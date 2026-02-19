'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface JudgeFeedback {
  judge_name: string;
  score: number;
  critique: string;
  strengths: string[];
  improvements: string[];
}

interface Feedback {
  overall_score: number;
  letter_grade?: string;
  headline?: string;
  consensus_summary: string;
  judge_feedback: JudgeFeedback[];
  next_steps: string[];
}

export default function ReviewRoom() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('latestFeedback');
    if (stored) {
      const data = JSON.parse(stored);
      setFeedback(data);
      // Persist for Green Room dashboard
      try {
        const history = JSON.parse(localStorage.getItem('setHistory') ?? '[]');
        history.unshift({ ...data, timestamp: Date.now() });
        localStorage.setItem('setHistory', JSON.stringify(history.slice(0, 20)));
      } catch (_) {}
    } else {
      router.push('/stage');
    }
  }, [router]);

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-300 text-xl">Loading feedback...</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-400 to-emerald-500';
    if (score >= 6) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 8) return '🔥';
    if (score >= 6) return '👍';
    return '💪';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-2">
            THE REVIEW ROOM
          </h1>
          <p className="text-cyan-300 text-lg">The judges have spoken</p>
        </div>

        {/* Overall Score Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-cyan-500/30 rounded-3xl p-8 mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          <div className="text-center">
            {feedback.headline && (
              <p className="text-2xl md:text-3xl font-bold text-cyan-200 mb-4">
                {feedback.headline}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 mb-4 flex-wrap">
              {feedback.letter_grade && (
                <div className={`text-7xl md:text-8xl font-black bg-gradient-to-r ${getScoreColor(feedback.overall_score)} bg-clip-text text-transparent`}>
                  {feedback.letter_grade}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${getScoreColor(feedback.overall_score)} bg-clip-text text-transparent`}>
                  {feedback.overall_score}
                </span>
                <span className="text-4xl">{getScoreEmoji(feedback.overall_score)}</span>
              </div>
            </div>
            <h2 className="text-xl text-cyan-100 font-semibold mb-4">Overall Score</h2>
            <p className="text-lg text-cyan-200 max-w-2xl mx-auto leading-relaxed">
              {feedback.consensus_summary}
            </p>
          </div>
        </div>

        {/* Judge Panels */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {feedback.judge_feedback.map((judge, idx) => (
            <div
              key={idx}
              className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 hover:border-pink-500/40 transition-all duration-300"
            >
              {/* Judge Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-pink-400">{judge.judge_name}</h3>
                <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(judge.score)} bg-clip-text text-transparent`}>
                  {judge.score}
                </div>
              </div>

              {/* Critique */}
              <div className="mb-4 p-4 bg-black/30 rounded-xl border border-cyan-500/10">
                <p className="text-cyan-100 italic leading-relaxed">"{judge.critique}"</p>
              </div>

              {/* Strengths */}
              {judge.strengths.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <span>✨</span> Strengths
                  </h4>
                  <ul className="space-y-1">
                    {judge.strengths.map((strength, i) => (
                      <li key={i} className="text-green-200 text-sm pl-4">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {judge.improvements.length > 0 && (
                <div>
                  <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                    <span>🎯</span> Room to Grow
                  </h4>
                  <ul className="space-y-1">
                    {judge.improvements.map((improvement, i) => (
                      <li key={i} className="text-orange-200 text-sm pl-4">
                        • {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>🚀</span> Next Steps
          </h3>
          <div className="space-y-3">
            {feedback.next_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20"
              >
                <span className="text-2xl">{idx + 1}</span>
                <p className="text-purple-100 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-full font-bold text-white text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] transition-all duration-300 transform hover:scale-105"
          >
            🎤 Back to Green Room
          </button>
          
          <button
            onClick={() => {
              const data = JSON.stringify(feedback, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `feedback-${Date.now()}.json`;
              a.click();
            }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full font-bold text-white text-lg shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all duration-300 transform hover:scale-105"
          >
            💾 Save Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
