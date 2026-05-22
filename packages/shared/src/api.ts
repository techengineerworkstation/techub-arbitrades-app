import type {
  ApiResponse,
  EngineStatus,
  PriceSpread,
  CycleRecord,
  Balances,
  FeeBreakdown,
  EngineConfig,
  HistoryResponse,
} from './types';

export function createApiClient(baseUrl: string) {
  async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return res.json();
  }

  return {
    getHealth(): Promise<ApiResponse<string>> {
      return fetchApi('/api/health');
    },

    getStatus(): Promise<ApiResponse<EngineStatus>> {
      return fetchApi('/api/status');
    },

    startEngine(amount: number): Promise<ApiResponse<string>> {
      return fetchApi('/api/start', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },

    stopEngine(): Promise<ApiResponse<string>> {
      return fetchApi('/api/stop', { method: 'POST' });
    },

    updateConfig(config: EngineConfig): Promise<ApiResponse<string>> {
      return fetchApi('/api/config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },

    getHistory(): Promise<ApiResponse<HistoryResponse>> {
      return fetchApi('/api/history');
    },

    getPrices(): Promise<ApiResponse<PriceSpread>> {
      return fetchApi('/api/prices');
    },

    getFees(): Promise<ApiResponse<FeeBreakdown>> {
      return fetchApi('/api/fees');
    },
  };
}

export type ArbitradesClient = ReturnType<typeof createApiClient>;
