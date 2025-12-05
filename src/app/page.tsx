'use client';

import Link from 'next/link';
import { CountdownTimer, DomainBar } from '@/components';
import { useProgress } from '@/hooks/useProgress';
import { useQuestions } from '@/hooks/useQuestions';
import type { Domain } from '@/types';

const DAILY_GOAL = 40;
const EXAM_DATE = new Date('2024-12-22');

function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getTodayAnswered(lastStudyDate: string | null, questionsAnswered: number): number {
  const today = new Date().toISOString().split('T')[0];
  if (lastStudyDate === today) {
    return questionsAnswered;
  }
  return 0;
}

export default function Dashboard() {
  const { progress } = useProgress();
  const { totalCount, questionsByDomain } = useQuestions();

  const stats = {
    totalSeen: progress.seenQuestionIds.length,
    accuracy:
      progress.questionsAnswered > 0
        ? Math.round((progress.correctCount / progress.questionsAnswered) * 100)
        : 0,
    streak: progress.streak,
    level: getLevel(progress.xp),
    reviewDue: progress.incorrectQuestionIds.length,
  };

  const todayAnswered = getTodayAnswered(progress.lastStudyDate, progress.questionsAnswered);
  const todayProgress = Math.min(100, (todayAnswered / DAILY_GOAL) * 100);

  const domains: Domain[] = [
    'Cloud Concepts',
    'Security & Compliance',
    'Technology',
    'Billing & Pricing',
  ];

  const getDomainAccuracy = (domain: Domain) => {
    const domainStats = progress.domainStats[domain];
    if (domainStats.answered === 0) return 0;
    return (domainStats.correct / domainStats.answered) * 100;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-display text-text-heading">AWS CCP Practice</h1>
          <p className="text-muted mt-1">Cloud Practitioner Exam Prep</p>
        </header>

        {/* Countdown & Today's Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CountdownTimer targetDate={EXAM_DATE} />

          <div className="px-4 py-3 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Today&apos;s Goal</span>
              <span className="text-sm text-muted">
                {todayAnswered}/{DAILY_GOAL}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-text-heading">
              {stats.totalSeen}/{totalCount}
            </div>
            <div className="text-xs text-muted">Questions Seen</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-text-heading">{stats.accuracy}%</div>
            <div className="text-xs text-muted">Accuracy</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-text-heading">
              {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
            </div>
            <div className="text-xs text-muted">Streak</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-secondary">Lv.{stats.level}</div>
            <div className="text-xs text-muted">{progress.xp} XP</div>
          </div>
        </div>

        {/* Domain Accuracy */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-display text-text-heading mb-4">Domain Accuracy</h2>
          <div className="space-y-4">
            {domains.map((domain) => (
              <Link
                key={domain}
                href={`/practice?domain=${encodeURIComponent(domain)}`}
                className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
              >
                <DomainBar
                  domain={domain}
                  accuracy={getDomainAccuracy(domain)}
                  questionCount={questionsByDomain[domain].length}
                  answeredCount={progress.domainStats[domain].answered}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/practice"
            className="flex items-center justify-center gap-2 bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span className="text-lg">🎯</span>
            Start Practice
          </Link>
          <Link
            href="/exam"
            className="flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary font-medium py-3 px-6 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <span className="text-lg">📝</span>
            Full Exam
          </Link>
          <Link
            href="/review"
            className="relative flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">🔄</span>
            Review
            {stats.reviewDue > 0 && (
              <span className="absolute -top-2 -right-2 bg-error text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.reviewDue}
              </span>
            )}
          </Link>
        </div>

        {/* Recent Activity */}
        {progress.questionsAnswered > 0 && (
          <section className="text-center text-sm text-muted">
            <p>
              Last studied:{' '}
              {progress.lastStudyDate
                ? new Date(progress.lastStudyDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Never'}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
