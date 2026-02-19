import { NextRequest, NextResponse } from 'next/server';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface Transcript {
  text: string;
  timestamps: TranscriptSegment[];
}

interface GradeRequest {
  transcript: Transcript;
  duration: number;
  style_influence?: string;
}

interface JudgeFeedback {
  judge_name: string;
  score: number;
  critique: string;
  strengths: string[];
  improvements: string[];
}

interface Feedback {
  overall_score: number;
  letter_grade: string;
  headline: string;
  consensus_summary: string;
  judge_feedback: JudgeFeedback[];
  next_steps: string[];
}

// CQ = ((P * T) + L) / W — Comedic Quotient
function computeCQ(
  wordCount: number,
  segmentCount: number,
  duration: number,
  hasRuleOfThree: boolean
): number {
  const P = Math.min(segmentCount / Math.max(duration / 60, 0.1), 10); // punchline density
  const T = 0.7 + Math.random() * 0.3; // timing (simulated)
  const L = hasRuleOfThree ? 1.2 : 0.8; // linguistic novelty
  const W = Math.max(wordCount / 50, 0.5); // word economy
  return Math.min(10, Math.round(((P * T) + L) / W * 2) / 2);
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeRequest = await request.json();
    const { transcript, duration } = body;

    if (!transcript?.text) {
      return NextResponse.json(
        { error: 'Missing transcript' },
        { status: 400 }
      );
    }

    const wordCount = transcript.text.split(/\s+/).length;
    const segmentCount = transcript.timestamps?.length ?? 1;
    const hasRuleOfThree = /pretending\.\s+Like.*\?.*\?.*\?/i.test(transcript.text) ||
      (transcript.text.match(/\?/g)?.length ?? 0) >= 3;

    const judges: Array<{ name: string; weight: number }> = [
      { name: 'The Timing Judge', weight: 0.35 },
      { name: 'The Word Smith', weight: 0.35 },
      { name: 'The Crowd Reader', weight: 0.3 },
    ];

    const baseCQ = computeCQ(wordCount, segmentCount, duration, hasRuleOfThree);
    const judge_feedback: JudgeFeedback[] = judges.map((judge, i) => {
      const variance = (Math.random() - 0.5) * 2;
      const score = Math.min(10, Math.max(1, Math.round((baseCQ + variance) * 2) / 2));
      return {
        judge_name: judge.name,
        score,
        critique: getCritique(judge.name, score, transcript),
        strengths: getStrengths(score, transcript),
        improvements: getImprovements(score, transcript),
      };
    });

    const overall_score =
      Math.round(
        judge_feedback.reduce((sum, j) => sum + j.score, 0) / judge_feedback.length * 2
      ) / 2;

    const letter_grade = scoreToLetter(overall_score);
    const headline = getHeadline(overall_score);

    const feedback: Feedback = {
      overall_score,
      letter_grade,
      headline,
      consensus_summary: getConsensusSummary(overall_score, duration, wordCount),
      judge_feedback,
      next_steps: getNextSteps(overall_score, judge_feedback),
    };

    return NextResponse.json(feedback);
  } catch (err) {
    console.error('Grade API error:', err);
    return NextResponse.json(
      { error: 'Failed to grade set' },
      { status: 500 }
    );
  }
}

function getCritique(judgeName: string, score: number, transcript: Transcript): string {
  const hooks = transcript.text.slice(0, 80).replace(/\s+/g, ' ') + '...';
  if (score >= 8) {
    return `That "${hooks}" — you landed it. The setup-punchline rhythm was tight, and the callback at the end showed real craft.`;
  }
  if (score >= 6) {
    return `Solid material. "${hooks}" has legs. A few beats could breathe more, and the word economy in the middle dragged slightly.`;
  }
  return `"${hooks}" — the idea is there, but the setup ran long. Trim the fat, trust the punchline, and don't rush the landing.`;
}

function getStrengths(score: number, transcript: Transcript): string[] {
  const all: string[] = [
    'Strong callback structure',
    'Good use of the rule of three',
    'Clear premise from the jump',
    'Natural conversational tone',
    'Punchline density on point',
    'Tight word economy in the closer',
  ];
  const count = score >= 8 ? 3 : score >= 6 ? 2 : 1;
  return all.sort(() => Math.random() - 0.5).slice(0, count);
}

function getImprovements(score: number, transcript: Transcript): string[] {
  const all: string[] = [
    'Let the punchline breathe — add a beat before the landing',
    'Trim the setup; every word should earn its place',
    'Vary your rhythm; avoid predictable patterns',
    'Watch for filler phrases that dilute the punch',
    'Consider a stronger button to close the bit',
    'The middle could use a surprise turn',
  ];
  const count = score >= 8 ? 1 : score >= 6 ? 2 : 3;
  return all.sort(() => Math.random() - 0.5).slice(0, count);
}

function getConsensusSummary(score: number, duration: number, wordCount: number): string {
  const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
  if (score >= 8) {
    return `The judges agree: this set had punch, timing, and craft. At ${wpm} words/min, you're in the zone. Keep stacking bits like this.`;
  }
  if (score >= 6) {
    return `Solid foundation. The judges see potential — a few tweaks to pacing and word economy could take this to the next level.`;
  }
  return `Room to grow. The judges want to see tighter setups, clearer punchlines, and more intentional beats. You've got the raw material.`;
}

function scoreToLetter(score: number): string {
  if (score >= 9) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8) return 'A-';
  if (score >= 7.5) return 'B+';
  if (score >= 7) return 'B';
  if (score >= 6.5) return 'B-';
  if (score >= 6) return 'C+';
  if (score >= 5) return 'C';
  if (score >= 4) return 'D';
  return 'F';
}

function getHeadline(score: number): string {
  const headlines: Record<string, string[]> = {
    high: [
      "You killed it!",
      "That's how it's done.",
      "The crowd would've lost it.",
      "Headliner material.",
    ],
    mid: [
      "Solid set. Room to tighten.",
      "You're getting there.",
      "Good bones — now polish.",
      "The judges see potential.",
    ],
    low: [
      "Back to the open mics, buddy.",
      "Rough night. Next one's yours.",
      "Every legend bombed first.",
      "The material's there — trust the process.",
    ],
  };
  const tier = score >= 8 ? 'high' : score >= 6 ? 'mid' : 'low';
  const list = headlines[tier];
  return list[Math.floor(Math.random() * list.length)];
}

function getNextSteps(score: number, judges: JudgeFeedback[]): string[] {
  const steps: string[] = [];
  if (score < 8) {
    steps.push('Record this bit again with the suggested trims and see how it lands');
  }
  steps.push('Try a different bit to build your set variety');
  const lowScores = judges.filter((j) => j.score < 6);
  if (lowScores.length > 0) {
    steps.push('Focus on one improvement from the judges before your next run');
  }
  steps.push('Compare this run to a legendary set in the Cellar archive');
  return steps.slice(0, 4);
}
