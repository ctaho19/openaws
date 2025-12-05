# AGENTS.md - AWS CCP Practice Exam App

## Project Overview
This is an AWS Certified Cloud Practitioner practice exam application built with Next.js and SST for AWS deployment.

## Commands

### Development
```bash
npm run dev      # Start Next.js dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### SST Deployment
```bash
npx sst dev      # Start SST dev mode (requires macOS 12+ or Linux)
npx sst deploy --stage prod  # Deploy to production
```

Note: SST v3 requires macOS 12+. This project uses SST v2 for compatibility with macOS 11.

### Scripts
```bash
node scripts/parseExams.mjs  # Re-parse questions from source repo
```

## Architecture

### Frontend (Next.js)
- `/src/app/` - Pages (Dashboard, Practice, Exam, Review)
- `/src/components/` - Reusable UI components
- `/src/hooks/` - React hooks (useProgress, useQuestions, useLocalStorage)
- `/src/types/` - TypeScript type definitions
- `/src/data/questions.json` - 1142 parsed practice questions

### Backend (SST/Lambda)
- `/packages/functions/src/` - Lambda handlers
  - `progress.ts` - GET/POST user progress
  - `reviewQueue.ts` - Get due review questions
  - `examAttempt.ts` - Record exam attempts

### Data Storage
- Client-side: localStorage (for offline-first experience)
- Server-side: DynamoDB (for persistence across devices)

## Code Conventions

### Styling
- Use Tailwind CSS with custom theme (see `tailwind.config.ts`)
- Follow the design system in `.amp/skills/frontend-design.md`
- Primary color: `#0D7377` (teal), Secondary: `#F59E0B` (amber)

### Components
- Use functional components with hooks
- Keep components in `/src/components/`
- Export all components from `/src/components/index.ts`

### Types
- Define types in `/src/types/index.ts`
- Use strict TypeScript (no `any`)

## Key Files
- `sst.config.ts` - SST infrastructure configuration
- `src/data/questions.json` - All 1142 practice questions
- `src/hooks/useProgress.ts` - Core progress tracking logic
- `.amp/skills/frontend-design.md` - Design system documentation

## Question Format
```typescript
interface Question {
  id: string;           // e.g., "practice-exam-1-q001"
  examId: string;       // e.g., "practice-exam-1"
  index: number;        // Question number in exam
  prompt: string;       // The question text
  options: Option[];    // Array of {id, text}
  correctOptionIds: string[];  // e.g., ["a"] or ["b", "e"]
  multiSelect: boolean; // true if multiple answers required
  domain: string;       // One of 4 domains
  source: string;       // Same as examId
}
```

## Domains
1. Cloud Concepts (178 questions)
2. Security & Compliance (304 questions)
3. Technology (457 questions)
4. Billing & Pricing (203 questions)
