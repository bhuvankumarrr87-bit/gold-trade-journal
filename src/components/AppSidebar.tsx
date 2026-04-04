import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, List, BookOpen, BarChart3, TrendingUp, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trades", icon: List },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
];

export default function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-[240px]'} min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 ease-out relative`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`p-5 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl btn-premium flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-4xl font-bold text-foreground tracking-tight whitespace-nowrap">DaddyFX Book</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {!collapsed && (
          <p className="text-4xl font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] px-3 mb-2">Navigation</p>
        )}
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-4xl font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(221,83%,53%,0.15)]"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className={`p-4 border-t border-sidebar-border space-y-3 ${collapsed ? 'items-center flex flex-col' : ''}`}>
        {!collapsed && <p className="text-4xl text-muted-foreground truncate">{user?.email}</p>}
        <button
          onClick={signOut}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} text-4xl text-muted-foreground hover:text-foreground transition-all duration-200 w-full group`}
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
