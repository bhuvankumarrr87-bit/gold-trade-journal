export interface Trade {
  id: string;
  symbol: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  openDate: string;
  closeDate: string;
  pnl: number;
  journal?: JournalEntry;
}

export interface JournalEntry {
  preTradeAnalysis: string;
  postTradeReview: string;
  emotions: string;
  lessonsLearned: string;
  rating: number;
  tags: string;
}

const STORAGE_KEY = 'gold-journal-trades';

export function calculatePnl(direction: 'Long' | 'Short', entryPrice: number, exitPrice: number, lotSize: number): number {
  const pipValue = 100; // For XAUUSD, 1 lot = $100 per $1 move
  const priceDiff = direction === 'Long' ? exitPrice - entryPrice : entryPrice - exitPrice;
  return parseFloat((priceDiff * lotSize * pipValue).toFixed(2));
}

export function getTrades(): Trade[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTrades(trades: Trade[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function addTrade(trade: Omit<Trade, 'id' | 'pnl'>): Trade {
  const trades = getTrades();
  const pnl = calculatePnl(trade.direction, trade.entryPrice, trade.exitPrice, trade.lotSize);
  const newTrade: Trade = {
    ...trade,
    id: crypto.randomUUID(),
    pnl,
  };
  trades.unshift(newTrade);
  saveTrades(trades);
  return newTrade;
}

export function updateTradeJournal(tradeId: string, journal: JournalEntry): void {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === tradeId);
  if (idx !== -1) {
    trades[idx].journal = journal;
    saveTrades(trades);
  }
}

export function deleteTrade(tradeId: string): void {
  const trades = getTrades().filter(t => t.id !== tradeId);
  saveTrades(trades);
}

export function getTradesByDateRange(trades: Trade[], startDate: Date, endDate: Date): Trade[] {
  return trades.filter(t => {
    const d = new Date(t.closeDate);
    return d >= startDate && d <= endDate;
  });
}

export function getDailyPnl(trades: Trade[]): Record<string, number> {
  const daily: Record<string, number> = {};
  trades.forEach(t => {
    const day = t.closeDate.split('T')[0];
    daily[day] = (daily[day] || 0) + t.pnl;
  });
  return daily;
}
