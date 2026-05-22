import { createApiClient } from '@arbitrades/shared';
import type {
  ApiResponse,
  EngineStatus,
  PriceSpread,
  CycleRecord,
  Balances,
  FeeBreakdown,
  EngineConfig,
  HistoryResponse,
} from '@arbitrades/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.arbitrades.sbs';

const client = createApiClient(API_BASE);

export const getHealth = client.getHealth;
export const getStatus = client.getStatus;
export const startEngine = client.startEngine;
export const stopEngine = client.stopEngine;
export const updateConfig = client.updateConfig;
export const getHistory = client.getHistory;
export const getPrices = client.getPrices;
export const getFees = client.getFees;

export type {
  ApiResponse,
  EngineStatus,
  PriceSpread,
  CycleRecord,
  Balances,
  FeeBreakdown,
  EngineConfig,
  HistoryResponse,
};
