"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Customer {
  _id: string;
  name: string;
  mobile_number: string;
  delivery_address?: string;
}

type ViewState = "empty" | "create" | "edit";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeView, setActiveView] = useState<ViewState>("empty");
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    delivery_address: "",
  });

  const fetchCustomers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/customers/`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeView === "edit" && activeCustomerId) {
      const original = customers.find((c) => c._id === activeCustomerId);
      if (original) {
        const isChanged =
          original.name !== formData.name ||
          original.mobile_number !== formData.mobile_number ||
          (original.delivery_address || "") !== formData.delivery_address;
        setHasChanges(isChanged);
      }
    }
  }, [formData, activeView, activeCustomerId, customers]);

  const handleCreateNewClick = () => {
    setActiveView("create");
    setActiveCustomerId(null);
    setFormData({ name: "", mobile_number: "", delivery_address: "" });
    setHasChanges(true);
  };

  const handleCustomerClick = (customer: Customer) => {
    setActiveView("edit");
    setActiveCustomerId(customer._id);
    setFormData({
      name: customer.name,
      mobile_number: customer.mobile_number,
      delivery_address: customer.delivery_address || "",
    });
    setHasChanges(false);
  };

  const handleDeleteCustomer = async () => {
    if (!activeCustomerId) return;
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${apiUrl}/customers/${activeCustomerId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setActiveView("empty");
          setActiveCustomerId(null);
          await fetchCustomers();
        } else {
          alert("Failed to delete customer.");
        }
      } catch (err) {
        console.error("Delete customer error:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.mobile_number) {
      alert("Name and Mobile Number are required!");
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const endpoint = activeView === "create" ? `${apiUrl}/customers/` : `${apiUrl}/customers/${activeCustomerId}`;
      const method = activeView === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchCustomers();
        setHasChanges(false);
        if (activeView === "create") {
          const newCustomer = await res.json();
          handleCustomerClick(newCustomer);
        }
      } else {
        alert("Failed to save customer");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile_number.includes(searchQuery)
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] bg-[#fdfdfc] rounded-2xl md:rounded-3xl overflow-hidden shadow-xs border border-gray-100">
      
      {/* LEFT PANE - MASTER LIST (Shown on mobile when no customer selected) */}
      <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] border-r border-gray-100 bg-white flex flex-col z-10 ${
        activeView !== "empty" ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Header & Search */}
        <div className="p-4 sm:p-6 pb-4 border-b border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customers</h1>
              <p className="text-sm font-medium text-gray-400 mt-1">{customers.length} total customers</p>
            </div>
            <button
              onClick={handleCreateNewClick}
              className="w-10 h-10 rounded-full bg-[#c51f2a] text-white flex items-center justify-center hover:bg-[#a51a23] shadow-md shadow-red-200 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="relative group">
            <svg className="w-5 h-5 absolute left-3.5 top-3 text-gray-400 group-focus-within:text-[#c51f2a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c51f2a]"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm font-medium">
              No customers found.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => handleCustomerClick(customer)}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeCustomerId === customer._id
                    ? "bg-red-50 shadow-sm border border-red-100"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 overflow-hidden flex-shrink-0 mr-4 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">{customer.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold truncate ${activeCustomerId === customer._id ? "text-[#c51f2a]" : "text-gray-900"}`}>
                    {customer.name}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
                    {customer.mobile_number}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE - DETAIL WORKSPACE */}
      <div className={`flex-1 bg-[#fdfdfc] relative flex flex-col ${
        activeView === "empty" ? "hidden md:flex" : "flex"
      }`}>
        {activeView === "empty" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-600">No Customer Selected</p>
            <p className="text-xs text-gray-400 mt-1">Select a customer from the list or create a new profile.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Toolbar */}
            <div className="h-14 sm:h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveView("empty")}
                  className="md:hidden mr-2 p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs font-bold"
                  title="Back to list"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>List</span>
                </button>

                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  {activeView === "create" ? "New Customer" : "Edit Customer"}
                </h2>
              </div>

              {activeView === "edit" && activeCustomerId && (
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Customer
                </button>
              )}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-8 pb-24">
                
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                  
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Name Input */}
                    <div className="flex-[2]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    {/* Mobile Input */}
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={formData.mobile_number}
                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Delivery Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</label>
                    <textarea
                      rows={4}
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none resize-none transition-all placeholder:text-gray-400"
                      placeholder="Full delivery address for shipping..."
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-end gap-3 transition-transform duration-300 ${hasChanges ? 'translate-y-0' : 'translate-y-full'}`}>
              <button
                onClick={() => {
                  if (activeView === "create") {
                    setActiveView("empty");
                  } else {
                    const original = customers.find(c => c._id === activeCustomerId);
                    if (original) handleCustomerClick(original);
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-[#c51f2a] hover:bg-[#a51a23] shadow-md shadow-red-200 transition-all active:scale-95 disabled:opacity-70 flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>

          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
      `}} />
    </div>
  );
}
