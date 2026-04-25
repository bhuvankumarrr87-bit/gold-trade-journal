import { useEffect, useState } from "react";
import { Search, Moon, Plus, Clock, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const initial = (user?.email?.[0] ?? "u").toUpperCase();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center gap-4 mb-8">
      {/* Title block */}
      <div className="shrink-0 min-w-[180px]">
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="flex-1 relative max-w-2xl mx-auto">
        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-card/60 border border-border/60 rounded-xl pl-11 pr-20 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 badge-pill bg-muted/60 text-muted-foreground border border-border/60">
          Ctrl+K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="w-9 h-9 rounded-xl bg-card/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
          aria-label="Toggle theme"
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          className="w-9 h-9 rounded-xl btn-premium flex items-center justify-center text-primary-foreground transition-all"
          aria-label="Add"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-9 px-3 rounded-xl bg-card/60 border border-border/60 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-num">{time.toLocaleTimeString("en-US", { hour12: true })}</span>
        </div>
        <button
          className="w-9 h-9 rounded-xl bg-card/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
          {initial}
        </div>
      </div>
    </header>
  );
}
