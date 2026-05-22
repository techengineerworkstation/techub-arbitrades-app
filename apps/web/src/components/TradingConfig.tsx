'use client';

import { useState } from 'react';
import { updateConfig } from '@/lib/api';
import { DEFAULT_CONFIG } from '@arbitrades/shared';

interface TradingConfigProps {
  isRunning: boolean;
  onConfigUpdate: () => void;
}

export default function TradingConfig({ isRunning, onConfigUpdate }: TradingConfigProps) {
  const [spreadThreshold, setSpreadThreshold] = useState(DEFAULT_CONFIG.spread_threshold?.toString() || '0.5');
  const [cycleDuration, setCycleDuration] = useState(DEFAULT_CONFIG.cycle_duration_hours?.toString() || '24');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateConfig({
      spread_threshold: parseFloat(spreadThreshold),
      cycle_duration_hours: parseInt(cycleDuration),
    });
    if (res.success) {
      onConfigUpdate();
    }
    setSaving(false);
  };

  return (
    <div className="card-metallic p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-metallic-green-800 mb-4">Configuration</h2>

      <div className="space-y-3 md:space-y-4">
        {/* Spread Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Spread Threshold (%)
          </label>
          <input
            type="number"
            value={spreadThreshold}
            onChange={(e) => setSpreadThreshold(e.target.value)}
            className="input-metallic"
            disabled={isRunning}
            min="0.1"
            step="0.1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Minimum spread to trigger arbitrage
          </p>
        </div>

        {/* Cycle Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Cycle Duration (hours)
          </label>
          <input
            type="number"
            value={cycleDuration}
            onChange={(e) => setCycleDuration(e.target.value)}
            className="input-metallic"
            disabled={isRunning}
            min="1"
            max="48"
          />
          <p className="text-xs text-gray-400 mt-1">
            Auto-stop after this duration
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isRunning || saving}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all
            ${isRunning
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-metallic-green-100 text-metallic-green-700 hover:bg-metallic-green-200'
            }`}
        >
          {saving ? 'Saving...' : 'Update Config'}
        </button>
      </div>

      {/* Network Info */}
      <div className="mt-4 md:mt-6 pt-4 border-t border-beige-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Network Routes</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-metallic-green-500 rounded-full flex-shrink-0" />
            <span className="text-gray-500">TRN Transfer:</span>
            <span className="font-medium">Arbitrum One</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-metallic-green-500 rounded-full flex-shrink-0" />
            <span className="text-gray-500">USDT Return:</span>
            <span className="font-medium">BSC BEP20</span>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-4 pt-4 border-t border-beige-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Deposit Addresses</h3>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-gray-500">Poloniex TRN:</span>
            <div className="font-mono text-gray-600 break-all">0x434c...0e96</div>
          </div>
          <div>
            <span className="text-gray-500">MEXC TRN:</span>
            <div className="font-mono text-gray-600 break-all">0x5a4c...7712</div>
          </div>
          <div>
            <span className="text-gray-500">Poloniex USDT:</span>
            <div className="font-mono text-gray-600 break-all">0x434c...0e96</div>
          </div>
        </div>
      </div>
    </div>
  );
}
