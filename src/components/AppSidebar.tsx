import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, List, BookOpen, BarChart3, TrendingUp, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trades", icon: List },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
];

export default function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">GoldJournal</span>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
