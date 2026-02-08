"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Bell, Activity, Zap } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/table", label: "Tabela", icon: Trophy },
  { href: "/live", label: "Ao Vivo", icon: Activity },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/pricing", label: "Planos", icon: Zap },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu de navegação"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-fb-bg/95 backdrop-blur-xl border-t border-fb-border/50 safe-area-pb"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-200 ${
                isActive ? "text-fb-primary" : "text-fb-text-muted"
              }`}
            >
              <Icon
                className={`size-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-fb-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
