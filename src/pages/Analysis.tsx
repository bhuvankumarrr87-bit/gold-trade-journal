import { useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Analysis() {
  const { data: trades = [], isLoading } = useTrades();

  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl), 0);
  const winners = trades.filter(t => Number(t.pnl) > 0);
  const losers = trades.filter(t => Number(t.pnl) < 0);
  const avgWin = winners.length ? winners.reduce((s, t) => s + Number(t.pnl), 0) / winners.length : 0;
  const avgLoss = losers.length ? losers.reduce((s, t) => s + Number(t.pnl), 0) / losers.length : 0;
  const bestTrade = trades.length ? Math.max(...trades.map(t => Number(t.pnl))) : 0;
  const worstTrade = trades.length ? Math.min(...trades.map(t => Number(t.pnl))) : 0;

  const longTrades = trades.filter(t => t.direction === 'Long');
  const shortTrades = trades.filter(t => t.direction === 'Short');
  const longPnl = longTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const shortPnl = shortTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const longWinRate = longTrades.length ? (longTrades.filter(t => Number(t.pnl) > 0).length / longTrades.length * 100) : 0;
  const shortWinRate = shortTrades.length ? (shortTrades.filter(t => Number(t.pnl) > 0).length / shortTrades.length * 100) : 0;

  // Daily P&L
  const dailyPnl = useMemo(() => {
    const daily: Record<string, number> = {};
    trades.forEach(t => {
      const day = t.close_time.split('T')[0];
      daily[day] = (daily[day] || 0) + Number(t.pnl);
    });
    return Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
  }, [trades]);

  const winDays = dailyPnl.filter(([, v]) => v > 0).length;
  const loseDays = dailyPnl.filter(([, v]) => v < 0).length;
  const avgDailyPnl = dailyPnl.length ? dailyPnl.reduce((s, [, v]) => s + v, 0) / dailyPnl.length : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, cum = 0;
  dailyPnl.forEach(([, v]) => { cum += v; if (cum > peak) peak = cum; const dd = peak - cum; if (dd > maxDD) maxDD = dd; });

  // Equity curve
  const equityData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.close_time.localeCompare(b.close_time));
    let c = 0;
    return sorted.map(t => { c += Number(t.pnl); return { date: new Date(t.close_time).toLocaleDateString(), cumulative: c }; });
  }, [trades]);

  // Day performance
  const dayPerf = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(d => ({ day: d, pnl: 0, count: 0 }));
    trades.forEach(t => {
      const dow = (new Date(t.close_time).getDay() + 6) % 7;
      data[dow].pnl += Number(t.pnl);
      data[dow].count++;
    });
    return data;
  }, [trades]);

  // Session performance
  const sessionPerf = useMemo(() => {
    const sessions = [
      { name: 'Asian', start: 22, end: 8, pnl: 0, count: 0, wins: 0 },
      { name: 'London', start: 8, end: 13, pnl: 0, count: 0, wins: 0 },
      { name: 'New York', start: 13, end: 22, pnl: 0, count: 0, wins: 0 },
    ];
    trades.forEach(t => {
      const hour = new Date(t.open_time).getUTCHours();
      let s = sessions[2]; // default NY
      if ((hour >= 22 || hour < 8)) s = sessions[0];
      else if (hour >= 8 && hour < 13) s = sessions[1];
      s.pnl += Number(t.pnl);
      s.count++;
      if (Number(t.pnl) > 0) s.wins++;
    });
    return sessions;
  }, [trades]);

  // Win/Loss distribution
  const distData = useMemo(() => {
    return [
      { name: 'Wins', value: winners.length, fill: 'hsl(142, 71%, 45%)' },
      { name: 'Losses', value: losers.length, fill: 'hsl(0, 84%, 60%)' },
    ];
  }, [winners, losers]);

  // Calendar heatmap
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
  const startDow = (firstDay.getDay() + 6) % 7;

  const quickStats = [
    { label: 'AVG WINNER', value: `$${avgWin.toFixed(2)}`, color: avgWin >= 0 },
    { label: 'AVG LOSER', value: `-$${Math.abs(avgLoss).toFixed(2)}`, color: false },
    { label: 'BEST TRADE', value: `$${bestTrade.toFixed(2)}`, color: true },
    { label: 'WORST TRADE', value: `-$${Math.abs(worstTrade).toFixed(2)}`, color: false },
    { label: 'WIN STREAK', value: `${winners.length}`, color: true },
    { label: 'LOSS STREAK', value: `${losers.length}`, color: false },
    { label: 'RISK:REWARD', value: `1:${avgLoss !== 0 ? Math.abs(avgWin / avgLoss).toFixed(2) : '∞'}`, color: true },
    { label: 'OPEN TRADES', value: '0', color: undefined },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis</h1>
        <p className="text-sm text-muted-foreground">{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      {/* Quick Stats + Equity Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">📊 Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map(s => (
              <div key={s.label} className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`font-bold text-sm ${s.color === undefined ? 'text-foreground' : s.color ? 'text-profit' : 'text-loss'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">📈 Equity Curve</h3>
          {equityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }} />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(217, 91%, 60%)" fill="url(#eqGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">Add trades to see equity curve</div>
          )}
        </div>
      </div>

      {/* Long vs Short + Day Performance + Session */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">↕️ Long vs Short</h3>
          <div className="space-y-3">
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2"><span className="text-primary">📈</span><span className="font-medium text-foreground">Long</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>TRADES</span><span>P&L</span><span>WIN %</span></div>
              <div className="flex justify-between text-sm"><span className="text-foreground">{longTrades.length}</span><span className={longPnl >= 0 ? 'text-profit' : 'text-loss'}>${longPnl.toFixed(2)}</span><span className="text-foreground">{longWinRate.toFixed(0)}%</span></div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2"><span className="text-loss">📉</span><span className="font-medium text-foreground">Short</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>TRADES</span><span>P&L</span><span>WIN %</span></div>
              <div className="flex justify-between text-sm"><span className="text-foreground">{shortTrades.length}</span><span className={shortPnl >= 0 ? 'text-profit' : 'text-loss'}>${shortPnl.toFixed(2)}</span><span className="text-foreground">{shortWinRate.toFixed(0)}%</span></div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">📅 Day Performance</h3>
          <div className="space-y-2">
            {dayPerf.map(d => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-8">{d.day}</span>
                <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden relative">
                  {d.count > 0 && (
                    <div className={`h-full rounded-full ${d.pnl >= 0 ? 'bg-primary' : 'bg-loss'}`}
                      style={{ width: `${Math.min(Math.abs(d.pnl) / (Math.max(...dayPerf.map(x => Math.abs(x.pnl))) || 1) * 100, 100)}%` }} />
                  )}
                </div>
                <span className={`text-xs font-medium w-16 text-right ${d.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {d.count > 0 ? `$${d.pnl.toFixed(2)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">🌍 Session Performance</h3>
          <div className="space-y-3">
            {sessionPerf.map(s => (
              <div key={s.name} className="bg-secondary rounded-lg p-3">
                <p className="font-medium text-foreground text-sm mb-1">{s.name}</p>
                <div className="flex justify-between text-xs">
                  <span className={`font-bold ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>${s.pnl.toFixed(2)}</span>
                  <span className="text-muted-foreground">Trades: {s.count}</span>
                  <span className="text-muted-foreground">Win: {s.count ? (s.wins / s.count * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + Win/Loss Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">📅 Trading Calendar · {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
              <div key={d} className="text-[10px] text-muted-foreground py-1 font-medium">{d}</div>
            ))}
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const pnl = calendarData[dateStr];
              const bg = pnl !== undefined ? (pnl > 0 ? 'bg-primary/20 border-primary/40' : 'bg-loss/20 border-loss/40') : 'bg-secondary/30 border-border';
              return (
                <div key={day} className={`aspect-square rounded-md text-xs flex flex-col items-center justify-center border ${bg}`}>
                  <span className="text-muted-foreground text-[10px]">{day}</span>
                  {pnl !== undefined && <span className={`text-[9px] font-bold ${pnl > 0 ? 'text-profit' : 'text-loss'}`}>${Math.abs(pnl).toFixed(0)}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 justify-center mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Profitable</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-loss" /> Losing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted" /> No Trades</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Win/Loss Distribution</h3>
          {trades.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">Add trades to see distribution</div>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-2 gap-x-12">
          <div className="space-y-2">
            {[
              { l: 'Total P&L', v: `$${totalPnl.toFixed(2)}`, c: totalPnl >= 0 },
              { l: 'Average winning trade', v: `$${avgWin.toFixed(2)}`, c: true },
              { l: 'Average losing trade', v: `-$${Math.abs(avgLoss).toFixed(2)}`, c: false },
              { l: 'Total number of trades', v: `${trades.length}` },
              { l: 'Number of winning trades', v: `${winners.length}`, c: true },
              { l: 'Number of losing trades', v: `${losers.length}`, c: false },
              { l: 'Largest profit', v: `$${bestTrade.toFixed(2)}`, c: true },
              { l: 'Largest loss', v: `-$${Math.abs(worstTrade).toFixed(2)}`, c: false },
            ].map(s => (
              <div key={s.l} className="flex justify-between py-1.5 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.l}</span>
                <span className={`text-sm font-semibold ${s.c === undefined ? 'text-foreground' : s.c ? 'text-profit' : 'text-loss'}`}>{s.v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { l: 'Total trading days', v: `${dailyPnl.length}` },
              { l: 'Winning days', v: `${winDays}`, c: true },
              { l: 'Losing days', v: `${loseDays}`, c: false },
              { l: 'Average daily P&L', v: `$${avgDailyPnl.toFixed(2)}`, c: avgDailyPnl >= 0 },
              { l: 'Max drawdown', v: `-$${maxDD.toFixed(2)}`, c: false },
              { l: 'Max drawdown %', v: peak > 0 ? `-${(maxDD / peak * 100).toFixed(2)}%` : '0%', c: false },
              { l: 'Trade expectancy', v: `$${trades.length ? (totalPnl / trades.length).toFixed(2) : '0.00'}`, c: totalPnl >= 0 },
            ].map(s => (
              <div key={s.l} className="flex justify-between py-1.5 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.l}</span>
                <span className={`text-sm font-semibold ${s.c === undefined ? 'text-foreground' : s.c ? 'text-profit' : 'text-loss'}`}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h3>
        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span>🥇</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.symbol}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.close_time).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.direction === 'Long' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>{t.direction}</span>
                <p className={`font-semibold text-sm ${Number(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No trades yet</p>
        )}
      </div>
    </div>
  );
}
