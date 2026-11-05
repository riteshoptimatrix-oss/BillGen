from fastapi import APIRouter, Request
from typing import Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_description="Get dashboard summary data")
async def get_dashboard_summary(request: Request) -> Dict[str, Any]:
    system_alerts = []
    
    # 1. Low stock alerts
    products_count = await request.app.mongodb["products"].count_documents({})
    low_stock_products_cursor = request.app.mongodb["products"].find({"stock": {"$lt": 10}}).limit(5)
    low_stock_products = await low_stock_products_cursor.to_list(5)
    for product in low_stock_products:
        system_alerts.append({
            "id": f"stock-{product['_id']}",
            "type": "stock",
            "title": product["name"],
            "subtitle": f"Only {product['stock']} units left",
            "actionText": "Restock"
        })

    # 2. Overdue Invoices
    invoices_cursor = request.app.mongodb["invoices"].find({})
    invoices = await invoices_cursor.to_list(1000)
    
    total_revenue = 0
    pending_bills = 0
    for inv in invoices:
        if inv.get("status") == "Paid":
            total_revenue += inv.get("amount", 0)
        else:
            pending_bills += 1
            if inv.get("status") == "Overdue":
                system_alerts.append({
                    "id": f"inv-{inv['_id']}",
                    "type": "overdue",
                    "title": f"Invoice {inv.get('client', 'Unknown')}",
                    "subtitle": f"₹{inv.get('amount', 0):,} is Overdue",
                    "actionText": "Send Reminder"
                })
    
    recent_invoices_cursor = request.app.mongodb["invoices"].find({}).sort("_id", -1).limit(5)
    recent_invoices_raw = await recent_invoices_cursor.to_list(5)
    recent_invoices = []
    current_year = datetime.now().year
    for inv in recent_invoices_raw:
        recent_invoices.append({
            "id": str(inv["_id"]),
            "invoice_number": inv.get("invoice_number", f"INV-{current_year}-{str(inv['_id'])[-4:].upper()}"),
            "client": inv.get("client", "Unknown"),
            "amount": inv.get("amount", 0),
            "status": inv.get("status", "Pending"),
            "date": inv.get("date", "")
        })

    # 3. Labour Salary Due (Assuming all labours need to be paid this month)
    active_labours = await request.app.mongodb["labours"].count_documents({})
    labours_cursor = request.app.mongodb["labours"].find({})
    labours = await labours_cursor.to_list(1000)
    
    total_salaries = 0
    for labour in labours:
        salary = labour.get("salary", 0)
        total_salaries += salary
        if salary > 0:
            system_alerts.append({
                "id": f"labour-{labour['_id']}",
                "type": "salary",
                "title": f"Salary: {labour['name']}",
                "subtitle": f"₹{salary:,} payment due",
                "actionText": "Pay Now"
            })

    expenses_cursor = request.app.mongodb["expenses"].find({})
    expenses = await expenses_cursor.to_list(1000)
    total_expenses = sum(exp["amount"] for exp in expenses)
    
    net_profit = total_revenue - (total_expenses + total_salaries)
    
    # Mock Chart Data 
    chart_data = [
        {"name": "Jan", "Revenue": 0, "Expenses": 0},
        {"name": "Feb", "Revenue": 0, "Expenses": 0},
        {"name": "Mar", "Revenue": 0, "Expenses": 0},
        {"name": "Apr", "Revenue": 0, "Expenses": 0},
        {"name": "May", "Revenue": 0, "Expenses": 0},
        {"name": "Jun", "Revenue": total_revenue, "Expenses": total_expenses + total_salaries},
    ]

    return {
        "kpis": {
            "totalRevenue": total_revenue,
            "pendingBills": pending_bills,
            "totalProducts": products_count,
            "netProfit": net_profit,
            "activeLabours": active_labours,
        },
        "chartData": chart_data,
        "systemAlerts": system_alerts, # Return all alerts for the View All modal
        "recentInvoices": recent_invoices
    }
