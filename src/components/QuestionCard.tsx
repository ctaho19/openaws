'use client';

import { ReactNode } from 'react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  prompt: string;
  options: Option[];
  correctAnswers: string[];
  explanation: string;
  domain: string;
}

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
  selectedOptions: string[];
  onSelect: (optionId: string) => void;
  showAnswer: boolean;
  isExamMode?: boolean;
  children?: ReactNode;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptions,
  onSelect,
  showAnswer,
  isExamMode = false,
  children,
}: QuestionCardProps) {
  const isMultiSelect = question.correctAnswers.length > 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {questionNumber !== undefined && totalQuestions !== undefined
            ? `Q.${questionNumber} of ${totalQuestions}`
            : `Question ${question.id}`}
        </span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          {question.domain}
        </span>
      </div>

      <div className="p-6">
        <p className="text-lg text-gray-900 leading-relaxed mb-6">
          {question.prompt}
        </p>

        {isMultiSelect && (
          <p className="text-sm text-amber-600 font-medium mb-4">
            (Choose {question.correctAnswers.length})
          </p>
        )}

        <div className="space-y-3 group">
          {question.options.map((option, index) => {
            const isSelected = selectedOptions.includes(option.id);
            const isCorrect = question.correctAnswers.includes(option.id);
            const shortcut = String.fromCharCode(65 + index);

            return (
              <button
                key={option.id}
                onClick={() => onSelect(option.id)}
                disabled={showAnswer && isExamMode}
                className={`
                  w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150
                  flex items-center gap-3 relative
                  ${
                    showAnswer
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isSelected
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-[#0D7377] bg-teal-50'
                      : 'border-gray-200 hover:border-[#0D7377]/50 hover:bg-gray-50'
                  }
                  ${!showAnswer && !isExamMode ? 'cursor-pointer' : ''}
                `}
              >
                <span
                  className={`
                    w-7 h-7 rounded flex items-center justify-center text-sm font-medium shrink-0
                    ${
                      showAnswer
                        ? isCorrect
                          ? 'bg-green-500 text-white'
                          : isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                        : isSelected
                        ? 'bg-[#0D7377] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  {showAnswer ? (
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
                <span className="text-gray-800">{option.text}</span>
                <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Press {shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {showAnswer && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Explanation</p>
            <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </div>

      {children && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}
