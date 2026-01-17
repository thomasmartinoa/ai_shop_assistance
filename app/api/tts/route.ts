import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Sarvam AI Bulbul - Generative AI TTS for Malayalam
// Sign up at: https://dashboard.sarvam.ai to get API key
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_API_URL = 'https://api.sarvam.ai/text-to-speech';

// Available speakers for Malayalam (Bulbul v2)
// Female: Anushka, Manisha, Vidya, Arya
// Male: Abhilash, Karun, Hitesh
type SarvamSpeaker = 'Anushka' | 'Manisha' | 'Vidya' | 'Arya' | 'Abhilash' | 'Karun' | 'Hitesh';

interface SarvamTTSRequest {
  inputs: string[];
  target_language_code: string;
  speaker: SarvamSpeaker;
  model: string;
  pitch?: number;       // -0.5 to 0.5, default 0
  pace?: number;        // 0.5 to 2.0, default 1
  loudness?: number;    // 0.5 to 2.0, default 1
  enable_preprocessing?: boolean;
}

interface SarvamTTSResponse {
  audios: string[];  // Base64 encoded WAV audio
}

// Generate speech using Sarvam AI Bulbul (Generative AI)
async function generateWithSarvam(
  text: string, 
  speaker: SarvamSpeaker = 'Anushka',
  pace: number = 1.0
): Promise<{ audioUrl: string; format: string } | null> {
  if (!SARVAM_API_KEY) {
    console.log('🔊 Sarvam API key not configured, will use fallback');
    return null;
  }

  try {
    console.log('🔊 Sarvam AI: Generating speech with Bulbul v2...');
    console.log('🔊 Speaker:', speaker, '| Pace:', pace);

    const requestBody: SarvamTTSRequest = {
      inputs: [text],
      target_language_code: 'ml-IN',  // Malayalam
      speaker: speaker,
      model: 'bulbul:v2',
      pace: pace,
      enable_preprocessing: true,
    };

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
    
    if (!data.audios || data.audios.length === 0) {
      console.error('🔊 Sarvam API returned no audio');
      return null;
    }

    const base64Audio = data.audios[0];
    const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

    console.log('🔊 Sarvam AI: Successfully generated generative audio');
    
    return {
      audioUrl: audioDataUrl,
      format: 'wav',
    };
  } catch (error) {
    console.error('🔊 Sarvam AI error:', error);
    return null;
  }
}

// Fallback: Google Translate TTS (robotic but reliable)
async function generateWithGoogleTranslate(text: string, lang: string = 'ml'): Promise<{ audioUrl: string; format: string } | null> {
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
    };
  } catch (error) {
    console.error('🔊 Google Translate error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'ml', speaker = 'Anushka', pace = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('🔊 TTS API: Generating speech for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

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

    console.log('🔊 TTS API: Successfully generated audio using:', provider);

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
      format: result.format,
      provider: provider,
    });

  } catch (error) {
    console.error('🔊 TTS API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
