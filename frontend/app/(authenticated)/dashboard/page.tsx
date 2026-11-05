"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

interface KPI {
  totalRevenue: number;
  pendingBills: number;
  totalProducts: number;
  netProfit: number;
  activeLabours: number;
}

interface ChartData {
  name: string;
  Revenue: number;
  Expenses: number;
}

interface SystemAlert {
  id: string;
  type: string; // 'stock', 'overdue', 'salary'
  title: string;
  subtitle: string;
  actionText: string;
}

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: string;
  date: string;
}

interface DashboardData {
  kpis: KPI;
  chartData: ChartData[];
  systemAlerts: SystemAlert[];
  recentInvoices: Invoice[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${apiUrl}/dashboard/summary`);
        if (res.ok) {
          const summaryData = await res.json();
          setData(summaryData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c51f2a]"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8">Failed to load dashboard</div>;

  return (
    <div className="space-y-6 pb-10">
      
      {/* KPI CARDS (Apple-style Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</h3>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">₹{data.kpis.totalRevenue.toLocaleString()}</p>
            <p className="text-xs font-medium text-green-500 mt-1">+14% from last month</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Net Profit</h3>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">₹{data.kpis.netProfit.toLocaleString()}</p>
            <p className="text-xs font-medium text-emerald-500 mt-1">+8% from last month</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Bills</h3>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{data.kpis.pendingBills}</p>
            <p className="text-xs font-medium text-orange-500 mt-1">Requires attention</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Products</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{data.kpis.totalProducts}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">In inventory catalog</p>
          </div>
        </div>

      </div>

      {/* MAIN CHART */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Overview (Monthly)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Revenue" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Expenses" fill="#c51f2a" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM SECTION: Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Invoices */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Invoices</h2>
            <Link
              href="/bill-invoice/create"
              className="px-4 py-1.5 bg-[#c51f2a] hover:bg-[#a51923] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Quick Generate
            </Link>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Invoice</th>
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 text-sm font-medium text-gray-900">{inv.id}</td>
                    <td className="py-3 text-sm text-gray-500">{inv.client}</td>
                    <td className="py-3 text-sm font-bold text-gray-900 text-right">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              Action Center
              {data.systemAlerts.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{data.systemAlerts.length}</span>
              )}
            </h2>
            <button 
              onClick={() => setIsAlertModalOpen(true)}
              className="text-[#c51f2a] text-xs font-bold hover:underline"
            >
              View All
            </button>
          </div>
          
          {data.systemAlerts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium pb-8 pt-4">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              You're all caught up!
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {data.systemAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  alert.type === 'stock' ? 'bg-orange-50/50 border-orange-100 hover:bg-orange-50' :
                  alert.type === 'overdue' ? 'bg-red-50/50 border-red-100 hover:bg-red-50' :
                  'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                }`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0 mr-3 flex items-center justify-center shadow-sm">
                      {alert.type === 'stock' && <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                      {alert.type === 'overdue' && <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {alert.type === 'salary' && <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{alert.title}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${
                        alert.type === 'stock' ? 'text-orange-500' :
                        alert.type === 'overdue' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>{alert.subtitle}</p>
                    </div>
                  </div>
                  <Link
                    href={alert.type === 'stock' ? '/products' : alert.type === 'overdue' ? '/bill-invoice' : '/labour'}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex-shrink-0 ml-2"
                  >
                    {alert.actionText}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      
      {/* ACTION CENTER MODAL */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Action Center</h2>
                  <p className="text-sm text-gray-500 font-medium">{data.systemAlerts.length} total items require your attention</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
              {data.systemAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-lg font-bold text-gray-900">You're all caught up!</p>
                  <p className="text-sm">No action items require your attention right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.systemAlerts.map(alert => (
                    <div key={alert.id} className={`flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm transition-colors hover:shadow-md ${
                      alert.type === 'stock' ? 'border-orange-100 hover:border-orange-200' :
                      alert.type === 'overdue' ? 'border-red-100 hover:border-red-200' :
                      'border-blue-100 hover:border-blue-200'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 border ${
                          alert.type === 'stock' ? 'bg-orange-50 border-orange-100' :
                          alert.type === 'overdue' ? 'bg-red-50 border-red-100' :
                          'bg-blue-50 border-blue-100'
                        }`}>
                          {alert.type === 'stock' && <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                          {alert.type === 'overdue' && <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {alert.type === 'salary' && <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-900">{alert.title}</p>
                          <p className={`text-sm font-semibold mt-1 ${
                            alert.type === 'stock' ? 'text-orange-500' :
                            alert.type === 'overdue' ? 'text-red-500' :
                            'text-blue-500'
                          }`}>{alert.subtitle}</p>
                        </div>
                      </div>
                      <Link
                        href={alert.type === 'stock' ? '/products' : alert.type === 'overdue' ? '/bill-invoice' : '/labour'}
                        className={`px-4 py-2 text-sm font-bold rounded-lg shadow-sm transition-colors flex-shrink-0 ml-4 ${
                          alert.type === 'stock' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                          alert.type === 'overdue' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                          'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {alert.actionText}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
      `}} />
    </div>
  );
}
