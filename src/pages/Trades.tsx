import { useState, useMemo } from "react";
import { getTrades, addTrade, deleteTrade, type Trade } from "@/lib/trades";
import { Plus, Trash2 } from "lucide-react";

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>(() => getTrades());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    direction: 'Long' as 'Long' | 'Short',
    entryPrice: '',
    exitPrice: '',
    lotSize: '0.1',
    openDate: new Date().toISOString().slice(0, 16),
    closeDate: new Date().toISOString().slice(0, 16),
  });

  const previewPnl = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const lot = parseFloat(form.lotSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(lot)) return null;
    const diff = form.direction === 'Long' ? exit - entry : entry - exit;
    return parseFloat((diff * lot * 100).toFixed(2));
  }, [form]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const lot = parseFloat(form.lotSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(lot)) return;

    addTrade({
      symbol: 'XAUUSD',
      direction: form.direction,
      entryPrice: entry,
      exitPrice: exit,
      lotSize: lot,
      openDate: form.openDate,
      closeDate: form.closeDate,
    });
    setTrades(getTrades());
    setShowForm(false);
    setForm({ direction: 'Long', entryPrice: '', exitPrice: '', lotSize: '0.1', openDate: new Date().toISOString().slice(0, 16), closeDate: new Date().toISOString().slice(0, 16) });
  }

  function handleDelete(id: string) {
    deleteTrade(id);
    setTrades(getTrades());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trades</h1>
          <p className="text-sm text-muted-foreground">{trades.length} trades recorded</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Trade
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">New XAUUSD Trade</h3>
          
          <div className="flex gap-2">
            {(['Long', 'Short'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setForm(f => ({ ...f, direction: d }))}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  form.direction === d
                    ? d === 'Long' ? 'bg-primary text-primary-foreground' : 'bg-loss text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={form.entryPrice}
                onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                placeholder="e.g. 2650.00"
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Exit Price</label>
              <input
                type="number"
                step="0.01"
                value={form.exitPrice}
                onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))}
                placeholder="e.g. 2660.00"
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lot Size</label>
              <input
                type="number"
                step="0.01"
                value={form.lotSize}
                onChange={e => setForm(f => ({ ...f, lotSize: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Open Date</label>
              <input
                type="datetime-local"
                value={form.openDate}
                onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Close Date</label>
              <input
                type="datetime-local"
                value={form.closeDate}
                onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              {previewPnl !== null && (
                <div className={`text-lg font-bold ${previewPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  P&L: {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
              Save Trade
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">OPEN / CLOSE</th>
              <th className="text-left text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">SYMBOL</th>
              <th className="text-left text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">TYPE</th>
              <th className="text-right text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">ENTRY</th>
              <th className="text-right text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">EXIT</th>
              <th className="text-right text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">SIZE</th>
              <th className="text-right text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">P&L</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted-foreground py-12">
                  No trades yet. Click "Add Trade" to get started.
                </td>
              </tr>
            ) : (
              trades.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-xs text-muted-foreground">Open: {new Date(t.openDate).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Close: {new Date(t.closeDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥇</span>
                      <span className="font-medium text-foreground">{t.symbol}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded ${t.direction === 'Long' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">${t.entryPrice.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">${t.exitPrice.toFixed(2)}</td>
                  <td className="px-5 py-4 text-right text-sm text-foreground">{t.lotSize}</td>
                  <td className={`px-5 py-4 text-right font-semibold ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-loss transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
