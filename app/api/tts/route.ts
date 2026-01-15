import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * TTS API Route - Server-side proxy for Malayalam text-to-speech
 * 
 * This bypasses CORS issues by fetching TTS audio server-side.
 * Currently uses Google Translate TTS as a temporary solution.
 * 
 * TODO: Replace with Google Cloud Text-to-Speech API for production:
 * - More reliable and officially supported
 * - Better voice quality (WaveNet voices)
 * - Requires GOOGLE_TTS_API_KEY in .env.local
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

    console.log('🔊 TTS API: Generating speech for:', text, 'lang:', lang);

    // Google Translate TTS URL (unofficial API - temporary solution)
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;

    // Fetch audio from Google Translate server-side
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      console.error('🔊 TTS API: Google Translate error:', response.status);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    // Get audio data as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easy client-side playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    console.log('🔊 TTS API: Successfully generated audio, size:', audioBuffer.byteLength, 'bytes');

    return NextResponse.json({
      success: true,
      audioUrl: audioDataUrl,
      format: 'mp3',
    });

  } catch (error) {
    console.error('🔊 TTS API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
