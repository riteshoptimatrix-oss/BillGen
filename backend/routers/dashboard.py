import asyncio
from fastapi import APIRouter, Request, Depends
from typing import Dict, Any, Optional
from datetime import datetime
from security import get_optional_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_description="Get dashboard summary data")
async def get_dashboard_summary(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    system_alerts = []
    db = request.app.mongodb

    # Execute all database queries concurrently in parallel
    (
        products_count,
        low_stock_products,
        invoices,
        recent_invoices_raw,
        active_labours_count,
        labours,
        expenses,
        purchases
    ) = await asyncio.gather(
        # 1. Product count and low stock items (lean projection)
        db["products"].count_documents({}),
        db["products"].find({"stock": {"$lt": 10}}, {"_id": 1, "name": 1, "stock": 1}).limit(5).to_list(5),
        
        # 2. Invoices summary with dates
        db["invoices"].find({}, {"_id": 1, "status": 1, "amount": 1, "client": 1, "date": 1, "balance_due": 1, "amount_paid": 1}).to_list(2000),
        
        # 3. Recent 5 invoices
        db["invoices"].find(
            {},
            {"_id": 1, "invoice_number": 1, "client": 1, "amount": 1, "status": 1, "date": 1, "balance_due": 1, "amount_paid": 1}
        ).sort("_id", -1).limit(5).to_list(5),
        
        # 4. Labours count and salary list
        db["labours"].count_documents({"status": {"$in": ["Active", "active"]}}),
        db["labours"].find({}, {"_id": 1, "name": 1, "salary": 1, "status": 1}).to_list(1000),
        
        # 5. Direct Expenses list
        db["expenses"].find({}, {"amount": 1, "date": 1, "description": 1}).to_list(2000),

        # 6. Purchases list
        db["purchases"].find({}, {"amount": 1, "purchase_date": 1, "date": 1, "category": 1}).to_list(2000)
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

    # 2. Invoices & Revenue Calculations
    total_revenue = 0.0
    total_sales = 0.0
    today_sales = 0.0
    month_sales = 0.0
    pending_bills = 0
    pending_amount = 0.0
    now = datetime.now()
    current_year = now.year
    current_month_str = now.strftime("%Y-%m")
    today_str = now.strftime("%Y-%m-%d")

    for inv in invoices:
        amt = float(inv.get("amount", 0.0))
        status = inv.get("status", "Pending")
        inv_date = str(inv.get("date", ""))[:10]

        total_sales += amt
        if inv_date == today_str:
            today_sales += amt
        if inv_date[:7] == current_month_str:
            month_sales += amt

        # Support manual partial payment tracking accurately
        amt_paid = float(inv.get("amount_paid", amt if status == "Paid" else 0.0))
        bal_due = float(inv.get("balance_due", 0.0 if status == "Paid" else (amt - amt_paid)))

        total_revenue += amt_paid

        if bal_due > 0:
            pending_bills += 1
            pending_amount += bal_due
            if status == "Overdue":
                system_alerts.append({
                    "id": f"inv-{inv['_id']}",
                    "type": "overdue",
                    "title": f"Invoice: {inv.get('client', 'Unknown')}",
                    "subtitle": f"₹{bal_due:,.0f} is Overdue",
                    "actionText": "Send Reminder"
                })

    # Format recent 5 invoices
    recent_invoices = []
    for inv in recent_invoices_raw:
        recent_invoices.append({
            "id": str(inv["_id"]),
            "invoice_number": inv.get("invoice_number", f"INV-{current_year}-{str(inv['_id'])[-4:].upper()}"),
            "client": inv.get("client", "Unknown Customer"),
            "amount": float(inv.get("amount", 0.0)),
            "status": inv.get("status", "Pending"),
            "date": inv.get("date", "")
        })

    # 3. Labour Salary Calculations & Alerts
    total_monthly_salaries = 0.0
    for labour in labours:
        salary = float(labour.get("salary", 0.0))
        total_monthly_salaries += salary
        if salary > 0 and str(labour.get("status", "Active")).lower() == "active":
            system_alerts.append({
                "id": f"labour-{labour['_id']}",
                "type": "salary",
                "title": f"Payroll: {labour.get('name', 'Staff Member')}",
                "subtitle": f"₹{salary:,.0f} monthly wage",
                "actionText": "Pay Now"
            })

    # 4. Expenses & Purchases Calculations
    total_direct_expenses = sum(float(exp.get("amount", 0.0)) for exp in expenses)
    total_purchases = sum(float(p.get("amount", 0.0)) for p in purchases)
    total_expenses = total_direct_expenses + total_purchases
    net_profit = total_revenue - (total_expenses + total_monthly_salaries)

    # 5. Current Month Expenses (Purchases + Expenses for current month)
    cur_month_expenses = 0.0
    for exp in expenses:
        exp_date = str(exp.get("date", ""))[:7]
        if exp_date == current_month_str:
            cur_month_expenses += float(exp.get("amount", 0.0))
    for p in purchases:
        p_date = str(p.get("purchase_date") or p.get("date") or "")[:7]
        if p_date == current_month_str:
            cur_month_expenses += float(p.get("amount", 0.0))
    if total_monthly_salaries > 0:
        cur_month_expenses += total_monthly_salaries

    # 6. Real Monthly Chart Data (12 Months of Current Year)
    months_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    chart_data = []

    for m_idx in range(1, 13):
        m_str = f"{current_year}-{m_idx:02d}"
        
        # Month revenue (collected payments)
        m_rev = sum(
            float(inv.get("amount_paid", inv.get("amount", 0.0) if inv.get("status") == "Paid" else 0.0))
            for inv in invoices
            if str(inv.get("date", ""))[:7] == m_str
        )
        
        # Month expenses (direct expenses + purchases)
        m_exp = sum(
            float(exp.get("amount", 0.0))
            for exp in expenses
            if str(exp.get("date", ""))[:7] == m_str
        ) + sum(
            float(p.get("amount", 0.0))
            for p in purchases
            if str(p.get("purchase_date") or p.get("date") or "")[:7] == m_str
        )

        chart_data.append({
            "name": months_names[m_idx - 1],
            "Revenue": round(m_rev, 2),
            "Expenses": round(m_exp, 2)
        })

    # 7. Real Expense Distribution
    total_exp_pie = total_purchases + total_monthly_salaries + total_direct_expenses
    if total_exp_pie > 0:
        mat_pct = round((total_purchases / total_exp_pie) * 100)
        lab_pct = round((total_monthly_salaries / total_exp_pie) * 100)
        ops_pct = max(0, 100 - (mat_pct + lab_pct))
        expense_distribution = [
            {"name": "Material & Spares", "value": mat_pct, "color": "#0260de"},
            {"name": "Labour & Staff", "value": lab_pct, "color": "#3b82f6"},
            {"name": "Operations & Utilities", "value": ops_pct, "color": "#93c5fd"}
        ]
    else:
        expense_distribution = []

    return {
        "kpis": {
            "totalRevenue": round(total_revenue, 2),
            "totalSales": round(total_sales, 2),
            "todaySales": round(today_sales, 2),
            "monthSales": round(month_sales, 2),
            "pendingBills": pending_bills,
            "pendingBillsAmount": round(pending_amount, 2),
            "totalProducts": products_count,
            "netProfit": round(net_profit, 2),
            "activeLabours": active_labours_count,
            "totalExpensesMonth": round(cur_month_expenses, 2)
        },
        "chartData": chart_data,
        "expenseDistribution": expense_distribution,
        "systemAlerts": system_alerts,
        "recentInvoices": recent_invoices
    }

@router.post("/reset-dummy-data", response_description="Reset dummy labours, expenses, purchases, and invoices")
async def reset_dummy_data(
    request: Request,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
) -> Dict[str, Any]:
    db = request.app.mongodb
    del_labours = await db["labours"].delete_many({})
    del_expenses = await db["expenses"].delete_many({})
    del_purchases = await db["purchases"].delete_many({})
    del_invoices = await db["invoices"].delete_many({})
    return {
        "success": True,
        "message": "All dummy financial records cleared successfully.",
        "deleted": {
            "labours": del_labours.deleted_count,
            "expenses": del_expenses.deleted_count,
            "purchases": del_purchases.deleted_count,
            "invoices": del_invoices.deleted_count,
        }
    }
