'use client';

import { useEffect, useState, useCallback } from 'react';

interface TimerProps {
  totalSeconds: number;
  onTimeUp?: () => void;
  paused?: boolean;
}

export function Timer({ totalSeconds, onTimeUp, paused = false }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const handleTimeUp = useCallback(() => {
    onTimeUp?.();
  }, [onTimeUp]);

  useEffect(() => {
    if (paused || secondsLeft <= 0) {
      if (secondsLeft <= 0) {
        handleTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, secondsLeft, handleTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft < 300 && secondsLeft > 0;
  const isCritical = secondsLeft < 60 && secondsLeft > 0;

  const formatTime = (m: number, s: number) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg
        transition-colors duration-200
        ${
          isCritical
            ? 'bg-red-100 text-red-700 animate-pulse'
            : isWarning
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-700'
        }
      `}
    >
      <svg
        className={`w-4 h-4 ${isWarning ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-semibold tabular-nums">
        {formatTime(minutes, seconds)}
      </span>
    </div>
  );
}
