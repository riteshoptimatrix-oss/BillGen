"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getApiUrl, formatImageUrl, getAuthToken } from "@/lib/api";
import { exportElementToPDF } from "@/lib/pdf";
import InvoicePrintDocument from "@/components/invoice/InvoicePrintDocument";
import ProductIllustration from "@/components/products/ProductIllustration";

interface InvoiceItem {
  product_id?: string;
  item_no: string;
  product_name: string;
  description: string;
  image?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CustomerOption {
  _id: string;
  name: string;
  mobile_number?: string;
  email?: string;
  gst_number?: string;
  delivery_address?: string;
  billing_address?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: string;
}

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  // Data sources from backend
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Company Information (SiddhiVinayak Enterprise) - Fully Dynamic & Editable
  const [companyName, setCompanyName] = useState("SiddhiVinayak Enterprise");
  const [companyTagline, setCompanyTagline] = useState(
    "High-Performance 3-Wheeler Commercial Vehicles & Spare Parts"
  );
  const [companyPhone, setCompanyPhone] = useState("+91 98250 14829");
  const [companyAddress, setCompanyAddress] = useState(
    "Plot 12, GIDC Heavy Engineering Zone, Odhav, Ahmedabad, Gujarat 382415"
  );
  const [companyWebsite, setCompanyWebsite] = useState("www.siddhivinayakenterprise.com");
  const [companyEmail, setCompanyEmail] = useState("contact@siddhivinayakenterprise.com");
  const [companyGstin, setCompanyGstin] = useState("24AAAFO1234F1Z9");

  // 2. Customer Information (Auto-fillable from Database + Fully Editable)
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [companyClientName, setCompanyClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGst, setClientGst] = useState("");

  // 3. Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("Immediate");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [status, setStatus] = useState("Paid");
  const [customTermsDays, setCustomTermsDays] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // 4. Products / Items List (Dynamic from Database)
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Product Dropdown & Add line State
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<ProductOption | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // 5. Payment Info
  const [bankName, setBankName] = useState("State Bank of India");
  const [accountNumber, setAccountNumber] = useState("39482019482");
  const [refIfsc, setRefIfsc] = useState("SBIN0001042");
  const [branchName, setBranchName] = useState("Odhav Industrial Branch, Ahmedabad");
  const [accountHolder, setAccountHolder] = useState("SiddhiVinayak Enterprise (Current Account)");
  const [accountType, setAccountType] = useState("Current Account");

  // 6. Terms and Conditions
  const [termsText, setTermsText] = useState(
    "1. Goods once sold will not be returned without warranty inspection.\n2. Interest @ 18% p.a. charged after due date.\n3. All disputes subject to Ahmedabad jurisdiction only."
  );

  // UI zoom scaling for A4 preview on screen
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [mobileActiveView, setMobileActiveView] = useState<"form" | "preview">("form");

  // On mobile screens, auto-adjust initial zoom scale to fit phone viewport
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setPreviewScale(0.44);
    }
  }, []);

  // Load defaults from System Settings (Company, Bank, Invoice & Tax rules)
  useEffect(() => {
    try {
      const savedBank = localStorage.getItem("sve_bank_settings");
      if (savedBank) {
        const b = JSON.parse(savedBank);
        if (b.bankName) setBankName(b.bankName);
        if (b.accountNumber) setAccountNumber(b.accountNumber);
        if (b.ifscCode) setRefIfsc(b.ifscCode);
        if (b.branchName) setBranchName(b.branchName);
        if (b.accountHolder) setAccountHolder(b.accountHolder);
        if (b.accountType) setAccountType(b.accountType);
      }

      const savedInv = localStorage.getItem("sve_invoice_defaults");
      if (savedInv) {
        const inv = JSON.parse(savedInv);
        if (inv.defaultTerms) setPaymentTerms(inv.defaultTerms);
        if (inv.defaultPaymentMethod) setPaymentMethod(inv.defaultPaymentMethod);
        if (inv.notes) setTermsText(inv.notes);
      }

      const savedTax = localStorage.getItem("sve_tax_settings");
      if (savedTax) {
        const t = JSON.parse(savedTax);
        if (t.defaultTaxRate !== undefined) setTaxRate(t.defaultTaxRate);
      }
    } catch (e) {
      console.error("Failed to load user settings into bill-invoice create", e);
    }
  }, []);

  const apiUrl = getApiUrl();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Click outside listener for product dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial data (customers, products, next invoice number)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [cRes, pRes, numRes, settingsRes] = await Promise.all([
          fetch(`${apiUrl}/customers/`, { headers, credentials: "include" }),
          fetch(`${apiUrl}/products/`, { headers, credentials: "include" }),
          fetch(`${apiUrl}/invoices/next-number`, { headers, credentials: "include" }),
          fetch(`${apiUrl}/settings`, { headers, credentials: "include" })
        ]);

        if (cRes.ok) {
          const custs = await cRes.json();
          setCustomers(custs);
          if (custs.length > 0) {
            // Default first customer
            handleCustomerSelect(custs[0]._id, custs);
          }
        }

        if (pRes.ok) {
          setProducts(await pRes.json());
        }

        if (numRes.ok) {
          const numData = await numRes.json();
          setInvoiceNumber(numData.next_number || `INV-${new Date().getFullYear()}-0001`);
        }

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.bank) {
            if (sData.bank.bankName) setBankName(sData.bank.bankName);
            if (sData.bank.accountNumber) setAccountNumber(sData.bank.accountNumber);
            if (sData.bank.ifscCode) setRefIfsc(sData.bank.ifscCode);
            if (sData.bank.branchName) setBranchName(sData.bank.branchName);
            if (sData.bank.accountHolder) setAccountHolder(sData.bank.accountHolder);
            if (sData.bank.accountType) setAccountType(sData.bank.accountType);
          }
          if (sData.invoice) {
            if (sData.invoice.defaultTerms) setPaymentTerms(sData.invoice.defaultTerms);
            if (sData.invoice.defaultPaymentMethod) setPaymentMethod(sData.invoice.defaultPaymentMethod);
            if (sData.invoice.notes) setTermsText(sData.invoice.notes);
          }
          if (sData.tax && sData.tax.defaultTaxRate !== undefined) {
            setTaxRate(sData.tax.defaultTaxRate);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    fetchData();
  }, []);

  // -------------------------------------------------------------
  // Automatic Due Date Calculation based on Invoice Date & Terms
  // -------------------------------------------------------------
  useEffect(() => {
    if (!invoiceDate) return;
    let days = 15;
    if (paymentTerms === "7 Days") days = 7;
    else if (paymentTerms === "15 Days") days = 15;
    else if (paymentTerms === "30 Days") days = 30;
    else if (paymentTerms === "Custom") days = Number(customTermsDays) || 0;

    const base = new Date(invoiceDate);
    if (!isNaN(base.getTime())) {
      base.setDate(base.getDate() + days);
      setDueDate(base.toISOString().split("T")[0]);
    }
  }, [invoiceDate, paymentTerms, customTermsDays]);

  // -------------------------------------------------------------
  // Customer Selection Auto-fill
  // -------------------------------------------------------------
  const handleCustomerSelect = (id: string, list = customers) => {
    setSelectedCustomerId(id);
    const c = list.find((item) => item._id === id);
    if (c) {
      setClientName(c.name);
      setCompanyClientName(c.name);
      setClientPhone(c.mobile_number || "");
      setClientEmail(c.email || "");
      setClientAddress(c.billing_address || c.delivery_address || "");
      setClientGst(c.gst_number || "");

      if (c.bank_name) setBankName(c.bank_name);
      if (c.account_number) setAccountNumber(c.account_number);
      if (c.ifsc_code) setRefIfsc(c.ifsc_code);
      if (c.branch_name) setBranchName(c.branch_name);
      if (c.account_holder_name) setAccountHolder(c.account_holder_name);
      if (c.account_type) setAccountType(c.account_type);
    }
  };

  // -------------------------------------------------------------
  // Product Selection & Line Items Add/Remove/Edit
  // -------------------------------------------------------------
  const handleSelectProduct = (prod: ProductOption) => {
    setSelectedProductToAdd(prod);
    setQtyToAdd(1);
    setStockWarning(null);
  };

  const handleQtyChange = (val: number) => {
    if (!selectedProductToAdd) return;
    if (val > selectedProductToAdd.stock) {
      setStockWarning(
        `Quantity (${val}) exceeds available stock (${selectedProductToAdd.stock} units)!`
      );
    } else {
      setStockWarning(null);
    }
    setQtyToAdd(val);
  };

  const handleAddItemToInvoice = () => {
    if (!selectedProductToAdd) return;
    const qty = Number(qtyToAdd) || 0;
    if (qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (qty > selectedProductToAdd.stock) {
      alert(`Cannot exceed available stock of ${selectedProductToAdd.stock} units.`);
      return;
    }

    const newItemNo = String(items.length + 1).padStart(2, "0");
    const newItem: InvoiceItem = {
      product_id: selectedProductToAdd._id,
      item_no: newItemNo,
      product_name: selectedProductToAdd.name,
      description: selectedProductToAdd.description || selectedProductToAdd.name,
      image: formatImageUrl(selectedProductToAdd.image) || "",
      quantity: qty,
      unit_price: selectedProductToAdd.price,
      total: qty * selectedProductToAdd.price
    };

    setItems([...items, newItem]);
    setSelectedProductToAdd(null);
    setQtyToAdd(1);
    setProductSearch("");
    setStockWarning(null);
    showToast(`Added ${newItem.product_name} to invoice.`);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    // Renumber item_no
    const renumbered = updated.map((it, idx) => ({
      ...it,
      item_no: String(idx + 1).padStart(2, "0")
    }));
    setItems(renumbered);
  };

  const handleUpdateItem = (
    index: number,
    field: "product_name" | "description" | "quantity" | "unit_price",
    value: any
  ) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === "product_name") {
      current.product_name = String(value);
    } else if (field === "description") {
      current.description = String(value);
    } else if (field === "quantity") {
      const q = Math.max(1, Number(value) || 0);
      current.quantity = q;
      current.total = q * current.unit_price;
    } else if (field === "unit_price") {
      const p = Math.max(0, Number(value) || 0);
      current.unit_price = p;
      current.total = current.quantity * p;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddManualRow = () => {
    const newItemNo = String(items.length + 1).padStart(2, "0");
    setItems([
      ...items,
      {
        item_no: newItemNo,
        product_name: "Specialized Engineering Labor / Fitting",
        description: "Full vehicle assembly calibration, chassis alignment & dyno testing service",
        image: "",
        quantity: 1,
        unit_price: 1500,
        total: 1500
      }
    ]);
  };

  // -------------------------------------------------------------
  // Automated Calculations (Subtotal, Tax, Discount, Grand Total)
  // -------------------------------------------------------------
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(((taxable * (Number(taxRate) || 0)) / 100) * 100) / 100;
    const grandTotal = Math.round((taxable + tax) * 100) / 100;

    const isInterState = clientGst && !clientGst.startsWith("24");
    const igst = isInterState ? tax : 0;
    const cgst = !isInterState ? Math.round((tax / 2) * 100) / 100 : 0;
    const sgst = !isInterState ? Math.round((tax / 2) * 100) / 100 : 0;

    return {
      subtotal,
      discount,
      taxable,
      tax,
      cgst,
      sgst,
      igst,
      grandTotal
    };
  }, [items, discountAmount, taxRate, clientGst]);

  // Format Date to DD/MM/YYYY
  const formattedInvoiceDate = useMemo(() => {
    if (!invoiceDate) return "";
    const [y, m, d] = invoiceDate.split("-");
    return `${d}/${m}/${y}`;
  }, [invoiceDate]);

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return "";
    const [y, m, d] = dueDate.split("-");
    return `${d}/${m}/${y}`;
  }, [dueDate]);

  // Filtered Products for Dropdown
  const filteredProductsList = useMemo(() => {
    if (!productSearch.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // -------------------------------------------------------------
  // Save & Finalize Invoice to Database
  // -------------------------------------------------------------
  const handleSaveInvoice = async () => {
    if (!clientName.trim()) {
      alert("Please enter customer name.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item to the invoice.");
      return;
    }

    // Statutory Indian Mobile Validation (if entered)
    const rawDigits = clientPhone.replace(/[\s\-\(\)]/g, "");
    const cleanPhone = rawDigits.startsWith("+91") ? rawDigits.slice(3) : rawDigits.startsWith("0") && rawDigits.length === 11 ? rawDigits.slice(1) : rawDigits;
    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert("Please enter a valid 10-digit Indian mobile number for the customer (e.g., 9825014829).");
      return;
    }

    // Statutory Indian GSTIN Validation (if entered)
    const cleanGst = clientGst.trim().toUpperCase();
    if (cleanGst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
      alert("Invalid customer GSTIN format. Expected 15 characters (e.g. 24AAAFO1234F1Z9).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        invoice_number: invoiceNumber.trim(),
        client: clientName.trim(),
        customer_phone: cleanPhone || undefined,
        customer_gst: cleanGst || undefined,
        customer_address: clientAddress.trim() || undefined,

        date: invoiceDate,
        payment_terms: paymentTerms,
        payment_terms_days:
          paymentTerms === "Custom"
            ? customTermsDays
            : paymentTerms === "7 Days"
            ? 7
            : paymentTerms === "30 Days"
            ? 30
            : 15,
        due_date: dueDate,
        payment_method: "Bank Transfer",
        place_of_supply: "Intra-State (Within Gujarat - CGST+SGST)",

        items: items.map((it) => ({
          product_id: it.product_id,
          item_no: it.item_no,
          product_name: it.product_name,
          description: it.description,
          image: formatImageUrl(it.image),
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total
        })),

        subtotal: calculations.subtotal,
        discount_amount: calculations.discount,
        tax_percent: taxRate,
        taxable_amount: calculations.taxable,
        cgst_amount: calculations.cgst,
        sgst_amount: calculations.sgst,
        igst_amount: calculations.igst,
        amount: calculations.grandTotal,
        amount_paid: status === "Paid" ? calculations.grandTotal : 0,
        balance_due: status === "Paid" ? 0 : calculations.grandTotal,
        status: status,

        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: refIfsc.trim() || undefined,
        branch_name: branchName.trim() || undefined,
        account_holder_name: accountHolder.trim() || undefined,
        account_type: accountType.trim() || undefined,

        notes: termsText
      };

      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/invoices/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Invoice ${invoiceNumber} saved successfully & inventory stock updated!`);
        setTimeout(() => {
          router.push("/bill-invoice");
        }, 1200);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save invoice.");
      }
    } catch (e) {
      console.error("Save invoice error:", e);
      alert("Error saving invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  // Direct PDF Download (Saves directly to user's computer without opening print dialog)
  const handleDownloadPDF = async () => {
    const invoiceEl = document.getElementById("printable-a4-invoice");
    if (!invoiceEl) return;

    setIsDownloading(true);
    showToast("Generating direct PDF download...");

    try {
      const filename = `Invoice-${invoiceNumber || "SiddhiVinayak"}.pdf`;
      await exportElementToPDF(invoiceEl, filename);
      showToast(`Downloaded ${filename} directly!`);
    } catch (err) {
      console.error("Direct PDF download error:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Invoice Handler
  const handlePrint = () => {
    window.print();
  };

  // Reference empty rows filler to maintain classic bill book height
  const minimumRows = 10;
  const emptyRowsCount = Math.max(0, minimumRows - items.length);

  return (
    <div className="pb-16 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#76c816]"></span>
          {toastMessage}
        </div>
      )}

      {/* Top Action Bar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#e2e8f0] pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/bill-invoice"
              className="p-2 rounded-xl border border-[#e2e8f0] hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to Invoices"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Invoice Generator · SiddhiVinayak Enterprise
              </h1>
              <p className="text-xs text-gray-500">
                Two-column workspace: Real-time form on the left, pixel-perfect A4 Bill Book preview on the right.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* DIRECT DOWNLOAD PDF BUTTON */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Direct Download PDF</span>
              </>
            )}
          </button>

          {/* Quick Print Icon */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print via Printer Dialog"
            className="p-2.5 bg-white border border-[#e2e8f0] text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-50 shadow-xs transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSaveInvoice}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isSubmitting ? "Finalizing..." : "Save & Finalize Invoice"}
          </button>
        </div>
      </div>

      {/* Mobile View Switcher (Only visible on mobile / tablet screens < xl) */}
      <div className="xl:hidden flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-700 shadow-xs mb-3">
        <button
          type="button"
          onClick={() => setMobileActiveView("form")}
          className={`flex-1 py-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-2 ${
            mobileActiveView === "form"
              ? "bg-white text-gray-900 shadow-xs font-black"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>📝 Invoice Form</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView("preview")}
          className={`flex-1 py-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-2 ${
            mobileActiveView === "preview"
              ? "bg-[#1e293b] text-white shadow-xs font-black"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>📄 Live A4 Preview</span>
          <span className="w-2 h-2 rounded-full bg-[#76c816] animate-pulse"></span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT SIDE: INVOICE INFORMATION FORM */}
        {/* ======================================================== */}
        <div className={`xl:col-span-6 space-y-6 print:hidden ${mobileActiveView === "form" ? "block" : "hidden xl:block"}`}>
          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#76c816] text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                Customer Details
              </h2>
              <span className="text-[11px] text-gray-400">Select or enter customer profile</span>
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Select Customer (Auto-fills details below)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-[#e2e8f0] rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#76c816]"
              >
                <option value="">-- Choose Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.gst_number ? `(${c.gst_number})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Client Name (Contact Person) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Jonathan Manathon"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Company Name (Customer Trade Name)
                </label>
                <input
                  type="text"
                  value={companyClientName}
                  onChange={(e) => setCompanyClientName(e.target.value)}
                  placeholder="e.g. Vorfun Medicine"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +01 234 55678"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={clientGst}
                  onChange={(e) => setClientGst(e.target.value)}
                  placeholder="e.g. 24AABCG1234F1Z8"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="e.g. 88B Fortuna Street, NYC"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: INVOICE META & PAYMENT TERMS */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#76c816] text-white flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                Invoice Details &amp; Due Date
              </h2>
              <span className="text-[11px] text-gray-400">Due date calculates automatically</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Invoice No.
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="001-245/670"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-mono font-bold text-[#0260de]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-medium"
                >
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Custom">Custom Days</option>
                </select>
              </div>

              {paymentTerms === "Custom" && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Custom Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customTermsDays}
                    onChange={(e) => setCustomTermsDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Calculated Due Date
                </label>
                <input
                  type="text"
                  readOnly
                  value={formattedDueDate}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-[#e2e8f0] rounded-lg font-bold text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  GST Tax Rate (%)
                </label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-bold text-gray-800"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PRODUCTS SELECTION & INVENTORY CHECK */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-[#0260de] flex items-center justify-center font-black text-[11px]">
                  3
                </span>
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  PRODUCTS SELECTION &amp; INVENTORY CHECK
                </h2>
              </div>
              <span className="text-[11px] text-gray-400 italic">
                Connected to Products module &middot; Real-time stock
              </span>
            </div>

            {/* Red Bordered Search Input from Screenshot */}
            <div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product inventory by name or description..."
                className="w-full px-4 py-2.5 text-xs text-gray-800 bg-white border-2 border-red-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 placeholder-gray-400 font-medium transition-all"
              />
            </div>

            {/* Product Cards Grid from Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
              {filteredProductsList.map((prod) => {
                const isSelected = selectedProductToAdd?._id === prod._id;
                const isLowStock = prod.stock <= 10;
                return (
                  <div
                    key={prod._id}
                    onClick={() => handleSelectProduct(prod)}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#0260de] ring-2 ring-red-100 shadow-md bg-red-50/20"
                        : "border-[#e2e8f0]/90 hover:border-gray-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-[#e2e8f0] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {prod.image ? (
                        <img
                          src={formatImageUrl(prod.image)}
                          alt={prod.name}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-gray-300 text-xs font-bold">📦</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate" title={prod.name}>
                        {prod.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-gray-900">
                          ₹{prod.price.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isLowStock
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Selector & Add Button for Selected Product */}
            {selectedProductToAdd && (
              <div className="p-3 bg-red-50/40 border border-red-200/70 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0260de]"></span>
                  <span className="font-bold text-gray-800">Selected:</span>
                  <span className="font-semibold text-gray-900">{selectedProductToAdd.name}</span>
                  <span className="font-bold text-[#0260de]">
                    (₹{selectedProductToAdd.price.toLocaleString("en-IN")})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-600">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProductToAdd.stock}
                    value={qtyToAdd}
                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-center"
                  />
                  <span className="font-bold text-gray-900 font-mono text-xs">
                    = ₹{(selectedProductToAdd.price * qtyToAdd).toLocaleString("en-IN")}
                  </span>
                  <button
                    type="button"
                    disabled={qtyToAdd > selectedProductToAdd.stock}
                    onClick={handleAddItemToInvoice}
                    className="px-4 py-1.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 shadow-xs"
                  >
                    + Add to Invoice
                  </button>
                </div>
              </div>
            )}

            {stockWarning && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{stockWarning}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Invoice Item List ({items.length} items)
              </span>
              <button
                type="button"
                onClick={handleAddManualRow}
                className="text-xs font-bold text-[#0260de] hover:underline flex items-center gap-1"
              >
                + Add Custom Service Row
              </button>
            </div>

            {/* Editable Items Table */}
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Sr. No</th>
                    <th className="py-2.5 px-3">Product &amp; Description</th>
                    <th className="py-2.5 px-3 text-right w-24">Price (₹)</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                        No items added yet. Search and select products above to add them to this invoice.
                      </td>
                    </tr>
                  ) : items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-center font-mono text-gray-400 font-bold align-top pt-3">
                        {it.item_no}
                      </td>
                      <td className="py-2.5 px-3 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-white border border-[#e2e8f0] shadow-xs flex-shrink-0 p-0.5 overflow-hidden flex items-center justify-center">
                            {it.image ? (
                              <img
                                src={formatImageUrl(it.image)}
                                alt=""
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <ProductIllustration name={it.product_name} className="w-full h-full" />
                            )}
                          </div>
                          <input
                            type="text"
                            value={it.product_name}
                            onChange={(e) => handleUpdateItem(idx, "product_name", e.target.value)}
                            placeholder="Product Name"
                            className="w-full px-2.5 py-1 border border-[#e2e8f0] rounded-lg font-bold text-gray-900 text-xs focus:ring-1 focus:ring-red-400 outline-none"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={it.description}
                          onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                          placeholder="Product Description (features, specs, vehicle compatibility)..."
                          className="w-full px-2.5 py-1 border border-[#e2e8f0] rounded-lg text-[11px] text-gray-600 resize-none focus:ring-1 focus:ring-red-400 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right align-top pt-3">
                        <input
                          type="number"
                          min="0"
                          value={it.unit_price}
                          onChange={(e) => handleUpdateItem(idx, "unit_price", e.target.value)}
                          className="w-24 px-2 py-1 border border-[#e2e8f0] rounded-lg text-right font-medium text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center align-top pt-3">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                          className="w-14 px-1.5 py-1 border border-[#e2e8f0] rounded-lg text-center font-bold text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-gray-900 align-top pt-3 text-xs font-mono">
                        ₹{it.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-center align-top pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-6 h-6 rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center font-bold transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: PAYMENT INFO & TERMS */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#76c816] text-white flex items-center justify-center font-bold text-[10px]">
                  4
                </span>
                Payment Info &amp; Terms &amp; Conditions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Bank of Georgia"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Account No.
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 56-67892"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Ref / IFSC
                </label>
                <input
                  type="text"
                  value={refIfsc}
                  onChange={(e) => setRefIfsc(e.target.value)}
                  placeholder="e.g. 0145 76590"
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Terms and Conditions
                </label>
                <textarea
                  rows={3}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  placeholder="Payment and warranty terms..."
                  className="w-full p-2.5 text-xs border border-[#e2e8f0] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: COMPANY INFO (SIDDHIVINAYAK ENTERPRISE DETAILS) */}
          <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#76c816] text-white flex items-center justify-center font-bold text-[10px]">
                  5
                </span>
                Company Header &amp; Footer Info
              </h2>
              <span className="text-[11px] text-gray-400">All fields fully dynamic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Company Phone
                </label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Company Email
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Company Website
                </label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={companyGstin}
                  onChange={(e) => setCompanyGstin(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#e2e8f0] rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SIDE: LIVE A4 INVOICE PREVIEW (MATCHING REFERENCE IMAGE) */}
        {/* ======================================================== */}
        <div className={`xl:col-span-6 flex flex-col items-center print:w-full print:block ${mobileActiveView === "preview" ? "block" : "hidden xl:flex"}`}>
          {/* Preview Controls Bar */}
          <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-3 text-xs px-2 print:hidden">
            <span className="font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#76c816] animate-pulse"></span>
              Live A4 Invoice Preview (Real-Time)
            </span>

            {/* Zoom Scaling Controls */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#e2e8f0] shadow-xs">
              <span className="text-[10px] font-bold text-gray-400">Zoom:</span>
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.max(0.35, Math.round((s - 0.05) * 100) / 100))}
                className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center font-black"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[11px] font-mono font-bold w-9 text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.min(1.20, Math.round((s + 0.05) * 100) / 100))}
                className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center font-black"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale(0.44)}
                className="text-[10px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold ml-1"
                title="Fit to phone width"
              >
                Fit Phone
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale(0.85)}
                className="text-[10px] text-gray-500 hover:text-gray-900 ml-0.5 font-semibold"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Scaled Preview Wrapper for Screen */}
          <div
            className="w-full overflow-x-auto flex justify-center pb-8 print:p-0 print:m-0 print:overflow-visible"
            style={{
              maxHeight: "calc(100vh - 140px)"
            }}
          >
            {/* THE ACTUAL A4 INVOICE DOCUMENT (210mm × 297mm - MATCHING REFERENCE DESIGN) */}
            <div
              className="origin-top transition-transform shadow-2xl print:shadow-none bg-white rounded-none"
              style={{
                width: "794px",
                height: "1123px",
                transform: `scale(${previewScale})`,
                marginBottom: `${-(1123 * (1 - previewScale))}px`,
                boxSizing: "border-box"
              }}
            >
              <InvoicePrintDocument
                id="printable-a4-invoice"
                data={{
                  invoice_number: invoiceNumber,
                  date: invoiceDate,
                  due_date: dueDate,
                  payment_terms: paymentTerms,
                  payment_method: paymentMethod,
                  status: status,

                  client: companyClientName || clientName || "Valued Customer",
                  customer_phone: clientPhone,
                  customer_email: clientEmail,
                  customer_gst: clientGst,
                  customer_address: clientAddress,

                  items: items.map((it) => {
                    let img = it.image || "";
                    if (!img && products.length > 0) {
                      const match = products.find(
                        (p) =>
                          (it.product_id && p._id === it.product_id) ||
                          p.name.toLowerCase() === (it.product_name || it.description || "").toLowerCase()
                      );
                      if (match?.image) img = formatImageUrl(match.image);
                    }
                    return {
                      product_id: it.product_id,
                      item_no: it.item_no,
                      product_name: it.product_name,
                      description: it.description,
                      quantity: it.quantity,
                      unit_price: it.unit_price,
                      total: it.total,
                      image: img ? formatImageUrl(img) : ""
                    };
                  }),

                  subtotal: calculations.subtotal,
                  discount_amount: discountAmount,
                  tax_percent: taxRate,
                  cgst_amount: calculations.cgst,
                  sgst_amount: calculations.sgst,
                  igst_amount: calculations.igst,
                  amount: calculations.grandTotal,
                  amount_paid: status === "Paid" ? calculations.grandTotal : 0,
                  balance_due: status === "Paid" ? 0 : calculations.grandTotal,

                  bank_name: bankName,
                  account_number: accountNumber,
                  ifsc_code: refIfsc,
                  branch_name: branchName,
                  account_holder_name: accountHolder,
                  account_type: accountType,

                  company_name: companyName,
                  company_tagline: companyTagline,
                  company_address: companyAddress,
                  company_gstin: companyGstin,
                  company_phone: companyPhone,
                  company_email: companyEmail,
                  company_website: companyWebsite,

                  notes: termsText
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-SPECIFIC CSS RULES TO ENSURE 100% A4 DIMENSIONS & REMOVE BROWSING HEADERS/FOOTERS */}
      <style jsx global>{`
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all navigational sidebars, headers, form controls */
          header,
          nav,
          aside,
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          /* Expand invoice container to 100% */
          #printable-a4-invoice {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
