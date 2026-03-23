import { useState, useMemo } from "react";
import { getTrades, updateTradeJournal, type Trade, type JournalEntry } from "@/lib/trades";
import { BookOpen, Save, Star } from "lucide-react";

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>(() => getTrades());
  const [selectedId, setSelectedId] = useState<string | null>(trades[0]?.id || null);

  const selectedTrade = useMemo(() => trades.find(t => t.id === selectedId), [trades, selectedId]);

  const [journal, setJournal] = useState<JournalEntry>(() => selectedTrade?.journal || {
    preTradeAnalysis: '',
    postTradeReview: '',
    emotions: '',
    lessonsLearned: '',
    rating: 5,
    tags: '',
  });

  function selectTrade(trade: Trade) {
    setSelectedId(trade.id);
    setJournal(trade.journal || {
      preTradeAnalysis: '',
      postTradeReview: '',
      emotions: '',
      lessonsLearned: '',
      rating: 5,
      tags: '',
    });
  }

  function handleSave() {
    if (!selectedId) return;
    updateTradeJournal(selectedId, journal);
    setTrades(getTrades());
  }

  const journaledCount = trades.filter(t => t.journal).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade Journal</h1>
        <p className="text-sm text-muted-foreground">{journaledCount} of {trades.length} trades journaled</p>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Trade list */}
        <div className="w-80 shrink-0 bg-card rounded-xl border border-border overflow-auto">
          <div className="p-4 border-b border-border">
            <div className="flex gap-2 text-xs font-medium">
              <span className="bg-primary/20 text-primary px-2.5 py-1 rounded">All {trades.length}</span>
              <span className="text-muted-foreground px-2.5 py-1">Journaled {journaledCount}</span>
              <span className="text-muted-foreground px-2.5 py-1">Pending {trades.length - journaledCount}</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Add trades first</p>
            ) : (
              trades.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTrade(t)}
                  className={`w-full text-left p-4 transition-colors ${
                    selectedId === t.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>🥇</span>
                      <span className="font-semibold text-foreground">{t.symbol}</span>
                    </div>
                    {t.journal && <span className="text-xs bg-profit/20 text-profit px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={t.direction === 'Long' ? 'text-primary' : 'text-loss'}>{t.direction}</span>
                    <span className="text-muted-foreground">${t.entryPrice.toFixed(2)}</span>
                    <span className={`font-medium ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(t.closeDate).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Journal editor */}
        <div className="flex-1 bg-card rounded-xl border border-border p-6 overflow-auto">
          {selectedTrade ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedTrade.symbol}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedTrade.direction} · Entry ${selectedTrade.entryPrice.toFixed(2)} · Size {selectedTrade.lotSize} · {new Date(selectedTrade.closeDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedTrade.pnl >= 0 ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'}`}>
                    {selectedTrade.pnl >= 0 ? 'WINNER' : 'LOSER'}
                  </span>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" /> PRE-TRADE ANALYSIS
                </label>
                <textarea
                  value={journal.preTradeAnalysis}
                  onChange={e => setJournal(j => ({ ...j, preTradeAnalysis: e.target.value }))}
                  placeholder="What did you see? Plan, thesis, levels, risk..."
                  className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">POST-TRADE REVIEW</label>
                <textarea
                  value={journal.postTradeReview}
                  onChange={e => setJournal(j => ({ ...j, postTradeReview: e.target.value }))}
                  placeholder="What happened? Execution, slippage, improvements..."
                  className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">😊 EMOTIONS</label>
                  <textarea
                    value={journal.emotions}
                    onChange={e => setJournal(j => ({ ...j, emotions: e.target.value }))}
                    placeholder="Calm, anxious, FOMO, confident..."
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">📖 LESSONS LEARNED</label>
                  <textarea
                    value={journal.lessonsLearned}
                    onChange={e => setJournal(j => ({ ...j, lessonsLearned: e.target.value }))}
                    placeholder="Key takeaways to repeat or avoid..."
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">🏷️ TAGS</label>
                  <input
                    value={journal.tags}
                    onChange={e => setJournal(j => ({ ...j, tags: e.target.value }))}
                    placeholder="breakout, trend, news (comma separated)"
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Star className="w-4 h-4" /> RATING</span>
                    <span className={`text-base font-bold ${journal.rating >= 7 ? 'text-profit' : journal.rating >= 4 ? 'text-warning' : 'text-loss'}`}>{journal.rating}/10</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={journal.rating}
                    onChange={e => setJournal(j => ({ ...j, rating: parseInt(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a trade to write your journal entry</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
