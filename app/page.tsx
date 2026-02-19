'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LastSet {
  overall_score: number;
  letter_grade?: string;
  headline?: string;
  timestamp: number;
}

export default function GreenRoom() {
  const [lastSet, setLastSet] = useState<LastSet | null>(null);
  const [history, setHistory] = useState<{ overall_score: number; timestamp: number }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('setHistory');
      if (raw) {
        const arr = JSON.parse(raw);
        if (arr.length > 0) {
          setLastSet({
            overall_score: arr[0].overall_score,
            letter_grade: arr[0].letter_grade,
            headline: arr[0].headline,
            timestamp: arr[0].timestamp,
          });
          setHistory(arr.slice(0, 10).map((s: { overall_score: number; timestamp: number }) => ({
            overall_score: s.overall_score,
            timestamp: s.timestamp,
          })));
        }
      }
    } catch (_) {
      // ignore
    }
  }, []);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-400 to-emerald-500';
    if (score >= 6) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-2">
            THE GREEN ROOM
          </h1>
          <p className="text-cyan-300 text-lg">
            Warm up. Check your stats. Go kill it.
          </p>
        </div>

        {/* Last Set Stats */}
        <div className="backdrop-blur-xl bg-white/10 border border-cyan-500/30 rounded-3xl p-8 mb-6 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
          <h2 className="text-xl font-bold text-cyan-200 mb-4">Last Set</h2>
          {lastSet ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-baseline gap-4">
                {lastSet.letter_grade && (
                  <span className={`text-5xl font-black bg-gradient-to-r ${getScoreColor(lastSet.overall_score)} bg-clip-text text-transparent`}>
                    {lastSet.letter_grade}
                  </span>
                )}
                <span className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor(lastSet.overall_score)} bg-clip-text text-transparent`}>
                  {lastSet.overall_score}
                </span>
                <span className="text-cyan-400 text-sm">{formatDate(lastSet.timestamp)}</span>
              </div>
              {lastSet.headline && (
                <p className="text-cyan-200 italic md:text-right max-w-md">
                  "{lastSet.headline}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-cyan-400/80">No sets yet. Hit the stage!</p>
          )}
        </div>

        {/* Growth Trend */}
        <div className="backdrop-blur-xl bg-white/10 border border-purple-500/30 rounded-3xl p-8 mb-10 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
          <h2 className="text-xl font-bold text-purple-200 mb-4">Growth Trend</h2>
          {history.length > 0 ? (
            <div className="flex items-end gap-2 h-24">
              {history.slice(0, 10).reverse().map((set, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[24px] flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t bg-gradient-to-t ${getScoreColor(set.overall_score)} opacity-80 transition-all hover:opacity-100`}
                    style={{ height: `${Math.max(12, (set.overall_score / 10) * 80)}%` }}
                    title={`${set.overall_score} — ${formatDate(set.timestamp)}`}
                  />
                  <span className="text-[10px] text-cyan-400/70 truncate max-w-full">
                    {formatDate(set.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-400/80">Record a few sets to see your trend.</p>
          )}
        </div>

        {/* Go On Stage */}
        <div className="text-center">
          <Link
            href="/stage"
            className="inline-block px-14 py-5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full font-bold text-white text-2xl shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:shadow-[0_0_60px_rgba(236,72,153,0.7)] transition-all duration-300 transform hover:scale-105"
          >
            🎤 Go On Stage
          </Link>
        </div>
      </div>
    </div>
  );
}
