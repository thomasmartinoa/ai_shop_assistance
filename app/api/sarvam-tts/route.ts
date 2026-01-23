import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Sarvam AI Text-to-Speech API
 * Uses Bulbul v2 model for natural Malayalam voice generation
 * Docs: https://docs.sarvam.ai/api-reference-docs/endpoints/speech-to-text
 */
export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'ml' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey || apiKey === 'your-sarvam-api-key-here') {
      console.warn('⚠️ Sarvam API key not configured, falling back to Google TTS');
      return NextResponse.json(
        { error: 'Sarvam API not configured', fallback: true },
        { status: 503 }
      );
    }

    console.log('🔊 Sarvam TTS: Generating speech for:', text.substring(0, 50) + '...', 'lang:', lang);

    // Sarvam AI TTS endpoint
    const sarvamUrl = 'https://api.sarvam.ai/text-to-speech';

    const response = await fetch(sarvamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: lang === 'ml' ? 'ml-IN' : lang,
        speaker: 'karun', // Male Malayalam voice (karun/meera for female)
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1', // Latest Bulbul model for natural Malayalam
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔊 Sarvam TTS error:', response.status, errorText);
      
      return NextResponse.json(
        { error: 'Sarvam API error', details: errorText, fallback: true },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Sarvam returns base64 audio in the response
    if (!data.audios || !data.audios[0]) {
      console.error('🔊 Sarvam TTS: No audio in response');
      return NextResponse.json(
        { error: 'No audio generated', fallback: true },
        { status: 500 }
      );
    }

    // Get base64 audio and create data URL
    const base64Audio = data.audios[0];
    const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

    console.log('🔊 Sarvam TTS: Successfully generated Malayalam audio');

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
      format: 'wav',
      provider: 'sarvam',
      language: lang,
    });

  } catch (error) {
    console.error('🔊 Sarvam TTS error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: true 
      },
      { status: 500 }
    );
  }
}
