'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days);
    };

    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (daysLeft === null) {
    return null;
  }

  const isUrgent = daysLeft <= 3;
  const isPast = daysLeft <= 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border
        ${
          isPast
            ? 'bg-red-50 border-red-200'
            : isUrgent
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-gray-200'
        }
      `}
    >
      <div
        className={`
          text-2xl font-bold
          ${isPast ? 'text-red-600' : isUrgent ? 'text-amber-600 animate-pulse' : 'text-gray-900'}
        `}
      >
        {isPast ? 'Exam day!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
      </div>
      <div className="text-sm text-gray-500">
        {isPast ? 'Good luck!' : `Until ${formatDate(targetDate)}`}
      </div>
    </div>
  );
}
