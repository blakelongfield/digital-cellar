from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import json

app = FastAPI(title="Digital Cellar Grading API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class Timestamp(BaseModel):
    start: float
    end: float
    text: str

class Transcript(BaseModel):
    text: str
    timestamps: List[Timestamp]

class GradeRequest(BaseModel):
    transcript: Transcript
    duration: int

class JudgeFeedback(BaseModel):
    judge_name: str
    score: float  # 0-10
    critique: str
    strengths: List[str]
    improvements: List[str]

class ConsensusFeedback(BaseModel):
    overall_score: float
    consensus_summary: str
    judge_feedback: List[JudgeFeedback]
    next_steps: List[str]

# ============================================
# JUDGE: THE BUTCHER
# ============================================

class TheButcher:
    """Focuses on word economy and brevity"""
    
    def __init__(self):
        self.name = "The Butcher"
        self.weight = 0.5
    
    def analyze(self, transcript: Transcript) -> JudgeFeedback:
        # Analyze word economy
        words = transcript.text.split()
        total_words = len(words)
        
        # Look for filler words
        fillers = ['like', 'um', 'uh', 'you know', 'basically', 'literally']
        filler_count = sum(1 for word in words if word.lower().strip('.,!?') in fillers)
        filler_ratio = filler_count / total_words if total_words > 0 else 0
        
        # Check for repetition
        unique_ratio = len(set(words)) / len(words) if words else 0
        
        # Calculate score (inverse of filler ratio, scaled)
        base_score = max(0, 10 - (filler_ratio * 50))
        repetition_penalty = (1 - unique_ratio) * 3
        score = max(0, min(10, base_score - repetition_penalty))
        
        # Generate feedback
        strengths = []
        improvements = []
        
        if filler_ratio < 0.05:
            strengths.append("Minimal filler words - your speech is clean")
        else:
            improvements.append(f"Cut down on filler words ({filler_count} detected)")
        
        if unique_ratio > 0.7:
            strengths.append("Good vocabulary variety")
        else:
            improvements.append("Avoid repeating the same words too much")
        
        # Check for long pauses in timestamps
        long_pauses = []
        for i in range(len(transcript.timestamps) - 1):
            gap = transcript.timestamps[i + 1].start - transcript.timestamps[i].end
            if gap > 2.0:
                long_pauses.append(gap)
        
        if long_pauses:
            improvements.append(f"Found {len(long_pauses)} long pauses - keep the momentum")
        
        critique = f"The Butcher sees {'potential' if score < 6 else 'promise'}. "
        if filler_ratio > 0.1:
            critique += f"You're using {filler_count} filler words. Every word should earn its place. "
        else:
            critique += "Your word choice is economical. "
        
        if improvements:
            critique += f"Trim the fat: {improvements[0]}."
        
        return JudgeFeedback(
            judge_name=self.name,
            score=round(score, 1),
            critique=critique,
            strengths=strengths,
            improvements=improvements
        )

# ============================================
# JUDGE: THE METRONOME
# ============================================

class TheMetronome:
    """Focuses on timing and pacing"""
    
    def __init__(self):
        self.name = "The Metronome"
        self.weight = 0.5
    
    def analyze(self, transcript: Transcript, duration: int) -> JudgeFeedback:
        timestamps = transcript.timestamps
        
        if not timestamps:
            return JudgeFeedback(
                judge_name=self.name,
                score=0,
                critique="No timing data available.",
                strengths=[],
                improvements=["Record with clear speech for timing analysis"]
            )
        
        # Calculate pacing metrics
        words_per_minute = len(transcript.text.split()) / (duration / 60) if duration > 0 else 0
        
        # Analyze gaps between phrases
        gaps = []
        for i in range(len(timestamps) - 1):
            gap = timestamps[i + 1].start - timestamps[i].end
            gaps.append(gap)
        
        avg_gap = sum(gaps) / len(gaps) if gaps else 0
        
        # Ideal comedy pacing: 120-160 words per minute
        # Ideal gaps: 0.3-1.5 seconds
        
        # Score based on WPM
        wpm_score = 10
        if words_per_minute < 100:
            wpm_score = 5
        elif words_per_minute > 180:
            wpm_score = 6
        elif 120 <= words_per_minute <= 160:
            wpm_score = 10
        else:
            wpm_score = 8
        
        # Score based on gaps
        gap_score = 10
        if avg_gap < 0.2:
            gap_score = 6  # Too rushed
        elif avg_gap > 2.0:
            gap_score = 5  # Too slow
        elif 0.5 <= avg_gap <= 1.2:
            gap_score = 10
        else:
            gap_score = 8
        
        score = (wpm_score + gap_score) / 2
        
        strengths = []
        improvements = []
        
        if 120 <= words_per_minute <= 160:
            strengths.append(f"Solid pacing at {int(words_per_minute)} WPM")
        elif words_per_minute < 120:
            improvements.append("Speed it up - you're dragging")
        else:
            improvements.append("Slow down - give the punchlines room to breathe")
        
        if 0.5 <= avg_gap <= 1.2:
            strengths.append("Good pause timing between phrases")
        elif avg_gap < 0.5:
            improvements.append("Add more pauses - let the audience catch up")
        else:
            improvements.append("Tighten up the gaps between jokes")
        
        # Check for rhythm consistency
        if len(gaps) > 2:
            variance = sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)
            if variance < 0.5:
                strengths.append("Consistent rhythm throughout")
            else:
                improvements.append("Your pacing is inconsistent - find your groove")
        
        critique = f"The Metronome hears {'decent rhythm' if score >= 6 else 'timing issues'}. "
        critique += f"You're at {int(words_per_minute)} words per minute. "
        
        if improvements:
            critique += f"Focus: {improvements[0]}."
        
        return JudgeFeedback(
            judge_name=self.name,
            score=round(score, 1),
            critique=critique,
            strengths=strengths,
            improvements=improvements
        )

# ============================================
# CONSENSUS ENGINE
# ============================================

def generate_consensus(judge_feedbacks: List[JudgeFeedback]) -> ConsensusFeedback:
    """
    Synthesizes individual judge feedback into a unified report
    """
    
    # Calculate weighted average score
    total_weight = sum([0.5, 0.5])  # Butcher: 0.5, Metronome: 0.5
    weighted_score = sum(
        fb.score * (0.5 if fb.judge_name == "The Butcher" else 0.5)
        for fb in judge_feedbacks
    ) / total_weight
    
    # Collect all strengths and improvements
    all_strengths = []
    all_improvements = []
    
    for fb in judge_feedbacks:
        all_strengths.extend(fb.strengths)
        all_improvements.extend(fb.improvements)
    
    # Generate consensus summary
    if weighted_score >= 8:
        tone = "Strong set! You're hitting the marks."
    elif weighted_score >= 6:
        tone = "Solid foundation, but there's room to level up."
    else:
        tone = "You've got raw material - now let's refine it."
    
    summary = f"{tone} "
    
    # Highlight top priority improvements
    if all_improvements:
        summary += f"Key focus: {all_improvements[0]}. "
    
    if all_strengths:
        summary += f"Keep doing: {all_strengths[0]}."
    
    # Generate next steps
    next_steps = []
    if all_improvements:
        next_steps.append(f"📝 {all_improvements[0]}")
    if len(all_improvements) > 1:
        next_steps.append(f"⏱️ {all_improvements[1]}")
    
    next_steps.append("🎯 Record another set and track your progress")
    
    return ConsensusFeedback(
        overall_score=round(weighted_score, 1),
        consensus_summary=summary,
        judge_feedback=judge_feedbacks,
        next_steps=next_steps
    )

# ============================================
# API ENDPOINTS
# ============================================

@app.post("/grade", response_model=ConsensusFeedback)
async def grade_set(request: GradeRequest):
    """
    Grade a comedy set using the judge panel
    """
    try:
        # Initialize judges
        butcher = TheButcher()
        metronome = TheMetronome()
        
        # Get individual feedback
        butcher_feedback = butcher.analyze(request.transcript)
        metronome_feedback = metronome.analyze(request.transcript, request.duration)
        
        judge_feedbacks = [butcher_feedback, metronome_feedback]
        
        # Generate consensus
        consensus = generate_consensus(judge_feedbacks)
        
        return consensus
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "Digital Cellar Grading API",
        "judges": ["The Butcher", "The Metronome"],
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
