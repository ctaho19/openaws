'use client';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  if (streak === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-full border border-gray-200">
        <span className="text-sm opacity-50">🔥</span>
        <span className="text-xs text-gray-400">No streak</span>
      </div>
    );
  }

  const isHot = streak >= 7;
  const isWarm = streak >= 3;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border
        transition-all duration-300
        ${isHot 
          ? 'bg-orange-50 border-orange-200 shadow-[0_0_8px_rgba(251,146,60,0.3)]' 
          : isWarm 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-gray-50 border-gray-200'
        }
      `}
    >
      <span 
        className={`
          text-sm transition-transform duration-300
          ${isHot ? 'animate-pulse' : ''}
        `}
      >
        🔥
      </span>
      <span 
        className={`
          text-xs font-medium
          ${isHot ? 'text-orange-600' : isWarm ? 'text-amber-600' : 'text-gray-600'}
        `}
      >
        {streak} {streak === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
}
