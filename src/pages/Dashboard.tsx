import { useMemo, useState } from "react";
import { useTrades } from "@/hooks/useTrades";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const timeframes = ["1W", "1M", "3M", "ALL"] as const;

export default function Dashboard() {
  const { data: trades = [], isLoading } = useTrades();
  const [timeframe, setTimeframe] = useState<typeof timeframes[number]>("ALL");

  const filteredTrades = useMemo(() => {
    if (timeframe === "ALL") return trades;
    const now = new Date();
    const cutoff = new Date();
    if (timeframe === "1W") cutoff.setDate(now.getDate() - 7);
    else if (timeframe === "1M") cutoff.setMonth(now.getMonth() - 1);
    else if (timeframe === "3M") cutoff.setMonth(now.getMonth() - 3);
    return trades.filter(t => new Date(t.close_time) >= cutoff);
  }, [trades, timeframe]);

  const totalPnl = filteredTrades.reduce((sum, t) => sum + Number(t.pnl), 0);
  const winningTrades = filteredTrades.filter(t => Number(t.pnl) > 0);
  const losingTrades = filteredTrades.filter(t => Number(t.pnl) < 0);
  const winRate = filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + Number(t.pnl), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + Number(t.pnl), 0) / losingTrades.length : 0;

  const chartData = useMemo(() => {
    const sorted = [...filteredTrades].sort((a, b) => a.close_time.localeCompare(b.close_time));
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += Number(t.pnl);
      return { date: new Date(t.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cumulative, pnl: Number(t.pnl) };
    });
  }, [filteredTrades]);

  const calendarData = useMemo(() => {
    const daily: Record<string, { pnl: number; count: number }> = {};
    trades.forEach(t => {
      const day = t.close_time.split('T')[0];
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
  const startDow = (firstDay.getDay() + 6) % 7;

  const stats = [
    { label: "Total P&L", value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: DollarSign, positive: totalPnl >= 0, sub: `${filteredTrades.length} trades` },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: Target, positive: winRate >= 50, sub: `${winningTrades.length}W · ${losingTrades.length}L` },
    { label: "Avg Win", value: `+$${avgWin.toFixed(2)}`, icon: TrendingUp, positive: true, sub: `${winningTrades.length} trades` },
    { label: "Avg Loss", value: `-$${Math.abs(avgLoss).toFixed(2)}`, icon: TrendingDown, positive: false, sub: `${losingTrades.length} trades` },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-4xl font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-4xl text-muted-foreground mt-1 font-medium">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-6 hover-lift group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.positive ? 'bg-profit/10' : 'bg-loss/10'}`}>
                <stat.icon className={`w-[18px] h-[18px] ${stat.positive ? 'text-profit' : 'text-loss'}`} />
              </div>
            </div>
            <p className={`text-4xl font-extrabold font-mono-num ${stat.positive ? 'text-profit' : 'text-loss'}`}>{stat.value}</p>
            <p className="text-4xl text-muted-foreground mt-1.5 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-foreground">Equity Curve</h2>
            </div>
            <div className="flex gap-1 bg-secondary/60 rounded-lg p-0.5">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-4xl font-semibold transition-all duration-200 ${
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} dx={-4} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(225, 14%, 9%)',
                    border: '1px solid hsl(225, 12%, 18%)',
                    borderRadius: '12px',
                    color: 'hsl(210, 20%, 95%)',
                    boxShadow: '0 8px 30px -8px rgba(0,0,0,0.4)',
                    padding: '12px 16px',
                    fontFamily: 'Inter',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
                  labelStyle={{ color: 'hsl(220, 10%, 46%)', fontSize: '11px', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(221, 83%, 53%)" fill="url(#colorPnl)" strokeWidth={2.5} dot={false} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-4xl font-medium">Add trades to see your equity curve</p>
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-4xl text-muted-foreground/60 font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data = calendarData[dateStr];
              const hasData = data !== undefined;
              const isProfit = hasData && data.pnl > 0;
              const isToday = day === now.getDate();

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg text-4xl flex flex-col items-center justify-center transition-all duration-200 cursor-default group relative
                    ${hasData
                      ? isProfit
                        ? 'bg-profit/12 border border-profit/20 glow-profit'
                        : 'bg-loss/12 border border-loss/20 glow-loss'
                      : 'bg-secondary/30 border border-transparent hover:border-border'
                    }
                    ${isToday ? 'ring-1 ring-primary/40' : ''}
                  `}
                >
                  <span className={`font-medium ${hasData ? (isProfit ? 'text-profit/80' : 'text-loss/80') : 'text-muted-foreground/60'}`}>{day}</span>
                  {hasData && (
                    <span className={`text-4xl font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {isProfit ? '+' : ''}{data.pnl.toFixed(0)}
                    </span>
                  )}
                  {/* Hover tooltip */}
                  {hasData && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="glass-card rounded-lg px-3 py-2 text-4xl whitespace-nowrap shadow-xl">
                        <p className={`font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                          {isProfit ? '+' : ''}${data.pnl.toFixed(2)}
                        </p>
                        <p className="text-muted-foreground">{data.count} trade{data.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 justify-center mt-4 text-4xl text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-profit" /> Profit</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-loss" /> Loss</span>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-4xl font-bold text-foreground mb-5">Recent Trades</h2>
        {trades.length > 0 ? (
          <div className="space-y-1">
            {trades.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-secondary/40 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-sm">🥇</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.symbol}</p>
                    <p className="text-4xl text-muted-foreground font-medium">{new Date(t.close_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className={`text-4xl font-semibold px-2.5 py-1 rounded-lg ${
                  t.direction === 'Long'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-loss/10 text-loss border border-loss/20'
                }`}>
                  {t.direction}
                </span>
                <p className={`font-bold font-mono-num text-4xl ${Number(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-muted-foreground text-4xl font-medium">No trades yet. Go to Trades to add your first trade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
