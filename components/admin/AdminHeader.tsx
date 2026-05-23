"use client";

import { Bell, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminHeaderProps {
  userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="font-medium text-stone-900">Admin Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        {/* View site link */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Site
        </Link>

        {/* User avatar */}
        <Avatar className="w-8 h-8 border border-stone-200">
          <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
