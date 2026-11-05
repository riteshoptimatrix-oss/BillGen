"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getApiUrl } from "@/lib/api";
import { exportElementToPDF } from "@/lib/pdf";

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

  // 2. Customer Information (Auto-fillable + Fully Editable)
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName] = useState("Jonathan Manathon");
  const [companyClientName, setCompanyClientName] = useState("Gujarat Auto Spares & Body Works");
  const [clientPhone, setClientPhone] = useState("+91 98250 14829");
  const [clientAddress, setClientAddress] = useState(
    "Plot 42, GIDC Industrial Estate, Odhav, Ahmedabad, Gujarat 382415"
  );
  const [clientGst, setClientGst] = useState("24AABCG1234F1Z8");

  // 3. Invoice Meta
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-0005");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("15 Days");
  const [customTermsDays, setCustomTermsDays] = useState<number>(15);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // 4. Products / Items List (Dynamic)
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      item_no: "01",
      product_name: "Auto Rickshaw Heavy-Duty Tubular Chassis Frame",
      description: "High-tensile mild steel tubular chassis, anti-corrosive electrophoretic primer coated.",
      image: "http://localhost:8000/uploads/auto_rickshaw_chassis.jpg",
      quantity: 2,
      unit_price: 18500,
      total: 37000
    },
    {
      item_no: "02",
      product_name: "200cc 4-Stroke CNG/Petrol Engine & Gearbox Assembly",
      description: "Single-cylinder 4-stroke 198.6cc engine unit with integrated 4-speed gearbox & reverse gear.",
      image: "http://localhost:8000/uploads/auto_rickshaw_engine.jpg",
      quantity: 1,
      unit_price: 34500,
      total: 34500
    },
    {
      item_no: "03",
      product_name: "Heavy-Duty Rear Differential Axle Assembly",
      description: "Precision-machined rear differential axle with hypoid crown wheel & pinion gear set.",
      image: "http://localhost:8000/uploads/auto_rickshaw_differential.jpg",
      quantity: 2,
      unit_price: 14800,
      total: 29600
    }
  ]);

  // Product Dropdown & Add line State
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<ProductOption | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // 5. Payment Info
  const [bankName, setBankName] = useState("Bank of Baroda");
  const [accountNumber, setAccountNumber] = useState("01420200001234");
  const [refIfsc, setRefIfsc] = useState("BARB0ODHAVA");

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
        const [cRes, pRes, numRes] = await Promise.all([
          fetch(`${apiUrl}/customers/`),
          fetch(`${apiUrl}/products/`),
          fetch(`${apiUrl}/invoices/next-number`)
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
          setInvoiceNumber(numData.next_number || "INV-2026-0005");
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
      setClientAddress(c.billing_address || c.delivery_address || "");
      setClientGst(c.gst_number || "");

      if (c.bank_name) setBankName(c.bank_name);
      if (c.account_number) setAccountNumber(c.account_number);
      if (c.ifsc_code) setRefIfsc(c.ifsc_code);
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
      image: selectedProductToAdd.image || "",
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

    return {
      subtotal,
      discount,
      taxable,
      tax,
      grandTotal
    };
  }, [items, discountAmount, taxRate]);

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

    setIsSubmitting(true);
    try {
      const payload = {
        invoice_number: invoiceNumber.trim(),
        client: clientName.trim(),
        customer_phone: clientPhone.trim() || undefined,
        customer_gst: clientGst.trim() || undefined,
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
          image: it.image,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total
        })),

        subtotal: calculations.subtotal,
        discount_amount: calculations.discount,
        tax_percent: taxRate,
        taxable_amount: calculations.taxable,
        cgst_amount: Math.round((calculations.tax / 2) * 100) / 100,
        sgst_amount: Math.round((calculations.tax / 2) * 100) / 100,
        igst_amount: 0.0,
        amount: calculations.grandTotal,
        amount_paid: calculations.grandTotal,
        balance_due: 0.0,
        status: "Paid",

        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: refIfsc.trim() || undefined,

        notes: termsText
      };

      const res = await fetch(`${apiUrl}/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                        <Image
                          src={prod.image}
                          alt={prod.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
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
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-center font-mono text-gray-400 font-bold align-top pt-3">
                        {it.item_no}
                      </td>
                      <td className="py-2.5 px-3 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-[#e2e8f0] shadow-xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 border border-[#e2e8f0] flex items-center justify-center text-xs flex-shrink-0">
                              📦
                            </div>
                          )}
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
            {/* THE ACTUAL A4 INVOICE DOCUMENT (210mm × 297mm) */}
            <div
              id="printable-a4-invoice"
              className="bg-white shadow-2xl print:shadow-none flex flex-col justify-between relative transition-transform origin-top"
              style={{
                width: "210mm",
                minHeight: "297mm",
                height: "297mm",
                transform: `scale(${previewScale})`,
                marginBottom: `${-(297 * 3.7795275591 * (1 - previewScale))}px`,
                boxSizing: "border-box"
              }}
            >
              {/* TOP HEADER: DUAL-TONE ANGLED POLYGON BANNER */}
              <div className="relative w-full h-[124px] overflow-hidden flex-shrink-0 bg-[#1e293b]">
                {/* Left Part: Vibrant Lime Green Polygon ("Bill Book") */}
                <div
                  className="absolute inset-0 bg-[#76c816] flex flex-col justify-center pl-12 shadow-sm"
                  style={{
                    clipPath: "polygon(0 0, 48% 0, 40% 100%, 0 100%)"
                  }}
                >
                  <span className="text-[10px] font-black tracking-widest text-[#1e293b]/70 uppercase">
                    Tax Invoice / Bill
                  </span>
                  <h1 className="text-4xl font-black text-gray-950 tracking-tight select-none">
                    Bill Book
                  </h1>
                </div>

                {/* Right Part: Dark Charcoal / Slate Polygon (Company Name & Tagline) */}
                <div
                  className="absolute inset-0 bg-[#1e293b] flex items-center justify-end pr-10"
                  style={{
                    clipPath: "polygon(48% 0, 100% 0, 100% 100%, 40% 100%)"
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Circle Logo Crest with Initial */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#76c816] to-[#5ea111] text-gray-950 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0 border border-white/20">
                      <span>SV</span>
                    </div>

                    <div className="text-right">
                      <h2 className="text-xl font-black text-white tracking-tight">
                        {companyName}
                      </h2>
                      <p className="text-[11px] text-[#76c816] font-semibold tracking-wide">
                        {companyTagline}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                        GSTIN: {companyGstin}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BODY CONTENT AREA */}
              <div className="flex-1 px-10 pt-5 pb-2 flex flex-col justify-between">
                <div>
                  {/* "Billed to" & Invoice Meta Grid */}
                  <div className="grid grid-cols-12 gap-3 mb-4 pb-3 border-b border-[#e2e8f0]">
                    {/* Left: Customer Info */}
                    <div className="col-span-7 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                        <span className="text-[10px] font-black text-[#1e293b] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#76c816]"></span>
                          Billed to (Buyer Details)
                        </span>
                        {clientGst && (
                          <span className="text-[9px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            GST: {clientGst}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Contact Person</p>
                          <p className="font-extrabold text-slate-900 text-xs mt-0.5">{clientName || "—"}</p>
                          <p className="text-slate-600 text-[11px] font-semibold mt-0.5 truncate">{companyClientName || ""}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Phone &amp; Address</p>
                          <p className="font-bold text-slate-900 text-xs mt-0.5 font-mono">{clientPhone || "—"}</p>
                          <p className="text-slate-600 text-[10px] mt-0.5 leading-snug line-clamp-2">{clientAddress || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Invoice Particulars */}
                    <div className="col-span-5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between text-xs">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="text-[10px] font-black text-[#1e293b] uppercase tracking-wider">
                          Invoice Particulars
                        </span>
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-[#1e293b] text-white">
                          {invoiceNumber || "—"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Invoice Date</p>
                          <p className="font-bold text-slate-900 text-xs font-mono mt-0.5">{formattedInvoiceDate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Payment Terms</p>
                          <p className="font-bold text-slate-900 text-xs mt-0.5">{paymentTerms}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Due Date</p>
                          <p className="font-bold text-red-600 text-xs font-mono mt-0.5">{formattedDueDate || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Mode</p>
                          <p className="font-bold text-slate-900 text-xs mt-0.5">Bank Transfer / UPI</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ITEMIZED TABLE: EXACT REQUESTED COLUMNS & BEAUTIFUL UI/UX */}
                  {/* Columns: Sr. No, Product (image + product name top + description below), Price, Qty, Total */}
                  <div className="border border-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      {/* Dark Charcoal Header */}
                      <thead>
                        <tr className="bg-[#1e293b] text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="py-2.5 px-3 border-r border-slate-700 text-center w-14">
                            Sr. No
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700 text-left">
                            Product
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-700 text-right w-28">
                            Price
                          </th>
                          <th className="py-2.5 px-3 border-r border-slate-700 text-center w-16">
                            Qty
                          </th>
                          <th className="py-2.5 px-4 text-right w-28">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-300 text-gray-800 bg-white">
                        {/* Dynamic User Entered Items */}
                        {items.map((it, idx) => (
                          <tr key={idx} className="min-h-[54px] hover:bg-slate-50/30">
                            {/* Sr. No */}
                            <td className="py-2 px-3 border-r border-gray-300 text-center font-bold text-slate-700 font-mono text-xs align-top">
                              {it.item_no || String(idx + 1).padStart(2, "0")}
                            </td>

                            {/* Product: Left Image + Top Product Name + Bottom Description */}
                            <td className="py-2 px-4 border-r border-gray-300 align-top">
                              <div className="flex items-start gap-3">
                                {it.image ? (
                                  <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] bg-white overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center">
                                    <img
                                      src={it.image}
                                      alt={it.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center flex-shrink-0 text-sm">
                                    📦
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-extrabold text-slate-900 text-xs leading-tight">
                                    {it.product_name || it.description}
                                  </h4>
                                  {it.description && (
                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                      {it.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-2 px-4 border-r border-gray-300 text-right font-semibold font-mono text-slate-800 text-xs align-top">
                              ₹{it.unit_price.toLocaleString("en-IN")}
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-3 border-r border-gray-300 text-center font-black text-slate-900 text-xs align-top">
                              {it.quantity}
                            </td>

                            {/* Total */}
                            <td className="py-2 px-4 text-right font-black font-mono text-slate-950 text-xs align-top">
                              ₹{it.total.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}

                        {/* Filler Empty Rows to maintain proper A4 vertical proportions */}
                        {Array.from({ length: emptyRowsCount }).map((_, fIdx) => (
                          <tr key={`filler-${fIdx}`} className="h-10">
                            <td className="py-1 px-3 border-r border-gray-300 text-center text-transparent font-mono text-xs">
                              {items.length + fIdx + 1}
                            </td>
                            <td className="py-1 px-4 border-r border-gray-300">&nbsp;</td>
                            <td className="py-1 px-4 border-r border-gray-300">&nbsp;</td>
                            <td className="py-1 px-3 border-r border-gray-300">&nbsp;</td>
                            <td className="py-1 px-4">&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BOTTOM BLOCK: PAYMENT INFO, TERMS, AND TOTALS */}
                <div className="border border-slate-900 rounded-xl overflow-hidden grid grid-cols-12 divide-x divide-slate-900 mt-3 text-xs bg-white">
                  {/* Left Column: Payment Info */}
                  <div className="col-span-4 p-3.5 space-y-1.5 text-[11px] text-slate-700 bg-slate-50/40">
                    <p className="font-black text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#76c816]"></span>
                      Payment info
                    </p>
                    <p className="text-slate-600">
                      Bank Name: <strong className="text-slate-900 font-semibold">{bankName}</strong>
                    </p>
                    <p className="text-slate-600 font-mono">
                      Account no.: <strong className="text-slate-900 font-semibold">{accountNumber}</strong>
                    </p>
                    <p className="text-slate-600 font-mono">
                      Ref / IFSC: <strong className="text-slate-900 font-semibold">{refIfsc}</strong>
                    </p>
                  </div>

                  {/* Middle Column: Terms and Conditions & Authorized Signatory */}
                  <div className="col-span-5 p-3.5 flex flex-col justify-between text-[10px] text-slate-600 leading-snug">
                    <div>
                      <p className="font-black text-slate-900 text-xs mb-1">Terms and Conditions</p>
                      <div className="whitespace-pre-line text-[10px] text-slate-500">
                        {termsText}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-end">
                      <span className="text-[9px] text-slate-400 font-mono">Computer Generated Invoice</span>
                      <div className="text-right">
                        <div className="w-28 border-b border-slate-400 mb-0.5"></div>
                        <span className="text-[10px] font-bold text-slate-800">Authorized Signatory</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Calculations & Totals (3 Stacked Rows with Green Highlight) */}
                  <div className="col-span-3 flex flex-col justify-end divide-y divide-slate-900">
                    {/* Subtotal Row */}
                    <div className="flex h-8 items-stretch">
                      <div className="w-1/2 bg-[#1e293b] text-white font-bold px-2.5 flex items-center text-[11px]">
                        Subtotal
                      </div>
                      <div className="w-1/2 px-2.5 font-bold font-mono text-slate-900 flex items-center justify-end text-[11px]">
                        ₹{calculations.subtotal.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Tax Row */}
                    <div className="flex h-8 items-stretch">
                      <div className="w-1/2 bg-[#1e293b] text-white font-bold px-2.5 flex items-center text-[11px]">
                        Tax ({taxRate}%)
                      </div>
                      <div className="w-1/2 px-2.5 font-bold font-mono text-slate-900 flex items-center justify-end text-[11px]">
                        ₹{calculations.tax.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Grand Total Row (Vibrant Lime Green Background) */}
                    <div className="flex h-10 items-stretch bg-[#76c816]">
                      <div className="w-1/2 text-gray-950 font-black px-2.5 flex items-center text-xs uppercase tracking-wide">
                        Total
                      </div>
                      <div className="w-1/2 px-2.5 font-black font-mono text-gray-950 flex items-center justify-end text-sm">
                        ₹{calculations.grandTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM FOOTER BANNER: DUAL-TONE ANGLED POLYGON WITH CONTACT INFO */}
              <div className="relative w-full h-[76px] overflow-hidden flex-shrink-0 bg-[#1e293b]">
                {/* Left Part: Dark Charcoal Bar with Contact Details */}
                <div
                  className="absolute inset-0 bg-[#1e293b] text-white flex items-center px-10 z-10"
                  style={{
                    clipPath: "polygon(0 0, 80% 0, 74% 100%, 0 100%)"
                  }}
                >
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#76c816]">📞</span>
                      <span>{companyPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#76c816]">🌐</span>
                      <span>{companyWebsite}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate max-w-[260px]">
                      <span className="text-[#76c816]">📍</span>
                      <span className="truncate">{companyAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#76c816]">✉️</span>
                      <span>{companyEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Right Part: Lime Green Corner Accent with Thank You Message */}
                <div
                  className="absolute inset-0 bg-[#76c816] flex items-center justify-end pr-6"
                  style={{
                    clipPath: "polygon(80% 0, 100% 0, 100% 100%, 74% 100%)"
                  }}
                >
                  <p className="text-[#1e293b] font-black text-xs uppercase tracking-wider text-right">
                    Thank You For<br />Your Business!
                  </p>
                </div>
              </div>
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
