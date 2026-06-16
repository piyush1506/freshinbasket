"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken, getUser, setUser, clearAuth, AUTH_API, authFetch } from "@/lib/auth";
import {
  Truck,
  CalendarClock,
  DollarSign,
  Wrench,
  UserCircle,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";

const sidebarLinks = [
  { label: "Active Deliveries", href: "/delivery", icon: Truck },
  { label: "Route Schedule", href: "/delivery/schedule", icon: CalendarClock },
  { label: "Profile", href: "/delivery/profile", icon: UserCircle },
];

export default function DeliveryLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [driverName, setDriverName] = useState("Driver");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Check role from cached user (instant check)
    const cachedUser = getUser();
    if (cachedUser) {
      if (cachedUser.role !== "DELIVERY") {
        router.push("/");
        return;
      }
      setDriverName(cachedUser.username || "Driver");
    }

    // Fetch fresh data from API (authoritative check)
    const fetchUserAndStats = async () => {
      try {
        const meRes = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/me/`
        );
        if (!meRes.ok) {
          clearAuth();
          router.push("/login");
          return;
        }
        const me = await meRes.json();
        if (me.role !== "DELIVERY") {
          clearAuth();
          router.push("/");
          return;
        }
        setDriverName(me.username || "Driver");
        setUser(me);

        const dashRes = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/dashboard/`
        );
        if (dashRes.ok) {
          const dash = await dashRes.json();
          setActiveCount(dash.active_delivery ? 1 : 0);
        }
      } catch { /* ignore */ }
    };
    fetchUserAndStats();
  }, [router]);

  const handleLogout = async () => {
    await AUTH_API.logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-gray-200 fixed h-screen z-30">
        {/* Brand */}
        <div className="px-6 pt-7 pb-5">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Freshinbasket
          </h1>
          <p className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">
            Driver Panel
          </p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/delivery" && pathname.startsWith(link.href));
            const Icon = link.icon;
            const showBadge = link.href === "/delivery" && activeCount > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#2D6A2E] text-white shadow-lg shadow-green-900/20"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {link.label}
                {showBadge && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Driver Info & Status */}
        <div className="px-4 pb-6 space-y-3">
          {/* Driver Card */}
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {driverName}
              </p>
              <p className="text-[11px] text-gray-400">Verified Partner</p>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`
              w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-300
              ${
                isOnline
                  ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                  : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
              }
            `}
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <div className="space-y-1.5">
            <div className={`w-5 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-gray-700 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </div>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Freshinbasket</h1>
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col">
            <div className="px-6 pt-7 pb-5 border-b border-gray-100">
              <h1 className="text-xl font-extrabold text-gray-900">Freshinbasket</h1>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Driver Panel</p>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/delivery" && pathname.startsWith(link.href));
                const Icon = link.icon;
                const showBadge = link.href === "/delivery" && activeCount > 0;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? "bg-[#2D6A2E] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                    {showBadge && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 pb-6 space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 px-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  {driverName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{driverName}</p>
                  <p className="text-[11px] text-gray-400">Verified Partner</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  isOnline ? "border-red-200 text-red-600 bg-red-50" : "border-green-200 text-green-700 bg-green-50"
                }`}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] pt-16 lg:pt-0">
        {/* Top Bar */}
        <header className="hidden lg:flex items-center justify-end h-16 px-8 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></span>
              <span className="text-gray-500">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut size={18} className="text-gray-500" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
