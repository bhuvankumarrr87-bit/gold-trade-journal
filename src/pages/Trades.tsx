import { useState, useMemo } from "react";
import { useTrades, useAddTrade, useDeleteTrade, calculatePnl } from "@/hooks/useTrades";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Trades() {
  const { data: trades = [], isLoading } = useTrades();
  const addTrade = useAddTrade();
  const deleteTrade = useDeleteTrade();
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
    return calculatePnl(form.direction, entry, exit, lot);
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const lot = parseFloat(form.lotSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(lot)) return;

    try {
      await addTrade.mutateAsync({
        symbol: 'XAUUSD',
        direction: form.direction,
        entry_price: entry,
        exit_price: exit,
        lot_size: lot,
        open_time: form.openDate,
        close_time: form.closeDate,
      });
      toast.success("Trade added!");
      setShowForm(false);
      setForm({ direction: 'Long', entryPrice: '', exitPrice: '', lotSize: '0.1', openDate: new Date().toISOString().slice(0, 16), closeDate: new Date().toISOString().slice(0, 16) });
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTrade.mutateAsync(id);
      toast.success("Trade deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trades</h1>
          <p className="text-sm text-muted-foreground">{trades.length} trades recorded</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-accent transition-colors opacity-50 cursor-not-allowed">
            Connect MT4/MT5
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">New XAUUSD Trade</h3>
          <div className="flex gap-2">
            {(['Long', 'Short'] as const).map(d => (
              <button key={d} type="button" onClick={() => setForm(f => ({ ...f, direction: d }))}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${form.direction === d ? (d === 'Long' ? 'bg-primary text-primary-foreground' : 'bg-loss text-primary-foreground') : 'bg-secondary text-secondary-foreground'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Entry Price</label>
              <input type="number" step="0.01" value={form.entryPrice} onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                placeholder="e.g. 2650.00" className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Exit Price</label>
              <input type="number" step="0.01" value={form.exitPrice} onChange={e => setForm(f => ({ ...f, exitPrice: e.target.value }))}
                placeholder="e.g. 2660.00" className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lot Size</label>
              <input type="number" step="0.01" value={form.lotSize} onChange={e => setForm(f => ({ ...f, lotSize: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Open Date</label>
              <input type="datetime-local" value={form.openDate} onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Close Date</label>
              <input type="datetime-local" value={form.closeDate} onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))}
                className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
            <button type="submit" disabled={addTrade.isPending} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {addTrade.isPending ? 'Saving...' : 'Save Trade'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-accent transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="text-center text-xs font-semibold text-muted-foreground tracking-wider px-5 py-3">SOURCE</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-12">No trades yet. Click "Add Trade" to get started.</td></tr>
              ) : (
                trades.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs text-muted-foreground">Open: {new Date(t.open_time).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Close: {new Date(t.close_time).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span>🥇</span>
                        <span className="font-medium text-foreground">{t.symbol}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded ${t.direction === 'Long' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>{t.direction}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-foreground">${Number(t.entry_price).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-foreground">${Number(t.exit_price).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-sm text-foreground">{t.lot_size}</td>
                    <td className={`px-5 py-4 text-right font-semibold ${Number(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{t.source}</span>
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
    </div>
  );
}
