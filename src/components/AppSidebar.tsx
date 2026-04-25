import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  BookOpen,
  BarChart3,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LineChart,
  Sparkles,
  FlaskConical,
  Users,
  Wrench,
  Settings,
  HelpCircle,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: { label: string; tone: "primary" | "warning" | "profit" };
  hasSub?: boolean;
  dot?: boolean;
};

const mainItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, dot: true },
  { to: "/trades", label: "Trades", icon: List },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/analysis", label: "Analysis", icon: BarChart3, hasSub: true },
  { to: "/market", label: "Market", icon: LineChart },
  { to: "/ai-report", label: "AI Report", icon: Sparkles, badge: { label: "PRO", tone: "primary" } },
  { to: "/backtesting", label: "Backtesting", icon: FlaskConical, badge: { label: "ELITE", tone: "warning" } },
  { to: "/lounge", label: "Traders Lounge", icon: Users, hasSub: true, dot: true },
  { to: "/tools", label: "Tools", icon: Wrench },
];

const supportItems: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help & Support", icon: HelpCircle },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
];

function badgeClass(tone: "primary" | "warning" | "profit") {
  if (tone === "warning") return "bg-warning/15 text-warning";
  if (tone === "profit") return "bg-profit/15 text-profit";
  return "bg-primary/15 text-primary";
}

function NavRow({ item, collapsed, isActive }: { item: NavItem; collapsed: boolean; isActive: boolean }) {
  return (
    <RouterNavLink
      to={item.to}
      className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group ${
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-sidebar-foreground hover:text-foreground hover:bg-accent/40"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
      )}
      <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-primary" : ""}`} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className={`badge-pill ${badgeClass(item.badge.tone)}`}>{item.badge.label}</span>
          )}
          {item.dot && !item.badge && (
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          )}
          {item.hasSub && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />}
        </>
      )}
    </RouterNavLink>
  );
}

export default function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const initial = (user?.email?.[0] ?? "u").toUpperCase();

  return (
    <aside
      className={`${collapsed ? "w-[72px]" : "w-[248px]"} min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 ease-out relative`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Brand */}
      <div className={`px-5 pt-5 pb-4 flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
        <div className="w-9 h-9 rounded-xl btn-premium flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="brand-wordmark whitespace-nowrap flex items-center gap-2">
            Daddy<span className="accent">FX</span>Book
            <span className="badge-pill bg-warning/15 text-warning">BETA</span>
          </span>
        )}
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="mx-3 mb-4 rounded-xl bg-card/60 border border-border/60 p-2.5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {user?.email?.split("@")[0] ?? "user"}
              </p>
              <span className="badge-pill bg-muted/60 text-muted-foreground">FREE</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] px-3 mt-2 mb-1.5">
            Menu
          </p>
        )}
        {mainItems.map((item) => (
          <NavRow key={item.to} item={item} collapsed={collapsed} isActive={location.pathname === item.to} />
        ))}

        {!collapsed && (
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] px-3 mt-5 mb-1.5">
            Support
          </p>
        )}
        {supportItems.map((item) => (
          <NavRow key={item.to} item={item} collapsed={collapsed} isActive={location.pathname === item.to} />
        ))}
      </nav>

      {/* Sign out */}
      <div className={`p-3 border-t border-sidebar-border ${collapsed ? "items-center flex flex-col" : ""}`}>
        <button
          onClick={signOut}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all duration-200 w-full group`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
