const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export async function getHealth(): Promise<ApiResponse<string>> {
  return fetchApi('/api/health');
}

export async function getStatus(): Promise<ApiResponse<EngineStatus>> {
  return fetchApi('/api/status');
}

export async function startEngine(amount: number): Promise<ApiResponse<string>> {
  return fetchApi('/api/start', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function stopEngine(): Promise<ApiResponse<string>> {
  return fetchApi('/api/stop', { method: 'POST' });
}

export async function updateConfig(config: {
  spread_threshold?: number;
  transfer_amount?: number;
  cycle_duration_hours?: number;
}): Promise<ApiResponse<string>> {
  return fetchApi('/api/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function getHistory(): Promise<ApiResponse<{
  history: CycleRecord[];
  cycles_completed: number;
  total_profit: number;
}>> {
  return fetchApi('/api/history');
}

export async function getPrices(): Promise<ApiResponse<PriceSpread>> {
  return fetchApi('/api/prices');
}

export async function getFees(): Promise<ApiResponse<FeeBreakdown>> {
  return fetchApi('/api/fees');
}
