export type Domain =
  | 'Cloud Concepts'
  | 'Security & Compliance'
  | 'Technology'
  | 'Billing & Pricing';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  index: number;
  prompt: string;
  options: Option[];
  correctOptionIds: string[];
  multiSelect: boolean;
  domain: Domain;
  source: string;
}

export interface DomainStats {
  answered: number;
  correct: number;
}

export interface ReviewItem {
  questionId: string;
  nextReviewAt: string;
  interval: number;
}

export interface DailyProgress {
  date: string;
  questionsAnswered: number;
}

export interface UserProgress {
  questionsAnswered: number;
  correctCount: number;
  domainStats: Record<Domain, DomainStats>;
  streak: number;
  lastStudyDate: string | null;
  xp: number;
  level: number;
  seenQuestionIds: string[];
  incorrectQuestionIds: string[];
  reviewQueue: ReviewItem[];
  earnedBadges: string[];
  consecutiveCorrect: number;
  dailyProgress: DailyProgress[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string[]>;
  score: number | null;
  totalQuestions: number;
}

export interface QuestionFilters {
  domain?: Domain;
  unseen?: boolean;
  incorrect?: boolean;
}
