'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STYLE_INFLUENCES = [
  { id: '', label: 'No preference' },
  { id: 'carlin', label: 'George Carlin — observational monologue' },
  { id: 'seinfeld', label: 'Jerry Seinfeld — clean, setup-punchline' },
  { id: 'chappelle', label: 'Dave Chappelle — storytelling, social commentary' },
  { id: 'burr', label: 'Bill Burr — rant, high energy' },
  { id: 'rock', label: 'Chris Rock — callbacks, rule of three' },
];

export default function StageView() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [styleInfluence, setStyleInfluence] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };

    initCamera();

    return () => {
      // Cleanup
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const actuallyStartRecording = () => {
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      await processRecording(blob, recordingTimeRef.current);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimeRef.current = 0;

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const next = prev + 1;
        recordingTimeRef.current = next;
        return next;
      });
    }, 1000);
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject || isProcessing) return;
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      actuallyStartRecording();
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const processRecording = async (videoBlob: Blob, duration: number) => {
    setIsProcessing(true);

    try {
      // Mock transcription for MVP
      const mockTranscript = {
        text: "So I went to the store yesterday... and I realized... nobody actually knows what they're doing. We're all just pretending. Like, the cashier? Pretending. The manager? Definitely pretending. Me? Oh, I'm the CEO of pretending.",
        timestamps: [
          { start: 0, end: 3.2, text: "So I went to the store yesterday..." },
          { start: 3.5, end: 6.8, text: "and I realized..." },
          { start: 7.0, end: 10.5, text: "nobody actually knows what they're doing." },
          { start: 10.8, end: 13.2, text: "We're all just pretending." },
          { start: 13.5, end: 16.8, text: "Like, the cashier? Pretending." },
          { start: 17.0, end: 19.5, text: "The manager? Definitely pretending." },
          { start: 19.8, end: 23.5, text: "Me? Oh, I'm the CEO of pretending." },
        ],
      };

      // Send to grading API
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: mockTranscript,
          duration,
          style_influence: styleInfluence || undefined,
        }),
      });

      const feedback = await response.json();
      
      // Store in sessionStorage and navigate to review
      sessionStorage.setItem('latestFeedback', JSON.stringify(feedback));
      router.push('/review');
    } catch (err) {
      console.error('Processing error:', err);
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-cyan-400/80 hover:text-cyan-300 text-sm mb-4 transition-colors"
          >
            ← Green Room
          </Link>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-2">
            THE DIGITAL CELLAR
          </h1>
          <p className="text-cyan-300 text-lg">Step into the spotlight</p>
        </div>

        {/* Stage Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          {/* Style Influence */}
          <div className="mb-6">
            <label className="block text-cyan-300 text-sm font-medium mb-2">
              Style Influence
            </label>
            <select
              value={styleInfluence}
              onChange={(e) => setStyleInfluence(e.target.value)}
              disabled={isRecording || isProcessing || countdown !== null}
              className="w-full md:max-w-md px-4 py-3 bg-black/40 border border-cyan-500/30 rounded-xl text-cyan-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
            >
              {STYLE_INFLUENCES.map((opt) => (
                <option key={opt.id || 'none'} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Camera View */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-9xl font-black text-cyan-400 animate-pulse drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]">
                  {countdown}
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-6 right-6 flex items-center gap-3 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white font-bold text-lg">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
                  <p className="text-cyan-300 text-xl font-semibold">
                    The Judges are deliberating...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing || countdown !== null}
                className="group relative px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-full font-bold text-white text-xl shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                <span className="relative z-10">🎤 START SET</span>
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="group relative px-12 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-full font-bold text-white text-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10">⏹ END SET</span>
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '💡', tip: 'Aim for 2-5 min sets' },
              { icon: '🎯', tip: 'Clear audio is key' },
              { icon: '⚡', tip: 'Be yourself!' },
            ].map((item, i) => (
              <div
                key={i}
                className="backdrop-blur-sm bg-white/5 border border-cyan-400/20 rounded-xl p-4 text-center"
              >
                <span className="text-3xl mb-2 block">{item.icon}</span>
                <p className="text-cyan-200 text-sm">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
