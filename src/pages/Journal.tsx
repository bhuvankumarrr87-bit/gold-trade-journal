import { useState, useEffect, useRef } from "react";
import { useTrades, useJournal, useSaveJournal, useChecklist, useSaveChecklist, useScreenshots, useUploadScreenshot } from "@/hooks/useTrades";
import { BookOpen, Save, Star, ImagePlus, Check } from "lucide-react";
import { toast } from "sonner";

export default function Journal() {
  const { data: trades = [], isLoading } = useTrades();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: existingJournal } = useJournal(selectedId);
  const { data: existingChecklist } = useChecklist(selectedId);
  const { data: screenshots = [] } = useScreenshots(selectedId);
  const saveJournal = useSaveJournal();
  const saveChecklist = useSaveChecklist();
  const uploadScreenshot = useUploadScreenshot();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTrade = trades.find(t => t.id === selectedId);

  const [journal, setJournal] = useState({
    pre_trade_notes: '', post_trade_notes: '', emotions: '', lessons: '', tags: '', rating: 5, risk_reward: '1:2',
  });

  const [checklist, setChecklist] = useState({
    checked_higher_tf: false, risk_within_limits: false, fits_plan: false, key_levels: false, news_checked: false,
  });

  useEffect(() => {
    if (!selectedId && trades.length > 0) setSelectedId(trades[0].id);
  }, [trades, selectedId]);

  useEffect(() => {
    if (existingJournal) {
      setJournal({
        pre_trade_notes: existingJournal.pre_trade_notes || '',
        post_trade_notes: existingJournal.post_trade_notes || '',
        emotions: existingJournal.emotions || '',
        lessons: existingJournal.lessons || '',
        tags: existingJournal.tags || '',
        rating: existingJournal.rating || 5,
        risk_reward: existingJournal.risk_reward || '1:2',
      });
    } else {
      setJournal({ pre_trade_notes: '', post_trade_notes: '', emotions: '', lessons: '', tags: '', rating: 5, risk_reward: '1:2' });
    }
  }, [existingJournal, selectedId]);

  useEffect(() => {
    if (existingChecklist) {
      setChecklist({
        checked_higher_tf: existingChecklist.checked_higher_tf || false,
        risk_within_limits: existingChecklist.risk_within_limits || false,
        fits_plan: existingChecklist.fits_plan || false,
        key_levels: existingChecklist.key_levels || false,
        news_checked: existingChecklist.news_checked || false,
      });
    } else {
      setChecklist({ checked_higher_tf: false, risk_within_limits: false, fits_plan: false, key_levels: false, news_checked: false });
    }
  }, [existingChecklist, selectedId]);

  async function handleSave() {
    if (!selectedId) return;
    try {
      await saveJournal.mutateAsync({ trade_id: selectedId, ...journal });
      await saveChecklist.mutateAsync({ trade_id: selectedId, ...checklist });
      toast.success("Journal saved!");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    try {
      await uploadScreenshot.mutateAsync({ tradeId: selectedId, file });
      toast.success("Screenshot uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const journaledIds = new Set(trades.filter(t => existingJournal?.trade_id === t.id).map(t => t.id));
  const checkCount = Object.values(checklist).filter(Boolean).length;

  if (isLoading) return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade Journal</h1>
        <p className="text-sm text-muted-foreground">{trades.length} trades</p>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Trade list */}
        <div className="w-72 shrink-0 bg-card rounded-xl border border-border overflow-auto">
          <div className="p-4 border-b border-border">
            <span className="text-xs font-medium bg-primary/20 text-primary px-2.5 py-1 rounded">All {trades.length}</span>
          </div>
          <div className="divide-y divide-border">
            {trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Add trades first</p>
            ) : (
              trades.map(t => (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-4 transition-colors ${selectedId === t.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary border-l-2 border-l-transparent'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>🥇</span>
                      <span className="font-semibold text-foreground">{t.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={t.direction === 'Long' ? 'text-primary' : 'text-loss'}>{t.direction}</span>
                    <span className="text-muted-foreground">${Number(t.entry_price).toFixed(2)}</span>
                    <span className={`font-medium ${Number(t.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(t.close_time).toLocaleDateString()}</p>
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
                      {selectedTrade.direction} · Entry ${Number(selectedTrade.entry_price).toFixed(2)} · Exit ${Number(selectedTrade.exit_price).toFixed(2)} · Size {selectedTrade.lot_size}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${Number(selectedTrade.pnl) >= 0 ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'}`}>
                    {Number(selectedTrade.pnl) >= 0 ? 'WINNER' : 'LOSER'}
                  </span>
                  <span className={`text-lg font-bold ${Number(selectedTrade.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {Number(selectedTrade.pnl) >= 0 ? '+' : ''}${Number(selectedTrade.pnl).toFixed(2)}
                  </span>
                </div>
                <button onClick={handleSave} disabled={saveJournal.isPending}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saveJournal.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>

              {/* Pre-trade analysis */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider flex items-center gap-2 mb-2">
                  📋 PRE-TRADE ANALYSIS
                </label>
                <textarea value={journal.pre_trade_notes} onChange={e => setJournal(j => ({ ...j, pre_trade_notes: e.target.value }))}
                  placeholder="What did you see? Plan, thesis, levels, risk..."
                  className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y" />
              </div>

              {/* Post-trade review */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">⏱️ POST-TRADE REVIEW</label>
                <textarea value={journal.post_trade_notes} onChange={e => setJournal(j => ({ ...j, post_trade_notes: e.target.value }))}
                  placeholder="What happened? Execution, slippage, improvements..."
                  className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y" />
              </div>

              {/* Risk Reward */}
              <div className="bg-secondary rounded-lg p-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider">⚖️ RISK : REWARD</span>
                <div className="flex items-center gap-2">
                  <input value={journal.risk_reward.split(':')[0] || '1'} onChange={e => setJournal(j => ({ ...j, risk_reward: `${e.target.value}:${j.risk_reward.split(':')[1] || '2'}` }))}
                    className="w-12 bg-card text-foreground border border-border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                  <span className="text-muted-foreground font-bold">:</span>
                  <input value={journal.risk_reward.split(':')[1] || '2'} onChange={e => setJournal(j => ({ ...j, risk_reward: `${j.risk_reward.split(':')[0] || '1'}:${e.target.value}` }))}
                    className="w-12 bg-card text-foreground border border-border rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">😊 EMOTIONS</label>
                  <textarea value={journal.emotions} onChange={e => setJournal(j => ({ ...j, emotions: e.target.value }))}
                    placeholder="Calm, anxious, FOMO, confident..."
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">📖 LESSONS LEARNED</label>
                  <textarea value={journal.lessons} onChange={e => setJournal(j => ({ ...j, lessons: e.target.value }))}
                    placeholder="Key takeaways to repeat or avoid..."
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 block">🏷️ TAGS</label>
                  <input value={journal.tags} onChange={e => setJournal(j => ({ ...j, tags: e.target.value }))}
                    placeholder="breakout, trend, news (comma separated)"
                    className="w-full bg-secondary text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Star className="w-4 h-4" /> RATING</span>
                    <span className={`text-base font-bold ${journal.rating >= 7 ? 'text-profit' : journal.rating >= 4 ? 'text-warning' : 'text-loss'}`}>{journal.rating}/10</span>
                  </label>
                  <input type="range" min={1} max={10} value={journal.rating}
                    onChange={e => setJournal(j => ({ ...j, rating: parseInt(e.target.value) }))}
                    className="w-full accent-primary" />
                </div>
              </div>

              {/* Execution Checklist */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-3 flex items-center justify-between">
                  <span>✅ EXECUTION CHECKLIST</span>
                  <span className="text-primary">{checkCount}/5</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'checked_higher_tf', label: 'Checked higher timeframe' },
                    { key: 'risk_within_limits', label: 'Risk within limits' },
                    { key: 'fits_plan', label: 'Fits my trading plan' },
                    { key: 'key_levels', label: 'Key levels identified' },
                    { key: 'news_checked', label: 'Economic calendar checked' },
                  ].map(item => (
                    <button key={item.key} type="button"
                      onClick={() => setChecklist(c => ({ ...c, [item.key]: !c[item.key as keyof typeof c] }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-colors ${
                        checklist[item.key as keyof typeof checklist]
                          ? 'bg-primary/10 border-primary/50 text-foreground'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        checklist[item.key as keyof typeof checklist] ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {checklist[item.key as keyof typeof checklist] && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground tracking-wider mb-3 block">🖼️ SCREENSHOTS</label>
                <div className="flex flex-wrap gap-3">
                  {screenshots.map(s => (
                    <div key={s.id} className="w-32 h-24 rounded-lg overflow-hidden border border-border">
                      <img src={s.image_url} alt="Trade screenshot" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add Image</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Trade Summary */}
              <div className="bg-secondary rounded-xl p-4 flex items-center gap-6">
                <span className="text-2xl">🥇</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-foreground">{selectedTrade.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedTrade.direction === 'Long' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'}`}>{selectedTrade.direction}</span>
                  <div>
                    <span className="text-muted-foreground text-xs">ENTRY</span>
                    <p className="font-mono text-foreground">${Number(selectedTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">EXIT</span>
                    <p className="font-mono text-foreground">${Number(selectedTrade.exit_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">P&L</span>
                    <p className={`font-bold ${Number(selectedTrade.pnl) >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {Number(selectedTrade.pnl) >= 0 ? '+' : ''}${Number(selectedTrade.pnl).toFixed(2)}
                    </p>
                  </div>
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
