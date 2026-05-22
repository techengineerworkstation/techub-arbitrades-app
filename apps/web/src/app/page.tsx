'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStatus, startEngine, stopEngine, type EngineStatus } from '@/lib/api';
import Dashboard from '@/components/Dashboard';
import TradingConfig from '@/components/TradingConfig';
import CycleTimeline from '@/components/CycleTimeline';
import PriceMonitor from '@/components/PriceMonitor';
import BalanceDisplay from '@/components/BalanceDisplay';
import ProfitChart from '@/components/ProfitChart';

export default function Home() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getStatus();
      if (res.success && res.data) {
        setStatus(res.data);
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError('Failed to connect to engine');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async (amount: number) => {
    const res = await startEngine(amount);
    if (!res.success) setError(res.error || 'Failed to start');
  };

  const handleStop = async () => {
    const res = await stopEngine();
    if (!res.success) setError(res.error || 'Failed to stop');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-metallic-green-200 border-t-metallic-green-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-metallic-green-600 font-semibold">Loading Techub Arbitrades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-metallic-green-800">
              Techub Arbitrades
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              TRN/USDT Arbitrage &middot; Poloniex &harr; MEXC
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`status-badge ${status?.is_running ? 'status-running' : 'status-idle'}`}>
              {status?.is_running ? 'RUNNING' : 'IDLE'}
            </span>
            <span className="text-xs text-gray-400">
              {status?.mode?.toUpperCase() || 'PAPER'} MODE
            </span>
          </div>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Dashboard status={status} onStart={handleStart} onStop={handleStop} />
          <PriceMonitor prices={status?.prices ?? null} />
          <CycleTimeline
            currentPhase={status?.current_phase || 'idle'}
            currentCycle={status?.current_cycle ?? null}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TradingConfig
            isRunning={status?.is_running || false}
            onConfigUpdate={fetchStatus}
          />
          <BalanceDisplay balances={status?.balances ?? null} />
          <ProfitChart
            history={status?.history || []}
            totalProfit={status?.total_profit || 0}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400">
        Techub Arbitrades App &middot; TRN Contract: 0x1114982539A2Bfb84e8b9e4e320bbC04532a9e44
      </footer>
    </div>
  );
}
