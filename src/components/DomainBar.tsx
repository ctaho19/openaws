'use client';

interface DomainBarProps {
  domain: string;
  accuracy: number;
  questionCount: number;
  answeredCount?: number;
}

export function DomainBar({
  domain,
  accuracy,
  questionCount,
  answeredCount,
}: DomainBarProps) {
  const getColorClasses = () => {
    if (accuracy < 60) {
      return {
        bar: 'bg-red-500',
        text: 'text-red-600',
      };
    }
    if (accuracy < 75) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600',
      };
    }
    return {
      bar: 'bg-green-600',
      text: 'text-green-600',
    };
  };

  const colors = getColorClasses();
  const displayCount = answeredCount !== undefined ? answeredCount : questionCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{domain}</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${colors.text}`}>
            {Math.round(accuracy)}%
          </span>
          <span className="text-gray-400 text-xs">
            ({displayCount}/{questionCount})
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, accuracy))}%` }}
        />
      </div>
    </div>
  );
}
