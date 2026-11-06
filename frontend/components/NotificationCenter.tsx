"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";

export interface NotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at?: string;
}

interface NotificationCenterProps {
  className?: string;
}

/**
 * Synthesizes a soft, pleasant notification chime using Web Audio API.
 * Does not require any external MP3 asset.
 */
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1 (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Tone 2 (A5 - 880 Hz) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay restrictions or headless browser
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 45) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 172800) return "Yesterday";
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function NotificationCenter({ className = "" }: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [liveToast, setLiveToast] = useState<NotificationItem | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count ?? (data.notifications || []).filter((n: NotificationItem) => !n.is_read).length);
      }
    } catch {
      // Backend may be warming up
    }
  };

  // 2. Real-Time Server-Sent Events (SSE) Listener with Auto-Reconnect & Polling Fallback
  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        const streamUrl = `${getApiUrl()}/notifications/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener("notification", (event) => {
          try {
            const newNotif: NotificationItem = JSON.parse(event.data);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id || (n._id && n._id === newNotif._id))) {
                return prev;
              }
              return [newNotif, ...prev];
            });
            setUnreadCount((c) => c + 1);

            // Trigger gentle audio chime & live floating toast
            playNotificationChime();
            setLiveToast(newNotif);

            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => {
              setLiveToast(null);
            }, 6000);
          } catch (err) {
            console.error("SSE parse error", err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff reconnect
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch {
        // Fallback to polling
      }
    };

    connectSSE();

    // Secondary Polling Heartbeat every 20 seconds to guarantee fresh data
    const pollingInterval = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollingInterval);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification read
  const handleMarkAsRead = async (notif: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.is_read) return;

    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch(`${getApiUrl()}/notifications/${notif.id}/read`, {
        method: "PATCH"
      });
    } catch {
      // Offline fallback
    }
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await fetch(`${getApiUrl()}/notifications/read-all`, {
        method: "POST"
      });
    } catch {
      // Offline fallback
    }
  };

  // Delete notification
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      await fetch(`${getApiUrl()}/notifications/${id}`, {
        method: "DELETE"
      });
    } catch {
      // Offline fallback
    }
  };

  // Click on notification to navigate
  const handleNotificationClick = (notif: NotificationItem) => {
    handleMarkAsRead(notif);
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === "unread" && item.is_read) return false;
      if (activeTab === "invoice" && item.type !== "invoice") return false;
      if (activeTab === "stock" && item.type !== "stock") return false;
      if (activeTab === "payment" && item.type !== "payment") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Icon renderer based on notification type
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "payment":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "stock":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "purchase":
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case "customer":
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* ==================================================================== */}
      {/* 1. NOTIFICATION BELL BUTTON WITH LIVE BADGE                          */}
      {/* ==================================================================== */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Live System Notifications"
        aria-label="Toggle notifications menu"
        className="relative w-10 h-10 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-2xl text-[#0f172a] hover:bg-slate-50 shadow-xs transition-all active:scale-95 cursor-pointer"
      >
        <svg className="w-4 h-4 text-[#0260de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-[#0260de] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ==================================================================== */}
      {/* 2. REAL-TIME FLOATING TOAST NOTIFICATION CARD                       */}
      {/* ==================================================================== */}
      {liveToast && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-white rounded-3xl p-4 shadow-2xl border border-blue-100 flex items-start gap-3.5 animate-in slide-in-from-top-4 duration-300">
          {renderTypeIcon(liveToast.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0260de]">
                Real-Time Alert
              </span>
              <span className="text-[10px] font-medium text-slate-400">Just now</span>
            </div>
            <h4 className="text-sm font-bold text-[#0f172a] truncate mt-0.5">{liveToast.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{liveToast.message}</p>
            {liveToast.link && (
              <button
                type="button"
                onClick={() => {
                  setLiveToast(null);
                  router.push(liveToast.link || "/dashboard");
                }}
                className="mt-2 text-xs font-bold text-[#0260de] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Details</span>
                <span>→</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. NOTIFICATION DROPDOWN / DRAWER PANEL                             */}
      {/* ==================================================================== */}
      {isOpen && (
        <div className="absolute right-0 top-12 sm:top-14 w-[92vw] sm:w-[420px] max-w-[440px] bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] z-50 overflow-hidden font-sans flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0260de] flex items-center justify-center font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-[#0f172a]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0260de] text-white text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Live sync with MongoDB & Render</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-[#0260de] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "invoice", label: "Bills & Invoices" },
              { id: "stock", label: "Stock Alerts" },
              { id: "payment", label: "Payments" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#0260de] text-white shadow-xs"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0260de] text-[#0f172a] placeholder:text-slate-400"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Notification List Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[380px] overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#0f172a]">No notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Everything is up-to-date and operating smoothly.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative p-3 rounded-2xl transition-all border flex items-start gap-3 cursor-pointer ${
                    notif.is_read
                      ? "bg-white border-slate-100 hover:bg-slate-50/80"
                      : "bg-blue-50/30 border-blue-100 hover:bg-blue-50/60 shadow-2xs"
                  }`}
                >
                  {renderTypeIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className={`text-xs font-bold truncate ${notif.is_read ? "text-slate-700" : "text-[#0f172a]"}`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#0260de] shrink-0" title="Unread" />
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100/60">
                      <span className="text-[10px] font-bold text-[#0260de] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Details</span>
                        <span>→</span>
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif, e)}
                            className="text-[10px] text-slate-500 hover:text-[#0260de] px-1.5 py-0.5 rounded-md hover:bg-white"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="text-[10px] text-slate-400 hover:text-red-600 px-1.5 py-0.5 rounded-md hover:bg-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Status */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live SSE Active
            </span>
            <span>Total: {notifications.length} alerts</span>
          </div>
        </div>
      )}
    </div>
  );
}
