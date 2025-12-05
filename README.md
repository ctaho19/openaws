# AWS CCP Practice Exam App

A web application for studying for the AWS Certified Cloud Practitioner (CLF-C02) exam. Built with Next.js and SST for deployment to AWS.

## 🎯 Features

### Core Study Modes

- **Practice Mode** - Targeted question drills with immediate feedback
  - Filter by domain (Cloud Concepts, Security, Technology, Billing)
  - Choose question count (10, 20, 50)
  - Option to show only unseen questions
  - Keyboard shortcuts for fast navigation

- **Exam Simulation** - Realistic exam experience
  - Full exam: 65 questions, 90 minutes
  - Mini exam: 20 questions, 25 minutes  
  - Timed with no peeking at answers
  - Question flagging for review
  - Detailed results with domain breakdown

- **Spaced Repetition Review** - Focus on weak areas
  - Questions you got wrong come back for review
  - Confidence-based scheduling (1-4 days)
  - Prioritizes questions you're unsure about

### Progress Tracking

- 📊 Domain accuracy breakdown
- 📈 Overall progress and coverage
- 🔥 Daily streak counter
- ⭐ XP and levels
- 🏆 Achievement badges

### Question Bank

- **1,142 practice questions** from 23 practice exams
- Covers all 4 exam domains:
  - Cloud Concepts (178 questions)
  - Security & Compliance (304 questions)  
  - Technology (457 questions)
  - Billing & Pricing (203 questions)
- Multiple choice and multi-select questions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- AWS credentials configured (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start studying!

### Deploy to AWS

```bash
# Deploy using SST
npx sst deploy --stage prod
```

## 📁 Project Structure

```
openaws/
├── src/
│   ├── app/                 # Next.js pages
│   │   ├── page.tsx         # Dashboard
│   │   ├── practice/        # Practice mode
│   │   ├── exam/            # Exam simulation
│   │   └── review/          # Spaced repetition
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   ├── lib/                 # Utilities
│   └── data/                # Questions JSON
├── packages/
│   └── functions/           # Lambda functions (SST)
├── scripts/                 # Build scripts
│   └── parseExams.mjs       # Question parser
└── sst.config.ts            # SST configuration
```

## 🎨 Design

The app follows a "Study Lab" aesthetic - calm, focused, and professional. Key design decisions:

- **Color Palette**: Teal primary (#0D7377), warm accents
- **Typography**: DM Serif Display (headings), DM Sans (body)
- **Layout**: Generous whitespace, card-based design
- **Motion**: Purposeful animations for feedback

See `.amp/skills/frontend-design.md` for the complete design system.

## 📝 Study Tips

1. **Daily Goal**: Aim for 40 questions per day
2. **Domain Focus**: Spend extra time on your weakest areas
3. **Simulate Exams**: Take at least one full exam per week
4. **Review Queue**: Check your review queue daily
5. **Understand, Don't Memorize**: Focus on concepts, not just answers

## 📊 Exam Info

- **Exam Code**: CLF-C02
- **Duration**: 90 minutes
- **Questions**: 65 (50 scored, 15 unscored)
- **Passing Score**: 70%
- **Format**: Multiple choice, multiple response

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: SST (AWS Lambda, DynamoDB)
- **Storage**: localStorage (client) + DynamoDB (server)
- **Deployment**: AWS (CloudFront, S3, Lambda)

## 📜 Credits

Question content sourced from [AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes) by kananinirav.

## 📄 License

MIT
