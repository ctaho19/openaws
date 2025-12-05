'use client';

import { useState } from 'react';
import { BADGES, type BadgeId } from '@/types/badges';

interface BadgeDisplayProps {
  badges: string[];
  maxVisible?: number;
}

export function BadgeDisplay({ badges, maxVisible = 5 }: BadgeDisplayProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  if (badges.length === 0) {
    return null;
  }

  const visibleBadges = badges.slice(0, maxVisible);
  const overflowCount = badges.length - maxVisible;

  const activeBadge = selectedBadge || hoveredBadge;
  const activeBadgeData = activeBadge ? BADGES[activeBadge as BadgeId] : null;

  return (
    <div className="relative inline-flex items-center gap-1">
      {visibleBadges.map((badgeId) => {
        const badge = BADGES[badgeId as BadgeId];
        if (!badge) return null;

        return (
          <button
            key={badgeId}
            className={`
              w-7 h-7 flex items-center justify-center rounded-full
              bg-gray-50 border border-gray-200
              hover:bg-gray-100 hover:scale-110
              transition-all duration-150 cursor-pointer
              ${activeBadge === badgeId ? 'ring-2 ring-teal-500 ring-offset-1' : ''}
            `}
            onMouseEnter={() => setHoveredBadge(badgeId)}
            onMouseLeave={() => setHoveredBadge(null)}
            onClick={() => setSelectedBadge(selectedBadge === badgeId ? null : badgeId)}
            aria-label={badge.name}
          >
            <span className="text-sm">{badge.icon}</span>
          </button>
        );
      })}
      
      {overflowCount > 0 && (
        <span className="text-xs text-gray-400 ml-0.5">+{overflowCount}</span>
      )}

      {activeBadgeData && (
        <div
          className="absolute top-full left-0 mt-2 z-10 
            px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200
            min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeBadgeData.icon}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{activeBadgeData.name}</p>
              <p className="text-xs text-gray-500">{activeBadgeData.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
