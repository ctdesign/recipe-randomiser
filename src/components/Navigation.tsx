"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shuffle,
  Bookmark,
  CalendarDays,
  Search,
  PlusCircle,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Suggest", icon: Shuffle },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/maybe", label: "Maybe", icon: Bookmark },
  { href: "/planner", label: "Plan", icon: CalendarDays },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 min-h-[48px] text-[10px] transition-colors ${
                isActive
                  ? "text-gray-900 font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
