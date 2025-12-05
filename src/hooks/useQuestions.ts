'use client';

import { useMemo, useCallback } from 'react';
import questionsData from '@/data/questions.json';
import type { Question, QuestionFilters, Domain } from '@/types';
import { useProgress } from './useProgress';
import { shuffleArray } from '@/lib/utils';

const questions = questionsData as Question[];

export function useQuestions() {
  const { progress } = useProgress();

  const getQuestionById = useCallback((id: string): Question | undefined => {
    return questions.find((q) => q.id === id);
  }, []);

  const getQuestionsByDomain = useCallback((domain: Domain): Question[] => {
    return questions.filter((q) => q.domain === domain);
  }, []);

  const getRandomQuestions = useCallback(
    (count: number, filters?: QuestionFilters): Question[] => {
      let filtered = [...questions];

      if (filters?.domain) {
        filtered = filtered.filter((q) => q.domain === filters.domain);
      }

      if (filters?.unseen) {
        filtered = filtered.filter(
          (q) => !progress.seenQuestionIds.includes(q.id)
        );
      }

      if (filters?.incorrect) {
        filtered = filtered.filter((q) =>
          progress.incorrectQuestionIds.includes(q.id)
        );
      }

      const shuffled = shuffleArray(filtered);
      return shuffled.slice(0, count);
    },
    [progress.seenQuestionIds, progress.incorrectQuestionIds]
  );

  const allQuestions = useMemo(() => questions, []);

  const questionsByDomain = useMemo(() => {
    const grouped: Record<Domain, Question[]> = {
      'Cloud Concepts': [],
      'Security & Compliance': [],
      'Technology': [],
      'Billing & Pricing': [],
    };

    for (const question of questions) {
      grouped[question.domain].push(question);
    }

    return grouped;
  }, []);

  return {
    questions: allQuestions,
    questionsByDomain,
    getQuestionById,
    getQuestionsByDomain,
    getRandomQuestions,
    totalCount: questions.length,
  };
}
