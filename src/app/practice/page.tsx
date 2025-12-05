'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { useQuestions } from '@/hooks/useQuestions';
import { useProgress } from '@/hooks/useProgress';
import type { Question, Domain } from '@/types';
import { formatTime, getAccuracyColor } from '@/lib/utils';

type SessionState = 'settings' | 'active' | 'complete';
type QuestionCount = 10 | 20 | 50;

const DOMAINS: (Domain | 'All')[] = [
  'All',
  'Cloud Concepts',
  'Security & Compliance',
  'Technology',
  'Billing & Pricing',
];

interface SessionResult {
  questionId: string;
  domain: Domain;
  isCorrect: boolean;
}

export default function PracticePage() {
  const { getRandomQuestions } = useQuestions();
  const { recordAnswer } = useProgress();

  const [sessionState, setSessionState] = useState<SessionState>('settings');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'All'>('All');
  const [onlyUnseen, setOnlyUnseen] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);

  const [questionTimer, setQuestionTimer] = useState(0);

  const currentQuestion = questions[currentIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionState === 'active' && !showAnswer) {
      interval = setInterval(() => {
        setQuestionTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, showAnswer]);

  const handleStart = useCallback(() => {
    const filters = {
      domain: selectedDomain === 'All' ? undefined : selectedDomain,
      unseen: onlyUnseen,
    };
    const selected = getRandomQuestions(questionCount, filters);
    
    if (selected.length === 0) {
      alert('No questions match your filters. Try adjusting your settings.');
      return;
    }

    setQuestions(selected);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setShowAnswer(false);
    setResults([]);
    setQuestionTimer(0);
    setSessionState('active');
  }, [questionCount, selectedDomain, onlyUnseen, getRandomQuestions]);

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (showAnswer) return;

      const isMultiSelect = currentQuestion.multiSelect;
      
      if (isMultiSelect) {
        setSelectedOptions((prev) =>
          prev.includes(optionId)
            ? prev.filter((id) => id !== optionId)
            : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    },
    [showAnswer, currentQuestion?.multiSelect]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOptions.length === 0) return;

    const correctIds = currentQuestion.correctOptionIds;
    const isCorrect =
      selectedOptions.length === correctIds.length &&
      selectedOptions.every((id) => correctIds.includes(id));

    recordAnswer(currentQuestion.id, isCorrect, currentQuestion.domain);

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        domain: currentQuestion.domain,
        isCorrect,
      },
    ]);
    setShowAnswer(true);
  }, [selectedOptions, currentQuestion, recordAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOptions([]);
      setShowAnswer(false);
      setQuestionTimer(0);
    } else {
      setSessionState('complete');
    }
  }, [currentIndex, questions.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionState !== 'active' || !currentQuestion) return;

      const key = e.key.toLowerCase();

      if (['1', '2', '3', '4', '5'].includes(key)) {
        const index = parseInt(key) - 1;
        if (index < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[index].id);
        }
      }

      if (['a', 'b', 'c', 'd', 'e'].includes(key)) {
        const index = key.charCodeAt(0) - 97;
        if (index < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[index].id);
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (showAnswer) {
          handleNext();
        } else if (selectedOptions.length > 0) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    sessionState,
    currentQuestion,
    showAnswer,
    selectedOptions,
    handleOptionSelect,
    handleSubmit,
    handleNext,
  ]);

  const domainBreakdown = useMemo(() => {
    const breakdown: Record<Domain, { total: number; correct: number }> = {
      'Cloud Concepts': { total: 0, correct: 0 },
      'Security & Compliance': { total: 0, correct: 0 },
      'Technology': { total: 0, correct: 0 },
      'Billing & Pricing': { total: 0, correct: 0 },
    };

    for (const result of results) {
      breakdown[result.domain].total++;
      if (result.isCorrect) {
        breakdown[result.domain].correct++;
      }
    }

    return breakdown;
  }, [results]);

  if (sessionState === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Mode</h1>
          <p className="text-gray-600 mb-8">
            Targeted question drills with immediate feedback
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Questions
              </label>
              <div className="flex gap-3">
                {([10, 20, 50] as QuestionCount[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition-all
                      ${
                        questionCount === count
                          ? 'bg-[#0D7377] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Domain Filter
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as Domain | 'All')}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              >
                {DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Only unseen questions</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Skip questions you&apos;ve already answered
                </p>
              </div>
              <button
                onClick={() => setOnlyUnseen(!onlyUnseen)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${onlyUnseen ? 'bg-[#0D7377]' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${onlyUnseen ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-[#0D7377] text-white font-semibold rounded-lg hover:bg-[#0a5c5f] transition-colors"
            >
              Start Practice
            </button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Keyboard shortcuts:</span> Use 1-5 or A-E to select options, Enter to submit/continue
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'complete') {
    const percentage = Math.round((correctCount / results.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#0D7377] to-[#14919B] flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h1>
            <p className="text-gray-600 mb-8">
              You answered {results.length} questions
            </p>

            <div className="flex items-center justify-center gap-8 mb-8">
              <div>
                <div className={`text-5xl font-bold ${getAccuracyColor(percentage)}`}>
                  {percentage}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Accuracy</div>
              </div>
              <div className="h-16 w-px bg-gray-200" />
              <div>
                <div className="text-5xl font-bold text-gray-900">
                  {correctCount}/{results.length}
                </div>
                <div className="text-sm text-gray-500 mt-1">Correct</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Domain Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(domainBreakdown)
                  .filter(([, stats]) => stats.total > 0)
                  .map(([domain, stats]) => {
                    const domainPct = Math.round((stats.correct / stats.total) * 100);
                    return (
                      <div key={domain} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{domain}</span>
                        <span className={getAccuracyColor(domainPct)}>
                          {stats.correct}/{stats.total} ({domainPct}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => setSessionState('settings')}
                className="flex-1 py-3 px-4 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5c5f] transition-colors"
              >
                Start Another Round
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const adaptedQuestion = currentQuestion
    ? {
        id: parseInt(currentQuestion.id) || 0,
        prompt: currentQuestion.prompt,
        options: currentQuestion.options,
        correctAnswers: currentQuestion.correctOptionIds,
        explanation: '',
        domain: currentQuestion.domain,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="h-4 w-px bg-gray-200" />
            <span className={`text-sm font-medium ${getAccuracyColor(results.length > 0 ? (correctCount / results.length) * 100 : 100)}`}>
              {correctCount}/{results.length} correct
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-mono">
              {formatTime(questionTimer)}
            </span>
            <button
              onClick={() => setSessionState('settings')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              End Session
            </button>
          </div>
        </div>

        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[#0D7377] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {adaptedQuestion && (
          <QuestionCard
            question={adaptedQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOptions={selectedOptions}
            onSelect={handleOptionSelect}
            showAnswer={showAnswer}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Press 1-5 or A-E to select • Enter to {showAnswer ? 'continue' : 'submit'}
              </span>
              {showAnswer ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5c5f] transition-colors"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOptions.length === 0}
                  className={`
                    px-6 py-2 font-medium rounded-lg transition-colors
                    ${
                      selectedOptions.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#0D7377] text-white hover:bg-[#0a5c5f]'
                    }
                  `}
                >
                  Submit
                </button>
              )}
            </div>
          </QuestionCard>
        )}
      </div>
    </div>
  );
}
