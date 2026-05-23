export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface EngineStatus {
  is_running: boolean;
  mode: string;
  current_phase: string;
  cycles_completed: number;
  total_profit: number;
  uptime_seconds: number;
  remaining_seconds: number;
  start_time: number | null;
  prices: PriceSpread | null;
  current_cycle: CycleRecord | null;
  history: CycleRecord[];
  balances: Balances | null;
  fees: FeeBreakdown | null;
}

export interface PriceSpread {
  poloniex_price: number;
  mexc_price: number;
  spread: number;
  spread_percent: number;
}

export interface CycleRecord {
  id: string;
  cycle_number: number;
  start_amount_usdt: number;
  phase: string;
  buy_price: number | null;
  sell_price: number | null;
  trn_quantity: number | null;
  gross_profit: number | null;
  fees: FeeBreakdown | null;
  net_profit: number | null;
  started_at: number;
  completed_at: number | null;
  status: string;
}

export interface Balances {
  poloniex_usdt: number;
  poloniex_trn: number;
  mexc_usdt: number;
  mexc_trn: number;
}

export interface FeeBreakdown {
  poloniex_trn_withdrawal: number;
  mexc_usdt_withdrawal: number;
  total_fees: number;
  estimated_net_profit: number;
}

export interface EngineConfig {
  spread_threshold?: number;
  transfer_amount?: number;
  cycle_duration_hours?: number;
}

export interface HistoryResponse {
  history: CycleRecord[];
  cycles_completed: number;
  total_profit: number;
}

export const PHASES = [
  { id: 'monitoring', label: 'Monitor', icon: '?' },
  { id: 'buy_trn', label: 'Buy TRN', icon: 'B' },
  { id: 'buy_confirmed', label: 'Confirm', icon: 'C' },
  { id: 'transfer_trn', label: 'Transfer', icon: 'T' },
  { id: 'trn_deposited', label: 'Deposit', icon: 'D' },
  { id: 'sell_trn', label: 'Sell TRN', icon: 'S' },
  { id: 'sell_confirmed', label: 'Confirm', icon: 'C' },
  { id: 'transfer_usdt', label: 'Return', icon: 'R' },
  { id: 'cycle_complete', label: 'Complete', icon: '!' },
] as const;

export const PHASE_DESCRIPTIONS: Record<string, string> = {
  idle: 'Engine is idle. Set trading amount and start.',
  monitoring: 'Scanning TRN/USDT prices on Poloniex and MEXC for spread opportunities.',
  buy_trn: 'Executing market buy order for TRN on Poloniex using USDT.',
  buy_confirmed: 'Buy order confirmed. Preparing TRN withdrawal.',
  transfer_trn: 'Transferring TRN from Poloniex to MEXC via Arbitrum One network.',
  trn_deposited: 'TRN deposit confirmed on MEXC. Preparing to sell.',
  sell_trn: 'Executing market sell order for TRN on MEXC for USDT.',
  sell_confirmed: 'Sell order confirmed. Preparing USDT transfer.',
  transfer_usdt: 'Transferring principal USDT back to Poloniex via BSC BEP20. Profit stays on MEXC.',
  cycle_complete: 'Cycle complete! Profit retained on MEXC. Starting next cycle.',
};

export const AMOUNT_PRESETS = [10, 15, 25, 50] as const;

export const DEFAULT_CONFIG: EngineConfig = {
  spread_threshold: 0.5,
  cycle_duration_hours: 24,
};
