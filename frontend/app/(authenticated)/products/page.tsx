"use client";

import { useState, useEffect } from "react";

interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
}

type ViewState = "empty" | "create" | "edit";

export default function ProductsSplitPanePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Split-Pane State
  const [activeView, setActiveView] = useState<ViewState>("empty");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  
  // Form State
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    price: 0,
    stock: 0,
  });

  const fetchProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/products/`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Check for changes in edit mode
  useEffect(() => {
    if (activeView === "edit" && activeProductId) {
      const original = products.find(p => p._id === activeProductId);
      if (original) {
        const isChanged = 
          original.name !== formData.name ||
          (original.description || "") !== formData.description ||
          (original.image || "") !== formData.image ||
          original.price !== formData.price ||
          original.stock !== formData.stock;
        setHasChanges(isChanged);
      }
    }
  }, [formData, activeView, activeProductId, products]);

  const handleCreateNewClick = () => {
    setActiveView("create");
    setActiveProductId(null);
    setFormData({ name: "", description: "", image: "", price: 0, stock: 0 });
    setHasChanges(true); // Always true for create so they can save
  };

  const handleProductClick = (product: Product) => {
    setActiveView("edit");
    setActiveProductId(product._id);
    setFormData({
      name: product.name,
      description: product.description || "",
      image: product.image || "",
      price: product.price,
      stock: product.stock,
    });
    setHasChanges(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this product?")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      try {
        await fetch(`${apiUrl}/products/${id}`, { method: "DELETE" });
        if (activeProductId === id) {
          setActiveView("empty");
          setActiveProductId(null);
        }
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    
    try {
      if (activeView === "create") {
        const res = await fetch(`${apiUrl}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newProduct = await res.json();
          await fetchProducts();
          handleProductClick(newProduct); // Switch to edit mode of the new product
        }
      } else if (activeView === "edit" && activeProductId) {
        const res = await fetch(`${apiUrl}/products/${activeProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchProducts();
          setHasChanges(false);
        }
      }
    } catch (error) {
      console.error("Failed to save product", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)] flex bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
      
      {/* LEFT PANE: Master List */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/30 ${
        activeView !== "empty" ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h1 className="text-lg font-bold text-gray-900">Products</h1>
          <button
            onClick={handleCreateNewClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Add Product"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search / Filter (Visual only for now) */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search products..." className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c51f2a] focus:border-[#c51f2a] transition-all" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#c51f2a]"></div></div>
          ) : products.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm">No products found.</div>
          ) : (
            products.map((product) => (
              <div 
                key={product._id}
                onClick={() => handleProductClick(product)}
                className={`group flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${activeProductId === product._id ? 'bg-[#c51f2a] text-white shadow-md' : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mr-3 flex items-center justify-center ${activeProductId === product._id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {product.image ? (
                    <img src={product.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <svg className={`w-5 h-5 ${activeProductId === product._id ? 'text-white/70' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className={`font-semibold truncate text-sm ${activeProductId === product._id ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                  <p className={`text-xs mt-0.5 font-medium ${activeProductId === product._id ? 'text-red-100' : 'text-gray-500'}`}>₹{product.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(product._id, e)}
                  className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${activeProductId === product._id ? 'hover:bg-red-800 text-red-200 hover:text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: Detail / Form */}
      <div className={`flex-1 flex flex-col bg-white ${
        activeView === "empty" ? "hidden md:flex" : "flex"
      }`}>
        
        {activeView === "empty" ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">Select a product to view details</p>
            <button onClick={handleCreateNewClick} className="mt-4 text-[#c51f2a] text-sm font-semibold hover:underline">Or create a new product</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Action Bar */}
            <div className="px-4 sm:px-8 py-3.5 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveView("empty")}
                  className="md:hidden mr-2 p-1.5 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs font-bold"
                  title="Back to products list"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>List</span>
                </button>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  {activeView === "create" ? "Add New Product" : "Edit Product"}
                </h2>
              </div>
              <button
                onClick={handleSave}
                disabled={(!hasChanges && activeView === 'edit') || isSaving || !formData.name}
                className="px-4 sm:px-5 py-2 bg-[#c51f2a] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#a51923] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? "Saving..." : activeView === "create" ? "Create Product" : hasChanges ? "Save Changes" : "Saved"}
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSave} className="max-w-2xl">
                
                {/* Minimal Form Layout */}
                <div className="space-y-6">
                  
                  {/* Top row: Image & Basic Info */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Image Upload Box */}
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image</label>
                      <div className="w-32 h-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#c51f2a] hover:bg-red-50/50 transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group">
                        {formData.image ? (
                          <>
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-bold">CHANGE</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#c51f2a] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#c51f2a] uppercase tracking-wider">Upload</span>
                          </div>
                        )}
                        <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                      </div>
                      {formData.image && (
                        <button type="button" onClick={() => setFormData({ ...formData, image: "" })} className="mt-2 text-xs text-red-500 hover:underline block text-center w-full">Remove</button>
                      )}
                    </div>

                    {/* Name & Desc */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all placeholder:text-gray-400"
                          placeholder="e.g. Premium Widget"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none resize-none transition-all placeholder:text-gray-400"
                          placeholder="Brief details about the product..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Bottom Row: Price & Stock */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.price || ""}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock Inventory</label>
                      <input
                        type="number"
                        required
                        value={formData.stock || ""}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                </div>
                
                <button type="submit" className="hidden">Submit</button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
      `}} />
    </div>
  );
}
