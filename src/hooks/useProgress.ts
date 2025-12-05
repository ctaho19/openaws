'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Domain, UserProgress, DomainStats, DailyProgress, ReviewItem } from '@/types';
import type { BadgeId } from '@/types/badges';

const STORAGE_KEY = 'openaws-progress';
const XP_PER_LEVEL = 100;
const STREAK_THRESHOLD = 20;

const initialDomainStats: Record<Domain, DomainStats> = {
  'Cloud Concepts': { answered: 0, correct: 0 },
  'Security & Compliance': { answered: 0, correct: 0 },
  'Technology': { answered: 0, correct: 0 },
  'Billing & Pricing': { answered: 0, correct: 0 },
};

const initialProgress: UserProgress = {
  questionsAnswered: 0,
  correctCount: 0,
  domainStats: initialDomainStats,
  streak: 0,
  lastStudyDate: null,
  xp: 0,
  level: 1,
  seenQuestionIds: [],
  incorrectQuestionIds: [],
  reviewQueue: [],
  earnedBadges: [],
  consecutiveCorrect: 0,
  dailyProgress: [],
};

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function getXpInCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

function checkBadges(
  prev: UserProgress,
  next: UserProgress,
  totalQuestionCount: number
): BadgeId[] {
  const newBadges: BadgeId[] = [];
  const earned = new Set(prev.earnedBadges);

  if (!earned.has('century') && next.questionsAnswered >= 100) {
    newBadges.push('century');
  }

  if (!earned.has('all-domains')) {
    const allDomainsPracticed = Object.values(next.domainStats).every(
      (stats) => stats.answered > 0
    );
    if (allDomainsPracticed) {
      newBadges.push('all-domains');
    }
  }

  if (!earned.has('perfect-10') && next.consecutiveCorrect >= 10) {
    newBadges.push('perfect-10');
  }

  if (!earned.has('streak-7') && next.streak >= 7) {
    newBadges.push('streak-7');
  }

  if (!earned.has('early-bird')) {
    const hour = new Date().getHours();
    if (hour < 8) {
      newBadges.push('early-bird');
    }
  }

  if (!earned.has('night-owl')) {
    const hour = new Date().getHours();
    if (hour >= 22) {
      newBadges.push('night-owl');
    }
  }

  if (totalQuestionCount > 0) {
    const seenPercentage = (next.seenQuestionIds.length / totalQuestionCount) * 100;
    if (!earned.has('halfway') && seenPercentage >= 50) {
      newBadges.push('halfway');
    }
    if (!earned.has('coverage') && seenPercentage >= 100) {
      newBadges.push('coverage');
    }
  }

  return newBadges;
}

function updateDailyProgress(
  dailyProgress: DailyProgress[],
  today: string
): DailyProgress[] {
  const existing = dailyProgress.find((d) => d.date === today);
  if (existing) {
    return dailyProgress.map((d) =>
      d.date === today ? { ...d, questionsAnswered: d.questionsAnswered + 1 } : d
    );
  }
  const last30Days = dailyProgress.slice(-29);
  return [...last30Days, { date: today, questionsAnswered: 1 }];
}

function calculateStreak(dailyProgress: DailyProgress[], today: string): number {
  let streak = 0;
  let checkDate = today;

  for (let i = 0; i < 365; i++) {
    const dayProgress = dailyProgress.find((d) => d.date === checkDate);
    if (dayProgress && dayProgress.questionsAnswered >= STREAK_THRESHOLD) {
      streak++;
      const date = new Date(checkDate);
      date.setDate(date.getDate() - 1);
      checkDate = date.toISOString().split('T')[0];
    } else if (checkDate === today) {
      break;
    } else {
      break;
    }
  }

  return streak;
}

export function useProgress(totalQuestionCount: number = 0) {
  const [progress, setProgress] = useLocalStorage<UserProgress>(
    STORAGE_KEY,
    initialProgress
  );

  const newlyEarnedBadgesRef = useRef<BadgeId[]>([]);

  const recordAnswer = useCallback(
    (questionId: string, isCorrect: boolean, domain: Domain, isReviewQuestion: boolean = false) => {
      setProgress((prev) => {
        const today = new Date().toISOString().split('T')[0];

        let xpGained = 1;
        if (isCorrect) xpGained += 1;
        if (isReviewQuestion) xpGained += 2;

        const newXp = prev.xp + xpGained;
        const newLevel = calculateLevel(newXp);

        const newIncorrectIds = isCorrect
          ? prev.incorrectQuestionIds.filter((id) => id !== questionId)
          : prev.incorrectQuestionIds.includes(questionId)
            ? prev.incorrectQuestionIds
            : [...prev.incorrectQuestionIds, questionId];

        const newConsecutiveCorrect = isCorrect ? prev.consecutiveCorrect + 1 : 0;

        const newDailyProgress = updateDailyProgress(prev.dailyProgress, today);
        const newStreak = calculateStreak(newDailyProgress, today);

        const nextState: UserProgress = {
          ...prev,
          questionsAnswered: prev.questionsAnswered + 1,
          correctCount: prev.correctCount + (isCorrect ? 1 : 0),
          domainStats: {
            ...prev.domainStats,
            [domain]: {
              answered: prev.domainStats[domain].answered + 1,
              correct: prev.domainStats[domain].correct + (isCorrect ? 1 : 0),
            },
          },
          streak: newStreak,
          lastStudyDate: today,
          xp: newXp,
          level: newLevel,
          seenQuestionIds: prev.seenQuestionIds.includes(questionId)
            ? prev.seenQuestionIds
            : [...prev.seenQuestionIds, questionId],
          incorrectQuestionIds: newIncorrectIds,
          consecutiveCorrect: newConsecutiveCorrect,
          dailyProgress: newDailyProgress,
          earnedBadges: prev.earnedBadges,
        };

        const newBadges = checkBadges(prev, nextState, totalQuestionCount);
        if (newBadges.length > 0) {
          nextState.earnedBadges = [...prev.earnedBadges, ...newBadges];
          newlyEarnedBadgesRef.current = newBadges;
        } else {
          newlyEarnedBadgesRef.current = [];
        }

        return nextState;
      });
    },
    [setProgress, totalQuestionCount]
  );

  const awardBadge = useCallback(
    (badgeId: BadgeId) => {
      setProgress((prev) => {
        if (prev.earnedBadges.includes(badgeId)) {
          return prev;
        }
        newlyEarnedBadgesRef.current = [badgeId];
        return {
          ...prev,
          earnedBadges: [...prev.earnedBadges, badgeId],
        };
      });
    },
    [setProgress]
  );

  const getNewlyEarnedBadges = useCallback((): BadgeId[] => {
    const badges = newlyEarnedBadgesRef.current;
    newlyEarnedBadgesRef.current = [];
    return badges;
  }, []);

  const getStats = useCallback(() => {
    const accuracy =
      progress.questionsAnswered > 0
        ? (progress.correctCount / progress.questionsAnswered) * 100
        : 0;

    return {
      ...progress,
      accuracy,
      xpInCurrentLevel: getXpInCurrentLevel(progress.xp),
      xpForNextLevel: XP_PER_LEVEL,
    };
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress(initialProgress);
  }, [setProgress]);

  const getDueReviewItems = useCallback((): ReviewItem[] => {
    const now = new Date().toISOString();
    return progress.reviewQueue.filter((item) => item.nextReviewAt <= now);
  }, [progress.reviewQueue]);

  type Confidence = 'guessed' | 'unsure' | 'confident';

  const scheduleReview = useCallback(
    (questionId: string, wasCorrect: boolean, confidence: Confidence) => {
      setProgress((prev) => {
        const existing = prev.reviewQueue.find((item) => item.questionId === questionId);
        const currentInterval = existing?.interval ?? 1;

        let newInterval: number;
        if (!wasCorrect) {
          newInterval = 1;
        } else if (confidence === 'guessed') {
          newInterval = 2;
        } else if (confidence === 'unsure') {
          newInterval = 2;
        } else {
          newInterval = Math.min(currentInterval * 2, 30);
        }

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

        const newItem: ReviewItem = {
          questionId,
          nextReviewAt: nextReviewAt.toISOString(),
          interval: newInterval,
        };

        const newQueue = prev.reviewQueue.filter((item) => item.questionId !== questionId);
        newQueue.push(newItem);

        return {
          ...prev,
          reviewQueue: newQueue,
        };
      });
    },
    [setProgress]
  );

  return useMemo(
    () => ({
      progress,
      recordAnswer,
      awardBadge,
      getNewlyEarnedBadges,
      getStats,
      resetProgress,
      getDueReviewItems,
      scheduleReview,
    }),
    [progress, recordAnswer, awardBadge, getNewlyEarnedBadges, getStats, resetProgress, getDueReviewItems, scheduleReview]
  );
}
