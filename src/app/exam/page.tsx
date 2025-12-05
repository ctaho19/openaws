'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Timer } from '@/components/Timer';
import { QuestionCard } from '@/components/QuestionCard';
import { DomainBar } from '@/components/DomainBar';
import { useQuestions } from '@/hooks/useQuestions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Question, Domain, ExamAttempt } from '@/types';
import { shuffleArray } from '@/lib/utils';

type ExamType = 'full' | 'mini';
type ExamPhase = 'setup' | 'exam' | 'results' | 'review';
type ReviewFilter = 'all' | 'incorrect' | 'flagged';

interface ExamConfig {
  type: ExamType;
  questionCount: number;
  timeSeconds: number;
}

const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  full: { type: 'full', questionCount: 65, timeSeconds: 90 * 60 },
  mini: { type: 'mini', questionCount: 20, timeSeconds: 25 * 60 },
};

const PASSING_SCORE = 70;

export default function ExamPage() {
  const { questions: allQuestions } = useQuestions();
  const [examAttempts, setExamAttempts] = useLocalStorage<ExamAttempt[]>('exam-attempts', []);

  const [phase, setPhase] = useState<ExamPhase>('setup');
  const [examType, setExamType] = useState<ExamType>('full');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timerPaused, setTimerPaused] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examStartTime, setExamStartTime] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

  const config = EXAM_CONFIGS[examType];
  const currentQuestion = examQuestions[currentIndex];

  const handleVisibilityChange = useCallback(() => {
    if (phase === 'exam') {
      setTimerPaused(document.hidden);
    }
  }, [phase]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const startExam = useCallback(() => {
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, config.questionCount);
    setExamQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setFlagged(new Set());
    setExamStartTime(new Date().toISOString());
    setPhase('exam');
  }, [allQuestions, config.questionCount]);

  const handleSelectOption = useCallback((optionId: string) => {
    if (!currentQuestion) return;

    setAnswers((prev) => {
      const currentAnswers = prev[currentQuestion.id] || [];
      const isMultiSelect = currentQuestion.multiSelect;

      if (isMultiSelect) {
        if (currentAnswers.includes(optionId)) {
          return {
            ...prev,
            [currentQuestion.id]: currentAnswers.filter((id) => id !== optionId),
          };
        }
        return {
          ...prev,
          [currentQuestion.id]: [...currentAnswers, optionId],
        };
      } else {
        return {
          ...prev,
          [currentQuestion.id]: [optionId],
        };
      }
    });
  }, [currentQuestion]);

  const toggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  }, [currentQuestion]);

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, examQuestions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const calculateResults = useCallback(() => {
    let correct = 0;
    const domainResults: Record<Domain, { correct: number; total: number }> = {
      'Cloud Concepts': { correct: 0, total: 0 },
      'Security & Compliance': { correct: 0, total: 0 },
      'Technology': { correct: 0, total: 0 },
      'Billing & Pricing': { correct: 0, total: 0 },
    };

    for (const question of examQuestions) {
      domainResults[question.domain].total++;
      const userAnswer = answers[question.id] || [];
      const correctAnswer = question.correctOptionIds;

      const isCorrect =
        userAnswer.length === correctAnswer.length &&
        userAnswer.every((a) => correctAnswer.includes(a));

      if (isCorrect) {
        correct++;
        domainResults[question.domain].correct++;
      }
    }

    return {
      correct,
      total: examQuestions.length,
      percentage: Math.round((correct / examQuestions.length) * 100),
      domainResults,
    };
  }, [examQuestions, answers]);

  const results = useMemo(() => {
    if (phase === 'results' || phase === 'review') {
      return calculateResults();
    }
    return null;
  }, [phase, calculateResults]);

  const incorrectQuestions = useMemo(() => {
    if (!results) return [];
    return examQuestions.filter((q) => {
      const userAnswer = answers[q.id] || [];
      const correctAnswer = q.correctOptionIds;
      return !(
        userAnswer.length === correctAnswer.length &&
        userAnswer.every((a) => correctAnswer.includes(a))
      );
    });
  }, [results, examQuestions, answers]);

  const submitExam = useCallback(() => {
    const result = calculateResults();
    const attempt: ExamAttempt = {
      id: crypto.randomUUID(),
      examId: `${examType}-exam-${Date.now()}`,
      startedAt: examStartTime || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers,
      score: result.percentage,
      totalQuestions: examQuestions.length,
    };
    setExamAttempts((prev) => [...prev, attempt]);
    setShowSubmitModal(false);
    setPhase('results');
  }, [calculateResults, examType, examStartTime, answers, examQuestions.length, setExamAttempts]);

  const handleTimeUp = useCallback(() => {
    submitExam();
  }, [submitExam]);

  const unansweredCount = examQuestions.filter((q) => !answers[q.id]?.length).length;
  const flaggedQuestions = examQuestions.filter((q) => flagged.has(q.id));

  const filteredReviewQuestions = useMemo(() => {
    switch (reviewFilter) {
      case 'incorrect':
        return incorrectQuestions;
      case 'flagged':
        return examQuestions.filter((q) => flagged.has(q.id));
      default:
        return examQuestions;
    }
  }, [reviewFilter, incorrectQuestions, examQuestions, flagged]);

  const startReview = useCallback((filter: ReviewFilter = 'all') => {
    setReviewFilter(filter);
    setCurrentIndex(0);
    setPhase('review');
  }, []);

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Exam Simulation Mode
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Simulate the real AWS CCP exam experience
          </p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setExamType('full')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                examType === 'full'
                  ? 'border-[#0D7377] bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Full Exam</div>
              <div className="text-sm text-gray-500">65 questions • 90 minutes</div>
            </button>

            <button
              onClick={() => setExamType('mini')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                examType === 'mini'
                  ? 'border-[#0D7377] bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Mini Exam</div>
              <div className="text-sm text-gray-500">20 questions • 25 minutes</div>
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">No peeking!</p>
                <p className="text-sm text-amber-700 mt-1">
                  Answers will only be shown after you submit the exam.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startExam}
            className="w-full py-3 bg-[#0D7377] text-white font-semibold rounded-lg hover:bg-[#0A5C5F] transition-colors"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'exam') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Timer
              totalSeconds={config.timeSeconds}
              onTimeUp={handleTimeUp}
              paused={timerPaused}
            />
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0A5C5F] transition-colors"
            >
              Submit Exam
            </button>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {examQuestions.map((q, idx) => {
                const isAnswered = answers[q.id]?.length > 0;
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`
                      w-8 h-8 rounded-full text-xs font-medium transition-all
                      ${isCurrent ? 'ring-2 ring-[#0D7377] ring-offset-1' : ''}
                      ${isFlagged ? 'ring-2 ring-amber-400' : ''}
                      ${
                        isAnswered
                          ? 'bg-[#0D7377] text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4">
          {currentQuestion && (
            <QuestionCard
              question={{
                id: currentQuestion.index,
                prompt: currentQuestion.prompt,
                options: currentQuestion.options,
                correctAnswers: currentQuestion.correctOptionIds,
                explanation: '',
                domain: currentQuestion.domain,
              }}
              questionNumber={currentIndex + 1}
              totalQuestions={examQuestions.length}
              selectedOptions={answers[currentQuestion.id] || []}
              onSelect={handleSelectOption}
              showAnswer={false}
              isExamMode={true}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleFlag}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    flagged.has(currentQuestion.id)
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill={flagged.has(currentQuestion.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  {flagged.has(currentQuestion.id) ? 'Flagged' : 'Flag for Review'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === examQuestions.length - 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#0D7377] text-white hover:bg-[#0A5C5F]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </QuestionCard>
          )}
        </main>

        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Exam?</h2>
              
              {unansweredCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}

              {flaggedQuestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Flagged for review:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {flaggedQuestions.map((q) => {
                      const idx = examQuestions.findIndex((eq) => eq.id === q.id);
                      return (
                        <span
                          key={q.id}
                          className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center justify-center"
                        >
                          {idx + 1}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6">
                Are you sure you want to submit? You cannot change your answers after submission.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Continue Exam
                </button>
                <button
                  onClick={submitExam}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-[#0D7377] text-white hover:bg-[#0A5C5F] transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'results' && results) {
    const passed = results.percentage >= PASSING_SCORE;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
                passed ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <span className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {results.percentage}%
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You scored {results.percentage}%
            </h1>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  PASSED
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  NEEDS IMPROVEMENT
                </>
              )}
            </div>

            <p className="text-gray-500">
              {results.correct} of {results.total} questions correct • Passing score: {PASSING_SCORE}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Domain</h2>
            <div className="space-y-4">
              {(Object.entries(results.domainResults) as [Domain, { correct: number; total: number }][]).map(
                ([domain, { correct, total }]) => {
                  if (total === 0) return null;
                  return (
                    <DomainBar
                      key={domain}
                      domain={domain}
                      accuracy={(correct / total) * 100}
                      questionCount={total}
                      answeredCount={correct}
                    />
                  );
                }
              )}
            </div>
          </div>

          {incorrectQuestions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Incorrect Questions ({incorrectQuestions.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {incorrectQuestions.map((q) => {
                  const idx = examQuestions.findIndex((eq) => eq.id === q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        startReview('incorrect');
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-medium flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-700 line-clamp-1">{q.prompt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startReview('all')}
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-[#0D7377] text-white hover:bg-[#0A5C5F] transition-colors"
            >
              Review All Answers
            </button>
            <Link
              href="/"
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    const reviewQuestion = filteredReviewQuestions[currentIndex];
    const actualIndex = reviewQuestion
      ? examQuestions.findIndex((q) => q.id === reviewQuestion.id)
      : -1;

    if (!reviewQuestion) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
            <p className="text-gray-600 mb-4">No questions match this filter.</p>
            <button
              onClick={() => setPhase('results')}
              className="px-4 py-2 rounded-lg font-medium bg-[#0D7377] text-white hover:bg-[#0A5C5F] transition-colors"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    }

    const userAnswer = answers[reviewQuestion.id] || [];
    const isCorrect =
      userAnswer.length === reviewQuestion.correctOptionIds.length &&
      userAnswer.every((a) => reviewQuestion.correctOptionIds.includes(a));

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPhase('results')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <span className="text-lg font-semibold text-gray-900">Review Mode</span>
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'incorrect', 'flagged'] as ReviewFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setReviewFilter(filter);
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    reviewFilter === filter
                      ? 'bg-[#0D7377] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4">
          <div className="mb-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isCorrect ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Correct
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Incorrect
                </>
              )}
            </div>
          </div>

          <QuestionCard
            question={{
              id: reviewQuestion.index,
              prompt: reviewQuestion.prompt,
              options: reviewQuestion.options,
              correctAnswers: reviewQuestion.correctOptionIds,
              explanation: '',
              domain: reviewQuestion.domain,
            }}
            questionNumber={actualIndex + 1}
            totalQuestions={examQuestions.length}
            selectedOptions={userAnswer}
            onSelect={() => {}}
            showAnswer={true}
            isExamMode={true}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {filteredReviewQuestions.length} ({reviewFilter})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(filteredReviewQuestions.length - 1, prev + 1))
                  }
                  disabled={currentIndex === filteredReviewQuestions.length - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#0D7377] text-white hover:bg-[#0A5C5F]"
                >
                  Next
                </button>
              </div>
            </div>
          </QuestionCard>
        </main>
      </div>
    );
  }

  return null;
}
