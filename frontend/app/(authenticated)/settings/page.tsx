"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  FileSpreadsheet,
  Receipt,
  Landmark,
  ShieldCheck,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Lock,
  Key,
  ShieldAlert,
} from "lucide-react";

type SettingsTab = "company" | "invoice" | "tax" | "bank" | "security";

// Default preset values
const DEFAULT_COMPANY_SETTINGS = {
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
  cin: "U34102GJ2015PTC082910",
};

const DEFAULT_INVOICE_DEFAULTS = {
  prefix: "INV",
  nextNumber: 6,
  defaultTerms: "15 Days",
  defaultPaymentMethod: "Bank Transfer",
  notes:
    "1. Goods once sold will not be returned without warranty inspection.\n2. Interest @ 18% p.a. charged after due date.\n3. All disputes subject to Ahmedabad jurisdiction only.",
  autoDecrementStock: true,
  showProductImageOnBill: true,
};

const DEFAULT_TAX_SETTINGS = {
  defaultTaxRate: 18,
  enableGst: true,
  enableCgstSgstSplit: true,
  hsnSummaryEnabled: true,
  reverseChargeApplicable: false,
  eInvoiceThreshold: 5000000,
};

const DEFAULT_BANK_SETTINGS = {
  bankName: "Bank of Baroda",
  accountHolder: "SiddhiVinayak Enterprise",
  accountNumber: "01420200001234",
  ifscCode: "BARB0ODHAVA",
  branchName: "Odhav Industrial Estate Branch",
  accountType: "Current Account",
  upiId: "siddhivinayak@barodampay",
};

const DEFAULT_SECURITY_SETTINGS = {
  adminEmail: "admin@siddhivinayak.com",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  sessionTimeout: "8 Hours",
  twoFactorEnabled: false,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Company Profile Settings (SiddhiVinayak Enterprise)
  const [companySettings, setCompanySettings] = useState(DEFAULT_COMPANY_SETTINGS);

  // 2. Invoice & Billing Defaults
  const [invoiceDefaults, setInvoiceDefaults] = useState(DEFAULT_INVOICE_DEFAULTS);

  // 3. Tax & GST Configuration
  const [taxSettings, setTaxSettings] = useState(DEFAULT_TAX_SETTINGS);

  // 4. Default Remittance Bank Details
  const [bankSettings, setBankSettings] = useState(DEFAULT_BANK_SETTINGS);

  // 5. User Account & Security
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SECURITY_SETTINGS);

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

      const savedSecurity = localStorage.getItem("sve_security_settings");
      if (savedSecurity) {
        const parsed = JSON.parse(savedSecurity);
        setSecuritySettings((prev) => ({
          ...prev,
          adminEmail: parsed.adminEmail || prev.adminEmail,
          sessionTimeout: parsed.sessionTimeout || prev.sessionTimeout,
          twoFactorEnabled: !!parsed.twoFactorEnabled,
        }));
      }
    } catch (e) {
      console.error("Failed to load settings from storage", e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSettings = (tabName?: string) => {
    setIsSaving(true);
    try {
      localStorage.setItem("sve_company_settings", JSON.stringify(companySettings));
      localStorage.setItem("sve_invoice_defaults", JSON.stringify(invoiceDefaults));
      localStorage.setItem("sve_tax_settings", JSON.stringify(taxSettings));
      localStorage.setItem("sve_bank_settings", JSON.stringify(bankSettings));
      localStorage.setItem(
        "sve_security_settings",
        JSON.stringify({
          adminEmail: securitySettings.adminEmail,
          sessionTimeout: securitySettings.sessionTimeout,
          twoFactorEnabled: securitySettings.twoFactorEnabled,
        })
      );

      setTimeout(() => {
        setIsSaving(false);
        showToast(
          tabName
            ? `✓ ${tabName} updated & saved successfully!`
            : "✓ All system settings saved successfully!"
        );
      }, 400);
    } catch (err) {
      console.error("Save settings error", err);
      setIsSaving(false);
      alert("Failed to save settings.");
    }
  };

  const handleResetTab = (tab: SettingsTab) => {
    if (tab === "company") {
      setCompanySettings(DEFAULT_COMPANY_SETTINGS);
      localStorage.setItem("sve_company_settings", JSON.stringify(DEFAULT_COMPANY_SETTINGS));
      showToast("Company profile reset to default.");
    } else if (tab === "invoice") {
      setInvoiceDefaults(DEFAULT_INVOICE_DEFAULTS);
      localStorage.setItem("sve_invoice_defaults", JSON.stringify(DEFAULT_INVOICE_DEFAULTS));
      showToast("Invoice defaults reset to default.");
    } else if (tab === "tax") {
      setTaxSettings(DEFAULT_TAX_SETTINGS);
      localStorage.setItem("sve_tax_settings", JSON.stringify(DEFAULT_TAX_SETTINGS));
      showToast("Tax & GST rules reset to default.");
    } else if (tab === "bank") {
      setBankSettings(DEFAULT_BANK_SETTINGS);
      localStorage.setItem("sve_bank_settings", JSON.stringify(DEFAULT_BANK_SETTINGS));
      showToast("Bank remittance details reset to default.");
    } else if (tab === "security") {
      setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
      localStorage.setItem(
        "sve_security_settings",
        JSON.stringify({
          adminEmail: DEFAULT_SECURITY_SETTINGS.adminEmail,
          sessionTimeout: DEFAULT_SECURITY_SETTINGS.sessionTimeout,
          twoFactorEnabled: DEFAULT_SECURITY_SETTINGS.twoFactorEnabled,
        })
      );
      showToast("Security preferences reset to default.");
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securitySettings.currentPassword.trim()) {
      alert("Please enter your current password.");
      return;
    }
    if (!securitySettings.newPassword || securitySettings.newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    // Success simulation and credential update
    setSecuritySettings((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    showToast("✓ Administrator password changed successfully!");
  };

  const tabs = [
    {
      id: "company" as SettingsTab,
      label: "Company Profile",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: "invoice" as SettingsTab,
      label: "Invoice & Billing",
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: "tax" as SettingsTab,
      label: "Tax & GST Rules",
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: "bank" as SettingsTab,
      label: "Bank Remittance",
      icon: <Landmark className="w-4 h-4" />,
    },
    {
      id: "security" as SettingsTab,
      label: "Security & Access",
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 pb-16 font-sans w-full max-w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
              System Settings &amp; Configuration
            </h1>
            <span className="bg-[#eaf8ea] text-[#1e822d] text-xs font-bold px-3 py-0.5 rounded-full border border-[#c4eec4]">
              Active Profile
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] font-medium mt-1">
            Configure default billing parameters, company letterhead, tax rules, bank accounts, and invoice templates for SiddhiVinayak Enterprise.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Full-Width Grid Card */}
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] w-full">
        {/* Navigation Tabs (Left Rail - 3 Cols on wide screens) */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#e2e8f0] bg-[#f8fafc]/60 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <p className="px-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-3">
              Settings Categories
            </p>
            <div className="flex lg:flex-col overflow-x-auto gap-1.5 pb-2 lg:pb-0">
              {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#0260de] text-white shadow-xs"
                        : "text-[#64748b] hover:bg-[#e2e8f0]/60 hover:text-[#0f172a] bg-transparent"
                    }`}
                  >
                    <div className={isActive ? "text-white" : "text-[#64748b]"}>
                      {t.icon}
                    </div>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block pt-6">
            <div className="p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] text-xs">
              <div className="flex items-center gap-2 text-[#0260de] font-black text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Single Source of Truth</span>
              </div>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Changes saved here reflect across Invoice Generation, Bill Book headers, and Financial Reports automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Right Settings Form Content (9 Cols on wide screens) */}
        <div className="lg:col-span-9 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "company" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">Company &amp; Legal Profile</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Official corporate information used for invoices, delivery challans, and tax authorities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Company Trade Name
                  </label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    State &amp; State Code
                  </label>
                  <input
                    type="text"
                    value={`${companySettings.state} (${companySettings.stateCode})`}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/(.*?)\s*\((\d+)\)/);
                      if (match) {
                        setCompanySettings({ ...companySettings, state: match[1].trim(), stateCode: match[2].trim() });
                      } else {
                        setCompanySettings({ ...companySettings, state: val });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Company Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={companySettings.tagline}
                    onChange={(e) => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Primary Phone
                  </label>
                  <input
                    type="text"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={companySettings.gstin}
                    onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Income Tax PAN
                  </label>
                  <input
                    type="text"
                    value={companySettings.pan}
                    onChange={(e) => setCompanySettings({ ...companySettings, pan: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    CIN Number
                  </label>
                  <input
                    type="text"
                    value={companySettings.cin}
                    onChange={(e) => setCompanySettings({ ...companySettings, cin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Registered Factory / Workshop Address
                  </label>
                  <textarea
                    rows={2}
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons for Tab */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => handleResetTab("company")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings("Company Profile")}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Company Profile</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICE & BILLING DEFAULTS */}
          {activeTab === "invoice" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">Invoice &amp; Billing Defaults</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Default sequence prefix, payment terms, and automated inventory sync.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoiceDefaults.prefix}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, prefix: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold font-mono text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Default Payment Terms
                  </label>
                  <select
                    value={invoiceDefaults.defaultTerms}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, defaultTerms: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  >
                    <option value="Immediate">Due on Receipt (Immediate)</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days (Recommended)</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Default Payment Method
                  </label>
                  <select
                    value={invoiceDefaults.defaultPaymentMethod}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, defaultPaymentMethod: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                    <input
                      type="checkbox"
                      checked={invoiceDefaults.autoDecrementStock}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, autoDecrementStock: e.target.checked })}
                      className="w-4 h-4 text-[#0260de] rounded"
                    />
                    <div>
                      <p className="font-bold text-[#0f172a] text-xs">
                        Auto-decrement inventory stock upon invoice creation
                      </p>
                      <p className="text-[10px] text-[#64748b]">Reduces item stock count in catalog automatically</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                    <input
                      type="checkbox"
                      checked={invoiceDefaults.showProductImageOnBill}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, showProductImageOnBill: e.target.checked })}
                      className="w-4 h-4 text-[#0260de] rounded"
                    />
                    <div>
                      <p className="font-bold text-[#0f172a] text-xs">
                        Render product photo in PDF &amp; Print
                      </p>
                      <p className="text-[10px] text-[#64748b]">Displays component thumbnails on A4 tax invoices</p>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Standard Terms &amp; Warranty Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={invoiceDefaults.notes}
                    onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de] resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons for Tab */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => handleResetTab("invoice")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings("Invoice & Billing Defaults")}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Invoice Defaults</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TAX & GST RULES */}
          {activeTab === "tax" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">Tax &amp; GST Configuration</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Configure Indian GST tax slabs, automated CGST/SGST splits, and thresholds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Standard Default Tax Rate (%)
                  </label>
                  <select
                    value={taxSettings.defaultTaxRate}
                    onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  >
                    <option value="0">0% (GST Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard Manufacturing)</option>
                    <option value="28">28% GST (Heavy Automotive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    E-Way Bill / E-Invoice Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={taxSettings.eInvoiceThreshold}
                    onChange={(e) => setTaxSettings({ ...taxSettings, eInvoiceThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div className="md:col-span-2 space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                    <input
                      type="checkbox"
                      checked={taxSettings.enableCgstSgstSplit}
                      onChange={(e) => setTaxSettings({ ...taxSettings, enableCgstSgstSplit: e.target.checked })}
                      className="w-4 h-4 text-[#0260de] rounded"
                    />
                    <div>
                      <p className="font-bold text-[#0f172a] text-xs">
                        Automatic CGST (50%) + SGST (50%) split for Intra-State (Gujarat)
                      </p>
                      <p className="text-[10px] text-[#64748b]">
                        Automatically bifurcates into Central and State GST ledgers for tax returns
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons for Tab */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => handleResetTab("tax")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings("Tax & GST Rules")}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Tax Rules</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BANK REMITTANCE */}
          {activeTab === "bank" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">Bank Remittance Accounts</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Default company bank accounts printed on tax bills for customer payment remittance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankSettings.bankName}
                    onChange={(e) => setBankSettings({ ...bankSettings, bankName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={bankSettings.accountHolder}
                    onChange={(e) => setBankSettings({ ...bankSettings, accountHolder: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankSettings.accountNumber}
                    onChange={(e) => setBankSettings({ ...bankSettings, accountNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankSettings.ifscCode}
                    onChange={(e) => setBankSettings({ ...bankSettings, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankSettings.branchName}
                    onChange={(e) => setBankSettings({ ...bankSettings, branchName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-medium text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={bankSettings.upiId}
                    onChange={(e) => setBankSettings({ ...bankSettings, upiId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>
              </div>

              {/* Action Buttons for Tab */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => handleResetTab("bank")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings("Bank Remittance")}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Bank Details</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & ACCESS */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e8f0] pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">Security &amp; Session Configuration</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Manage master administrative account credentials, multi-factor authentication, and timeout policies.
                </p>
              </div>

              {/* Account & Session Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    value={securitySettings.adminEmail}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, adminEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Session Inactivity Timeout
                  </label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-bold text-[#0f172a] text-xs focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                  >
                    <option value="4 Hours">4 Hours</option>
                    <option value="8 Hours">8 Hours (Full Shift)</option>
                    <option value="24 Hours">24 Hours</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center justify-between cursor-pointer p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                        className="w-4 h-4 text-[#0260de] rounded"
                      />
                      <div>
                        <p className="font-bold text-[#0f172a] text-xs">
                          Two-Factor Authentication (2FA / OTP Verification)
                        </p>
                        <p className="text-[10px] text-[#64748b]">
                          Require one-time mobile passcode upon logging into the ERP dashboard
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        securitySettings.twoFactorEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {securitySettings.twoFactorEnabled ? "Active & Protected" : "Disabled"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="p-5 bg-gradient-to-br from-[#f8fafc] to-white rounded-2xl border border-[#e2e8f0] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a]">
                  <Lock className="w-4 h-4 text-[#0260de]" />
                  <span>Update Admin Password</span>
                </div>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={securitySettings.currentPassword}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Min. 6 chars"
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0260de]/20 focus:border-[#0260de]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e2e8f0] hover:bg-[#0260de] hover:text-white hover:border-[#0260de] text-[#0f172a] font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Action Buttons for Tab */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => handleResetTab("security")}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSettings("Security & Access Preferences")}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Security Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
