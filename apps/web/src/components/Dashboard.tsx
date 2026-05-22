'use client';

import { useState } from 'react';
import type { EngineStatus } from '@/lib/api';

interface DashboardProps {
  status: EngineStatus | null;
  onStart: (amount: number) => void;
  onStop: () => void;
}

export default function Dashboard({ status, onStart, onStop }: DashboardProps) {
  const [amount, setAmount] = useState('15');

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="card-metallic p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-metallic-green-800">Trading Control</h2>
        <div className="flex items-center gap-2">
          {status?.is_running && (
            <div className="w-3 h-3 bg-metallic-green-500 rounded-full animate-pulse-green" />
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-beige-100 rounded-lg">
          <div className="stat-value">{status?.cycles_completed || 0}</div>
          <div className="stat-label">Cycles</div>
        </div>
        <div className="text-center p-3 bg-beige-100 rounded-lg">
          <div className="stat-value text-metallic-green-600">
            ${(status?.total_profit || 0).toFixed(4)}
          </div>
          <div className="stat-label">Total Profit</div>
        </div>
        <div className="text-center p-3 bg-beige-100 rounded-lg">
          <div className="stat-value text-sm">
            {status?.is_running ? formatUptime(status.uptime_seconds) : '--'}
          </div>
          <div className="stat-label">Uptime</div>
        </div>
        <div className="text-center p-3 bg-beige-100 rounded-lg">
          <div className="stat-value text-sm">
            {status?.is_running ? formatTime(status.remaining_seconds) : '24h 0m'}
          </div>
          <div className="stat-label">Remaining</div>
        </div>
      </div>

      {/* Trading Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Trading Amount (USDT)
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter USDT amount"
            className="input-metallic flex-1"
            disabled={status?.is_running}
            min="1"
            step="0.01"
          />
          <div className="flex gap-2">
            {[10, 15, 25, 50].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                disabled={status?.is_running}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${amount === val.toString()
                    ? 'bg-metallic-green-500 text-white'
                    : 'bg-beige-200 text-gray-600 hover:bg-beige-300'
                  } ${status?.is_running ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!status?.is_running ? (
          <button
            onClick={() => onStart(parseFloat(amount) || 15)}
            className="btn-metallic flex-1 text-lg"
          >
            Start Arbitrage
          </button>
        ) : (
          <button
            onClick={onStop}
            className="btn-metallic-danger flex-1 text-lg"
          >
            Stop Engine
          </button>
        )}
      </div>

      {/* Current Cycle Info */}
      {status?.current_cycle && (
        <div className="mt-6 p-4 bg-metallic-green-50 rounded-lg border border-metallic-green-100">
          <h3 className="text-sm font-semibold text-metallic-green-700 mb-2">
            Current Cycle #{status.current_cycle.cycle_number}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Amount:</span>{' '}
              <span className="font-medium">${status.current_cycle.start_amount_usdt}</span>
            </div>
            <div>
              <span className="text-gray-500">Phase:</span>{' '}
              <span className="font-medium capitalize">{status.current_cycle.phase.replace(/_/g, ' ')}</span>
            </div>
            {status.current_cycle.buy_price && (
              <div>
                <span className="text-gray-500">Buy Price:</span>{' '}
                <span className="font-medium">${status.current_cycle.buy_price.toFixed(6)}</span>
              </div>
            )}
            {status.current_cycle.trn_quantity && (
              <div>
                <span className="text-gray-500">TRN Qty:</span>{' '}
                <span className="font-medium">{status.current_cycle.trn_quantity.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
