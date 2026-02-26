# Digital Cellar — Agent Context

This doc gives AI agents (and humans) context on what the project is, what exists, and what remains to do.

## Project purpose

**Goal:** Record a comedy set (camera + mic), transcribe it, analyze it for **content** and **comedic timing**, and give structured feedback.

**Audience:** AI agents and developers working on this repo.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 — [app/](app/).
- **Backend (Python):** FastAPI in [backend/main.py](backend/main.py). When `ANTHROPIC_API_KEY` is set, The Butcher and The Metronome are AI judges (Anthropic); otherwise rule-based. Response includes `letter_grade` and `headline`.
- **Grading (used by UI):** Next.js [app/api/grade/route.ts](app/api/grade/route.ts): when `BACKEND_URL` is set, proxies to FastAPI; else rule-based. Transcription: [app/api/transcribe/route.ts](app/api/transcribe/route.ts) (OpenAI Whisper).

---

## User flow (what exists)

- **Green Room** ([app/page.tsx](app/page.tsx)): Dashboard with last set (score, letter grade, headline), growth trend (last 10 scores from localStorage), "Go On Stage" → `/stage`.
- **Stage** ([app/stage/page.tsx](app/stage/page.tsx)): Record → POST `/api/transcribe` (OpenAI Whisper) → POST `/api/grade` with real transcript, duration, style_influence. When `BACKEND_URL` is set, grading is done by FastAPI (AI or rule-based).
- **Review** ([app/review/page.tsx](app/review/page.tsx)): Shows feedback from sessionStorage (overall score, letter grade, headline, consensus, per-judge panels, next steps). "Save Feedback" downloads JSON; result is pushed to localStorage for Green Room history.

**Flow:** Green Room → Stage (record) → `/api/transcribe` → `/api/grade` (proxies to FastAPI if `BACKEND_URL` set) → Review.

---

## What's implemented

| Area             | Status    | Location                                                                                                                                 |
|------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Recording        | Done      | Stage: getUserMedia, MediaRecorder, blob + duration                                                                                      |
| Transcription    | Done      | [app/api/transcribe/route.ts](app/api/transcribe/route.ts): OpenAI Whisper, returns text + timestamps                                    |
| Grading (used)   | Done      | Next.js grade route: proxies to FastAPI when BACKEND_URL set; else rule-based. Returns letter_grade, headline, judge_feedback, next_steps  |
| Grading (backend)| Done      | FastAPI [backend/main.py](backend/main.py): AI Butcher + Metronome when ANTHROPIC_API_KEY set; else rule-based. letter_grade, headline    |
| UI flow          | Done      | Green Room, Stage, Review with persistence (localStorage/sessionStorage)                                                                   |
| AI (LLM)         | Done      | Anthropic in backend for The Butcher (content/structure) and The Metronome (timing/rhythm)                                               |
| Style influence  | Done      | Passed from Stage to grade API and into backend AI prompts                                                                                 |

---

## What needs to be done

- **Docs:** README project-specific description; reference `.env.example` for env vars.
- **Optional:** Increase Next.js body size limit for long recordings if needed (see transcribe route).

---

## Env vars (see .env.example)

- **OPENAI_API_KEY** (Next.js): Required for transcription. No key → transcribe API returns 503.
- **BACKEND_URL** (Next.js): When set, POST /api/grade proxies to this URL. Unset → rule-based grading only.
- **ANTHROPIC_API_KEY** (backend): When set, Butcher and Metronome use AI. Unset → rule-based judges.
- **ANTHROPIC_MODEL** (backend, optional): Default `claude-sonnet-4-20250514`.

---

## Quick reference

- **Run frontend:** `npm run dev` (port 3000).
- **Run backend:** From `backend/`, `uvicorn main:app --reload` (port 8000). Set `BACKEND_URL=http://localhost:8000` to use it.
- **Key types:** Grade request = `transcript` (text + timestamps) + `duration` + optional `style_influence`; feedback = overall_score, letter_grade, headline, consensus_summary, judge_feedback, next_steps.
