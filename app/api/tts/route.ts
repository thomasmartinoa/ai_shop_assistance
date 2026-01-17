import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Sarvam AI Bulbul - Generative AI TTS for Malayalam
// Sign up at: https://dashboard.sarvam.ai to get API key
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';

// Available speakers for Malayalam (Bulbul v2) - MUST BE LOWERCASE
// Female: anushka, manisha, vidya, arya
// Male: abhilash, karun, hitesh
type SarvamSpeaker = 'anushka' | 'manisha' | 'vidya' | 'arya' | 'abhilash' | 'karun' | 'hitesh';

// Valid speakers list for validation
const VALID_SPEAKERS: SarvamSpeaker[] = ['anushka', 'manisha', 'vidya', 'arya', 'abhilash', 'karun', 'hitesh'];

interface SarvamTTSRequest {
  text: string;                    // Single text input (not array for real-time API)
  target_language_code: string;
  speaker: SarvamSpeaker;
  model: string;
  pitch?: number;       // -0.5 to 0.5, default 0
  pace?: number;        // 0.5 to 2.0, default 1.0
  loudness?: number;    // 0.5 to 2.0, default 1.0
  enable_preprocessing?: boolean;
  audio_format?: string; // wav, mp3, etc.
}

interface SarvamTTSResponse {
  audios: string[];  // Base64 encoded audio
  request_id?: string;
}

// Generate speech using Sarvam AI Bulbul (Generative AI)
async function generateWithSarvam(
  text: string, 
  speaker: SarvamSpeaker = 'anushka',
  pace: number = 1.0
): Promise<{ audioUrl: string; format: string; speaker: string } | null> {
  if (!SARVAM_API_KEY) {
    console.log('🔊 Sarvam API key not configured, will use fallback');
    return null;
  }

  // Validate and normalize speaker name (must be lowercase)
  const normalizedSpeaker = speaker.toLowerCase() as SarvamSpeaker;
  if (!VALID_SPEAKERS.includes(normalizedSpeaker)) {
    console.log(`🔊 Invalid speaker "${speaker}", using default "anushka"`);
  }
  const finalSpeaker = VALID_SPEAKERS.includes(normalizedSpeaker) ? normalizedSpeaker : 'anushka';

  try {
    console.log('🔊 Sarvam AI: Generating speech with Bulbul v2...');
    console.log('🔊 Text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    console.log('🔊 Speaker:', finalSpeaker, '| Pace:', pace);

    const requestBody: SarvamTTSRequest = {
      text: text,                          // Single text, not array
      target_language_code: 'ml-IN',       // Malayalam
      speaker: finalSpeaker,               // Lowercase speaker name
      model: 'bulbul:v2',
      pace: Math.max(0.5, Math.min(2.0, pace)),  // Clamp between 0.5-2.0
      enable_preprocessing: true,
      audio_format: 'wav',
    };

    console.log('🔊 Sarvam Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔊 Sarvam API error:', response.status, errorText);
      return null;
    }

    const data: SarvamTTSResponse = await response.json();
    console.log('🔊 Sarvam Response received, request_id:', data.request_id);
    
    if (!data.audios || data.audios.length === 0) {
      console.error('🔊 Sarvam API returned no audio');
      return null;
    }

    const base64Audio = data.audios[0];
    const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

    console.log('🔊 Sarvam AI: Successfully generated audio with speaker:', finalSpeaker);
    
    return {
      audioUrl: audioDataUrl,
      format: 'wav',
      speaker: finalSpeaker,
    };
  } catch (error) {
    console.error('🔊 Sarvam AI error:', error);
    return null;
  }
}

// Fallback: Google Translate TTS (robotic but reliable)
async function generateWithGoogleTranslate(text: string, lang: string = 'ml'): Promise<{ audioUrl: string; format: string; speaker: string } | null> {
  try {
    console.log('🔊 Fallback: Using Google Translate TTS...');
    
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      console.error('🔊 Google Translate error:', response.status);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('🔊 Google Translate: Generated audio, size:', audioBuffer.byteLength, 'bytes');
    
    return {
      audioUrl: audioDataUrl,
      format: 'mp3',
      speaker: 'google-default',
    };
  } catch (error) {
    console.error('🔊 Google Translate error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'ml', speaker = 'anushka', pace = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('🔊 TTS API Request:');
    console.log('  - Text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    console.log('  - Speaker:', speaker);
    console.log('  - Pace:', pace);

    // Try Sarvam AI first (generative, natural voice)
    let result = await generateWithSarvam(text, speaker as SarvamSpeaker, pace);
    let provider = 'sarvam';

    // Fallback to Google Translate if Sarvam fails
    if (!result) {
      result = await generateWithGoogleTranslate(text, lang);
      provider = 'google';
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate speech from all providers' },
        { status: 500 }
      );
    }

    console.log('🔊 TTS API: Successfully generated audio using:', provider, 'speaker:', (result as { speaker?: string }).speaker || 'N/A');

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      format: result.format,
      provider: provider,
      speaker: (result as { speaker?: string }).speaker || speaker,
    });

  } catch (error) {
    console.error('🔊 TTS API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
