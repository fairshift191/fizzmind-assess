# Fizzmind — Assessment Process

## Overview

Fizzmind is selective. Every applicant goes through an assessment to help us understand who they are, what they're passionate about, and whether they'd be a great fit for a Fizzmind cohort. The assessment also helps us recommend the right camp location and program track.

We offer **two assessment paths**:

| Path | Duration | Format | Best For |
|------|----------|--------|----------|
| Voice Assessment | ~15 min | AI conversation with Scout | Full evaluation, scholarship consideration, personalized recommendations |
| Assessment Test | 10 min | 30 Python MCQs | Quick skill placement for coding-focused applicants |

Both can be taken from any device with a browser. No downloads, no accounts, no scheduling.

---

## Path 1: Voice Assessment

### What It Is
A real-time voice conversation with **Scout**, our AI camp counselor powered by Google Gemini Flash 3.1 Live. Scout is warm, encouraging, and genuinely curious — she talks to kids like a cool older sibling, not like an interviewer.

### How It Works
1. Student enters their name and email on the Fizzmind assessment page
2. Optionally selects a preferred camp location
3. Clicks "Voice Assessment" — browser requests microphone access
4. Scout greets them by name and begins a natural conversation
5. Over ~15 minutes, Scout explores 8 dimensions through casual chat
6. Scout calls internal tools to record scores as the conversation progresses
7. At the end, Scout recommends a camp location and program track
8. Student sees a results screen with their profile

### The 8 Assessment Dimensions

| Dimension | What We're Evaluating | How Scout Explores It |
|-----------|----------------------|----------------------|
| Age & Grade | Age-appropriateness, academic level | "How old are you? What grade?" |
| Interests & Passions | What excites them, depth of engagement | "What could you talk about for hours?" |
| Projects & Accomplishments | What they've actually built/created | "Have you built anything cool recently?" |
| Collaboration Style | How they work with others | "Do you prefer solo or team projects?" |
| Language Proficiency | Communication skills, multilingualism | "What languages do you speak?" |
| Camp & Travel Experience | Prior independence, travel comfort | "Have you traveled or been to camp before?" |
| Motivation & Why Us | Why Fizzmind specifically, clarity of goals | "What made you interested in THIS camp?" |
| Independence & Comfort | Readiness to be away from home | "How do you feel about trying new things?" |

### Scoring Rubric (1-10)
| Range | Level | Meaning |
|-------|-------|---------|
| 1-3 | Developing | Limited readiness, needs more support |
| 4-5 | Emerging | Some foundation, would benefit from guidance |
| 6-7 | Solid | Well-prepared, will thrive with moderate support |
| 8-9 | Strong | Confident and capable, ready for challenges |
| 10 | Exceptional | Standout strength, could mentor peers |

### Conversation Flow (7 phases)

1. **Warm Up & Icebreaker** (2-3 min) — Fun question, get comfortable, learn age/grade
2. **Interests & Projects Deep Dive** (4-5 min) — Passions, what they've built, how they learn
3. **Social & Collaboration** (2-3 min) — Friends, teamwork, group dynamics
4. **World Experience** (2-3 min) — Travel, languages, cultural comfort
5. **Why Fizzmind & Motivation** (2-3 min) — Why us, what they seek, what they'd contribute
6. **Independence & Readiness** (1-2 min) — Comfort with new experiences, being away from home
7. **Camp Matching & Wrap-Up** (2-3 min) — Recommendation, encouragement, farewell

### What Scout Knows
Scout has full knowledge of:
- All 9 camp locations with specific activities
- All 5 program tracks with detailed offerings
- Scholarship availability (need-based up to 100%, merit up to 40%)
- Camp durations (USA: 3 weeks, others: 2 weeks)
- Cohort size (20 students)
- Fizzmind philosophy (learning through play, selective admission)

Scout shares this information naturally during the conversation — never as a lecture, always as relevant details woven into the chat.

### Technical Details
- **AI Model:** Google Gemini Flash 3.1 Live (voice-to-voice)
- **Voice:** Charon (warm, natural, human-like)
- **Audio:** 16kHz input (mic), 24kHz output (speakers), WebSocket connection
- **Transcription:** Dual — Gemini native + Web Speech API for visitor subtitles
- **Tool Calling:** 4 tools (update_assessment, recommend_camp, recommend_track, complete_assessment)
- **Browser Support:** Chrome, Edge, Safari (mic required)

---

## Path 2: Assessment Test

### What It Is
A 30-question multiple-choice Python test designed for beginners (ages 10-14). Questions use kid-friendly language, relatable examples (pizza, robots, pets), and cover fundamental concepts.

### How It Works
1. Student enters name and email
2. Clicks "Assessment Test" on the welcome screen
3. Scout (voice AI) greets them on the instructions screen, has a brief chat, explains the test
4. Student clicks "Start Test" — 10-minute timer begins
5. 30 questions displayed one at a time with navigation dots
6. Student can skip, go back, and change answers freely
7. Test auto-submits when timer runs out, or student clicks "Finish Test"
8. Results screen shows score, time used, and per-question breakdown

### Topics Covered
| Topic | # of Questions | Examples |
|-------|---------------|----------|
| Basics | 3 | print(), comments, input(), variables |
| Variables | 2 | Assignment, types |
| Lists | 6 | Creating, indexing, append, len, negative index |
| Strings | 3 | Indexing, upper/lower, concatenation |
| Math & Operators | 2 | Arithmetic, ** operator |
| If Statements | 3 | Syntax, ==, conditional logic |
| Loops | 5 | for, while, range, break |
| Functions | 3 | def, return, calling |
| Logic | 1 | Boolean, True/False |
| Data Types | 1 | Types overview |
| Debugging | 1 | Spot the error |

### Question Design Principles
- Simple, plain language — "What will Python show?" not "What is the output?"
- Fun context — pizza, snacks, pets, robots, high scores
- No trick questions — straightforward concept testing
- Code snippets are short (2-5 lines max)
- Every question has exactly 4 options
- Difficulty: beginner to intermediate (no advanced topics)

### Scoring
| Range | Level | What It Means |
|-------|-------|--------------|
| 0-10 | Beginner | New to Python — would benefit from intro track |
| 11-18 | Developing | Has basics — ready for guided project work |
| 19-24 | Solid | Comfortable with fundamentals — ready for real projects |
| 25-28 | Strong | Advanced for age — can tackle challenging builds |
| 29-30 | Exceptional | Remarkable — potential for mentoring and advanced AI/ML work |

---

## After the Assessment

### What Happens Next
1. **Results are generated** — scores, recommendations, and summary
2. **Application is reviewed** by the Fizzmind Admissions team
3. **Decision email** sent within 7 days:
   - **Accepted** — with recommended camp location and track
   - **Waitlisted** — strong candidate, pending cohort availability
   - **Not accepted** — with encouraging feedback and suggestions
4. **Scholarship notification** (if applicable) — within 14 days
5. **Registration and payment** — secure online process with installment options

### Acceptance Criteria
We don't have a minimum score. Acceptance is holistic:
- **Curiosity & motivation** weigh most heavily — a kid who scores 6/10 on skills but 10/10 on motivation is a strong candidate
- **Diversity contribution** — we balance cohorts for geographic, cultural, and interest diversity
- **Fit** — would this kid thrive here? Would they add to the group?

### Retaking the Assessment
- Students can retake the assessment once, after a 30-day waiting period
- Only the most recent assessment is considered
- Retaking is encouraged if the first attempt was disrupted (technical issues, nervousness, etc.)

---

## Privacy & Data

### What We Collect
- Name and email (entered by student)
- Voice conversation transcript (voice assessment only)
- Assessment scores and counselor notes
- Test answers and timing data (assessment test only)

### What We Don't Collect
- No video or images
- No location data
- No device fingerprinting
- No data sold to third parties

### Data Retention
- Assessment data retained for 12 months for admissions purposes
- Deleted upon request at any time
- Transcripts never shared outside the Fizzmind Admissions team

### Parental Consent
- Recommended for students under 13
- Parents can request access to their child's assessment results
- Parents can request data deletion at any time
