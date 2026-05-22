'use client';

import type { CycleRecord } from '@/lib/api';
import { PHASES, PHASE_DESCRIPTIONS } from '@arbitrades/shared';

interface CycleTimelineProps {
  currentPhase: string;
  currentCycle: CycleRecord | null;
}

function getPhaseIndex(phase: string): number {
  const normalized = phase.toLowerCase().replace(/ /g, '_');
  return PHASES.findIndex((p) => p.id === normalized);
}

export default function CycleTimeline({ currentPhase, currentCycle }: CycleTimelineProps) {
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className="card-metallic p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-metallic-green-800">Cycle Progress</h2>
        {currentCycle && (
          <span className="text-xs md:text-sm text-gray-500">
            Cycle #{currentCycle.cycle_number}
          </span>
        )}
      </div>

      {/* Desktop Timeline (hidden on small screens) */}
      <div className="hidden md:block relative">
        <div className="absolute top-6 left-6 right-6 h-1 bg-beige-200 rounded">
          <div
            className="h-full bg-metallic-green-500 rounded transition-all duration-500"
            style={{ width: `${Math.max(0, (currentIndex / (PHASES.length - 1)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between relative z-10">
          {PHASES.map((phase, index) => {
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
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

      {/* Mobile Timeline (vertical, shown on small screens) */}
      <div className="md:hidden space-y-2">
        {PHASES.map((phase, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          const isInactive = index > currentIndex;
          return (
            <div
              key={phase.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-metallic-green-50 border border-metallic-green-200'
                  : isComplete
                    ? 'bg-beige-50 opacity-70'
                    : 'opacity-40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
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
                className={`text-sm ${
                  isActive
                    ? 'text-metallic-green-700 font-semibold'
                    : isComplete
                      ? 'text-metallic-green-500'
                      : 'text-gray-400'
                }`}
              >
                {phase.label}
              </span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-metallic-green-500 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase Description */}
      <div className="mt-4 p-3 bg-beige-50 rounded-lg">
        <div className="text-xs md:text-sm text-gray-600">
          <span className="font-semibold text-metallic-green-700">Current: </span>
          {PHASE_DESCRIPTIONS[currentPhase.toLowerCase().replace(/ /g, '_')] || 'Processing...'}
        </div>
      </div>
    </div>
  );
}
