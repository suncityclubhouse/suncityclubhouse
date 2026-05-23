"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  BookOpen,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { adminLogout } from "@/actions/admin";
import { cn } from "@/lib/utils/formatters";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/facilities", label: "Facilities", icon: Building2 },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/revenue", label: "Revenue", icon: TrendingUp },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-50 md:relative flex flex-col bg-stone-900 text-stone-300 transition-all duration-300 ease-in-out flex-shrink-0",
        // Mobile visibility
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop width
        collapsed ? "md:w-16 w-60" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-stone-800", collapsed && "justify-center")}>
        {!collapsed && (
          <Link href="/dashboard" className="font-serif text-lg font-semibold text-white">
            Clubhouse
          </Link>
        )}
        {collapsed && (
          <span className="text-amber-400 font-bold text-lg">C</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(href, exact)
                    ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                    : "hover:bg-stone-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-800 p-2">
        <form action={adminLogout}>
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-400 hover:text-red-400 hover:bg-red-900/20 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </form>
      </div>

      {/* Collapse toggle (Desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-20 bg-stone-800 border border-stone-700 text-stone-400 rounded-full p-1 hover:text-white transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
