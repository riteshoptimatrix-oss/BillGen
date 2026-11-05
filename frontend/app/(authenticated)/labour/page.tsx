"use client";

import { useState, useEffect } from "react";

interface Labour {
  _id: string;
  name: string;
  mobile_number: string;
  address?: string;
  image?: string;
  aadhar_image?: string;
  salary: number;
}

type ViewState = "empty" | "create" | "edit";

export default function LabourSplitPanePage() {
  const [labours, setLabours] = useState<Labour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Split-Pane State
  const [activeView, setActiveView] = useState<ViewState>("empty");
  const [activeLabourId, setActiveLabourId] = useState<string | null>(null);
  
  // Form State
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    address: "",
    image: "",
    aadhar_image: "",
    salary: 0,
  });

  const fetchLabours = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/labours/`);
      if (res.ok) {
        const data = await res.json();
        setLabours(data);
      }
    } catch (error) {
      console.error("Failed to fetch labours", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  // Check for changes in edit mode
  useEffect(() => {
    if (activeView === "edit" && activeLabourId) {
      const original = labours.find(l => l._id === activeLabourId);
      if (original) {
        const isChanged = 
          original.name !== formData.name ||
          original.mobile_number !== formData.mobile_number ||
          (original.address || "") !== formData.address ||
          (original.image || "") !== formData.image ||
          (original.aadhar_image || "") !== formData.aadhar_image ||
          original.salary !== formData.salary;
        setHasChanges(isChanged);
      }
    }
  }, [formData, activeView, activeLabourId, labours]);

  const handleCreateNewClick = () => {
    setActiveView("create");
    setActiveLabourId(null);
    setFormData({ name: "", mobile_number: "", address: "", image: "", aadhar_image: "", salary: 0 });
    setHasChanges(true);
  };

  const handleLabourClick = (labour: Labour) => {
    setActiveView("edit");
    setActiveLabourId(labour._id);
    setFormData({
      name: labour.name,
      mobile_number: labour.mobile_number,
      address: labour.address || "",
      image: labour.image || "",
      aadhar_image: labour.aadhar_image || "",
      salary: labour.salary || 0,
    });
    setHasChanges(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to remove this labour record?")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      try {
        await fetch(`${apiUrl}/labours/${id}`, { method: "DELETE" });
        if (activeLabourId === id) {
          setActiveView("empty");
          setActiveLabourId(null);
        }
        fetchLabours();
      } catch (error) {
        console.error("Failed to delete labour", error);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'aadhar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    try {
      // Reuse the existing upload logic which handles generic images
      const res = await fetch(`${apiUrl}/labours/upload`, {
        method: "POST",
        body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'image') {
          setFormData({ ...formData, image: data.url });
        } else {
          setFormData({ ...formData, aadhar_image: data.url });
        }
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
        const res = await fetch(`${apiUrl}/labours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newLabour = await res.json();
          await fetchLabours();
          handleLabourClick(newLabour);
        }
      } else if (activeView === "edit" && activeLabourId) {
        const res = await fetch(`${apiUrl}/labours/${activeLabourId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchLabours();
          setHasChanges(false);
        }
      }
    } catch (error) {
      console.error("Failed to save labour record", error);
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
          <h1 className="text-lg font-bold text-gray-900">Labour</h1>
          <button
            onClick={handleCreateNewClick}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Add Labour"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search labour..." className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c51f2a] focus:border-[#c51f2a] transition-all" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#c51f2a]"></div></div>
          ) : labours.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm">No records found.</div>
          ) : (
            labours.map((labour) => (
              <div 
                key={labour._id}
                onClick={() => handleLabourClick(labour)}
                className={`group flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${activeLabourId === labour._id ? 'bg-[#c51f2a] text-white shadow-md' : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 flex items-center justify-center ${activeLabourId === labour._id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {labour.image ? (
                    <img src={labour.image} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <svg className={`w-5 h-5 ${activeLabourId === labour._id ? 'text-white/70' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className={`font-semibold truncate text-sm ${activeLabourId === labour._id ? 'text-white' : 'text-gray-900'}`}>{labour.name}</p>
                  <p className={`text-xs mt-0.5 font-medium ${activeLabourId === labour._id ? 'text-red-100' : 'text-gray-500'}`}>{labour.mobile_number || "No number"}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(labour._id, e)}
                  className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${activeLabourId === labour._id ? 'hover:bg-red-800 text-red-200 hover:text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">Select a labour profile to view details</p>
            <button onClick={handleCreateNewClick} className="mt-4 text-[#c51f2a] text-sm font-semibold hover:underline">Or add new labour</button>
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
                  title="Back to labour list"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>List</span>
                </button>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  {activeView === "create" ? "Add New Labour" : "Edit Profile"}
                </h2>
              </div>
              <button
                onClick={handleSave}
                disabled={(!hasChanges && activeView === 'edit') || isSaving || !formData.name}
                className="px-4 sm:px-5 py-2 bg-[#c51f2a] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#a51923] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? "Saving..." : activeView === "create" ? "Save Labour" : hasChanges ? "Save Changes" : "Saved"}
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleSave} className="max-w-2xl">
                
                <div className="space-y-8">
                  
                  {/* Basic Info Row */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Profile Image Box */}
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Profile Photo</label>
                      <div className="w-32 h-32 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#c51f2a] hover:bg-red-50/50 transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group">
                        {formData.image ? (
                          <>
                            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-bold">CHANGE</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#c51f2a] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </div>
                        )}
                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} />
                      </div>
                      {formData.image && (
                        <button type="button" onClick={() => setFormData({ ...formData, image: "" })} className="mt-2 text-xs text-red-500 hover:underline block text-center w-full">Remove</button>
                      )}
                    </div>

                    {/* Name & Phone */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all placeholder:text-gray-400"
                          placeholder="e.g. Ramesh Kumar"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-gray-400 font-medium">+91</span>
                          <input
                            type="tel"
                            required
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg pl-12 pr-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all placeholder:text-gray-400"
                            placeholder="9876543210"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Address & Salary */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-[2]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                      <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none resize-none transition-all placeholder:text-gray-400"
                        placeholder="Full residential address..."
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salary (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.salary || ""}
                          onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-[#c51f2a]/20 focus:border-[#c51f2a] outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aadhar Card Image */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aadhar Card Document</label>
                    <div className="w-full h-48 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#c51f2a] hover:bg-red-50/50 transition-colors overflow-hidden flex items-center justify-center relative cursor-pointer group">
                      {formData.aadhar_image ? (
                        <>
                          <img src={formData.aadhar_image} alt="Aadhar Card" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-sm font-bold bg-[#c51f2a] px-4 py-2 rounded-lg">Update Document</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-8 h-8 text-gray-400 group-hover:text-[#c51f2a] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                          <span className="text-xs font-bold text-gray-500 group-hover:text-[#c51f2a] uppercase tracking-wider">Upload Aadhar Image</span>
                        </div>
                      )}
                      <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, 'aadhar')} />
                    </div>
                    {formData.aadhar_image && (
                      <button type="button" onClick={() => setFormData({ ...formData, aadhar_image: "" })} className="mt-2 text-xs text-red-500 hover:underline block w-full text-left">Remove Document</button>
                    )}
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
