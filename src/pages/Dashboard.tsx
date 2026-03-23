import { useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: trades = [], isLoading } = useTrades();

  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl), 0);
  const winningTrades = trades.filter(t => Number(t.pnl) > 0);
  const losingTrades = trades.filter(t => Number(t.pnl) < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + Number(t.pnl), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + Number(t.pnl), 0) / losingTrades.length : 0;

  const chartData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.close_time.localeCompare(b.close_time));
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += Number(t.pnl);
      return { date: new Date(t.close_time).toLocaleDateString(), cumulative, pnl: Number(t.pnl) };
    });
  }, [trades]);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    const daily: Record<string, number> = {};
    trades.forEach(t => {
      const day = t.close_time.split('T')[0];
      daily[day] = (daily[day] || 0) + Number(t.pnl);
    });
    return daily;
  }, [trades]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Monday start

  const stats = [
    { label: "TOTAL P&L", value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: DollarSign, positive: totalPnl >= 0, sub: `${trades.length} trades` },
    { label: "WIN RATE", value: `${winRate.toFixed(0)}%`, icon: Target, positive: winRate >= 50, sub: `${winningTrades.length}W / ${losingTrades.length}L` },
    { label: "AVG WIN", value: `$${avgWin.toFixed(2)}`, icon: TrendingUp, positive: true, sub: `${winningTrades.length} trades` },
    { label: "AVG LOSS", value: `$${Math.abs(avgLoss).toFixed(2)}`, icon: TrendingDown, positive: false, sub: `${losingTrades.length} trades` },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.positive ? 'text-profit' : 'text-loss'}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.positive ? 'text-profit' : 'text-loss'}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Equity Curve</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']} />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(217, 91%, 60%)" fill="url(#colorPnl)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">Add trades to see your equity curve</div>
          )}
        </div>

        {/* Monthly P&L Calendar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Monthly P&L · {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-xs text-muted-foreground py-1">{d}</div>
            ))}
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const pnl = calendarData[dateStr];
              const bg = pnl !== undefined ? (pnl > 0 ? 'bg-primary/30 border-primary/50' : 'bg-loss/30 border-loss/50') : 'bg-secondary/50 border-border';
              return (
                <div key={day} className={`aspect-square rounded text-[10px] flex flex-col items-center justify-center border ${bg}`}>
                  <span className="text-muted-foreground">{day}</span>
                  {pnl !== undefined && (
                    <span className={`text-[8px] font-bold ${pnl > 0 ? 'text-profit' : 'text-loss'}`}>
                      {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent trades */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h2>
        {trades.length > 0 ? (
          <div className="space-y-3">
            {trades.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🥇</span>
                  <div>
                    <p className="font-medium text-foreground">{t.symbol}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.close_time).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${t.direction === 'Long' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>
                  {t.direction}
                </span>
                <p className={`font-semibold ${Number(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No trades yet. Go to Trades to add your first trade.</p>
        )}
      </div>
    </div>
  );
}
