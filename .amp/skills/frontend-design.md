# AWS CCP Practice Exam - Frontend Design Skill

## Design Direction: "Study Lab" Aesthetic

This app adopts a **focused academic study lab** aesthetic - clean, professional, and calm. Think of a modern university library or a premium testing center. The design should feel serious but not cold, supportive but not gamified to the point of distraction.

### Core Visual Identity

**Color Palette:**
- **Background**: Warm off-white `#FAFAFA` with subtle paper texture feel
- **Primary Accent**: Deep teal `#0D7377` - calming yet authoritative (AWS-adjacent)
- **Secondary**: Warm amber `#F59E0B` for progress, achievements
- **Success**: Forest green `#059669`
- **Error/Wrong**: Muted coral `#DC2626`
- **Text**: Charcoal `#1F2937` for body, `#111827` for headings
- **Muted**: Cool gray `#6B7280` for secondary text

**Typography:**
- **Headings**: `DM Serif Display` - distinctive, editorial feel
- **Body/UI**: `Source Sans Pro` or `DM Sans` - clear, readable
- **Code/Technical**: `JetBrains Mono` for AWS service names

**Spatial Design:**
- Generous whitespace - let questions breathe
- Card-based layout with subtle shadows
- Left sidebar for navigation in exam mode
- Bottom action bar on mobile

---

## Component Design Guidelines

### Question Card
```
┌─────────────────────────────────────────┐
│ Q.15 of 65                   ⏱ 42:30   │
│─────────────────────────────────────────│
│                                         │
│  Which AWS service provides object      │
│  storage with 99.999999999% durability? │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ A  Amazon S3                     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ B  Amazon EBS                    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ C  Amazon RDS                    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ D  Amazon DynamoDB               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Flag for Review]          [Submit →] │
└─────────────────────────────────────────┘
```

- Options have clear hover states with teal left border
- Selected state: filled background with checkmark
- Keyboard shortcuts (1-4 or A-D) visible on hover
- Multi-select questions show checkboxes

### Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│  🎯 AWS CCP Practice                            │
│  ─────────────────────────────────────────────  │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  17 DAYS LEFT   │  │  TODAY'S GOAL   │      │
│  │  Until Dec 22   │  │  ████████░░ 26/40│      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  WEAK AREAS                                │ │
│  │  Security ████████████░░░░ 68%            │ │
│  │  Billing  ██████░░░░░░░░░░ 45%            │ │
│  │  Technology ██████████████░ 82%           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [🎯 Practice] [📝 Full Exam] [🔄 Review (12)] │
└─────────────────────────────────────────────────┘
```

### Progress & Stats
- Circular progress rings for overall completion
- Horizontal bars for domain accuracy (color-coded)
- Streak counter with subtle flame icon
- XP shown as a simple level badge

### Exam Results Screen
- Large score percentage in center
- Domain breakdown with color-coded bars
- List of incorrect questions with "Review" links
- Comparison to passing score (70%)

---

## Animation & Motion

**Principles:**
- Purposeful, not decorative
- Fast and snappy (150-200ms)
- Ease-out timing for most transitions

**Key Animations:**
1. **Page transitions**: Subtle fade + slight upward slide
2. **Answer selection**: Quick scale pulse (1.02x) + color fill
3. **Submit feedback**: Slide down reveal for explanation
4. **Progress updates**: Smooth bar fills with slight overshoot
5. **Countdown urgency**: Gentle pulse when <5 min remaining

---

## Responsive Design

**Desktop (>1024px):**
- Two-column layout for exam (sidebar + question)
- Dashboard uses grid layout

**Tablet (768-1024px):**
- Collapsible sidebar
- Slightly more compact spacing

**Mobile (<768px):**
- Full-width single column
- Bottom sticky bar for navigation
- Swipe gestures for next/previous question

---

## Anti-Patterns to AVOID

❌ Purple gradients on white backgrounds
❌ Generic Inter/Roboto/Arial fonts
❌ Excessive drop shadows or glassmorphism
❌ Neon colors or "tech bro" aesthetics
❌ Overly gamified elements (coins, stars everywhere)
❌ Cookie-cutter card layouts
❌ Flat, lifeless color schemes

---

## Implementation Notes

### Tailwind CSS Config
```js
{
  colors: {
    primary: '#0D7377',
    secondary: '#F59E0B',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280',
    success: '#059669',
    error: '#DC2626',
  },
  fontFamily: {
    display: ['DM Serif Display', 'serif'],
    body: ['DM Sans', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  }
}
```

### Key Components to Build
1. `QuestionCard` - Main question display
2. `OptionButton` - Answer option with states
3. `ProgressRing` - Circular progress indicator
4. `DomainBar` - Horizontal accuracy bar
5. `CountdownTimer` - Days remaining widget
6. `ExamNavigation` - Question number grid
7. `ResultsSummary` - Post-exam breakdown

Remember: This is a study tool. Every design decision should reduce cognitive load and help the user focus on learning AWS concepts.
