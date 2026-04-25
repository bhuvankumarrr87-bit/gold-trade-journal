import { useMemo, useState } from "react";
import { useTrades } from "@/hooks/useTrades";
import { DollarSign, Clock, CheckCircle2, Target, Activity, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const timeframes = ["1D", "1W", "1M", "3M", "ALL"] as const;
type TF = typeof timeframes[number];

export default function Dashboard() {
  const { data: trades = [], isLoading } = useTrades();
  const [timeframe, setTimeframe] = useState<TF>("1W");

  const filteredTrades = useMemo(() => {
    if (timeframe === "ALL") return trades;
    const cutoff = new Date();
    if (timeframe === "1D") cutoff.setDate(cutoff.getDate() - 1);
    else if (timeframe === "1W") cutoff.setDate(cutoff.getDate() - 7);
    else if (timeframe === "1M") cutoff.setMonth(cutoff.getMonth() - 1);
    else if (timeframe === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
    return trades.filter((t) => new Date(t.close_time) >= cutoff);
  }, [trades, timeframe]);

  // Treat all trades as realized for now (no "open position" flag in schema)
  const realized = filteredTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const unrealized = 0;
  const totalPnl = realized + unrealized;
  const closedCount = filteredTrades.length;
  const winningTrades = filteredTrades.filter((t) => Number(t.pnl) > 0);
  const losingTrades = filteredTrades.filter((t) => Number(t.pnl) < 0);
  const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;

  const chartData = useMemo(() => {
    const sorted = [...filteredTrades].sort((a, b) => a.close_time.localeCompare(b.close_time));
    let cumulative = 0;
    const points = sorted.map((t) => {
      cumulative += Number(t.pnl);
      return {
        date: new Date(t.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        cumulative: Number(cumulative.toFixed(2)),
      };
    });
    if (points.length === 1) {
      return [{ date: "Start", cumulative: 0 }, points[0]];
    }
    return points;
  }, [filteredTrades]);

  const calendarData = useMemo(() => {
    const daily: Record<string, { pnl: number; count: number }> = {};
    trades.forEach((t) => {
      const day = t.close_time.split("T")[0];
      if (!daily[day]) daily[day] = { pnl: 0, count: 0 };
      daily[day].pnl += Number(t.pnl);
      daily[day].count++;
    });
    return daily;
  }, [trades]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalCells = startDow + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  // Monthly aggregate (current month)
  const monthlyPnl = Object.entries(calendarData)
    .filter(([d]) => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
    .reduce((s, [, v]) => s + v.pnl, 0);

  // Weekly aggregates for the right column
  const weeklyTotals = useMemo(() => {
    const totals: { pnl: number; trades: number }[] = Array.from({ length: weeks }, () => ({ pnl: 0, trades: 0 }));
    for (let d = 1; d <= daysInMonth; d++) {
      const cellIdx = startDow + (d - 1);
      const w = Math.floor(cellIdx / 7);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const data = calendarData[dateStr];
      if (data) {
        totals[w].pnl += data.pnl;
        totals[w].trades += data.count;
      }
    }
    return totals;
  }, [calendarData, weeks, startDow, daysInMonth, year, month]);

  const stats = [
    {
      label: "Total P&L",
      value: totalPnl,
      icon: DollarSign,
      iconBg: "bg-primary/15 text-primary",
      pill: { label: "Total", tone: "bg-primary/15 text-primary" },
      sub: `${closedCount} trade${closedCount === 1 ? "" : "s"}`,
      tone: totalPnl >= 0 ? "text-profit" : "text-loss",
    },
    {
      label: "Unrealized",
      value: unrealized,
      icon: Clock,
      iconBg: "bg-warning/15 text-warning",
      sub: "0 open positions",
      tone: "text-foreground",
    },
    {
      label: "Realized",
      value: realized,
      icon: CheckCircle2,
      iconBg: "bg-primary/15 text-primary",
      sub: `${closedCount} closed trades`,
      tone: realized >= 0 ? "text-profit" : "text-loss",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card border border-border/60 p-5 hover-lift">
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className="w-[18px] h-[18px]" />
              </div>
              {stat.pill && (
                <span className={`badge-pill ${stat.pill.tone}`}>{stat.pill.label}</span>
              )}
            </div>
            <p className="text-label mb-2">{stat.label}</p>
            <p className={`text-metric ${stat.tone}`}>
              {stat.value >= 0 ? "+" : ""}${Math.abs(stat.value).toFixed(2)}
            </p>
            <p className="text-[12px] text-muted-foreground mt-2 font-medium">{stat.sub}</p>
          </div>
        ))}

        {/* Win Rate card */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 hover-lift">
          <div className="flex items-start justify-between mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Target className="w-[18px] h-[18px]" />
            </div>
          </div>
          <p className="text-label mb-2">Win Rate</p>
          <p className="text-metric text-foreground">{winRate.toFixed(0)}%</p>
          <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
              style={{ width: `${Math.min(100, winRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Performance + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Performance */}
        <div className="lg:col-span-3 rounded-2xl bg-card border border-border/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-label">Performance</span>
              </div>
              <p className={`text-metric ${totalPnl >= 0 ? "text-foreground" : "text-loss"}`}>
                {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-1 bg-secondary/60 rounded-lg p-1 border border-border/40">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-200 ${
                    timeframe === tf
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 16%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11, fontFamily: "Plus Jakarta Sans" }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 11, fontFamily: "Plus Jakarta Sans" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                  dx={4}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 25%, 11%)",
                    border: "1px solid hsl(222, 25%, 16%)",
                    borderRadius: "10px",
                    color: "hsl(210, 20%, 98%)",
                    boxShadow: "0 8px 30px -8px rgba(0,0,0,0.5)",
                    padding: "10px 14px",
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                  labelStyle={{ color: "hsl(220, 9%, 46%)", fontSize: "11px", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(217, 91%, 60%)"
                  fill="url(#perfFill)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(217, 91%, 60%)", stroke: "hsl(222, 25%, 11%)", strokeWidth: 2 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Add trades to see your performance</p>
              </div>
            </div>
          )}
        </div>

        {/* Monthly P&L */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-foreground">Monthly P&L</h2>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground font-medium">
                Monthly: <span className={`text-num font-bold ${monthlyPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {monthlyPnl >= 0 ? "+" : ""}${Math.abs(monthlyPnl).toFixed(2)}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Header row: M T W T F S S + Weekly */}
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_64px] gap-1.5 text-center mb-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-muted-foreground/60 font-bold py-1">{d}</div>
            ))}
            <div className="text-[10px] text-muted-foreground/60 font-bold py-1">Weekly</div>
          </div>

          {/* Week rows */}
          <div className="space-y-1.5">
            {Array.from({ length: weeks }).map((_, w) => {
              const wt = weeklyTotals[w];
              const wPositive = wt.pnl >= 0;
              return (
                <div key={w} className="grid grid-cols-[repeat(7,minmax(0,1fr))_64px] gap-1.5">
                  {Array.from({ length: 7 }).map((__, d) => {
                    const cellIdx = w * 7 + d;
                    const dayNum = cellIdx - startDow + 1;
                    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
                    if (!inMonth) {
                      return <div key={d} className="aspect-square rounded-lg bg-secondary/20 border border-transparent" />;
                    }
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const data = calendarData[dateStr];
                    const hasData = !!data;
                    const isProfit = hasData && data.pnl >= 0;
                    const isToday = dayNum === now.getDate();
                    return (
                      <div
                        key={d}
                        className={`aspect-square rounded-lg p-1.5 flex flex-col justify-between text-left transition-all duration-200 cursor-default group relative
                          ${hasData
                            ? isProfit
                              ? "bg-profit/12 border border-profit/25 hover:bg-profit/20"
                              : "bg-loss/12 border border-loss/25 hover:bg-loss/20"
                            : "bg-secondary/30 border border-border/30 hover:border-border"}
                          ${isToday ? "ring-1 ring-primary/50" : ""}`}
                      >
                        <span className={`text-[10px] font-bold ${hasData ? (isProfit ? "text-profit" : "text-loss") : "text-muted-foreground/70"}`}>
                          {dayNum}
                        </span>
                        {hasData && (
                          <span className={`text-[9px] font-bold leading-none ${isProfit ? "text-profit" : "text-loss"}`}>
                            {isProfit ? "+" : "-"}${Math.abs(data.pnl).toFixed(0)}
                          </span>
                        )}
                        {hasData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                            <div className="rounded-lg bg-popover border border-border px-3 py-2 text-[11px] whitespace-nowrap shadow-xl">
                              <p className={`font-bold text-num ${isProfit ? "text-profit" : "text-loss"}`}>
                                {isProfit ? "+" : "-"}${Math.abs(data.pnl).toFixed(2)}
                              </p>
                              <p className="text-muted-foreground">{data.count} trade{data.count > 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Weekly column */}
                  <div className="aspect-square rounded-lg bg-secondary/40 border border-border/40 p-1.5 flex flex-col justify-between text-center">
                    <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider leading-none">Weekly</span>
                    <div>
                      <p className={`text-[10px] font-extrabold leading-none text-num ${wt.trades === 0 ? "text-muted-foreground" : wPositive ? "text-profit" : "text-loss"}`}>
                        {wPositive ? "" : "-"}${Math.abs(wt.pnl).toFixed(0)}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                        {wt.trades} traded
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center mt-4 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Profit</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-loss" /> Loss</span>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="rounded-2xl bg-card border border-border/60 p-6">
        <h2 className="text-[15px] font-bold text-foreground mb-5">Open Positions</h2>
        {trades.length > 0 ? (
          <div className="space-y-1">
            {trades.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-secondary/40 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center text-base">🥇</div>
                  <div>
                    <p className="font-bold text-foreground text-[14px]">{t.symbol}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {new Date(t.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <span className={`badge-pill ${t.direction === "Long" ? "bg-primary/15 text-primary" : "bg-loss/15 text-loss"}`}>
                  {t.direction}
                </span>
                <p className={`font-extrabold text-num text-[15px] ${Number(t.pnl) >= 0 ? "text-profit" : "text-loss"}`}>
                  {Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm font-medium">No trades yet. Go to Trades to add your first trade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
