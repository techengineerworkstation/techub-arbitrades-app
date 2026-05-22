'use client';

import type { CycleRecord } from '@/lib/api';

interface CycleTimelineProps {
  currentPhase: string;
  currentCycle: CycleRecord | null;
}

const PHASES = [
  { id: 'monitoring', label: 'Monitor', icon: '?' },
  { id: 'buy_trn', label: 'Buy TRN', icon: 'B' },
  { id: 'buy_confirmed', label: 'Confirm', icon: 'C' },
  { id: 'transfer_trn', label: 'Transfer', icon: 'T' },
  { id: 'trn_deposited', label: 'Deposit', icon: 'D' },
  { id: 'sell_trn', label: 'Sell TRN', icon: 'S' },
  { id: 'sell_confirmed', label: 'Confirm', icon: 'C' },
  { id: 'transfer_usdt', label: 'Return', icon: 'R' },
  { id: 'cycle_complete', label: 'Complete', icon: '!' },
];

function getPhaseIndex(phase: string): number {
  const normalized = phase.toLowerCase().replace(/_/g, '_');
  return PHASES.findIndex((p) => p.id === normalized);
}

export default function CycleTimeline({ currentPhase, currentCycle }: CycleTimelineProps) {
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className="card-metallic p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-metallic-green-800">Cycle Progress</h2>
        {currentCycle && (
          <span className="text-sm text-gray-500">
            Cycle #{currentCycle.cycle_number}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-beige-200 rounded">
          <div
            className="h-full bg-metallic-green-500 rounded transition-all duration-500"
            style={{ width: `${Math.max(0, (currentIndex / (PHASES.length - 1)) * 100)}%` }}
          />
        </div>

        {/* Phase Nodes */}
        <div className="flex justify-between relative z-10">
          {PHASES.map((phase, index) => {
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
            const isInactive = index > currentIndex;

            return (
              <div key={phase.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                    ${isActive
                      ? 'bg-metallic-green-500 text-white animate-pulse-green'
                      : isComplete
                        ? 'bg-metallic-green-300 text-white'
                        : 'bg-beige-200 text-gray-400'
                    }`}
                >
                  {phase.icon}
                </div>
                <span
                  className={`mt-2 text-xs text-center ${
                    isActive
                      ? 'text-metallic-green-700 font-semibold'
                      : isComplete
                        ? 'text-metallic-green-500'
                        : 'text-gray-400'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Description */}
      <div className="mt-6 p-3 bg-beige-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-metallic-green-700">Current: </span>
          {getPhaseDescription(currentPhase)}
        </div>
      </div>
    </div>
  );
}

function getPhaseDescription(phase: string): string {
  const descriptions: Record<string, string> = {
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
  return descriptions[phase.toLowerCase().replace(/ /g, '_')] || 'Processing...';
}
