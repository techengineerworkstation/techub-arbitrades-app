'use client';

import type { PriceSpread } from '@/lib/api';

interface PriceMonitorProps {
  prices: PriceSpread | null;
}

export default function PriceMonitor({ prices }: PriceMonitorProps) {
  return (
    <div className="card-metallic p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-metallic-green-800 mb-4">Price Monitor</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Poloniex Price */}
        <div className="p-3 md:p-4 bg-beige-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-metallic-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-700 text-sm">Poloniex</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-metallic-green-700">
            ${prices?.poloniex_price.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-gray-500 mt-1">TRN/USDT</div>
        </div>

        {/* Spread */}
        <div className="p-3 md:p-4 bg-metallic-green-50 rounded-lg border border-metallic-green-100">
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-500 mb-1">Spread</div>
            <div className={`text-2xl md:text-3xl font-bold ${
              (prices?.spread_percent || 0) >= 0 ? 'text-metallic-green-600' : 'text-red-500'
            }`}>
              {prices?.spread_percent.toFixed(2) || '0.00'}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ${prices?.spread.toFixed(6) || '0.000000'}
            </div>
          </div>
        </div>

        {/* MEXC Price */}
        <div className="p-3 md:p-4 bg-beige-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-metallic-green-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-700 text-sm">MEXC</span>
          </div>
          <div className="text-xl md:text-2xl font-bold text-metallic-green-700">
            ${prices?.mexc_price.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-gray-500 mt-1">TRN/USDT</div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="mt-3 md:mt-4 p-3 bg-beige-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-metallic-green-100 text-metallic-green-700 rounded font-medium">
            Buy TRN
          </span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-beige-200 rounded">Arbitrum One</span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-metallic-green-100 text-metallic-green-700 rounded font-medium">
            Sell TRN
          </span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-beige-200 rounded">BSC BEP20</span>
          <span>&rarr;</span>
          <span className="px-2 py-1 bg-metallic-green-100 text-metallic-green-700 rounded font-medium">
            Repeat
          </span>
        </div>
      </div>
    </div>
  );
}
