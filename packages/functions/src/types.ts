export interface UserProfile {
  pk: string;
  sk: "PROFILE";
  totalQuestionsAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  longestStreak: number;
  lastAnsweredAt?: string;
  xp: number;
  domainStats: Record<string, { answered: number; correct: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionProgress {
  pk: string;
  sk: string;
  questionId: string;
  isCorrect: boolean;
  confidence: "low" | "medium" | "high";
  timeSpent: number;
  attempts: number;
  lastAttemptAt: string;
  nextReviewAt: string;
  GSI1PK: string;
  GSI1SK: string;
}

export interface ExamAttempt {
  pk: string;
  sk: string;
  score: number;
  totalQuestions: number;
  duration: number;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  createdAt: string;
}

export interface RecordProgressInput {
  questionId: string;
  isCorrect: boolean;
  confidence: "low" | "medium" | "high";
  timeSpent: number;
  domain?: string;
}

export interface ExamAttemptInput {
  score: number;
  totalQuestions: number;
  duration: number;
  domainBreakdown: Record<string, { correct: number; total: number }>;
}
