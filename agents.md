# Digital Cellar — Agent Context

This doc gives AI agents (and humans) context on what the project is, what exists, and what remains to do.

## Project purpose

**Goal:** Record a comedy set (camera + mic), transcribe it, analyze it for **content** and **comedic timing**, and give structured feedback.

**Audience:** AI agents and developers working on this repo.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 — [app/](app/).
- **Backend (Python):** FastAPI in [backend/main.py](backend/main.py), Pydantic models. `anthropic` is in requirements but **not used**.
- **Grading (used by UI):** Next.js API route [app/api/grade/route.ts](app/api/grade/route.ts) — rule-based “CQ” formula and three judges (Timing, Word Smith, Crowd Reader).

---

## User flow (what exists)

- **Green Room** ([app/page.tsx](app/page.tsx)): Dashboard with last set (score, letter grade, headline), growth trend (last 10 scores from localStorage), “Go On Stage” → `/stage`.
- **Stage** ([app/stage/page.tsx](app/stage/page.tsx)): Camera + mic via `getUserMedia`, countdown, MediaRecorder (video/webm), stop → `processRecording(blob, duration)`. **Transcription is mocked:** a fixed `mockTranscript` is always sent; the real recording is never transcribed. Style-influence dropdown is sent in the request but not used by the grade API.
- **Review** ([app/review/page.tsx](app/review/page.tsx)): Shows feedback from sessionStorage (overall score, letter grade, headline, consensus, per-judge panels, next steps). “Save Feedback” downloads JSON; result is pushed to localStorage for Green Room history.

**Flow:** Green Room → Stage (record, mock transcript) → POST to **Next.js** `/api/grade` → Review. The FastAPI backend is **not** called by the app.

---

## What’s implemented

| Area             | Status    | Location                                                                                                                                 |
|------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Recording        | Done      | Stage: getUserMedia, MediaRecorder, blob + duration                                                                                      |
| Transcription    | Mock only | Stage: hardcoded `mockTranscript` in `processRecording`                                                                                   |
| Grading (used)   | Done      | Next.js [app/api/grade/route.ts](app/api/grade/route.ts): CQ formula, 3 judges, letter grade, headline, next steps                        |
| Grading (unused) | Done      | FastAPI [backend/main.py](backend/main.py): The Butcher (word economy, fillers), The Metronome (WPM 120–160, pacing), consensus           |
| UI flow          | Done      | Green Room, Stage, Review with persistence (localStorage/sessionStorage)                                                                  |
| AI (LLM)         | Not used  | `anthropic` in backend requirements only; no imports in `main.py`                                                                          |
| Style influence  | UI only   | Chosen on Stage; not used in either grading implementation                                                                               |

---

## What needs to be done

- **Real transcription:** Replace mock transcript with actual speech-to-text (e.g. send recorded audio to a transcription API or service) and pass real `transcript` + timestamps to the grade API.
- **Use AI for analysis:** Either integrate Anthropic in the FastAPI backend for content/timing feedback, or add an LLM step in the Next.js API; currently all feedback is rule-based.
- **Backend integration:** Decide whether the app should call the FastAPI grading API; if yes, add env (e.g. `BACKEND_URL`), proxy or direct call from Next.js to FastAPI, and document in this file and README.
- **Unify or choose grading:** Two implementations exist (Next.js vs FastAPI). Either wire the frontend to FastAPI and deprecate the Next.js grading logic, or consolidate on one implementation and remove/archive the other.
- **Use style influence:** Pass `style_influence` into the grading logic (and into any LLM prompt) so feedback can be tailored (e.g. Carlin, Seinfeld).
- **Docs and config:** Add `.env.example` and document env vars (e.g. transcription API key, optional backend URL, Anthropic API key). README currently has no project-specific description; this file can serve as the source of truth for “what this app is.”

---

## Quick reference

- **Run frontend:** `npm run dev` (port 3000).
- **Run backend:** From `backend/`, `uvicorn main:app --reload` (separate process; not required for current frontend flow).
- **Key types:** Grade request = `transcript` (text + timestamps) + `duration`; feedback = overall_score, letter_grade, headline, consensus_summary, judge_feedback, next_steps.
