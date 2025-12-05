'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { useQuestions } from '@/hooks/useQuestions';
import { useProgress } from '@/hooks/useProgress';
import type { Question, Domain } from '@/types';
import { getAccuracyColor } from '@/lib/utils';

type SessionState = 'queue' | 'active' | 'confidence' | 'complete';
type Confidence = 'guessed' | 'unsure' | 'confident';

interface SessionResult {
  questionId: string;
  domain: Domain;
  isCorrect: boolean;
  confidence: Confidence;
}

export default function ReviewPage() {
  const { getQuestionById } = useQuestions();
  const { recordAnswer, getDueReviewItems, scheduleReview } = useProgress();

  const [sessionState, setSessionState] = useState<SessionState>('queue');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);

  const dueItems = useMemo(() => getDueReviewItems(), [getDueReviewItems]);
  
  const dueQuestions = useMemo(() => {
    return dueItems
      .map((item) => getQuestionById(item.questionId))
      .filter((q): q is Question => q !== undefined);
  }, [dueItems, getQuestionById]);
  
  const activeQuestions = questions.length > 0 ? questions : dueQuestions;
  const currentQuestion = activeQuestions[currentIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;

  const handleStart = useCallback(() => {
    if (dueQuestions.length === 0) return;
    setQuestions(dueQuestions);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setShowAnswer(false);
    setResults([]);
    setSessionState('active');
  }, [dueQuestions]);

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (showAnswer) return;

      const isMultiSelect = currentQuestion?.multiSelect;

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
    if (selectedOptions.length === 0 || !currentQuestion) return;

    const correctIds = currentQuestion.correctOptionIds;
    const isCorrect =
      selectedOptions.length === correctIds.length &&
      selectedOptions.every((id) => correctIds.includes(id));

    recordAnswer(currentQuestion.id, isCorrect, currentQuestion.domain);
    setLastAnswerCorrect(isCorrect);
    setShowAnswer(true);
  }, [selectedOptions, currentQuestion, recordAnswer]);

  const handleShowConfidence = useCallback(() => {
    setSessionState('confidence');
  }, []);

  const handleConfidence = useCallback(
    (confidence: Confidence) => {
      if (!currentQuestion) return;

      scheduleReview(currentQuestion.id, lastAnswerCorrect, confidence);

      setResults((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          domain: currentQuestion.domain,
          isCorrect: lastAnswerCorrect,
          confidence,
        },
      ]);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedOptions([]);
        setShowAnswer(false);
        setSessionState('active');
      } else {
        setSessionState('complete');
      }
    },
    [currentQuestion, currentIndex, questions.length, lastAnswerCorrect, scheduleReview]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionState === 'confidence') {
        if (e.key === '1') handleConfidence('guessed');
        if (e.key === '2') handleConfidence('unsure');
        if (e.key === '3') handleConfidence('confident');
        return;
      }

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
          handleShowConfidence();
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
    handleShowConfidence,
    handleConfidence,
  ]);

  if (sessionState === 'queue') {
    if (questions.length === 0) {
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h1>
              <p className="text-gray-600 mb-6">
                Questions will appear here based on your previous answers.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Start practicing to build your review queue.
              </p>

              <Link
                href="/practice"
                className="inline-block px-6 py-3 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5c5f] transition-colors"
              >
                Start Practicing
              </Link>
            </div>
          </div>
        </div>
      );
    }

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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Spaced Repetition Review</h1>
          <p className="text-gray-600 mb-8">
            Questions you got wrong or were unsure about
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-4xl font-bold text-[#0D7377]">{questions.length}</span>
                <span className="text-gray-600 ml-2">questions due for review</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Answer each question, then rate your confidence</li>
                <li>• Wrong answers: review again in 1 day</li>
                <li>• Correct but unsure: review in 2 days</li>
                <li>• Correct and confident: review in 4+ days</li>
              </ul>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-[#0D7377] text-white font-semibold rounded-lg hover:bg-[#0a5c5f] transition-colors"
            >
              Start Review Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'complete') {
    const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#0D7377] to-[#14919B] flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Complete!</h1>
            <p className="text-gray-600 mb-8">
              You reviewed {results.length} question{results.length !== 1 ? 's' : ''}
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">Confidence Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {results.filter((r) => r.confidence === 'guessed').length}
                  </div>
                  <div className="text-gray-500">Guessed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">
                    {results.filter((r) => r.confidence === 'unsure').length}
                  </div>
                  <div className="text-gray-500">Unsure</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {results.filter((r) => r.confidence === 'confident').length}
                  </div>
                  <div className="text-gray-500">Confident</div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Come back tomorrow for more reviews
            </p>

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/practice"
                className="flex-1 py-3 px-4 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5c5f] transition-colors"
              >
                Practice More
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'confidence') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              Review {currentIndex + 1} of {questions.length}
            </span>
            <span className={`text-sm font-medium ${lastAnswerCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {lastAnswerCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-[#0D7377] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">How confident were you?</h2>
            <p className="text-gray-600 mb-8">
              This helps schedule your next review
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleConfidence('guessed')}
                className="w-full py-4 px-6 border-2 border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-between"
              >
                <span>Guessed</span>
                <span className="text-sm text-red-400">Review in {lastAnswerCorrect ? '2' : '1'} day{lastAnswerCorrect ? 's' : ''}</span>
              </button>
              <button
                onClick={() => handleConfidence('unsure')}
                className="w-full py-4 px-6 border-2 border-amber-200 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-between"
              >
                <span>Unsure</span>
                <span className="text-sm text-amber-400">Review in {lastAnswerCorrect ? '2' : '1'} day{lastAnswerCorrect ? 's' : ''}</span>
              </button>
              <button
                onClick={() => handleConfidence('confident')}
                className="w-full py-4 px-6 border-2 border-green-200 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors flex items-center justify-between"
              >
                <span>Confident</span>
                <span className="text-sm text-green-400">Review in {lastAnswerCorrect ? '4' : '1'} days</span>
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Press 1, 2, or 3 to select
            </p>
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
              Review {currentIndex + 1} of {questions.length}
            </span>
            <div className="h-4 w-px bg-gray-200" />
            <span className={`text-sm font-medium ${getAccuracyColor(results.length > 0 ? (correctCount / results.length) * 100 : 100)}`}>
              {correctCount}/{results.length} correct
            </span>
          </div>

          <button
            onClick={() => setSessionState('queue')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            End Session
          </button>
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
                  onClick={handleShowConfidence}
                  className="px-6 py-2 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5c5f] transition-colors"
                >
                  Rate Confidence
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
