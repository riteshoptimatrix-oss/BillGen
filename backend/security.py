import os
import time
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Set
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "siddhivinayak-enterprise-billing-secure-key-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

def get_password_hash(password: str) -> str:
    """Generate a cryptographic bcrypt hash for a password (cost factor 12)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Safely verify a plain text password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

# Fallback default admin credentials (overridable via ENV)
DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ritesh.work.1510@gmail.com")
DEFAULT_ADMIN_PASSWORD_HASH = os.getenv(
    "ADMIN_PASSWORD_HASH",
    # Pre-calculated bcrypt hash for default admin credential
    "$2b$12$0XMHyih1rOFa2Odf3GEwf.xXuiPiPc.AmPzc6lAdtFSoQsMGos7hi"
)

security_bearer = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed, expirable JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": "siddhivinayak-enterprise-billing",
        "type": "access_token"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and strictly verify a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_exp": True,
                "verify_iat": True,
                "require": ["exp", "sub", "type"]
            }
        )
        if payload.get("type") != "access_token":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"}
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and validates the JWT token
    from either the Authorization header or HttpOnly cookie.
    """
    token: Optional[str] = None
    
    # 1. Check Authorization Bearer header
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
        
    # 2. Check fallback auth cookie
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this resource",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    return {
        "email": email,
        "role": payload.get("role", "admin"),
        "name": payload.get("name", "Authorized User")
    }

async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[Dict[str, Any]]:
    """Optional authentication dependency that does not raise 401 if unauthenticated."""
    try:
        return await get_current_user(request, credentials)
    except Exception:
        return None

# ==============================================================================
# In-Memory Rate Limiting & Brute Force Defense
# ==============================================================================
_login_attempts: Dict[str, list] = {}

def check_login_rate_limit(client_ip: str, max_attempts: int = 5, window_seconds: int = 60):
    """
    Enforce brute force protection on authentication endpoints.
    Allows up to max_attempts failures within window_seconds per client IP.
    """
    now = time.time()
    attempts = _login_attempts.get(client_ip, [])
    # Filter attempts within current window
    attempts = [t for t in attempts if now - t < window_seconds]
    _login_attempts[client_ip] = attempts
    
    if len(attempts) >= max_attempts:
        retry_after = int(window_seconds - (now - attempts[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {max(retry_after, 5)} seconds before trying again.",
            headers={"Retry-After": str(max(retry_after, 5))}
        )

def record_failed_login(client_ip: str):
    """Record a failed login attempt for the client IP."""
    now = time.time()
    if client_ip not in _login_attempts:
        _login_attempts[client_ip] = []
    _login_attempts[client_ip].append(now)

def reset_login_attempts(client_ip: str):
    """Reset attempt counter upon successful login."""
    if client_ip in _login_attempts:
        del _login_attempts[client_ip]

# ==============================================================================
# Safe File Upload Validation (MIME type, Extensions & Magic Bytes)
# ==============================================================================
ALLOWED_IMAGE_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_PDF_EXTENSIONS: Set[str] = {".pdf"}
ALLOWED_ALL_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_PDF_EXTENSIONS

ALLOWED_MIME_TYPES: Set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024    # 15 MB

MAGIC_NUMBERS = {
    "jpg": [b"\xFF\xD8\xFF"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "webp": [b"RIFF"],
    "pdf": [b"%PDF-"]
}

def validate_uploaded_file(
    filename: str,
    content_type: str,
    content: bytes,
    is_pdf_only: bool = False,
    is_image_only: bool = False
):
    """
    Strict multi-tier verification of uploaded files:
    1. Extension whitelist check
    2. Size boundary check
    3. MIME type header check
    4. Magic byte signature check to prevent polyglots / disguised scripts
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if is_pdf_only and ext not in ALLOWED_PDF_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only official PDF (.pdf) documents are permitted."
        )
        
    if is_image_only and ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only standard images (.jpg, .jpeg, .png, .webp) are permitted."
        )
        
    if ext not in ALLOWED_ALL_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disallowed file extension '{ext}'. Only images and PDFs are allowed."
        )

    # Size validation
    max_size = MAX_PDF_SIZE_BYTES if ext == ".pdf" else MAX_IMAGE_SIZE_BYTES
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum permissible size of {max_size // (1024 * 1024)} MB."
        )

    # Content-type check
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME content-type '{content_type}'."
        )

    # Magic byte verification
    header = content[:16]
    valid_magic = False
    
    if ext in {".jpg", ".jpeg"} and header.startswith(b"\xFF\xD8\xFF"):
        valid_magic = True
    elif ext == ".png" and header.startswith(b"\x89PNG\r\n\x1a\n"):
        valid_magic = True
    elif ext == ".webp" and header.startswith(b"RIFF") and b"WEBP" in content[:16]:
        valid_magic = True
    elif ext == ".pdf" and header.startswith(b"%PDF-"):
        valid_magic = True
        
    if not valid_magic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File signature header does not match declared extension. Corrupted or unauthorized file format."
        )
