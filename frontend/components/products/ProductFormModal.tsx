"use client";

import { useState, useRef } from "react";
import { getApiUrl, formatImageUrl } from "@/lib/api";
import {
  Product,
  ERP_UNITS,
  GST_RATES,
  formatINR
} from "./types";
import {
  X,
  UploadCloud,
  Check,
  AlertCircle,
  Package,
  Layers,
  IndianRupee,
  Boxes,
  FileText,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus
} from "lucide-react";

type FormTab = "basic" | "images" | "pricing" | "inventory" | "additional";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
  showToast: (msg: string) => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
  showToast
}: ProductFormModalProps) {
  if (!isOpen) return null;

  return (
    <ProductFormContent
      key={productToEdit?._id || "new-product"}
      productToEdit={productToEdit}
      onClose={onClose}
      onSuccess={onSuccess}
      showToast={showToast}
    />
  );
}

function ProductFormContent({
  productToEdit,
  onClose,
  onSuccess,
  showToast
}: {
  productToEdit?: Product | null;
  onClose: () => void;
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
  showToast: (msg: string) => void;
}) {
  const isEditing = Boolean(productToEdit && productToEdit._id);

  // Form Fields State initialized directly from props
  const [name, setName] = useState(productToEdit?.name || "");
  const [sku, setSku] = useState(productToEdit?.sku || "");
  const [category, setCategory] = useState<string>(productToEdit?.category || "General");
  const [description, setDescription] = useState(productToEdit?.description || "");

  // Images
  const [mainImage, setMainImage] = useState<string>(productToEdit?.image || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(
    productToEdit?.gallery || (productToEdit?.image ? [productToEdit.image] : [])
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"system" | "url">("system");
  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) {
      showToast("Please enter an image URL");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
      showToast("Image URL must start with http://, https:// or /");
      return;
    }
    setGalleryImages((prev) => [...prev, url]);
    if (!mainImage) {
      setMainImage(url);
    }
    setImageUrlInput("");
    showToast("Image URL added to gallery");
  };

  // Pricing & Tax
  const [price, setPrice] = useState<number>(productToEdit?.price || 0);
  const [costPrice, setCostPrice] = useState<number>(productToEdit?.cost_price || 0);
  const [taxRate, setTaxRate] = useState<number>(productToEdit?.tax_rate ?? 18);
  const [hsnCode, setHSNCode] = useState(productToEdit?.hsn_code || "HSN8708");

  // Inventory
  const [stock, setStock] = useState<number>(productToEdit?.stock ?? 10);
  const [minStockAlert, setMinStockAlert] = useState<number>(productToEdit?.min_stock_alert ?? 5);
  const [unit, setUnit] = useState<string>(productToEdit?.unit || "Piece (Pcs)");

  // Additional Information
  const [specifications, setSpecifications] = useState(productToEdit?.specifications || "");
  const [productStatus, setProductStatus] = useState<"Active" | "Draft" | "Archived">(
    productToEdit?.status || "Active"
  );

  // Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single or multiple file upload handler
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) {
      showToast("Please upload valid image files (JPG, PNG, WebP)");
      return;
    }

    setIsUploading(true);
    const apiUrl = getApiUrl();

    for (const file of fileList) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${apiUrl}/products/upload`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          const uploadedUrl = data.url || data.path;
          setGalleryImages((prev) => [...prev, uploadedUrl]);
          if (!mainImage) {
            setMainImage(uploadedUrl);
          }
          showToast("Image uploaded successfully");
        } else {
          showToast("Failed to upload image");
        }
      } catch (err) {
        console.error("Upload error", err);
        showToast("Error connecting to upload service");
      }
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const removeGalleryImage = (index: number) => {
    const target = galleryImages[index];
    const updated = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updated);
    if (mainImage === target) {
      setMainImage(updated.length > 0 ? updated[0] : "");
    }
  };

  const setAsMainImage = (url: string) => {
    setMainImage(url);
  };

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = "Product name is required";
    }
    if (price < 0) {
      errs.price = "Selling price cannot be negative";
    }
    if (stock < 0) {
      errs.stock = "Available stock cannot be negative";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct highlighted errors");
      return;
    }

    setIsSaving(true);
    const apiUrl = getApiUrl();

    // Payload for backend
    const payload = {
      name: name.trim(),
      description: description.trim(),
      image: mainImage || (galleryImages.length > 0 ? galleryImages[0] : ""),
      gallery: galleryImages,
      price: Number(price) || 0,
      cost_price: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      min_stock_alert: Number(minStockAlert) || 5,
      category,
      unit,
      hsn_code: hsnCode.trim(),
      tax_rate: Number(taxRate) || 0,
      sku: sku.trim() || undefined,
      status: productStatus,
      specifications: specifications.trim() || undefined
    };

    try {
      if (isEditing && productToEdit?._id) {
        const res = await fetch(`${apiUrl}/products/${productToEdit._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          showToast("Product updated successfully");
          onSuccess(updated, false);
          onClose();
        } else {
          showToast("Failed to update product");
        }
      } else {
        const res = await fetch(`${apiUrl}/products/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          showToast("New product created successfully");
          onSuccess(created, true);
          onClose();
        } else {
          showToast("Failed to create product");
        }
      }
    } catch (err) {
      console.error("Save error", err);
      showToast("Network error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time tax computation
  const calcTaxAmount = (price * (Number(taxRate) || 0)) / 100;
  const calcTotalWithTax = price + calcTaxAmount;

  const tabList: { id: FormTab; label: string; icon: typeof FileText }[] = [
    { id: "basic", label: "A. Basic Info", icon: FileText },
    { id: "images", label: "B. Product Images", icon: ImageIcon },
    { id: "pricing", label: "C. Pricing & Tax", icon: IndianRupee },
    { id: "inventory", label: "D. Inventory", icon: Boxes },
    { id: "additional", label: "E. Additional", icon: Layers }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0260de] shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update product catalog details, images, pricing and inventory levels."
                  : "Fill in the details below to add a new item to your enterprise catalog."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs Navigation */}
        <div className="px-6 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
          {tabList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-[#0260de] text-[#0260de] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB A: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g. Heavy Duty Auto Rickshaw Tubular Chassis Frame"
                    className={`w-full bg-slate-50/70 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0260de]/10 transition-all ${
                      errors.name ? "border-rose-300 focus:border-rose-500" : "border-slate-200/90 focus:border-[#0260de]"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* SKU / Product ID */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SV-CHS-0042"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to auto-generate PRD-XXXX
                  </p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description &amp; Overview
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed technical specifications, dimensions, material grade, compatibility..."
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB B: PRODUCT IMAGES */}
          {activeTab === "images" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Image Input Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-sm">
                <button
                  type="button"
                  onClick={() => setImageInputMode("system")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                    imageInputMode === "system"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload from System</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                    imageInputMode === "url"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Direct Image URL</span>
                </button>
              </div>

              {/* Mode 1: System File Upload & Drag-and-Drop */}
              {imageInputMode === "system" && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#0260de] bg-blue-50/50"
                      : "border-slate-300 hover:border-[#0260de] bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) handleUploadFiles(e.target.files);
                    }}
                    className="sr-only"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-[#0260de] mb-3">
                    <UploadCloud className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    {isUploading ? "Uploading image..." : "Click to browse or drag images from your system"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    Supports JPG, PNG, WEBP files up to 10MB. Stored locally or on server.
                  </p>
                </div>
              )}

              {/* Mode 2: Direct Image URL Input */}
              {imageInputMode === "url" && (
                <div className="p-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Paste Direct Product Image URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        placeholder="https://example.com/images/product-part.jpg"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0260de] focus:ring-1 focus:ring-[#0260de]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2.5 bg-[#0260de] hover:bg-[#0252bf] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Image URL</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    You can paste any web image URL (Unsplash, manufacturer CDN, cloud storage, or external hosted link).
                  </p>
                </div>
              )}

              {/* Primary Image Direct URL Field */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary / Main Product Image URL
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={mainImage}
                    onChange={(e) => setMainImage(e.target.value)}
                    placeholder="Active main image URL will appear here or enter directly..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                  {mainImage && (
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formatImageUrl(mainImage)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Previews */}
              {galleryImages.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                    Uploaded Product Gallery ({galleryImages.length})
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {galleryImages.map((imgUrl, idx) => {
                      const isMain = imgUrl === mainImage;
                      return (
                        <div
                          key={idx}
                          className={`relative group aspect-square rounded-xl bg-white border-2 p-1 overflow-hidden shadow-2xs ${
                            isMain ? "border-[#0260de]" : "border-slate-200"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formatImageUrl(imgUrl)}
                            alt=""
                            className="w-full h-full object-contain"
                          />

                          {isMain && (
                            <span className="absolute bottom-1.5 left-1.5 bg-[#0260de] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                              Main
                            </span>
                          )}

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => setAsMainImage(imgUrl)}
                                className="p-1 rounded-md bg-white text-slate-800 text-[10px] font-semibold hover:bg-blue-50 hover:text-[#0260de]"
                                title="Set as Main"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="p-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB C: PRICING & TAX */}
          {activeTab === "pricing" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0260de]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price || ""}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                    />
                  </div>
                </div>

                {/* Purchase / Cost Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase / Cost Price (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice || ""}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                    />
                  </div>
                </div>

                {/* GST Percentage */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GST Tax Bracket (%) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST
                      </option>
                    ))}
                  </select>
                </div>

                {/* HSN Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHSNCode(e.target.value)}
                    placeholder="e.g. HSN8708"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>
              </div>

              {/* Dynamic Tax Breakdown Calculation Preview */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-blue-950 block">
                    Calculated Invoice Price Breakdown
                  </span>
                  <span className="text-blue-700 text-[11px]">
                    Base {formatINR(price)} + {taxRate}% GST ({formatINR(calcTaxAmount)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">
                    Gross Total
                  </span>
                  <span className="text-base font-extrabold text-[#0260de]">
                    {formatINR(calcTotalWithTax)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB D: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Available Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>

                {/* Minimum Stock Alert */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>

                {/* Unit of Measurement */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit of Measurement <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
                  >
                    {ERP_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB E: ADDITIONAL INFORMATION */}
          {activeTab === "additional" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={productStatus}
                    onChange={(e) =>
                      setProductStatus(e.target.value as "Active" | "Draft" | "Archived")
                    }
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de] cursor-pointer"
                  >
                    <option value="Active">Active (Visible in Invoicing)</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {/* Specifications Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Technical Specifications / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    placeholder="Enter key-value specs or internal notes (e.g., Weight: 14.5kg, Material: Seamless Carbon Steel Pipe, Warranty: 12 Months)"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#0260de]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: FormTab[] = ["basic", "images", "pricing", "inventory", "additional"];
                    const curIdx = tabs.indexOf(activeTab);
                    if (curIdx > 0) setActiveTab(tabs[curIdx - 1]);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Previous Step
                </button>
              )}

              {activeTab !== "additional" ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: FormTab[] = ["basic", "images", "pricing", "inventory", "additional"];
                    const curIdx = tabs.indexOf(activeTab);
                    if (curIdx < tabs.length - 1) setActiveTab(tabs[curIdx + 1]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Next Step
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0260de] text-white text-xs font-bold hover:bg-[#0252bf] shadow-xs hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Saving Product..." : isEditing ? "Save Changes" : "Create Product"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
