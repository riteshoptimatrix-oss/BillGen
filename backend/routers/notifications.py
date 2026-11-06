import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from security import get_current_user, get_optional_user

logger = logging.getLogger("notifications")

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Active Server-Sent Event (SSE) subscriber queues
subscribers: List[asyncio.Queue] = []

async def broadcast_notification(
    mongodb,
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None
) -> Dict[str, Any]:
    """
    Persist notification to MongoDB Atlas and broadcast in real-time
    to all active SSE client streams.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "title": title,
        "message": message,
        "type": type,
        "link": link or "/dashboard",
        "is_read": False,
        "created_at": now_iso
    }
    
    try:
        result = await mongodb["notifications"].insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        doc["id"] = str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to persist notification: {e}")
        doc["id"] = f"temp-{int(datetime.now().timestamp())}"

    # Broadcast to all live SSE queues
    dead_queues = []
    payload = json.dumps(doc)
    for q in list(subscribers):
        try:
            q.put_nowait(payload)
        except Exception:
            dead_queues.append(q)

    for dead in dead_queues:
        if dead in subscribers:
            subscribers.remove(dead)

    return doc


@router.get("/stream")
async def notification_stream(request: Request):
    """
    Server-Sent Events (SSE) live notification stream.
    Clients connect once and receive instant real-time events whenever
    new bills, stock warnings, payments, or activities occur.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial confirmation event
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
            
            while True:
                # Check client disconnection
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next notification or send heartbeat ping every 15 seconds
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: notification\ndata: {data}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat to prevent Render/Netlify proxy timeouts
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in subscribers:
                subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/")
async def list_notifications(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    """
    Fetch notifications with unread count and dynamic system alert syncing.
    """
    db = request.app.mongodb

    # Fetch recent 50 notifications from MongoDB Atlas
    cursor = db["notifications"].find({}).sort("created_at", -1).limit(50)
    raw_notifications = await cursor.to_list(50)

    # Convert ObjectId to string
    notifications = []
    for n in raw_notifications:
        n_id = str(n["_id"])
        notifications.append({
            "id": n_id,
            "_id": n_id,
            "title": n.get("title", "Notification"),
            "message": n.get("message", ""),
            "type": n.get("type", "info"),
            "link": n.get("link", "/dashboard"),
            "is_read": bool(n.get("is_read", False)),
            "created_at": n.get("created_at", "")
        })

    # If notifications collection is low, automatically check and sync dynamic system alerts
    if len(notifications) < 5:
        # Check low stock products
        low_stock = await db["products"].find({"stock": {"$lt": 10}}, {"name": 1, "stock": 1}).to_list(5)
        for p in low_stock:
            title = f"Low Stock: {p.get('name', 'Product')}"
            exists = any(title in n["title"] for n in notifications)
            if not exists:
                new_doc = await broadcast_notification(
                    db,
                    title=title,
                    message=f"Only {p.get('stock', 0)} units remaining in warehouse.",
                    type="stock",
                    link="/products"
                )
                notifications.insert(0, new_doc)

        # Check overdue invoices
        overdue_invoices = await db["invoices"].find(
            {"status": "Overdue"},
            {"invoice_number": 1, "client": 1, "amount": 1}
        ).to_list(5)
        for inv in overdue_invoices:
            title = f"Overdue Invoice: {inv.get('invoice_number', 'Invoice')}"
            exists = any(title in n["title"] for n in notifications)
            if not exists:
                new_doc = await broadcast_notification(
                    db,
                    title=title,
                    message=f"₹{inv.get('amount', 0):,} due from {inv.get('client', 'Customer')}.",
                    type="payment",
                    link="/bill-invoice"
                )
                notifications.insert(0, new_doc)

    unread_count = sum(1 for n in notifications if not n.get("is_read"))

    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@router.patch("/{id}/read")
async def mark_notification_read(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Mark a specific notification as read."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Notification ID format")

    await request.app.mongodb["notifications"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"is_read": True}}
    )
    return {"status": "success", "id": id, "is_read": True}


@router.post("/read-all")
async def mark_all_notifications_read(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Mark all active notifications as read."""
    await request.app.mongodb["notifications"].update_many(
        {"is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"status": "success", "message": "All notifications marked as read."}


@router.delete("/{id}")
async def delete_notification(
    id: str,
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Delete a notification."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Notification ID format")

    await request.app.mongodb["notifications"].delete_one({"_id": ObjectId(id)})
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "deleted", "id": id})


@router.post("/test")
async def trigger_test_notification(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """Trigger a live test notification for verification."""
    doc = await broadcast_notification(
        request.app.mongodb,
        title="Real-Time Test Alert",
        message="Live notifications are working seamlessly across Netlify & Render!",
        type="info",
        link="/dashboard"
    )
    return {"status": "broadcasted", "notification": doc}
