"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/day", label: "Day" },
  { href: "/week", label: "Week" },
  { href: "/mcq/play", label: "MCQ Play" },
  { href: "/weak-areas", label: "Weak Areas" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-semibold">
              Prep Wisely
            </Link>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navigationItems.map((item) => {
              // Exact match for dashboard, prefix match for others
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-sm whitespace-nowrap",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
            <div className="ml-4 border-l pl-4 hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
