import os
import re
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    check_login_rate_limit,
    record_failed_login,
    reset_login_attempts,
    check_forgot_password_rate_limit,
    record_forgot_password_attempt,
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD_HASH
)
from email_service import send_password_reset_email
from routers.notifications import broadcast_notification

logger = logging.getLogger("auth_router")

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ==============================================================================
# SCHEMAS
# ==============================================================================
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered user email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")

class LoginResponse(BaseModel):
    status: str
    token: str
    user: Dict[str, Any]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email address")

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Cryptographic reset token")
    new_password: str = Field(..., min_length=6, max_length=128, description="New password")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=6, max_length=128, description="New password")

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr = Field(..., description="New email address for the account")

class CreateUserRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address for the new user")
    password: str = Field(..., min_length=6, max_length=128, description="Initial password")
    name: Optional[str] = Field(None, description="Full name or display name")
    role: Optional[str] = Field("admin", description="User role (admin, operator, etc.)")


def validate_password_strength(password: str) -> None:
    """Enforce security standards for new passwords."""
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )


def _determine_frontend_origin(request: Request) -> str:
    """Determine the originating frontend application URL for reset links."""
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        origin_clean = re.sub(r"/+$", "", origin)
        origin_clean = re.sub(r"/(login|forgot-password|reset-password).*$", "", origin_clean)
        if origin_clean.startswith("http://") or origin_clean.startswith("https://"):
            return origin_clean

    env_frontend = os.getenv("FRONTEND_URL", "").strip()
    if env_frontend:
        return re.sub(r"/+$", "", env_frontend)

    return "https://smart-erp-testing.netlify.app"


# ==============================================================================
# DEFAULT USER INITIALIZATION & SEEDING
# ==============================================================================
async def ensure_default_system_users(db):
    """
    Ensure the database has:
    1. Indexes on `users` and `password_resets`.
    2. Required user: shaileshbhai123@gmail.com (Initial password: Shaileshbhai@123).
    3. Master admin user from environment (ritesh.work.1510@gmail.com).
    Does NOT overwrite password if user already exists (preserves user updates).
    """
    try:
        # 1. Indexes
        await db["users"].create_index([("email", 1)], unique=True, background=True)
        await db["password_resets"].create_index([("token", 1)], unique=True, background=True)
        await db["password_resets"].create_index([("expires_at", 1)], background=True)
        await db["password_resets"].create_index([("email", 1)], background=True)

        now_iso = datetime.now(timezone.utc).isoformat()

        # 2. Seed Shaileshbhai user
        target_email = "shaileshbhai123@gmail.com"
        existing_shailesh = await db["users"].find_one({"email": target_email})
        if not existing_shailesh:
            shailesh_doc = {
                "email": target_email,
                "name": "Shaileshbhai",
                "password_hash": get_password_hash("Shaileshbhai@123"),
                "role": "admin",
                "status": "Active",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            await db["users"].insert_one(shailesh_doc)
            logger.info(f"✓ Initialized required user '{target_email}' in MongoDB users collection.")
        else:
            logger.info(f"User '{target_email}' already exists in users collection.")

        # 3. Seed Default Admin user if not in collection
        admin_email = DEFAULT_ADMIN_EMAIL.strip().lower()
        existing_admin = await db["users"].find_one({"email": admin_email})
        if not existing_admin:
            admin_doc = {
                "email": admin_email,
                "name": "SiddhiVinayak Admin",
                "password_hash": DEFAULT_ADMIN_PASSWORD_HASH,
                "role": "admin",
                "status": "Active",
                "created_at": now_iso,
                "updated_at": now_iso
            }
            await db["users"].insert_one(admin_doc)
            logger.info(f"✓ Seeded default admin user '{admin_email}' into MongoDB users collection.")

    except Exception as e:
        logger.error(f"Error initializing default system users: {e}")


# ==============================================================================
# AUTH ENDPOINTS
# ==============================================================================
@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, request: Request, response: Response):
    """
    Authenticate user credentials against MongoDB users collection with bcrypt verification.
    Issues a cryptographically signed HS256 JWT access token and sets an HttpOnly cookie.
    """
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    email = credentials.email.strip().lower()
    password = credentials.password
    db = request.app.mongodb

    user_doc = await db["users"].find_one({"email": email})
    is_valid = False
    user_name = "Authorized User"
    user_role = "admin"

    if user_doc:
        stored_hash = user_doc.get("password_hash", "")
        if stored_hash and verify_password(password, stored_hash):
            is_valid = True
            user_name = user_doc.get("name") or email.split("@")[0].capitalize()
            user_role = user_doc.get("role", "admin")
    else:
        # Fallback check against configured environment admin
        admin_email = DEFAULT_ADMIN_EMAIL.strip().lower()
        if email == admin_email:
            if verify_password(password, DEFAULT_ADMIN_PASSWORD_HASH):
                is_valid = True
                user_name = "SiddhiVinayak Admin"
                user_role = "admin"
            elif os.getenv("ADMIN_PASSWORD") and password == os.getenv("ADMIN_PASSWORD"):
                is_valid = True
                user_name = "SiddhiVinayak Admin"
                user_role = "admin"

    if not is_valid:
        record_failed_login(client_ip)
        logger.warning(f"Failed login attempt for '{email}' from IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    reset_login_attempts(client_ip)
    logger.info(f"Successful login for user '{email}' ({client_ip})")

    token = create_access_token(data={
        "sub": email,
        "role": user_role,
        "name": user_name
    })

    is_production = os.getenv("ENVIRONMENT", "development").lower() in ["production", "prod"] or os.getenv("RENDER") is not None
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=True if is_production else False,
        max_age=86400  # 24 hours
    )

    return {
        "status": "success",
        "token": token,
        "user": {
            "email": email,
            "role": user_role,
            "name": user_name
        }
    }


@router.get("/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Validates active JWT token and returns verified identity profile."""
    return {"status": "authenticated", "user": user}


@router.post("/logout")
async def logout(response: Response):
    """Clear session authentication cookies."""
    is_production = os.getenv("ENVIRONMENT", "development").lower() in ["production", "prod"] or os.getenv("RENDER") is not None
    response.delete_cookie(
        key="access_token",
        samesite="none" if is_production else "lax",
        secure=True if is_production else False
    )
    return {"status": "success", "message": "Logged out successfully."}


# ==============================================================================
# FORGOT PASSWORD & RESET PASSWORD FLOW
# ==============================================================================
@router.post("/forgot-password")
async def request_password_reset(payload: ForgotPasswordRequest, request: Request):
    """
    Step 1 & 2: Generate secure single-use password reset link.
    Strict anti-enumeration: Always returns success confirmation regardless of
    whether the email is registered or not.
    """
    client_ip = request.client.host if request.client else "unknown"
    check_forgot_password_rate_limit(client_ip)
    record_forgot_password_attempt(client_ip)

    email = payload.email.strip().lower()
    db = request.app.mongodb

    # Check if user exists
    user_doc = await db["users"].find_one({"email": email})
    admin_email = DEFAULT_ADMIN_EMAIL.strip().lower()

    if user_doc or email == admin_email:
        # Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        now_dt = datetime.now(timezone.utc)
        expires_at = now_dt + timedelta(minutes=20)

        # Invalidate any previously active tokens for this user
        await db["password_resets"].update_many(
            {"email": email, "used": False},
            {"$set": {"used": True, "invalidated_reason": "superseded_by_new_request"}}
        )

        # Record reset token in MongoDB
        reset_doc = {
            "email": email,
            "token": token,
            "created_at": now_dt.isoformat(),
            "expires_at": expires_at.isoformat(),
            "used": False,
            "client_ip": client_ip
        }
        await db["password_resets"].insert_one(reset_doc)

        # Build reset link
        frontend_base = _determine_frontend_origin(request)
        reset_link = f"{frontend_base}/reset-password?token={token}"

        # Send email via SMTP / async service
        recipient_name = user_doc.get("name") if user_doc else "Admin"
        await send_password_reset_email(email, reset_link, recipient_name)

        # Also broadcast real-time in-app notification
        try:
            await broadcast_notification(
                db,
                title="Password Reset Link Generated",
                message=f"Reset link requested for {email}. Valid for 20 minutes.",
                type="security",
                link=f"/reset-password?token={token}"
            )
        except Exception as e:
            logger.warning(f"Could not broadcast reset notification: {e}")

    # Return uniform message to prevent account enumeration attacks
    return {
        "status": "success",
        "message": "If this email address is registered, a password reset link has been dispatched to your inbox. Please check your email."
    }


@router.get("/verify-reset-token")
async def verify_reset_token(token: str, request: Request):
    """
    Validate that a reset token exists, is not expired, and has not been used.
    Used by frontend Reset Password page to validate link on mount.
    """
    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Invalid reset link format.")

    db = request.app.mongodb
    doc = await db["password_resets"].find_one({"token": token})

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link is invalid or does not exist."
        )

    if doc.get("used"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used. Please request a new one."
        )

    expires_at_str = doc.get("expires_at")
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This password reset link has expired (20 min limit). Please request a new one."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    return {
        "status": "valid",
        "email": doc.get("email"),
        "message": "Token is valid for password reset."
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, request: Request):
    """
    Step 3 & 4: Set new password using a valid reset token.
    Invalidates token, updates password hash in database, and renders old password invalid.
    """
    validate_password_strength(payload.new_password)

    db = request.app.mongodb
    token_doc = await db["password_resets"].find_one({"token": payload.token})

    if not token_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link is invalid."
        )

    if token_doc.get("used"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has already been used. Please request a new link."
        )

    # Expiry verification
    expires_at_str = token_doc.get("expires_at")
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This reset link has expired. Please request a new link."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    email = token_doc["email"]
    new_hash = get_password_hash(payload.new_password)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Update password in MongoDB users collection
    await db["users"].update_one(
        {"email": email},
        {
            "$set": {
                "password_hash": new_hash,
                "updated_at": now_iso
            }
        },
        upsert=True
    )

    # Invalidate token and all other tokens for this user
    await db["password_resets"].update_one(
        {"_id": token_doc["_id"]},
        {"$set": {"used": True, "used_at": now_iso}}
    )
    await db["password_resets"].update_many(
        {"email": email, "used": False},
        {"$set": {"used": True, "invalidated_reason": "password_reset_completed"}}
    )

    # Real-time alert
    try:
        await broadcast_notification(
            db,
            title="Password Reset Successful",
            message=f"Password for account {email} was successfully reset.",
            type="security",
            link="/login"
        )
    except Exception:
        pass

    logger.info(f"✓ Password successfully reset for user '{email}' via token.")

    return {
        "status": "success",
        "message": "Password has been successfully updated. You can now sign in with your new password."
    }


# ==============================================================================
# USER SETTINGS: CHANGE PASSWORD (AUTHENTICATED)
# ==============================================================================
@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Allows authenticated users to change their password from the User Settings page.
    Validates current password against stored hash before updating.
    """
    validate_password_strength(payload.new_password)

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password."
        )

    db = request.app.mongodb
    email = current_user["email"].strip().lower()
    user_doc = await db["users"].find_one({"email": email})

    is_current_valid = False
    if user_doc and user_doc.get("password_hash"):
        is_current_valid = verify_password(payload.current_password, user_doc["password_hash"])
    elif email == DEFAULT_ADMIN_EMAIL.strip().lower():
        is_current_valid = (
            verify_password(payload.current_password, DEFAULT_ADMIN_PASSWORD_HASH) or
            (os.getenv("ADMIN_PASSWORD") and payload.current_password == os.getenv("ADMIN_PASSWORD"))
        )

    if not is_current_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Please verify and try again."
        )

    new_hash = get_password_hash(payload.new_password)
    now_iso = datetime.now(timezone.utc).isoformat()

    await db["users"].update_one(
        {"email": email},
        {
            "$set": {
                "password_hash": new_hash,
                "updated_at": now_iso
            }
        },
        upsert=True
    )

    try:
        await broadcast_notification(
            db,
            title="Password Changed",
            message=f"Password for {email} was changed from User Settings.",
            type="security",
            link="/settings"
        )
    except Exception:
        pass

    logger.info(f"✓ Password changed successfully from User Settings for '{email}'")

    return {
        "status": "success",
        "message": "Password changed successfully."
    }


@router.post("/update-email")
async def update_user_email(
    payload: UpdateEmailRequest,
    request: Request,
    response: Response,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Allow authenticated user to change their account email address from their profile.
    Checks for conflicts, updates MongoDB users collection, issues a fresh JWT,
    and updates session cookie and client token.
    """
    old_email = current_user["email"].strip().lower()
    new_email = payload.new_email.strip().lower()

    if old_email == new_email:
        return {
            "status": "success",
            "message": "Email is already set to this address.",
            "email": new_email
        }

    db = request.app.mongodb

    # Check if new email is already claimed by another user
    existing = await db["users"].find_one({"email": new_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The email address '{new_email}' is already registered to another account."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # Update email in users collection
    result = await db["users"].update_one(
        {"email": old_email},
        {"$set": {"email": new_email, "updated_at": now_iso}}
    )

    # If user was default admin not yet in collection, create/upsert
    if result.matched_count == 0:
        await db["users"].insert_one({
            "email": new_email,
            "name": current_user.get("name", "Admin"),
            "password_hash": DEFAULT_ADMIN_PASSWORD_HASH,
            "role": current_user.get("role", "admin"),
            "status": "Active",
            "created_at": now_iso,
            "updated_at": now_iso
        })

    # Invalidate any old password reset tokens for the old email
    await db["password_resets"].update_many(
        {"email": old_email, "used": False},
        {"$set": {"used": True, "invalidated_reason": "email_changed"}}
    )

    # Issue a fresh JWT access token with the updated email
    new_token = create_access_token(data={
        "sub": new_email,
        "role": current_user.get("role", "admin"),
        "name": current_user.get("name", "Authorized User")
    })

    # Set updated cookie
    is_production = os.getenv("ENVIRONMENT", "development").lower() in ["production", "prod"] or os.getenv("RENDER") is not None
    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=True if is_production else False,
        max_age=86400
    )

    try:
        await broadcast_notification(
            db,
            title="Account Email Updated",
            message=f"Account email updated from {old_email} to {new_email}.",
            type="security",
            link="/settings"
        )
    except Exception as e:
        logger.warning(f"Could not broadcast email update notification: {e}")

    logger.info(f"✓ User email updated from '{old_email}' to '{new_email}'")

    return {
        "status": "success",
        "message": f"Account email updated to {new_email}.",
        "token": new_token,
        "email": new_email
    }


# ==============================================================================
# USER MANAGEMENT (ADMIN ONLY)
# ==============================================================================
@router.get("/users")
async def list_users(
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List registered users (excluding password hashes)."""
    db = request.app.mongodb
    cursor = db["users"].find({}, {"password_hash": 0}).sort("created_at", -1)
    users = await cursor.to_list(100)
    for u in users:
        u["id"] = str(u["_id"])
        del u["_id"]
    return {"users": users}


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new user account with secure password hashing."""
    validate_password_strength(payload.password)
    db = request.app.mongodb
    email = payload.email.strip().lower()

    existing = await db["users"].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email}' already exists."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    new_user = {
        "email": email,
        "name": payload.name or email.split("@")[0].capitalize(),
        "password_hash": get_password_hash(payload.password),
        "role": payload.role or "admin",
        "status": "Active",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    result = await db["users"].insert_one(new_user)
    new_user["id"] = str(result.inserted_id)
    del new_user["password_hash"]
    del new_user["_id"]

    return {
        "status": "success",
        "message": f"User '{email}' created successfully.",
        "user": new_user
    }

