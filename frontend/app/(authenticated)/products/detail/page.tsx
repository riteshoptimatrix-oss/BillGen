"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl, formatImageUrl } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const [pid, setPid] = useState<string | null>(null);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    price: 0,
    stock: 0,
  });

  const fetchProduct = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products/${pid}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          image: data.image || "",
          price: data.price,
          stock: data.stock,
        });
      } else {
        router.push("/products");
      }
    } catch (error) {
      console.error("Failed to fetch product", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("pid");
    if (!id) {
      router.push("/products");
      return;
    }
    setPid(id);
  }, [router]);

  useEffect(() => {
    if (pid) {
      fetchProduct();
    }
  }, [pid, router]);

  // Check for changes to enable/disable save button
  useEffect(() => {
    if (product) {
      const isChanged = 
        product.name !== formData.name ||
        (product.description || "") !== formData.description ||
        (product.image || "") !== formData.image ||
        product.price !== formData.price ||
        product.stock !== formData.stock;
      setHasChanges(isChanged);
    }
  }, [formData, product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/products/upload`, {
        method: "POST",
        body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, image: data.url });
      }
    } catch (error) {
      console.error("Failed to upload image", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/products/${pid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Automatically redirect to products list on success
        router.push("/products");
      }
    } catch (error) {
      console.error("Failed to save product", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c51f2a]"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="font-sans max-w-5xl mx-auto pb-12 relative z-10">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-50/50 to-transparent -z-10 rounded-3xl blur-3xl opacity-60"></div>

      <div className="flex justify-between items-center mb-8">
        {/* Back Button */}
        <Link 
          href="/products" 
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#c51f2a] transition-all hover:-translate-x-1"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 border border-gray-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          Back to Products
        </Link>
        
        {/* Top Save Action */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || !formData.name}
          className="px-8 py-3 bg-gradient-to-r from-[#c51f2a] to-[#a51923] text-white font-semibold rounded-2xl hover:shadow-[0_8px_30px_rgb(197,31,42,0.3)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Changes...
            </>
          ) : hasChanges ? (
            "Save Changes"
          ) : (
            "All Changes Saved"
          )}
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image */}
        <div className="md:w-2/5 p-8 lg:p-12 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100/50 bg-gradient-to-br from-gray-50/50 to-white/30">
          <div className="w-full max-w-sm aspect-square rounded-[2rem] bg-white shadow-xl shadow-gray-200/40 border border-white overflow-hidden flex items-center justify-center relative group">
            {formData.image ? (
              <img src={formatImageUrl(formData.image)} alt={formData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <svg className="w-24 h-24 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            
            <label className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 border border-white/40">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-white font-bold tracking-wide text-sm drop-shadow-md">UPDATE IMAGE</span>
              <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Right Side: Details & Editing (Ultra Modern) */}
        <div className="md:w-3/5 p-8 lg:p-14 bg-white/40">
          
          <div className="mb-10 group">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product Name"
              className="w-full text-5xl font-extrabold text-[#0f172a] tracking-tight bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#c51f2a] focus:ring-0 px-0 py-2 outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-10 mb-12">
            <div className="flex-1 group">
              <label className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pricing (INR)
              </label>
              <div className="relative flex items-baseline">
                <span className="text-gray-400 font-bold text-3xl mr-1">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full text-4xl font-black text-[#c51f2a] bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#c51f2a] focus:ring-0 px-0 py-1 outline-none transition-all placeholder:text-red-200"
                />
              </div>
            </div>
            
            <div className="flex-1 group">
              <label className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Current Stock
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.stock || ""}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full text-4xl font-bold text-[#0f172a] bg-transparent border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-[#c51f2a] focus:ring-0 px-0 py-1 outline-none transition-all placeholder:text-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="mb-8 group">
            <label className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
              <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Product Description
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write a compelling description for this product..."
              className="w-full text-gray-600/90 text-lg leading-relaxed bg-transparent border-0 border-l-4 border-transparent hover:border-gray-200 focus:border-[#c51f2a] focus:ring-0 pl-5 py-2 outline-none resize-none transition-all placeholder:text-gray-300"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
