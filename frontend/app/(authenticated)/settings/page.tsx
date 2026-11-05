"use client";

import { useState, useEffect } from "react";

type SettingsTab = "company" | "invoice" | "tax" | "bank" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Company Profile Settings (SiddhiVinayak Enterprise)
  const [companySettings, setCompanySettings] = useState({
    name: "SiddhiVinayak Enterprise",
    tagline: "High-Performance 3-Wheeler Commercial Vehicles & Spare Parts",
    phone: "+91 98250 14829",
    email: "contact@siddhivinayakenterprise.com",
    website: "www.siddhivinayakenterprise.com",
    address: "Plot 12, GIDC Heavy Engineering Zone, Odhav, Ahmedabad, Gujarat 382415",
    state: "Gujarat",
    stateCode: "24",
    gstin: "24AAAFO1234F1Z9",
    pan: "AAAFO1234F",
    cin: "U34102GJ2015PTC082910"
  });

  // 2. Invoice & Billing Defaults
  const [invoiceDefaults, setInvoiceDefaults] = useState({
    prefix: "INV",
    nextNumber: 6,
    defaultTerms: "15 Days",
    defaultPaymentMethod: "Bank Transfer",
    notes: "1. Goods once sold will not be returned without warranty inspection.\n2. Interest @ 18% p.a. charged after due date.\n3. All disputes subject to Ahmedabad jurisdiction only.",
    autoDecrementStock: true,
    showProductImageOnBill: true
  });

  // 3. Tax & GST Configuration
  const [taxSettings, setTaxSettings] = useState({
    defaultTaxRate: 18,
    enableGst: true,
    enableCgstSgstSplit: true,
    hsnSummaryEnabled: true,
    reverseChargeApplicable: false,
    eInvoiceThreshold: 5000000
  });

  // 4. Default Remittance Bank Details
  const [bankSettings, setBankSettings] = useState({
    bankName: "Bank of Baroda",
    accountHolder: "SiddhiVinayak Enterprise",
    accountNumber: "01420200001234",
    ifscCode: "BARB0ODHAVA",
    branchName: "Odhav Industrial Estate Branch",
    accountType: "Current Account",
    upiId: "siddhivinayak@barodampay"
  });

  // 5. User Account & Security
  const [securitySettings, setSecuritySettings] = useState({
    adminEmail: "admin@siddhivinayak.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    sessionTimeout: "8 Hours",
    twoFactorEnabled: false
  });

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const savedCompany = localStorage.getItem("sve_company_settings");
      if (savedCompany) setCompanySettings(JSON.parse(savedCompany));

      const savedInvoice = localStorage.getItem("sve_invoice_defaults");
      if (savedInvoice) setInvoiceDefaults(JSON.parse(savedInvoice));

      const savedTax = localStorage.getItem("sve_tax_settings");
      if (savedTax) setTaxSettings(JSON.parse(savedTax));

      const savedBank = localStorage.getItem("sve_bank_settings");
      if (savedBank) setBankSettings(JSON.parse(savedBank));
    } catch (e) {
      console.error("Failed to load settings from storage", e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("sve_company_settings", JSON.stringify(companySettings));
      localStorage.setItem("sve_invoice_defaults", JSON.stringify(invoiceDefaults));
      localStorage.setItem("sve_tax_settings", JSON.stringify(taxSettings));
      localStorage.setItem("sve_bank_settings", JSON.stringify(bankSettings));

      setTimeout(() => {
        setIsSaving(false);
        showToast("Settings updated & saved successfully!");
      }, 500);
    } catch (err) {
      console.error("Save settings error", err);
      setIsSaving(false);
      alert("Failed to save settings.");
    }
  };

  const tabs = [
    {
      id: "company" as SettingsTab,
      label: "Company Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: "invoice" as SettingsTab,
      label: "Invoice & Billing",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: "tax" as SettingsTab,
      label: "Tax & GST Rules",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "bank" as SettingsTab,
      label: "Bank Remittance",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: "security" as SettingsTab,
      label: "Security & Access",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#76c816]"></span>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              System Settings &amp; Configuration
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              Active Profile
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure default billing parameters, company letterhead, tax rules, bank accounts, and invoice templates for SiddhiVinayak Enterprise.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#c51f2a] hover:bg-[#a81922] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Saving Changes...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save All Settings
            </>
          )}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Navigation Tabs (Horizontal scroll on mobile, vertical stack on desktop) */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 p-3 sm:p-4">
          <p className="hidden md:block px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Categories
          </p>
          <div className="flex md:flex-col overflow-x-auto gap-1 pb-1 md:pb-0 scrollbar-none">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 sm:py-3 rounded-2xl text-xs font-bold transition-all text-left flex-shrink-0 md:w-full ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200/80 font-black"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 bg-transparent"
                  }`}
                >
                  <div className={`${isActive ? "text-[#c51f2a]" : "text-gray-400"}`}>
                    {t.icon}
                  </div>
                  <span className="whitespace-nowrap">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block pt-6 px-3">
            <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100 text-xs">
              <p className="font-extrabold text-[#c51f2a]">Single Source of Truth</p>
              <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                Changes saved here reflect across Invoice Generation, Bill Book headers, and Financial Reports.
              </p>
            </div>
          </div>
        </div>

        {/* Right Settings Form Content */}
        <div className="md:col-span-9 p-6 sm:p-8 overflow-y-auto">
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "company" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900">Company &amp; Legal Profile</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official corporate information used for invoices, delivery challans, and tax authorities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-bold text-gray-900 text-sm focus:ring-1 focus:ring-red-400 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Company Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={companySettings.tagline}
                    onChange={(e) => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800 focus:ring-1 focus:ring-red-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Primary Phone</label>
                  <input
                    type="text"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={companySettings.gstin}
                    onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">State &amp; State Code</label>
                  <input
                    type="text"
                    value={`${companySettings.state} (${companySettings.stateCode})`}
                    onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Income Tax PAN</label>
                  <input
                    type="text"
                    value={companySettings.pan}
                    onChange={(e) => setCompanySettings({ ...companySettings, pan: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Registered Factory / Workshop Address</label>
                  <textarea
                    rows={2}
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICE & BILLING DEFAULTS */}
          {activeTab === "invoice" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900">Invoice &amp; Billing Defaults</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Default sequence prefix, payment terms, and automated inventory sync.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoiceDefaults.prefix}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, prefix: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-bold font-mono text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Default Payment Terms</label>
                  <select
                    value={invoiceDefaults.defaultTerms}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, defaultTerms: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  >
                    <option value="Immediate">Due on Receipt (Immediate)</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days (Recommended)</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Default Payment Method</label>
                  <select
                    value={invoiceDefaults.defaultPaymentMethod}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, defaultPaymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={invoiceDefaults.autoDecrementStock}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, autoDecrementStock: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-bold text-gray-800 text-[11px]">
                      Auto-decrement inventory stock when invoice is generated
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={invoiceDefaults.showProductImageOnBill}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, showProductImageOnBill: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-bold text-gray-800 text-[11px]">
                      Always render product thumbnail images in the A4 bill book table
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Default Terms and Conditions Text</label>
                  <textarea
                    rows={4}
                    value={invoiceDefaults.notes}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, notes: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 resize-none text-[11px] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAX & GST RULES */}
          {activeTab === "tax" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900">Tax &amp; GST Configuration</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure Indian GST tax slabs, automated CGST/SGST splits, and thresholds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Standard Default Tax Rate (%)</label>
                  <select
                    value={taxSettings.defaultTaxRate}
                    onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-bold text-gray-900"
                  >
                    <option value="0">0% (GST Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard Manufacturing)</option>
                    <option value="28">28% GST (Heavy Automotive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">E-Way Bill / E-Invoice Threshold (₹)</label>
                  <input
                    type="number"
                    value={taxSettings.eInvoiceThreshold}
                    onChange={(e) => setTaxSettings({ ...taxSettings, eInvoiceThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-800"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={taxSettings.enableCgstSgstSplit}
                      onChange={(e) => setTaxSettings({ ...taxSettings, enableCgstSgstSplit: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Automatic CGST (50%) + SGST (50%) split for Intra-State (Gujarat)</p>
                      <p className="text-[11px] text-gray-500">Automatically creates equal Central &amp; State tax components</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      checked={taxSettings.hsnSummaryEnabled}
                      onChange={(e) => setTaxSettings({ ...taxSettings, hsnSummaryEnabled: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-gray-900">Include HSN/SAC Summary in GSTR-1 Register Reports</p>
                      <p className="text-[11px] text-gray-500">Includes 8-digit HSN breakdown in GST summary report</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK REMITTANCE */}
          {activeTab === "bank" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900">Remittance Bank Details</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  The bank account printed on all invoices for direct wire transfer from buyers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankSettings.bankName}
                    onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankSettings.accountHolder}
                    onChange={(e) => setBankSettings({ ...bankSettings, accountHolder: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankSettings.accountNumber}
                    onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={bankSettings.ifscCode}
                    onChange={(e) => setBankSettings({ ...bankSettings, ifscCode: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={bankSettings.branchName}
                    onChange={(e) => setBankSettings({ ...bankSettings, branchName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Corporate UPI ID</label>
                  <input
                    type="text"
                    value={bankSettings.upiId}
                    onChange={(e) => setBankSettings({ ...bankSettings, upiId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-mono font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & ACCESS */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900">Security &amp; Administrator Access</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update administrator credentials, active session duration, and access security.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Admin Email Address</label>
                  <input
                    type="email"
                    value={securitySettings.adminEmail}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, adminEmail: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securitySettings.currentPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new strong password"
                    value={securitySettings.newPassword}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Session Inactivity Timeout</label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl font-medium text-gray-800"
                  >
                    <option value="2 Hours">2 Hours</option>
                    <option value="8 Hours">8 Hours (Standard Working Day)</option>
                    <option value="24 Hours">24 Hours</option>
                    <option value="Never">Never</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
