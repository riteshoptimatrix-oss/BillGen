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
    <svg className="w-4 h-4 flex-shrink-0 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
  doubleChevronLeft: (
    <svg className="w-4 h-4 flex-shrink-0 text-[#8c6b57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
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
  // 1. VERTICAL MAHOGANY ICON RAIL (Matching the user's reference image exactly)
  // ============================================================================
  const verticalIconRail = (
    <div className="relative flex w-16 sm:w-[68px] flex-col items-center justify-between py-5 overflow-hidden bg-gradient-to-b from-[#6b3e26] via-[#5a331e] to-[#432415] text-white flex-shrink-0 select-none shadow-lg shadow-stone-900/10 h-full rounded-[26px]">
      {/* Decorative contoured radial gradient grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(ellipse at 100% 30%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(ellipse at 0% 75%, rgba(0,0,0,0.5) 0%, transparent 50%)`
        }}
      />

      {/* Top Section: Toggle / Expand button */}
      <div className="w-full flex flex-col items-center space-y-2.5 z-10">
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
          className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-xs mb-1"
        >
          {isCollapsed ? navIcons.doubleChevronRight : (
            <div className="flex flex-col items-center justify-center font-black text-xs">
              <span>SV</span>
            </div>
          )}
        </button>

        {/* Navigation icons grouped with thin dividers matching reference image */}
        <div className="w-full flex flex-col items-center space-y-1.5">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="w-full flex flex-col items-center">
              {/* Thin white/20 divider line */}
              {gIdx > 0 && (
                <div className="my-2 h-[1px] w-7 bg-white/20" />
              )}

              {group.items.map((item) => {
                const active = isRouteActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onClose?.()}
                    title={item.name}
                    className={`relative flex items-center justify-center transition-all duration-200 my-0.5 ${
                      active
                        ? "h-11 w-11 rounded-2xl bg-[#faf7f4] text-[#3d2215] shadow-md shadow-stone-900/25 font-black scale-105"
                        : "h-10 w-10 rounded-2xl text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Thin Divider + Logout */}
      <div className="z-10 w-full flex flex-col items-center pt-1">
        <div className="my-2 h-[1px] w-7 bg-white/20" />
        <button
          type="button"
          onClick={handleLogout}
          title="Log Out"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/70 hover:bg-white/15 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          {navIcons.logout}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // 2. EXPANDED RIGHT MENU PANEL (Warm Light Cream)
  // ============================================================================
  const expandedMenuPanel = (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto bg-[#faf7f4] px-4 py-5 transition-all duration-300 min-w-[210px] rounded-r-[26px]">
      <div>
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between px-1">
          <Link
            href="/dashboard"
            onClick={() => onClose?.()}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5c341f] text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              SV
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black text-[#261710] tracking-tight leading-tight">
                SiddhiVinayak
              </span>
              <span className="text-[9px] font-bold text-[#8c6b57] tracking-wider uppercase mt-0.5">
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
            className="p-1.5 rounded-xl text-[#8c6b57] hover:bg-[#ede3da] hover:text-[#5c341f] transition-colors cursor-pointer"
          >
            {navIcons.doubleChevronLeft}
          </button>
        </div>

        {/* Menu Groups */}
        <div className="space-y-4">
          {navigationGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[10px] font-bold text-[#8c6b57] uppercase tracking-wider mb-1">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isRouteActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-[13px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-[#f3e7dc] text-[#331c12] font-bold shadow-xs"
                          : "text-[#3f2a1e] hover:bg-[#f3ece6] hover:text-[#1e1009]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={active ? "text-[#4a2c1d]" : "text-[#73523f] group-hover:text-[#4a2c1d]"}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      {!active && (
                        <span className="text-[#a89080] group-hover:text-[#6b4731] transition-transform group-hover:translate-x-0.5">
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

      {/* Footer system status */}
      <div className="pt-4 px-2">
        <div className="flex items-center justify-between text-[11px] text-[#997d6c]">
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
      {/* A. MOBILE DOCKED VERTICAL RAIL (Always visible on mobile!)          */}
      {/* ================================================================== */}
      <div className="lg:hidden flex flex-col p-2 h-screen flex-shrink-0 z-30">
        <div className="h-full rounded-[26px] overflow-hidden border border-[#e8dfd8] shadow-md shadow-stone-900/10">
          {verticalIconRail}
        </div>
      </div>

      {/* Mobile Slide-out Full Drawer (Opens when user wants full text menu) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={onClose}
          />
          {/* Drawer combining vertical rail + expanded panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] p-3 flex flex-col font-sans z-50 animate-in slide-in-from-left duration-200">
            <div className="flex h-full w-full select-none overflow-hidden rounded-[26px] border border-[#e8dfd8] bg-white shadow-2xl">
              {verticalIconRail}
              {expandedMenuPanel}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* B. DESKTOP SIDEBAR (Full Option C when open, Icon-only when closed) */}
      {/* ================================================================== */}
      <aside
        className={`hidden lg:flex flex-col p-3 transition-all duration-300 flex-shrink-0 font-sans h-screen ${
          isCollapsed ? "w-[88px]" : "w-72 xl:w-80"
        }`}
      >
        <div className="flex h-full w-full select-none overflow-hidden rounded-[26px] border border-[#e8dfd8] bg-white shadow-xl shadow-stone-900/5">
          {/* Always visible: Vertical Mahogany Rail */}
          {verticalIconRail}

          {/* Conditionally visible: Expanded Right Cream Menu Panel */}
          {!isCollapsed && expandedMenuPanel}
        </div>
      </aside>
    </>
  );
}
