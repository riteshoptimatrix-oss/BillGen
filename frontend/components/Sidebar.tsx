"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Crisp SVG Icons styled to match the reference image exactly
const navIcons = {
  dashboard: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  products: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  finance: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <ellipse cx="12" cy="7" rx="7" ry="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 7v4.5C5 12.88 8.13 14 12 14s7-1.12 7-2.5V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11.5V16c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-4.5" />
    </svg>
  ),
  labour: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14a8 8 0 0116 0H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20a1 1 0 001-1v-1a1 1 0 00-1-1H2a1 1 0 00-1 1v1a1 1 0 001 1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v8" />
    </svg>
  ),
  customers: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  billInvoice: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-3.5 h-3.5 flex-shrink-0 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  doubleChevronRight: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
  doubleChevronLeft: (
    <svg className="w-4 h-4 flex-shrink-0 text-[#64748b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  )
};

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: navIcons.dashboard }
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { id: "products", name: "Products", href: "/products", icon: navIcons.products },
      { id: "finance", name: "Finance", href: "/finance", icon: navIcons.finance },
      { id: "labour", name: "Labour", href: "/labour", icon: navIcons.labour }
    ]
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "customers", name: "Customers", href: "/customers", icon: navIcons.customers },
      { id: "bill-invoice", name: "Bill & Invoice", href: "/bill-invoice", icon: navIcons.billInvoice },
      { id: "reports", name: "Reports", href: "/reports", icon: navIcons.reports }
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { id: "settings", name: "Settings", href: "/settings", icon: navIcons.settings }
    ]
  }
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onOpenMobileDrawer?: () => void;
}

export default function Sidebar({
  isMobileOpen = false,
  onClose,
  onOpenMobileDrawer,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(href);
  };

  // ============================================================================
  // 1. VERTICAL ICON RAIL (Clean Light Theme matching Expanded Menu)
  // ============================================================================
  const verticalIconRail = (
    <div className="relative flex w-full flex-col items-center justify-between py-5 overflow-hidden bg-white text-slate-700 flex-shrink-0 select-none h-full rounded-[26px]">
      {/* Top Section: Aligned Brand SV Button + Navigation Groups */}
      <div className="w-full flex flex-col items-center z-10">
        {/* Top SV Brand Button - Height 40px + mb-6 matches Expanded Menu Header */}
        <div className="h-10 mb-6 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              } else if (onOpenMobileDrawer) {
                onOpenMobileDrawer();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            title={isCollapsed ? "Expand Sidebar" : "Menu"}
            className="w-10 h-10 rounded-2xl bg-[#0260de] hover:bg-[#0252bf] text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
          >
            {isCollapsed ? navIcons.doubleChevronRight : (
              <div className="flex flex-col items-center justify-center font-black text-xs">
                <span>SV</span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation icons grouped with heights identical to right panel */}
        <div className="w-full flex flex-col items-center space-y-4">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="w-full flex flex-col items-center">
              {/* Category spacer / divider line matching the h-5 mb-1 group title on the right */}
              <div className="h-5 mb-1 flex items-center justify-center w-full">
                {gIdx > 0 ? (
                  <div className="h-[1px] w-7 bg-slate-200" />
                ) : (
                  <div className="h-[1px] w-7 opacity-0" />
                )}
              </div>

              {/* Items row - h-10 + space-y-1 matching the right panel buttons */}
              <div className="space-y-1 flex flex-col items-center w-full">
                {group.items.map((item) => {
                  const active = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onClose?.()}
                      title={item.name}
                      className={`relative flex items-center justify-center transition-all duration-200 h-10 w-10 rounded-2xl ${
                        active
                          ? "bg-blue-50 text-[#0260de] font-bold shadow-xs border border-blue-100 scale-100"
                          : "text-slate-500 hover:bg-slate-50 hover:text-[#0f172a]"
                      }`}
                    >
                      {item.icon}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Aligned Logout Button */}
      <div className="z-10 w-full flex flex-col items-center pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          title="Log Out"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer active:scale-95"
        >
          {navIcons.logout}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // 2. EXPANDED RIGHT MENU PANEL (Modern Pure White Single Unified Sidebar)
  // ============================================================================
  const expandedMenuPanel = (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto bg-white px-4 py-5 transition-all duration-300 w-full h-full rounded-[26px]">
      <div>
        {/* Brand Header - Height 40px + mb-6 */}
        <div className="h-10 mb-6 flex items-center justify-between px-1">
          <Link
            href="/dashboard"
            onClick={() => onClose?.()}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0260de] text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform shrink-0">
              SV
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-[#0f172a] tracking-tight leading-tight">
                SiddhiVinayak
              </span>
              <span className="text-[9px] font-bold text-[#64748b] tracking-wider uppercase mt-0.5">
                Enterprise Billing
              </span>
            </div>
          </Link>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              setIsCollapsed(true);
            }}
            title="Collapse sidebar"
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            {navIcons.doubleChevronLeft}
          </button>
        </div>

        {/* Menu Groups */}
        <div className="space-y-4">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              {/* Category Header with explicit h-5 mb-1 */}
              <div className="h-5 mb-1 flex items-center">
                <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>

              {/* Items in group with explicit h-10 */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={`group flex items-center justify-between px-3 h-10 rounded-2xl text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-[#0260de] font-bold shadow-xs border border-blue-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={active ? "text-[#0260de]" : "text-slate-400 group-hover:text-[#0260de]"}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      {!active && (
                        <span className="text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5">
                          {navIcons.chevronRight}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer system status & Logout */}
      <div className="pt-4 px-2 space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 h-10 rounded-2xl text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <span className="text-slate-400 group-hover:text-red-600">{navIcons.logout}</span>
          <span>Log Out</span>
        </button>

        <div className="h-8 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <span className="font-mono text-[10px] opacity-75">v2.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ================================================================== */}
      {/* A. MOBILE SLIDE-OUT NAVIGATION DRAWER (Only opens via Hamburger)  */}
      {/* ================================================================== */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Single drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] p-2.5 sm:p-3 flex flex-col font-sans z-50 animate-in slide-in-from-left duration-250">
            <div className="flex h-full w-full select-none overflow-hidden rounded-[26px] border border-[#e2e8f0] bg-white shadow-2xl relative">
              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="absolute top-3 right-3 z-30 p-1.5 rounded-xl bg-white/90 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-[#e2e8f0]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {expandedMenuPanel}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* B. DESKTOP SIDEBAR: Single Unified Sidebar (Icon rail OR Full Menu) */}
      {/* ================================================================== */}
      <aside
        className={`hidden lg:flex flex-col p-3 transition-all duration-300 flex-shrink-0 font-sans h-screen ${
          isCollapsed ? "w-[88px]" : "w-64 xl:w-72"
        }`}
      >
        <div className="flex h-full w-full select-none overflow-hidden rounded-[26px] border border-[#e2e8f0] bg-white shadow-xl shadow-slate-900/5">
          {isCollapsed ? verticalIconRail : expandedMenuPanel}
        </div>
      </aside>
    </>
  );
}
