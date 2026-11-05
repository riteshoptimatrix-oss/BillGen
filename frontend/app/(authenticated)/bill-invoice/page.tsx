"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface InvoiceItem {
  product_id?: string;
  item_no?: string;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  image?: string;
}

interface Invoice {
  _id?: string;
  id?: string;
  invoice_number: string;
  client: string;
  customer_phone?: string;
  customer_gst?: string;
  customer_email?: string;
  customer_address?: string;

  date: string;
  payment_terms?: string;
  payment_terms_days?: number;
  due_date?: string;
  payment_method?: string;
  place_of_supply?: string;

  items?: InvoiceItem[];
  subtotal?: number;
  discount_amount?: number;
  tax_percent?: number;
  taxable_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  amount: number; // Grand total
  amount_paid?: number;
  balance_due?: number;
  status: "Paid" | "Pending" | "Overdue";

  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: string;

  notes?: string;
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

export default function BillInvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. Customer Details Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [formClient, setFormClient] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formCustomerGst, setFormCustomerGst] = useState("");
  const [formCustomerEmail, setFormCustomerEmail] = useState("");
  const [formCustomerAddress, setFormCustomerAddress] = useState("");

  // 2. Invoice Details Form State
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPaymentTerms, setFormPaymentTerms] = useState<string>("15 Days");
  const [customTermsDays, setCustomTermsDays] = useState<number>(15);
  const [formDueDate, setFormDueDate] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Bank Transfer");
  const [formTaxRate, setFormTaxRate] = useState<number>(18);
  const [formPlaceOfSupply, setFormPlaceOfSupply] = useState<string>(
    "Intra-State (Within Gujarat - CGST+SGST)"
  );
  const [formStatus, setFormStatus] = useState<"Paid" | "Pending" | "Overdue">("Pending");

  // 3. Products Cart / Items State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<ProductOption | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

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

  // 4. Customer Bank Details Form State
  const [formBankName, setFormBankName] = useState("");
  const [formAccountHolder, setFormAccountHolder] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");
  const [formBranchName, setFormBranchName] = useState("");
  const [formAccountType, setFormAccountType] = useState("Current");

  // 5. Notes & Financial Adjustments State
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formAmountPaid, setFormAmountPaid] = useState<number>(0);
  const [formNotes, setFormNotes] = useState(
    "Standard Auto Rickshaw Manufacturing Warranty (1 Year / 40,000 km on Powertrain). Goods once dispatched cannot be returned without inspection clearance."
  );

  // View / Print Modal State
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current || !viewInvoice) return;
    setIsDownloading(true);
    showToast("Generating direct PDF download...");

    try {
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF engine"));
          document.head.appendChild(script);
        });
      }

      const clone = printAreaRef.current.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      clone.style.padding = "20px";
      clone.style.width = "210mm";
      clone.style.boxSizing = "border-box";
      clone.style.position = "fixed";
      clone.style.top = "-99999px";
      clone.style.left = "-99999px";
      document.body.appendChild(clone);

      const filename = `Invoice-${viewInvoice.invoice_number || "SiddhiVinayak"}.pdf`;

      const opt = {
        margin: 5,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await (window as any).html2pdf().set(opt).from(clone).save();
      document.body.removeChild(clone);
      showToast(`Downloaded ${filename} directly!`);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${apiUrl}/invoices/`);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${apiUrl}/customers/`),
        fetch(`${apiUrl}/products/`)
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (e) {
      console.error("Error loading customers/products", e);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomersAndProducts();
  }, []);

  // -------------------------------------------------------------
  // Automatic Due Date Calculation based on Invoice Date & Terms
  // -------------------------------------------------------------
  useEffect(() => {
    if (!formDate) return;
    let daysToAdd = 15;
    if (formPaymentTerms === "7 Days") daysToAdd = 7;
    else if (formPaymentTerms === "15 Days") daysToAdd = 15;
    else if (formPaymentTerms === "30 Days") daysToAdd = 30;
    else if (formPaymentTerms === "Custom") daysToAdd = Number(customTermsDays) || 0;

    const baseDate = new Date(formDate);
    if (!isNaN(baseDate.getTime())) {
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      setFormDueDate(baseDate.toISOString().split("T")[0]);
    }
  }, [formDate, formPaymentTerms, customTermsDays]);

  // -------------------------------------------------------------
  // Customer Selection Auto-fill (Editable in Invoice)
  // -------------------------------------------------------------
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c._id === customerId);
    if (cust) {
      setFormClient(cust.name);
      setFormCustomerPhone(cust.mobile_number || "");
      setFormCustomerGst(cust.gst_number || "");
      setFormCustomerEmail(cust.email || "");
      setFormCustomerAddress(cust.billing_address || cust.delivery_address || "");

      // Bank details
      setFormBankName(cust.bank_name || "");
      setFormAccountHolder(cust.account_holder_name || cust.name || "");
      setFormAccountNumber(cust.account_number || "");
      setFormIfscCode(cust.ifsc_code || "");
      setFormBranchName(cust.branch_name || "");
      setFormAccountType(cust.account_type || "Current");

      // Auto-set place of supply based on GST state code (24 = Gujarat)
      if (cust.gst_number && !cust.gst_number.startsWith("24")) {
        setFormPlaceOfSupply("Inter-State (Outside Gujarat - IGST)");
      } else {
        setFormPlaceOfSupply("Intra-State (Within Gujarat - CGST+SGST)");
      }
    }
  };

  // -------------------------------------------------------------
  // Product Selection & Quantity Validation against Available Stock
  // -------------------------------------------------------------
  const handleSelectProductCard = (product: ProductOption) => {
    setSelectedProductToAdd(product);
    setQtyToAdd(1);
    setStockWarning(null);
  };

  const handleQtyChange = (val: number) => {
    if (!selectedProductToAdd) return;
    if (val > selectedProductToAdd.stock) {
      setStockWarning(
        `Quantity (${val}) exceeds available inventory stock of ${selectedProductToAdd.stock} units!`
      );
    } else {
      setStockWarning(null);
    }
    setQtyToAdd(val);
  };

  const handleAddProductToInvoice = () => {
    if (!selectedProductToAdd) return;
    const qty = Number(qtyToAdd) || 0;
    if (qty <= 0) {
      alert("Please enter a quantity greater than zero.");
      return;
    }
    if (qty > selectedProductToAdd.stock) {
      alert(`Cannot exceed available inventory stock of ${selectedProductToAdd.stock} units!`);
      return;
    }

    // Check if already in items list
    const existingIndex = items.findIndex((it) => it.product_id === selectedProductToAdd._id);
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + qty;
      if (newQty > selectedProductToAdd.stock) {
        alert(`Total combined quantity (${newQty}) exceeds stock of ${selectedProductToAdd.stock} units!`);
        return;
      }
      const updated = [...items];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: newQty * existing.unit_price
      };
      setItems(updated);
    } else {
      const lineTotal = qty * selectedProductToAdd.price;
      const newItem: InvoiceItem = {
        product_id: selectedProductToAdd._id,
        description: selectedProductToAdd.name,
        quantity: qty,
        unit_price: selectedProductToAdd.price,
        tax_rate: formTaxRate,
        total: lineTotal,
        image: selectedProductToAdd.image
      };
      setItems([...items, newItem]);
    }

    // Reset selection
    setSelectedProductToAdd(null);
    setQtyToAdd(1);
    setProductSearch("");
    setStockWarning(null);
  };

  const handleRemoveProductItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    const item = items[index];
    const prod = products.find((p) => p._id === item.product_id);
    const maxStock = prod ? prod.stock : 9999;

    if (newQty > maxStock) {
      alert(`Quantity cannot exceed available stock (${maxStock} units).`);
      return;
    }
    if (newQty <= 0) {
      handleRemoveProductItem(index);
      return;
    }

    const updated = [...items];
    updated[index] = {
      ...item,
      quantity: newQty,
      total: newQty * item.unit_price
    };
    setItems(updated);
  };

  // -------------------------------------------------------------
  // Automatic Invoice Calculations
  // -------------------------------------------------------------
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = Math.min(subtotal, Math.max(0, Number(formDiscount) || 0));
    const taxableAmount = Math.max(0, subtotal - discount);

    const isIntraState = formPlaceOfSupply.includes("Intra-State");
    const taxRate = Number(formTaxRate) || 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxRate > 0) {
      if (isIntraState) {
        cgstAmount = (taxableAmount * (taxRate / 2)) / 100;
        sgstAmount = (taxableAmount * (taxRate / 2)) / 100;
      } else {
        igstAmount = (taxableAmount * taxRate) / 100;
      }
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

    // Amount paid and balance due
    const paid =
      formStatus === "Paid"
        ? grandTotal
        : Math.min(grandTotal, Math.max(0, Number(formAmountPaid) || 0));
    const balanceDue = Math.max(0, grandTotal - paid);

    return {
      subtotal,
      discount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      grandTotal,
      paid,
      balanceDue,
      isIntraState
    };
  }, [items, formDiscount, formTaxRate, formPlaceOfSupply, formStatus, formAmountPaid]);

  // Open Create Modal
  const openCreateModal = async () => {
    try {
      const res = await fetch(`${apiUrl}/invoices/next-number`);
      if (res.ok) {
        const data = await res.json();
        setFormInvoiceNumber(data.next_number);
      }
    } catch {
      setFormInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }

    setSelectedCustomerId("");
    setFormClient("");
    setFormCustomerPhone("");
    setFormCustomerGst("");
    setFormCustomerEmail("");
    setFormCustomerAddress("");

    setFormDate(new Date().toISOString().split("T")[0]);
    setFormPaymentTerms("15 Days");
    setCustomTermsDays(15);
    setFormPaymentMethod("Bank Transfer");
    setFormTaxRate(18);
    setFormPlaceOfSupply("Intra-State (Within Gujarat - CGST+SGST)");
    setFormStatus("Pending");

    setItems([]);
    setSelectedProductToAdd(null);
    setQtyToAdd(1);
    setStockWarning(null);

    setFormBankName("");
    setFormAccountHolder("");
    setFormAccountNumber("");
    setFormIfscCode("");
    setFormBranchName("");
    setFormAccountType("Current");

    setFormDiscount(0);
    setFormAmountPaid(0);

    setIsPreviewOpen(false);
    setIsCreateOpen(true);
  };

  // -------------------------------------------------------------
  // Final Save & Finalize Invoice
  // -------------------------------------------------------------
  const handleFinalizeInvoice = async () => {
    if (!formClient.trim()) {
      alert("Please select or enter customer name.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one product to the invoice.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Invoice = {
        invoice_number: formInvoiceNumber.trim(),
        client: formClient.trim(),
        customer_phone: formCustomerPhone.trim() || undefined,
        customer_gst: formCustomerGst.trim() || undefined,
        customer_email: formCustomerEmail.trim() || undefined,
        customer_address: formCustomerAddress.trim() || undefined,

        date: formDate,
        payment_terms: formPaymentTerms,
        payment_terms_days:
          formPaymentTerms === "Custom"
            ? customTermsDays
            : formPaymentTerms === "7 Days"
            ? 7
            : formPaymentTerms === "30 Days"
            ? 30
            : 15,
        due_date: formDueDate,
        payment_method: formPaymentMethod,
        place_of_supply: formPlaceOfSupply,

        items,
        subtotal: calculations.subtotal,
        discount_amount: calculations.discount,
        tax_percent: formTaxRate,
        taxable_amount: calculations.taxableAmount,
        cgst_amount: calculations.cgstAmount,
        sgst_amount: calculations.sgstAmount,
        igst_amount: calculations.igstAmount,
        amount: calculations.grandTotal,
        amount_paid: calculations.paid,
        balance_due: calculations.balanceDue,
        status: formStatus,

        bank_name: formBankName.trim() || undefined,
        account_holder_name: formAccountHolder.trim() || undefined,
        account_number: formAccountNumber.trim() || undefined,
        ifsc_code: formIfscCode.trim() || undefined,
        branch_name: formBranchName.trim() || undefined,
        account_type: formAccountType.trim() || undefined,

        notes: formNotes
      };

      const res = await fetch(`${apiUrl}/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdInvoice = await res.json();
        showToast(`Invoice ${createdInvoice.invoice_number} generated & stock updated successfully!`);
        await Promise.all([fetchInvoices(), fetchCustomersAndProducts()]);
        setIsCreateOpen(false);
        setIsPreviewOpen(false);
        // Automatically open the finalized invoice for printing/download
        setViewInvoice(createdInvoice);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to generate invoice.");
      }
    } catch (e) {
      console.error("Save invoice error:", e);
      alert("Error saving invoice to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${apiUrl}/invoices/${invoiceId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Invoice deleted successfully.");
        setInvoices((prev) => prev.filter((i) => (i._id || i.id) !== invoiceId));
        if (viewInvoice && (viewInvoice._id || viewInvoice.id) === invoiceId) {
          setViewInvoice(null);
        }
      }
    } catch (e) {
      console.error("Delete invoice error:", e);
    }
  };

  // Filtered Products for Searchable Dropdown
  const filteredProductsList = useMemo(() => {
    if (!productSearch.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_gst?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || inv.status?.toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totalInvoicedRevenue = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPaidRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPendingBalance = invoices.reduce((sum, i) => sum + (i.balance_due || (i.status !== "Paid" ? i.amount : 0)), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Paid
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Pending
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Bill &amp; Invoice Management
            </h1>
            <span className="bg-red-50 text-[#c51f2a] text-xs font-bold px-3 py-1 rounded-full border border-red-100">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Generate professional GST-compliant invoices with automated tax, stock tracking, and sales register synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/finance"
            className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Finance &rarr; Sales</span>
          </Link>
          <Link
            href="/bill-invoice/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c51f2a] hover:bg-[#a81922] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Generate Invoice
          </Link>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Invoiced</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">
            ₹{totalInvoicedRevenue.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{invoices.length} Total Invoices Generated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collected Revenue</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalPaidRevenue.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-emerald-600/80 mt-1">Fully Settled Payments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Receivables</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            ₹{totalPendingBalance.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-amber-600/80 mt-1">Outstanding Balance Due</p>
        </div>
      </div>

      {/* Invoice Registry Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, customer, GST..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
            {["ALL", "PAID", "PENDING", "OVERDUE"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === st
                    ? "bg-[#c51f2a] text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Records Table */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#c51f2a]"></div>
            <p className="text-xs text-gray-400 mt-2 font-medium">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 font-bold text-sm">No invoices found</p>
            <p className="text-xs text-gray-400 mt-1">
              Click &quot;Generate Invoice&quot; to create your first professional bill.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Invoice Date</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-6 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-6 text-center">Payment Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const id = (inv._id || inv.id) as string;
                  return (
                    <tr key={id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <span className="bg-red-50 text-[#c51f2a] px-2 py-0.5 rounded border border-red-100">
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        {inv.client}
                        {inv.customer_gst && (
                          <span className="block text-[10px] text-gray-400 font-mono">
                            GST: {inv.customer_gst}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-gray-500 whitespace-nowrap">{inv.date}</td>
                      <td className="py-3.5 px-6 text-gray-500 whitespace-nowrap">{inv.due_date || "-"}</td>
                      <td className="py-3.5 px-6 text-right font-black text-gray-900 whitespace-nowrap">
                        ₹{(inv.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-amber-600 whitespace-nowrap">
                        ₹{(inv.balance_due ?? (inv.status !== "Paid" ? inv.amount : 0)).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          View / Download PDF
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(id)}
                          className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL: COMPREHENSIVE INVOICE BUILDER */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-6">
              <div>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Professional Bill &amp; Invoice Builder
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1.5 tracking-tight">
                  Generate Manufacturing Invoice
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select customer, choose products from inventory, verify automatic tax &amp; due date, and preview before generating.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* FORM BODY */}
            <div className="space-y-6 text-xs">
              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#c51f2a] flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    Customer Information
                  </h3>
                  <span className="text-[11px] text-gray-400 italic">Auto-fills from Customer module · Editable</span>
                </div>

                {/* Customer Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Select Existing Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    aria-label="Select Customer"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a]"
                  >
                    <option value="">-- Choose Customer from Database --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.gst_number ? `(GST: ${c.gst_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled & Editable Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formClient}
                      onChange={(e) => setFormClient(e.target.value)}
                      placeholder="Customer / Company Name"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formCustomerGst}
                      onChange={(e) => setFormCustomerGst(e.target.value)}
                      placeholder="e.g. 24AABCG1234F1Z8"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formCustomerEmail}
                      onChange={(e) => setFormCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Billing &amp; Delivery Address
                    </label>
                    <input
                      type="text"
                      value={formCustomerAddress}
                      onChange={(e) => setFormCustomerAddress(e.target.value)}
                      placeholder="Full billing street address, city, state, postal code"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: INVOICE DETAILS & AUTOMATED TERMS */}
              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#c51f2a] flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    Invoice Details &amp; Payment Terms
                  </h3>
                  <span className="text-[11px] text-gray-400 italic">Due Date calculated automatically</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      required
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-mono font-bold text-[#c51f2a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                    >
                      <option value="7 Days">7 Days</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="Custom">Custom Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      {formPaymentTerms === "Custom" ? "Custom Days" : "Calculated Due Date"}
                    </label>
                    {formPaymentTerms === "Custom" ? (
                      <input
                        type="number"
                        min="1"
                        value={customTermsDays}
                        onChange={(e) => setCustomTermsDays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold"
                        placeholder="Number of days"
                      />
                    ) : (
                      <input
                        type="date"
                        readOnly
                        value={formDueDate}
                        className="w-full px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg font-bold text-gray-800 cursor-not-allowed"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Tax Rate (GST %)
                    </label>
                    <select
                      value={formTaxRate}
                      onChange={(e) => setFormTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800"
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% (Lubricants &amp; Spares)</option>
                      <option value="12">12% (Electrical &amp; Accessories)</option>
                      <option value="18">18% (Standard Auto Rickshaw &amp; Components)</option>
                      <option value="28">28% (Luxury &amp; Specialized Assemblies)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Place of Supply / Tax Calculation
                    </label>
                    <select
                      value={formPlaceOfSupply}
                      onChange={(e) => setFormPlaceOfSupply(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium"
                    >
                      <option value="Intra-State (Within Gujarat - CGST+SGST)">
                        Intra-State (Within Gujarat: CGST {formTaxRate / 2}% + SGST {formTaxRate / 2}%)
                      </option>
                      <option value="Inter-State (Outside Gujarat - IGST)">
                        Inter-State (Outside Gujarat: IGST {formTaxRate}%)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRODUCT SELECTION & INVENTORY CART */}
              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#c51f2a] flex items-center justify-center font-bold text-[10px]">
                      3
                    </span>
                    Products Selection &amp; Inventory Check
                  </h3>
                  <span className="text-[11px] text-gray-400 italic">Select product from dropdown · Real-time stock</span>
                </div>

                {/* PRODUCT DROPDOWN & ADD CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Searchable Product Dropdown */}
                  <div className="md:col-span-6 relative" ref={productDropdownRef}>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Product Dropdown <span className="text-red-500">*</span>
                    </label>

                    {/* Dropdown Button Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className={`w-full px-3.5 py-2 text-xs bg-white border rounded-xl font-semibold flex items-center justify-between shadow-xs transition-all text-left ${
                        isProductDropdownOpen ? "border-[#c51f2a] ring-2 ring-[#c51f2a]/20" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {selectedProductToAdd ? (
                        <div className="flex items-center gap-2 truncate">
                          {selectedProductToAdd.image ? (
                            <Image
                              src={selectedProductToAdd.image}
                              alt=""
                              width={24}
                              height={24}
                              className="w-6 h-6 object-cover rounded border border-gray-100 flex-shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold flex-shrink-0">
                              AR
                            </div>
                          )}
                          <span className="font-bold text-gray-900 truncate">
                            {selectedProductToAdd.name}
                          </span>
                          <span className="text-[#c51f2a] font-mono font-bold">
                            ₹{selectedProductToAdd.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-normal">-- Select a Product from Dropdown --</span>
                      )}

                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {selectedProductToAdd && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              selectedProductToAdd.stock < 10
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {selectedProductToAdd.stock} in stock
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            isProductDropdownOpen ? "rotate-180 text-[#c51f2a]" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Dropdown Floating Menu */}
                    {isProductDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Search Inside Dropdown */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50/80">
                          <input
                            type="text"
                            autoFocus
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Type to filter products..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c51f2a]"
                          />
                        </div>

                        {/* Dropdown Items List */}
                        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 p-1">
                          {filteredProductsList.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-xs">No matching products found</div>
                          ) : (
                            filteredProductsList.map((prod) => {
                              const isSelected = selectedProductToAdd?._id === prod._id;
                              return (
                                <div
                                  key={prod._id}
                                  onClick={() => {
                                    handleSelectProductCard(prod);
                                    setIsProductDropdownOpen(false);
                                  }}
                                  className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? "bg-red-50 text-[#c51f2a]"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {prod.image ? (
                                      <Image
                                        src={prod.image}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold flex-shrink-0">
                                        AR
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-900 text-xs truncate">{prod.name}</p>
                                      <p className="text-[10px] text-gray-500 font-mono">
                                        ₹{prod.price.toLocaleString("en-IN")} per unit
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        prod.stock < 10
                                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      {prod.stock} in stock
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Quantity {selectedProductToAdd ? `(Max: ${selectedProductToAdd.stock})` : ""}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProductToAdd ? selectedProductToAdd.stock : undefined}
                      disabled={!selectedProductToAdd}
                      value={qtyToAdd}
                      onChange={(e) => handleQtyChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Line Subtotal
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-black text-gray-900 text-right truncate">
                      ₹{selectedProductToAdd ? (selectedProductToAdd.price * (Number(qtyToAdd) || 0)).toLocaleString("en-IN") : "0"}
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      disabled={!selectedProductToAdd || (selectedProductToAdd && qtyToAdd > selectedProductToAdd.stock)}
                      onClick={handleAddProductToInvoice}
                      className="w-full py-2 px-3 bg-[#c51f2a] hover:bg-[#a81922] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Stock Warning Notice */}
                {stockWarning && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{stockWarning}</span>
                  </div>
                )}

                {/* Selected Products Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-center">Tax %</th>
                        <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-400 italic">
                            No products added yet. Select products from the inventory above.
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-2">
                              {it.image ? (
                                <Image
                                  src={it.image}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 object-cover rounded border"
                                  unoptimized
                                />
                              ) : null}
                              <span>{it.description}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-gray-700">
                              ₹{it.unit_price.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleUpdateItemQty(idx, Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-center font-bold"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center text-gray-500 font-medium">
                              {formTaxRate}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-gray-900">
                              ₹{it.total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveProductItem(idx)}
                                className="text-gray-400 hover:text-rose-600 font-bold p-1"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: CUSTOMER BANK DETAILS */}
              <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#c51f2a] flex items-center justify-center font-bold text-[10px]">
                      4
                    </span>
                    Customer Bank Details
                  </h3>
                  <span className="text-[11px] text-gray-400 italic">Included on invoice for remittance verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="e.g. Bank of Baroda, HDFC Bank"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formAccountHolder}
                      onChange={(e) => setFormAccountHolder(e.target.value)}
                      placeholder="Account holder name"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      placeholder="e.g. 01420200001234"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formIfscCode}
                      onChange={(e) => setFormIfscCode(e.target.value)}
                      placeholder="e.g. BARB0ODHAVA"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={formBranchName}
                      onChange={(e) => setFormBranchName(e.target.value)}
                      placeholder="Branch name"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Account Type
                    </label>
                    <select
                      value={formAccountType}
                      onChange={(e) => setFormAccountType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                    >
                      <option value="Current">Current Account</option>
                      <option value="Savings">Savings Account</option>
                      <option value="Cash Credit">Cash Credit (CC)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: NOTES & AUTOMATIC INVOICE TOTALS BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Additional Notes */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#c51f2a] flex items-center justify-center font-bold text-[10px]">
                      5
                    </span>
                    Additional Notes &amp; Terms
                  </h3>
                  <textarea
                    rows={4}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Delivery instructions, warranty terms, and dispatch notes..."
                    className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#c51f2a]"
                  />

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Initial Invoice Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold"
                    >
                      <option value="Pending">Pending (Payment Awaiting)</option>
                      <option value="Paid">Paid (Full Payment Received)</option>
                      <option value="Overdue">Overdue (Immediate Attention)</option>
                    </select>
                  </div>
                </div>

                {/* Automatic Calculations Card */}
                <div className="bg-white p-5 rounded-2xl border-2 border-gray-200 space-y-2 shadow-xs">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b pb-2">
                    Automatic Invoice Calculations
                  </h4>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Subtotal (Gross Items):</span>
                    <span className="font-bold text-gray-900">
                      ₹{calculations.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Discount Amount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Number(e.target.value))}
                      className="w-24 px-2 py-0.5 border border-gray-200 rounded text-right font-bold text-xs"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-700 font-semibold">Taxable Amount:</span>
                    <span className="font-bold text-gray-900">
                      ₹{calculations.taxableAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {calculations.isIntraState ? (
                    <>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>CGST ({formTaxRate / 2}%):</span>
                        <span className="font-semibold text-emerald-600">
                          ₹{calculations.cgstAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>SGST ({formTaxRate / 2}%):</span>
                        <span className="font-semibold text-emerald-600">
                          ₹{calculations.sgstAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>IGST ({formTaxRate}%):</span>
                      <span className="font-semibold text-blue-600">
                        ₹{calculations.igstAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-2 border-t-2 border-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-[#c51f2a] text-lg">
                      ₹{calculations.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {formStatus !== "Paid" && (
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-gray-500">Amount Paid (₹):</span>
                      <input
                        type="number"
                        min="0"
                        max={calculations.grandTotal}
                        value={formAmountPaid}
                        onChange={(e) => setFormAmountPaid(Number(e.target.value))}
                        className="w-24 px-2 py-0.5 border border-gray-200 rounded text-right font-bold text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-1 text-amber-700 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{calculations.balanceDue.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={items.length === 0 || !formClient.trim()}
                  className="px-5 py-2.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-40 w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview Invoice
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeInvoice}
                  disabled={isSubmitting || items.length === 0 || !formClient.trim()}
                  className="px-6 py-2.5 bg-[#c51f2a] hover:bg-[#a81922] text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {isSubmitting ? "Finalizing & Updating Stock..." : "Generate Invoice & Update Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: LIVE INVOICE PREVIEW BEFORE FINALIZATION */}
      {/* ========================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#c51f2a]">
                Invoice Preview
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* PREVIEW CONTENT */}
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-6 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Opti Matrix Auto Rickshaw Mfg.
                  </h2>
                  <p className="text-gray-500 text-[11px]">Plot 12, GIDC Heavy Engineering Zone</p>
                  <p className="text-gray-500 text-[11px]">Ahmedabad, Gujarat - 382415</p>
                  <p className="text-gray-600 font-mono text-[11px] font-bold">GSTIN: 24AAAFO1234F1Z9</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-extrabold text-[#c51f2a] bg-red-50 px-2.5 py-1 rounded border border-red-100 inline-block">
                    {formInvoiceNumber}
                  </span>
                  <p className="text-gray-500 text-[11px] mt-1.5">Date: {formDate}</p>
                  <p className="text-gray-500 text-[11px]">Due Date: {formDueDate} ({formPaymentTerms})</p>
                  <p className="text-gray-500 text-[11px]">Payment Mode: {formPaymentMethod}</p>
                  <div className="mt-1">{getStatusBadge(formStatus)}</div>
                </div>
              </div>

              {/* Bill To & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bill To</p>
                  <h4 className="text-sm font-bold text-gray-900 mt-0.5">{formClient}</h4>
                  {formCustomerPhone && <p className="text-gray-600 text-[11px]">Phone: {formCustomerPhone}</p>}
                  {formCustomerEmail && <p className="text-gray-600 text-[11px]">Email: {formCustomerEmail}</p>}
                  {formCustomerGst && <p className="text-gray-800 font-mono text-[11px] font-bold">GSTIN: {formCustomerGst}</p>}
                  {formCustomerAddress && <p className="text-gray-600 text-[11px] mt-1">{formCustomerAddress}</p>}
                </div>

                {formBankName && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Bank Details</p>
                    <p className="font-bold text-gray-900 mt-0.5">{formBankName}</p>
                    <p className="text-gray-600 text-[11px]">A/C: {formAccountNumber} ({formAccountType})</p>
                    <p className="text-gray-600 text-[11px]">IFSC: {formIfscCode} · {formBranchName}</p>
                    <p className="text-gray-600 text-[11px]">Beneficiary: {formAccountHolder}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{it.description}</td>
                      <td className="py-2.5 px-3 text-right">₹{it.unit_price.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        ₹{it.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations Summary */}
              <div className="flex flex-col items-end space-y-1 text-xs">
                <div className="flex justify-between w-64 text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{calculations.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {calculations.discount > 0 && (
                  <div className="flex justify-between w-64 text-gray-600">
                    <span>Discount:</span>
                    <span>-₹{calculations.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-gray-800 font-semibold border-t pt-1">
                  <span>Taxable Value:</span>
                  <span>₹{calculations.taxableAmount.toLocaleString("en-IN")}</span>
                </div>
                {calculations.isIntraState ? (
                  <>
                    <div className="flex justify-between w-64 text-emerald-700">
                      <span>CGST ({formTaxRate / 2}%):</span>
                      <span>₹{calculations.cgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between w-64 text-emerald-700">
                      <span>SGST ({formTaxRate / 2}%):</span>
                      <span>₹{calculations.sgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between w-64 text-blue-700">
                    <span>IGST ({formTaxRate}%):</span>
                    <span>₹{calculations.igstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-sm font-black text-gray-900 border-t-2 border-gray-900 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-[#c51f2a]">₹{calculations.grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between w-64 text-xs font-bold text-amber-700">
                  <span>Balance Due:</span>
                  <span>₹{calculations.balanceDue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {formNotes && (
                <div className="p-3 bg-gray-50 rounded-xl text-gray-500 italic text-[11px]">
                  <strong>Terms &amp; Notes:</strong> {formNotes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-3 pt-4 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalizeInvoice}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#c51f2a] hover:bg-[#a81922] text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Finalizing..." : "Confirm & Finalize Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: FINAL PROFESSIONAL INVOICE (PRINT & PDF) */}
      {/* ========================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6 print:hidden">
              <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                Finalized Manufacturing Tax Invoice
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Downloading PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Direct Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  title="Print"
                  className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>

                <button
                  onClick={() => setViewInvoice(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* PRINTABLE BILL DOCUMENT */}
            <div ref={printAreaRef} className="space-y-6 text-xs text-gray-800 p-2 sm:p-4 bg-white print:p-0">
              {/* Company & Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#76c816] text-[#1e293b] flex items-center justify-center font-black text-sm">
                      SV
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      SiddhiVinayak Enterprise
                    </h2>
                  </div>
                  <p className="text-gray-500 text-[11px]">High-Performance 3-Wheeler Commercial Vehicles &amp; Spare Parts</p>
                  <p className="text-gray-500 text-[11px]">Plot 12, GIDC Heavy Engineering Zone, Odhav</p>
                  <p className="text-gray-500 text-[11px]">Ahmedabad, Gujarat - 382415, India</p>
                  <p className="text-gray-800 font-mono text-[11px] font-black mt-1">
                    GSTIN: 24AAAFO1234F1Z9 · State Code: 24 (Gujarat)
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-black text-[#c51f2a] bg-red-50 px-3 py-1 rounded-lg border border-red-100 inline-block">
                    {viewInvoice.invoice_number}
                  </span>
                  <p className="text-gray-500 text-[11px] mt-2">
                    Invoice Date: <strong className="text-gray-900">{viewInvoice.date}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Due Date: <strong className="text-gray-900">{viewInvoice.due_date || "-"}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Terms: <strong className="text-gray-900">{viewInvoice.payment_terms || "15 Days"}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Method: <strong className="text-gray-900">{viewInvoice.payment_method || "Bank Transfer"}</strong>
                  </p>
                  <div className="mt-2">{getStatusBadge(viewInvoice.status)}</div>
                </div>
              </div>

              {/* Bill To & Customer Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Billed To (Customer)</p>
                  <h4 className="text-sm font-black text-gray-900 mt-0.5">{viewInvoice.client}</h4>
                  {viewInvoice.customer_phone && (
                    <p className="text-gray-600 text-[11px]">Phone: {viewInvoice.customer_phone}</p>
                  )}
                  {viewInvoice.customer_email && (
                    <p className="text-gray-600 text-[11px]">Email: {viewInvoice.customer_email}</p>
                  )}
                  {viewInvoice.customer_gst && (
                    <p className="text-gray-900 font-mono text-[11px] font-bold mt-0.5">
                      Customer GSTIN: {viewInvoice.customer_gst}
                    </p>
                  )}
                  {viewInvoice.customer_address && (
                    <p className="text-gray-600 text-[11px] mt-1">{viewInvoice.customer_address}</p>
                  )}
                </div>

                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Customer Remittance Bank Details
                  </p>
                  {viewInvoice.bank_name ? (
                    <>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{viewInvoice.bank_name}</h4>
                      <p className="text-gray-600 text-[11px]">
                        Account Number: <strong className="font-mono text-gray-900">{viewInvoice.account_number}</strong>
                      </p>
                      <p className="text-gray-600 text-[11px]">
                        IFSC Code: <strong className="font-mono text-gray-900">{viewInvoice.ifsc_code}</strong> · {viewInvoice.branch_name}
                      </p>
                      <p className="text-gray-600 text-[11px]">
                        Beneficiary: {viewInvoice.account_holder_name} ({viewInvoice.account_type || "Current"})
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic text-[11px] mt-2">
                      Standard corporate account remittance / Direct Bank Transfer.
                    </p>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table with image + product name + description */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1e293b] text-white uppercase font-black text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-14">Sr. No</th>
                      <th className="py-2.5 px-4 text-left">Product</th>
                      <th className="py-2.5 px-4 text-right w-28">Price</th>
                      <th className="py-2.5 px-3 text-center w-16">Qty</th>
                      <th className="py-2.5 px-4 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {viewInvoice.items && viewInvoice.items.length > 0 ? (
                      viewInvoice.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 text-center text-gray-500 font-mono font-bold align-top pt-2.5">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-4 align-top">
                            <div className="flex items-start gap-3">
                              {it.image ? (
                                <img
                                  src={it.image}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs flex-shrink-0">
                                  📦
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-gray-900 text-xs">
                                  {it.product_name || it.description}
                                </h4>
                                {it.description && (
                                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                                    {it.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-semibold text-gray-800 align-top pt-2.5">
                            ₹{it.unit_price.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 px-3 text-center font-black text-gray-900 align-top pt-2.5">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-4 text-right font-black font-mono text-gray-950 align-top pt-2.5">
                            ₹{it.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-3 text-center text-gray-400 font-mono">1</td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          Auto Rickshaw Chassis &amp; Component Assemblies
                        </td>
                        <td className="py-3 px-4 text-right font-mono">₹{(viewInvoice.amount || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-center font-black">1</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-gray-900">
                          ₹{(viewInvoice.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculations & Tax Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="space-y-2 max-w-sm text-gray-600 text-[11px]">
                  {viewInvoice.notes && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-800 text-[11px] mb-0.5">Special Instructions &amp; Terms:</p>
                      <p className="italic">{viewInvoice.notes}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 space-y-0.5">
                    <p>• Interest @ 18% per annum will be charged if payment is delayed beyond the due date.</p>
                    <p>• Subject to Ahmedabad, Gujarat jurisdiction only.</p>
                  </div>
                </div>

                {/* Amount Totals Box */}
                <div className="w-full sm:w-72 bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-900">
                      ₹{(viewInvoice.subtotal || viewInvoice.amount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {viewInvoice.discount_amount && viewInvoice.discount_amount > 0 ? (
                    <div className="flex justify-between text-gray-600">
                      <span>Discount:</span>
                      <span className="font-bold text-rose-600">
                        -₹{viewInvoice.discount_amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : null}

                  {viewInvoice.cgst_amount || viewInvoice.sgst_amount ? (
                    <>
                      <div className="flex justify-between text-emerald-700 text-[11px]">
                        <span>CGST ({(viewInvoice.tax_percent || 18) / 2}%):</span>
                        <span className="font-semibold">₹{(viewInvoice.cgst_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 text-[11px]">
                        <span>SGST ({(viewInvoice.tax_percent || 18) / 2}%):</span>
                        <span className="font-semibold">₹{(viewInvoice.sgst_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  ) : viewInvoice.igst_amount ? (
                    <div className="flex justify-between text-blue-700 text-[11px]">
                      <span>IGST ({viewInvoice.tax_percent || 18}%):</span>
                      <span className="font-semibold">₹{viewInvoice.igst_amount.toLocaleString("en-IN")}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-base font-black text-gray-900 border-t-2 border-gray-900 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-[#c51f2a]">₹{(viewInvoice.amount || 0).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-xs pt-1 border-t border-gray-200 font-semibold text-gray-700">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-700">
                      ₹{(viewInvoice.amount_paid ?? (viewInvoice.status === "Paid" ? viewInvoice.amount : 0)).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-black text-amber-700">
                    <span>Balance Due:</span>
                    <span>
                      ₹{(viewInvoice.balance_due ?? (viewInvoice.status !== "Paid" ? viewInvoice.amount : 0)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Verification */}
              <div className="pt-10 flex justify-between items-end border-t border-gray-200 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Receiver&apos;s Signature</p>
                  <div className="w-44 border-b border-gray-300 mt-8"></div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">For Opti Matrix Auto Rickshaw Mfg.</p>
                  <div className="w-44 border-b border-gray-300 mt-8 ml-auto"></div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
