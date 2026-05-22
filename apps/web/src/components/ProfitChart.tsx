'use client';

import type { CycleRecord } from '@/lib/api';

interface ProfitChartProps {
  history: CycleRecord[];
  totalProfit: number;
}

export default function ProfitChart({ history, totalProfit }: ProfitChartProps) {
  const maxProfit = Math.max(...history.map((c) => c.net_profit || 0), 0.001);
  const recentCycles = history.slice(-10);

  return (
    <div className="card-metallic p-6">
      <h2 className="text-xl font-bold text-metallic-green-800 mb-4">Profit History</h2>

      {/* Total Profit */}
      <div className="text-center mb-6 p-4 bg-metallic-green-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Total Net Profit</div>
        <div className={`text-3xl font-bold ${
          totalProfit >= 0 ? 'text-metallic-green-600' : 'text-red-500'
        }`}>
          ${totalProfit.toFixed(4)}
        </div>
      </div>

      {/* Bar Chart */}
      {recentCycles.length > 0 ? (
        <div className="space-y-2">
          {recentCycles.map((cycle, index) => {
            const profit = cycle.net_profit || 0;
            const width = Math.max(5, Math.abs(profit / maxProfit) * 100);
            const isPositive = profit >= 0;

            return (
              <div key={cycle.id} className="flex items-center gap-2">
                <div className="w-8 text-xs text-gray-500 text-right">
                  #{cycle.cycle_number}
                </div>
                <div className="flex-1 h-6 bg-beige-100 rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      isPositive ? 'bg-metallic-green-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className={`w-20 text-xs text-right font-medium ${
                  isPositive ? 'text-metallic-green-600' : 'text-red-500'
                }`}>
                  ${profit.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <div className="text-sm">No cycles completed yet</div>
          <div className="text-xs mt-1">Start trading to see profit history</div>
        </div>
      )}

      {/* Fee Breakdown */}
      {history.length > 0 && history[history.length - 1].fees && (
        <div className="mt-4 pt-4 border-t border-beige-200">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Last Cycle Fees</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">TRN Withdrawal (Poloniex)</span>
              <span className="font-medium">
                {history[history.length - 1].fees?.poloniex_trn_withdrawal.toFixed(2) || '0'} TRN
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">USDT Withdrawal (MEXC)</span>
              <span className="font-medium">
                ${history[history.length - 1].fees?.mexc_usdt_withdrawal.toFixed(2) || '0'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-beige-100">
              <span className="text-gray-600 font-medium">Total Fees</span>
              <span className="font-semibold">
                ${history[history.length - 1].fees?.total_fees.toFixed(4) || '0'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
