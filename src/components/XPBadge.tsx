'use client';

interface XPBadgeProps {
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
}

export function XPBadge({ level, xpInCurrentLevel, xpForNextLevel }: XPBadgeProps) {
  const progress = (xpInCurrentLevel / xpForNextLevel) * 100;
  const radius = 14;
  const strokeWidth = 3;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-full border border-gray-200">
      <div className="relative w-8 h-8">
        <svg width="32" height="32" className="transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            stroke="#0D7377"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{level}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-600">Level {level}</span>
        <span className="text-[10px] text-gray-400">
          {xpInCurrentLevel}/{xpForNextLevel} XP
        </span>
      </div>
    </div>
  );
}
