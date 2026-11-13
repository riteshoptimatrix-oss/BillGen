"use client";

import React, { useState } from "react";
import { formatImageUrl } from "@/lib/api";
import ProductIllustration from "@/components/products/ProductIllustration";
import {
  Calendar,
  FileText,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

export interface InvoiceItemData {
  product_id?: string;
  item_no?: string;
  product_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total: number;
  image?: string;
}

export interface InvoiceDocumentData {
  invoice_number: string;
  date: string;
  due_date?: string;
  payment_terms?: string;
  payment_method?: string;
  status: "Paid" | "Pending" | "Overdue" | string;

  // Buyer / Customer
  client: string;
  customer_phone?: string;
  customer_email?: string;
  customer_gst?: string;
  customer_address?: string;

  // Items
  items?: InvoiceItemData[];

  // Financials
  subtotal?: number;
  discount_amount?: number;
  tax_percent?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  amount: number; // Grand Total
  amount_paid?: number;
  balance_due?: number;

  // Bank Info
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_type?: string;

  // Company Details (Defaulted to SiddhiVinayak Enterprise)
  company_name?: string;
  company_tagline?: string;
  company_address?: string;
  company_gstin?: string;
  company_state_code?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  for_company_signatory?: string;

  // Terms & Instructions
  notes?: string;
}

interface InvoicePrintDocumentProps {
  data: InvoiceDocumentData;
  id?: string;
}

function InvoiceProductCell({ it }: { it: InvoiceItemData }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = it.image ? formatImageUrl(it.image) : "";
  const productName = it.product_name || it.description || "Automotive Component";

  return (
    <div className="flex items-center gap-3">
      {/* Product Image Thumbnail (Consistent with Reference Design) */}
      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200/90 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
        {imageUrl && !imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={productName}
            crossOrigin="anonymous"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <ProductIllustration name={productName} className="w-full h-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-slate-900 text-xs leading-snug truncate">
          {productName}
        </h4>
        {it.description && it.description.trim() !== productName.trim() && (
          <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
            {it.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function InvoicePrintDocument({
  data,
  id = "printable-a4-invoice"
}: InvoicePrintDocumentProps) {
  // Format numbers to INR standard
  const formatCurrency = (val?: number) => {
    const num = Number(val) || 0;
    return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const invoiceNum = data.invoice_number || "INV-2026-0007";
  const invoiceDate = data.date || "2026-11-03";
  const dueDate = data.due_date || data.date || "2026-11-03";
  const paymentTerms = data.payment_terms || "Immediate";
  const paymentMethod = data.payment_method || "UPI";
  const isPaid = (data.status || "").toLowerCase() === "paid";
  const isPending = (data.status || "").toLowerCase() === "pending";

  // Optional dynamic overrides from localStorage if not provided on invoice
  let dynamicCompany: any = null;
  let dynamicBank: any = null;
  if (typeof window !== "undefined") {
    try {
      const storedComp = localStorage.getItem("sve_company_settings");
      if (storedComp) dynamicCompany = JSON.parse(storedComp);
      const storedBank = localStorage.getItem("sve_bank_settings");
      if (storedBank) dynamicBank = JSON.parse(storedBank);
    } catch {}
  }

  const companyName = data.company_name || dynamicCompany?.name || "SiddhiVinayak Enterprise";
  const companyTagline =
    data.company_tagline || dynamicCompany?.tagline || "High-Performance 3-Wheeler Commercial Vehicles & Spare Parts";
  const companyAddress =
    data.company_address ||
    dynamicCompany?.address ||
    "Plot 12, GIDC Heavy Engineering Zone, Odhav, Ahmedabad, Gujarat - 382415, India";
  const companyGstin = data.company_gstin || dynamicCompany?.gstin || "24AAAF01234F1Z9";
  const companyStateCode =
    data.company_state_code ||
    (dynamicCompany?.stateCode && dynamicCompany?.state
      ? `${dynamicCompany.stateCode} (${dynamicCompany.state})`
      : "24 (Gujarat)");
  const companyPhone = data.company_phone || dynamicCompany?.phone || "+91 98250 14829";
  const companyEmail = data.company_email || dynamicCompany?.email || "contact@siddhivinayakenterprise.com";
  const companyWebsite = data.company_website || dynamicCompany?.website || "www.siddhivinayakenterprise.com";
  const forSignatory = data.for_company_signatory || "For Opti Matrix Auto Rickshaw Mfg.";

  // Customer Bank details
  const bankName = data.bank_name || dynamicBank?.bankName || "State Bank of India";
  const accountNumber = data.account_number || dynamicBank?.accountNumber || "39482019482";
  const ifscCode = data.ifsc_code || dynamicBank?.ifscCode || "SBIN0001042";
  const branchName = data.branch_name || dynamicBank?.branchName || "Odhav Industrial Branch, Ahmedabad";
  const beneficiary =
    data.account_holder_name || dynamicBank?.accountHolder || "SiddhiVinayak Enterprise (Current Account)";

  // Items
  const items = data.items && data.items.length > 0 ? data.items : [];

  // Totals
  const subtotal = data.subtotal ?? data.amount;
  const discount = data.discount_amount ?? 0;
  const grandTotal = data.amount;
  const amountPaid = data.amount_paid ?? (isPaid ? grandTotal : 0);
  const balanceDue = data.balance_due ?? (isPaid ? 0 : grandTotal - amountPaid);

  return (
    <div
      id={id}
      data-invoice-root="true"
      className="bg-white text-slate-800 font-sans shadow-2xl print:shadow-none flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        width: "794px",
        height: "1123px",
        minHeight: "1123px",
        maxHeight: "1123px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        margin: "0 auto"
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER & DECORATIVE GEAR GRAPHICS                */}
      {/* ======================================================== */}
      <div className="relative pt-6 px-8 pb-3 flex items-start justify-between overflow-hidden">
        {/* Background Decorative Gears & Curved Accent (Top Right) */}
        <div className="absolute top-0 right-0 w-80 h-36 pointer-events-none opacity-90 -z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 320 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft gradient backdrop curve */}
            <path
              d="M320 0H60C120 40 180 120 320 144V0Z"
              fill="url(#gear-curve-gradient)"
              opacity="0.12"
            />
            {/* Large Cog */}
            <g transform="translate(230, 20) scale(0.65)" opacity="0.25">
              <circle cx="60" cy="60" r="30" fill="none" stroke="#0a467e" strokeWidth="8" />
              <circle cx="60" cy="60" r="16" fill="#0a467e" />
              <path
                d="M54 0h12v18h-12zM54 102h12v18h-12zM0 54h18v12H0zM102 54h18v12h-18zM16 16l12.7 12.7-8.5 8.5L7.5 24.5zM83 83l12.7 12.7-8.5 8.5-12.7-12.7zM16 104l8.5-8.5 12.7 12.7-8.5 8.5zM83 37l8.5-8.5 12.7 12.7-8.5 8.5z"
                fill="#0a467e"
              />
            </g>
            {/* Medium Interlocking Cog */}
            <g transform="translate(170, 5) scale(0.48)" opacity="0.3">
              <circle cx="60" cy="60" r="28" fill="none" stroke="#0260de" strokeWidth="7" />
              <circle cx="60" cy="60" r="14" fill="#0260de" />
              <path
                d="M54 0h12v16h-12zM54 104h12v16h-12zM0 54h16v12H0zM104 54h16v12h-16zM18 18l11 11-8 8-11-11zM83 83l11 11-8 8-11-11zM18 102l8-8 11 11-8 8zM83 39l8-8 11 11-8 8z"
                fill="#0260de"
              />
            </g>
            {/* Small Cog */}
            <g transform="translate(130, 50) scale(0.35)" opacity="0.22">
              <circle cx="60" cy="60" r="26" fill="none" stroke="#0a467e" strokeWidth="8" />
              <circle cx="60" cy="60" r="12" fill="#0a467e" />
            </g>
            <defs>
              <linearGradient id="gear-curve-gradient" x1="60" y1="0" x2="320" y2="144" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0260de" />
                <stop offset="1" stopColor="#0a467e" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Company Identity Left */}
        <div className="relative z-10 flex items-start gap-3.5 max-w-[500px]">
          {/* Logo Badge */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0 border border-white/40"
            style={{
              background: "linear-gradient(135deg, #073866 0%, #0260de 100%)"
            }}
          >
            <span className="tracking-tighter">SV</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-[#0f2438] tracking-tight leading-tight">
              {companyName}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {companyTagline}
            </p>

            {/* Address */}
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0260de] shrink-0 -mt-0.5" />
              <span className="truncate">{companyAddress}</span>
            </div>

            {/* GSTIN & State Code */}
            <div className="text-[11px] font-bold text-slate-900 mt-0.5 tracking-tight">
              <span>GSTIN: </span>
              <span className="font-mono">{companyGstin}</span>
              <span className="text-slate-300 mx-2">|</span>
              <span>State Code: {companyStateCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INVOICE TITLE & INVOICE NUMBER BANNER                 */}
      {/* ======================================================== */}
      <div className="px-8 mt-1 mb-2.5 flex items-center justify-between">
        {/* Left: INVOICE / Tax Invoice */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-[#0a2540] tracking-tight">
            INVOICE
          </span>
          <span className="text-3xl font-light text-[#0260de] leading-none">/</span>
          <div className="leading-tight">
            <span className="text-xs font-bold text-slate-900 block">
              Tax Invoice
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Original for Recipient
            </span>
          </div>
        </div>

        {/* Right: Angled Cobalt Blue Ribbon */}
        <div
          className="relative text-right text-white py-2 pl-9 pr-6 shadow-sm flex flex-col justify-center min-w-[210px]"
          style={{
            background: "linear-gradient(90deg, #0a467e 0%, #083c6d 100%)",
            clipPath: "polygon(22px 0, 100% 0, 100% 100%, 0 100%)"
          }}
        >
          <span className="text-[9.5px] uppercase font-bold text-blue-200 tracking-wider">
            Invoice No.
          </span>
          <span className="text-lg font-black font-mono tracking-wider text-white">
            {invoiceNum}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. INVOICE METADATA STRIP BAR                           */}
      {/* ======================================================== */}
      <div className="px-8 mb-3.5">
        <div className="rounded-xl border border-slate-200/90 bg-[#fbfcfe] px-4 py-2 flex items-center justify-between shadow-2xs text-xs">
          {/* Invoice Date */}
          <div className="flex items-center gap-2 pr-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0 border border-blue-100">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Invoice Date
              </span>
              <span className="text-[11.5px] font-bold text-slate-900 font-mono">
                {invoiceDate}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Due Date */}
          <div className="flex items-center gap-2 px-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0 border border-blue-100">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Due Date
              </span>
              <span className="text-[11.5px] font-bold text-slate-900 font-mono">
                {dueDate}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Terms */}
          <div className="flex items-center gap-2 px-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Terms
              </span>
              <span className="text-[11.5px] font-bold text-slate-900">
                {paymentTerms}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Method */}
          <div className="flex items-center gap-2 px-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0 border border-blue-100">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Method
              </span>
              <span className="text-[11.5px] font-bold text-slate-900">
                {paymentMethod}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="pl-2">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#eaf8ea] text-[#1e822d] border border-[#c7ecc7] shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e822d]" />
                <span>Paid</span>
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#fff7ed] text-[#c2641e] border border-[#fedec2] shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#c2641e]" />
                <span>Pending</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#fef1f0] text-[#cf382b] border border-[#fbd6d3] shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-[#cf382b]" />
                <span>Overdue</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DUAL CARDS: CUSTOMER & BANK DETAILS                   */}
      {/* ======================================================== */}
      <div className="px-8 grid grid-cols-2 gap-4 mb-3.5">
        {/* CARD 1: BILLED TO (CUSTOMER) */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col shadow-2xs">
          {/* Header Bar */}
          <div className="bg-[#0c4a8a] text-white px-3.5 py-1.5 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              BILLED TO (CUSTOMER)
            </span>
          </div>

          {/* Card Body */}
          <div className="p-3 bg-[#fbfcfe] flex-1 space-y-1.5 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
              {data.client || "Valued Customer"}
            </h3>

            {data.customer_phone && (
              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Phone: {data.customer_phone}</span>
              </div>
            )}

            {data.customer_email && (
              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Email: {data.customer_email}</span>
              </div>
            )}

            {data.customer_gst && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-900">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Customer GSTIN: </span>
                <span className="font-mono text-[#0c4a8a]">{data.customer_gst}</span>
              </div>
            )}

            {data.customer_address && (
              <div className="flex items-start gap-2 text-[10.5px] text-slate-600 leading-snug pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{data.customer_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: CUSTOMER REMITTANCE BANK DETAILS */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col shadow-2xs relative">
          {/* Background Pillar Watermark */}
          <div className="absolute right-3 bottom-2 pointer-events-none opacity-[0.07] text-[#0c4a8a]">
            <Building2 className="w-24 h-24 stroke-[1]" />
          </div>

          {/* Header Bar */}
          <div className="bg-[#0c4a8a] text-white px-3.5 py-1.5 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              CUSTOMER REMITTANCE BANK DETAILS
            </span>
          </div>

          {/* Card Body */}
          <div className="p-3 bg-[#fbfcfe] flex-1 space-y-1.5 text-xs relative z-10">
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
              {bankName}
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-slate-800">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Account Number: </span>
              <strong className="font-mono font-bold text-slate-900">
                {accountNumber}
              </strong>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>IFSC Code: </span>
              <strong className="font-mono font-bold text-slate-900">
                {ifscCode}
              </strong>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{branchName}</span>
            </div>

            <div className="flex items-center gap-2 text-[10.5px] text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Beneficiary: {beneficiary}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. PRODUCTS & SERVICES TABLE                             */}
      {/* ======================================================== */}
      <div className="px-8 mb-3.5 flex-1 min-h-[170px] max-h-[300px]">
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs h-full flex flex-col justify-start">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0c4a8a] text-white text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-14">Sr. No.</th>
                <th className="py-2.5 px-4 text-left">Product</th>
                <th className="py-2.5 px-4 text-right w-28">Price (INR)</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-4 text-right w-32">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sr No */}
                    <td className="py-2 px-3 text-center font-bold text-slate-700 align-middle">
                      {idx + 1}
                    </td>

                    {/* Product Image + Name + Desc */}
                    <td className="py-2.5 px-4 align-middle">
                      <InvoiceProductCell it={it} />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-4 text-right font-medium text-slate-800 align-middle font-mono text-xs">
                      {formatCurrency(it.unit_price)}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3 text-center font-bold text-slate-900 align-middle text-xs">
                      {it.quantity}
                    </td>

                    {/* Line Total */}
                    <td className="py-2 px-4 text-right font-bold text-slate-950 align-middle font-mono text-xs">
                      {formatCurrency(it.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 align-middle">1</td>
                  <td className="py-2.5 px-4 align-middle">
                    <InvoiceProductCell
                      it={{
                        product_name: "Auto Rickshaw Chassis & Component Assemblies",
                        description: "High-Performance 3-Wheeler Chassis Frame & Powertrain",
                        quantity: 1,
                        unit_price: grandTotal,
                        total: grandTotal
                      }}
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs align-middle">{formatCurrency(grandTotal)}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-xs align-middle">1</td>
                  <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900 text-xs align-middle">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. LOWER SECTION: INSTRUCTIONS & FINANCIAL SUMMARY       */}
      {/* ======================================================== */}
      <div className="px-8 grid grid-cols-12 gap-4 mb-3.5 items-start">
        {/* Left: Special Instructions & Terms */}
        <div className="col-span-7 rounded-2xl bg-[#f0f6fc] border border-blue-100 p-3.5 space-y-2 relative overflow-hidden text-xs">
          {/* Subtle Gear Watermark */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="#0a467e">
              <circle cx="50" cy="50" r="28" stroke="#0a467e" strokeWidth="6" fill="none" />
              <circle cx="50" cy="50" r="14" fill="#0a467e" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-[#0c4a8a] font-bold text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Special Instructions &amp; Terms:</span>
          </div>

          <p className="text-slate-700 text-[11px] leading-relaxed relative z-10">
            {data.notes ||
              "Counter sale with spot UPI payment Ref: UPI/20261103/928410294."}
          </p>

          <ul className="text-[10px] text-slate-600 space-y-0.5 relative z-10 font-medium">
            <li>• Interest @ 18% per annum will be charged if payment is delayed beyond the due date.</li>
            <li>• Subject to Ahmedabad, Gujarat jurisdiction only.</li>
          </ul>
        </div>

        {/* Right: Financial Breakdown Card */}
        <div className="col-span-5 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs divide-y divide-slate-100 text-xs">
          {/* Subtotal */}
          <div className="p-2.5 px-3.5 flex justify-between items-center text-slate-600">
            <span>Subtotal:</span>
            <span className="font-extrabold text-slate-900 font-mono">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount if any */}
          {discount > 0 && (
            <div className="p-2 px-3.5 flex justify-between items-center text-rose-600 font-medium">
              <span>Discount:</span>
              <span className="font-extrabold font-mono">
                -{formatCurrency(discount)}
              </span>
            </div>
          )}

          {/* Tax Breakdown */}
          {data.cgst_amount || data.sgst_amount ? (
            <>
              <div className="p-2 px-3.5 flex justify-between items-center text-slate-600 text-[11px]">
                <span>CGST ({(data.tax_percent || 18) / 2}%):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(data.cgst_amount)}
                </span>
              </div>
              <div className="p-2 px-3.5 flex justify-between items-center text-slate-600 text-[11px]">
                <span>SGST ({(data.tax_percent || 18) / 2}%):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(data.sgst_amount)}
                </span>
              </div>
            </>
          ) : (
            <div className="p-2 px-3.5 flex justify-between items-center text-slate-600 text-[11px]">
              <span>IGST ({data.tax_percent || 18}%):</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(data.igst_amount || ((subtotal - discount) * (data.tax_percent || 18)) / 100)}
              </span>
            </div>
          )}

          {/* Grand Total Bar */}
          <div
            className="p-2.5 px-4 text-white flex justify-between items-center shadow-xs"
            style={{
              background: "linear-gradient(90deg, #093d74 0%, #0c4a8a 100%)"
            }}
          >
            <span className="font-black text-sm uppercase tracking-wide">Grand Total:</span>
            <span className="font-black text-lg font-mono tracking-tight">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Amount Paid */}
          <div className="p-2 px-3.5 flex justify-between items-center text-slate-700">
            <span className="font-semibold">Amount Paid:</span>
            <span className="font-extrabold text-[#1e822d] font-mono">
              {formatCurrency(amountPaid)}
            </span>
          </div>

          {/* Balance Due */}
          <div className="p-2 px-3.5 bg-[#fffbeb] flex justify-between items-center text-amber-900">
            <span className="font-bold">Balance Due:</span>
            <span className="font-black text-sm font-mono">
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. SIGNATURES & OFFICIAL CIRCULAR STAMP                  */}
      {/* ======================================================== */}
      <div className="px-8 pb-3 pt-1 flex items-end justify-between text-xs">
        {/* Receiver's Signature */}
        <div className="text-center w-48">
          <div className="w-full border-b border-slate-300 pb-2 mb-1.5" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Receiver&apos;s Signature
          </span>
        </div>

        {/* Center: Official Stamp / Seal */}
        <div className="flex flex-col items-center justify-center -mb-1">
          <svg
            className="w-20 h-20 text-[#0c4a8a]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer dotted / double border */}
            <circle cx="50" cy="50" r="46" stroke="#0c4a8a" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="42" stroke="#0c4a8a" strokeWidth="1" strokeDasharray="3 2" />

            {/* Inner Ring */}
            <circle cx="50" cy="50" r="26" stroke="#0c4a8a" strokeWidth="1.5" />

            {/* Circular Path Text: SiddhiVinayak Enterprise */}
            <path
              id="stamp-text-path-top"
              d="M15,50 A35,35 0 0,1 85,50"
              fill="none"
            />
            <text fill="#0c4a8a" fontSize="7" fontWeight="bold" letterSpacing="0.8">
              <textPath href="#stamp-text-path-top" startOffset="50%" textAnchor="middle">
                SiddhiVinayak Enterprise
              </textPath>
            </text>

            <path
              id="stamp-text-path-bottom"
              d="M85,50 A35,35 0 0,1 15,50"
              fill="none"
            />
            <text fill="#0c4a8a" fontSize="7" fontWeight="bold" letterSpacing="1">
              <textPath href="#stamp-text-path-bottom" startOffset="50%" textAnchor="middle">
                ★ Ahmedabad ★
              </textPath>
            </text>

            {/* Center Monogram */}
            <text
              x="50"
              y="56"
              fill="#0c4a8a"
              fontSize="16"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              SV
            </text>
          </svg>
        </div>

        {/* Right: Company Authorized Signatory */}
        <div className="text-center w-56 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-900 block mb-1">
            {forSignatory}
          </span>

          {/* Elegant handwritten signature rendering */}
          <div className="h-9 w-36 flex items-center justify-center my-0.5">
            <svg viewBox="0 0 140 40" className="w-full h-full text-[#0a467e]">
              <path
                d="M10 28 C 30 10, 45 35, 65 14 C 75 4, 85 30, 95 18 C 105 10, 115 25, 130 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M20 32 C 50 30, 90 28, 125 31"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="w-full border-b border-slate-300 pb-1 mb-1.5" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Authorized Signatory
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. BOTTOM DEEP COBALT/NAVY CONTACT FOOTER STRIP          */}
      {/* ======================================================== */}
      <div className="w-full bg-[#0c4a8a] text-white py-2.5 px-6 flex items-center justify-center gap-8 text-[11px] font-semibold shrink-0">
        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <span>{companyPhone}</span>
        </div>

        <span className="text-blue-300 opacity-60">|</span>

        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <span>{companyEmail}</span>
        </div>

        <span className="text-blue-300 opacity-60">|</span>

        {/* Website */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <span>{companyWebsite}</span>
        </div>
      </div>
    </div>
  );
}
