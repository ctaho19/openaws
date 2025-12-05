'use client';

interface OptionButtonProps {
  option: {
    id: string;
    text: string;
  };
  isSelected: boolean;
  isCorrect?: boolean;
  showFeedback: boolean;
  onClick: () => void;
  shortcut: string;
}

export function OptionButton({
  option,
  isSelected,
  isCorrect,
  showFeedback,
  onClick,
  shortcut,
}: OptionButtonProps) {
  const getStyles = () => {
    if (showFeedback) {
      if (isCorrect) {
        return {
          container: 'border-green-500 bg-green-50',
          badge: 'bg-green-500 text-white',
        };
      }
      if (isSelected) {
        return {
          container: 'border-red-500 bg-red-50',
          badge: 'bg-red-500 text-white',
        };
      }
      return {
        container: 'border-gray-200 bg-gray-50 opacity-60',
        badge: 'bg-gray-200 text-gray-600',
      };
    }

    if (isSelected) {
      return {
        container: 'border-[#0D7377] bg-teal-50',
        badge: 'bg-[#0D7377] text-white',
      };
    }

    return {
      container: 'border-gray-200 hover:border-[#0D7377]/50 hover:bg-gray-50',
      badge: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
    };
  };

  const styles = getStyles();

  return (
    <button
      onClick={onClick}
      disabled={showFeedback}
      className={`
        group w-full text-left px-4 py-3 rounded-lg border-2 
        transition-all duration-150 ease-out
        flex items-center gap-3 relative
        ${styles.container}
        ${!showFeedback ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
      `}
    >
      <span
        className={`
          w-7 h-7 rounded flex items-center justify-center text-sm font-medium shrink-0
          transition-colors duration-150
          ${styles.badge}
        `}
      >
        {showFeedback ? (
          isCorrect ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isSelected ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            shortcut
          )
        ) : (
          shortcut
        )}
      </span>

      <span className="text-gray-800 flex-1">{option.text}</span>

      {!showFeedback && (
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          Press {shortcut}
        </span>
      )}
    </button>
  );
}
