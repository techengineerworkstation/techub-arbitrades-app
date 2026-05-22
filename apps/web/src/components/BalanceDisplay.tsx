'use client';

import type { Balances } from '@/lib/api';

interface BalanceDisplayProps {
  balances: Balances | null;
}

export default function BalanceDisplay({ balances }: BalanceDisplayProps) {
  return (
    <div className="card-metallic p-6">
      <h2 className="text-xl font-bold text-metallic-green-800 mb-4">Balances</h2>

      <div className="space-y-4">
        {/* Poloniex */}
        <div className="p-4 bg-beige-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-metallic-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-700 text-sm">Poloniex</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-lg font-bold text-metallic-green-700">
                ${balances?.poloniex_usdt.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-gray-500">USDT</div>
            </div>
            <div>
              <div className="text-lg font-bold text-metallic-green-700">
                {balances?.poloniex_trn.toFixed(4) || '0.0000'}
              </div>
              <div className="text-xs text-gray-500">TRN</div>
            </div>
          </div>
        </div>

        {/* MEXC */}
        <div className="p-4 bg-beige-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-metallic-green-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-700 text-sm">MEXC</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-lg font-bold text-metallic-green-700">
                ${balances?.mexc_usdt.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-gray-500">USDT</div>
            </div>
            <div>
              <div className="text-lg font-bold text-metallic-green-700">
                {balances?.mexc_trn.toFixed(4) || '0.0000'}
              </div>
              <div className="text-xs text-gray-500">TRN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Indicator */}
      {balances && balances.mexc_usdt > 0 && (
        <div className="mt-4 p-3 bg-metallic-green-50 rounded-lg border border-metallic-green-100">
          <div className="text-xs text-gray-500 mb-1">Profit Retained (MEXC)</div>
          <div className="text-lg font-bold text-metallic-green-600">
            ${(balances.mexc_usdt - (balances.poloniex_usdt || 0)).toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}
