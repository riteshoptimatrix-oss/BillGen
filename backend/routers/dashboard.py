import asyncio
from fastapi import APIRouter, Request, Depends
from typing import Dict, Any
from datetime import datetime
from security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/summary", response_description="Get dashboard summary data")
async def get_dashboard_summary(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    system_alerts = []
    db = request.app.mongodb

    # Execute all database queries concurrently in parallel
    (
        products_count,
        low_stock_products,
        invoices,
        recent_invoices_raw,
        active_labours,
        labours,
        expenses
    ) = await asyncio.gather(
        # 1. Product count and low stock items (lean projection)
        db["products"].count_documents({}),
        db["products"].find({"stock": {"$lt": 10}}, {"_id": 1, "name": 1, "stock": 1}).limit(5).to_list(5),
        
        # 2. Invoices summary (excluding heavy pdf_base64)
        db["invoices"].find({}, {"_id": 1, "status": 1, "amount": 1, "client": 1}).to_list(1000),
        
        # 3. Recent 5 invoices (lean projection)
        db["invoices"].find(
            {},
            {"_id": 1, "invoice_number": 1, "client": 1, "amount": 1, "status": 1, "date": 1}
        ).sort("_id", -1).limit(5).to_list(5),
        
        # 4. Labours count and salary list
        db["labours"].count_documents({}),
        db["labours"].find({}, {"_id": 1, "name": 1, "salary": 1}).to_list(1000),
        
        # 5. Expenses list
        db["expenses"].find({}, {"amount": 1}).to_list(1000)
    )

    # 1. Low stock alerts
    for product in low_stock_products:
        system_alerts.append({
            "id": f"stock-{product['_id']}",
            "type": "stock",
            "title": product.get("name", "Unknown Product"),
            "subtitle": f"Only {product.get('stock', 0)} units left",
            "actionText": "Restock"
        })

    # 2. Overdue Invoices
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

    # 3. Labour Salary Due
    total_salaries = 0
    for labour in labours:
        salary = labour.get("salary", 0)
        total_salaries += salary
        if salary > 0:
            system_alerts.append({
                "id": f"labour-{labour['_id']}",
                "type": "salary",
                "title": f"Salary: {labour.get('name', 'Worker')}",
                "subtitle": f"₹{salary:,} payment due",
                "actionText": "Pay Now"
            })

    total_expenses = sum(exp.get("amount", 0) for exp in expenses)
    net_profit = total_revenue - (total_expenses + total_salaries)

    chart_data = [
        {"name": "Jan", "Revenue": 10000, "Expenses": 5000},
        {"name": "Feb", "Revenue": 13000, "Expenses": 7000},
        {"name": "Mar", "Revenue": 17000, "Expenses": 11000},
        {"name": "Apr", "Revenue": 22000, "Expenses": 13000},
        {"name": "May", "Revenue": 38000, "Expenses": 17000},
        {"name": "Jun", "Revenue": 58000, "Expenses": 26500},
    ]

    expense_distribution = [
        {"name": "Material", "value": 45, "color": "#5c341f"},
        {"name": "Labour", "value": 25, "color": "#c4733d"},
        {"name": "Operations", "value": 15, "color": "#f3ceb2"},
        {"name": "Others", "value": 15, "color": "#e8be9d"},
    ]

    return {
        "kpis": {
            "totalRevenue": total_revenue,
            "pendingBills": pending_bills,
            "totalProducts": products_count,
            "netProfit": net_profit,
            "activeLabours": active_labours,
            "totalExpensesMonth": 26500
        },
        "chartData": chart_data,
        "expenseDistribution": expense_distribution,
        "systemAlerts": system_alerts,
        "recentInvoices": recent_invoices
    }
