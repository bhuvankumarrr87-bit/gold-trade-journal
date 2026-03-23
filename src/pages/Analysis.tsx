import { useMemo } from "react";
import { getTrades, getDailyPnl } from "@/lib/trades";

export default function Analysis() {
  const trades = useMemo(() => getTrades(), []);
  const dailyPnl = getDailyPnl(trades);

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winners = trades.filter(t => t.pnl > 0);
  const losers = trades.filter(t => t.pnl < 0);
  const avgWin = winners.length ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;
  const bestTrade = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;
  const worstTrade = trades.length ? Math.min(...trades.map(t => t.pnl)) : 0;
  const longTrades = trades.filter(t => t.direction === 'Long');
  const shortTrades = trades.filter(t => t.direction === 'Short');
  const longPnl = longTrades.reduce((s, t) => s + t.pnl, 0);
  const shortPnl = shortTrades.reduce((s, t) => s + t.pnl, 0);
  const longWinRate = longTrades.length ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length * 100) : 0;
  const shortWinRate = shortTrades.length ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length * 100) : 0;

  const dailyEntries = Object.entries(dailyPnl).sort(([a], [b]) => a.localeCompare(b));
  const winDays = dailyEntries.filter(([, v]) => v > 0).length;
  const loseDays = dailyEntries.filter(([, v]) => v < 0).length;
  const avgDailyPnl = dailyEntries.length ? dailyEntries.reduce((s, [, v]) => s + v, 0) / dailyEntries.length : 0;

  // Max drawdown
  let peak = 0, maxDD = 0, cum = 0;
  dailyEntries.forEach(([, v]) => {
    cum += v;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  });

  const leftStats = [
    { label: 'Total P&L', value: `$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 },
    { label: 'Average daily volume', value: trades.length > 0 ? (trades.length / Math.max(dailyEntries.length, 1)).toFixed(2) : '0' },
    { label: 'Average winning trade', value: `$${avgWin.toFixed(2)}`, color: true },
    { label: 'Average losing trade', value: `-$${Math.abs(avgLoss).toFixed(2)}`, color: false },
    { label: 'Total number of trades', value: `${trades.length}` },
    { label: 'Number of winning trades', value: `${winners.length}`, color: true },
    { label: 'Number of losing trades', value: `${losers.length}`, color: false },
    { label: 'Largest profit', value: `$${bestTrade.toFixed(2)}`, color: true },
    { label: 'Largest loss', value: `-$${Math.abs(worstTrade).toFixed(2)}`, color: false },
  ];

  const rightStats = [
    { label: 'Total trading days', value: `${dailyEntries.length}` },
    { label: 'Winning days', value: `${winDays}`, color: true },
    { label: 'Losing days', value: `${loseDays}`, color: false },
    { label: 'Average daily P&L', value: `$${avgDailyPnl.toFixed(2)}`, color: avgDailyPnl >= 0 },
    { label: 'Max drawdown', value: `-$${maxDD.toFixed(2)}`, color: false },
    { label: 'Trade expectancy', value: `$${trades.length ? (totalPnl / trades.length).toFixed(2) : '0.00'}`, color: totalPnl >= 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      </div>

      {/* Long vs Short */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Long vs Short</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Long</p>
              <p className="text-xs text-muted-foreground">TRADES: {longTrades.length}</p>
              <p className={`font-bold ${longPnl >= 0 ? 'text-profit' : 'text-loss'}`}>${longPnl.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Win: {longWinRate.toFixed(0)}%</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Short</p>
              <p className="text-xs text-muted-foreground">TRADES: {shortTrades.length}</p>
              <p className={`font-bold ${shortPnl >= 0 ? 'text-profit' : 'text-loss'}`}>${shortPnl.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Win: {shortWinRate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">BEST TRADE</p>
              <p className="font-bold text-profit">${bestTrade.toFixed(2)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">WORST TRADE</p>
              <p className="font-bold text-loss">-${Math.abs(worstTrade).toFixed(2)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">WIN STREAK</p>
              <p className="font-bold text-foreground">{winners.length}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">RISK:REWARD</p>
              <p className="font-bold text-primary">1:{avgLoss !== 0 ? Math.abs(avgWin / avgLoss).toFixed(2) : '∞'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed stats */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-2 gap-x-12">
          <div className="space-y-3">
            {leftStats.map(s => (
              <div key={s.label} className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-semibold ${s.color === undefined ? 'text-foreground' : s.color ? 'text-profit' : 'text-loss'}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {rightStats.map(s => (
              <div key={s.label} className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-semibold ${s.color === undefined ? 'text-foreground' : s.color ? 'text-profit' : 'text-loss'}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
