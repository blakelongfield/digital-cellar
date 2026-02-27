import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Allow larger uploads for long sets (e.g. 10 min video)
export const maxDuration = 60;

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptResponse {
  text: string;
  timestamps: TranscriptSegment[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Transcription not configured (missing OPENAI_API_KEY)' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing or invalid file in form data (use field name "file")' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // verbose_json returns { text, segments?: Array<{ start, end, text }>, ... }
    const segments = (transcription as { segments?: Array<{ start: number; end: number; text: string }> }).segments ?? [];
    const timestamps: TranscriptSegment[] = segments.map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text?.trim() ?? '',
    }));

    const response: TranscriptResponse = {
      text: typeof transcription.text === 'string' ? transcription.text : '',
      timestamps,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Transcribe API error:', err);
    const message = err instanceof Error ? err.message : 'Transcription failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
