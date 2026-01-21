# Sarvam AI Malayalam Voice Integration

## Overview
This project now uses **Sarvam AI's Bulbul v2** model for natural Malayalam text-to-speech (TTS) output across the entire application.

## Implementation Details

### Architecture
```
User Action → voice.speak() → useVoice Hook → Sarvam TTS API → Audio Playback
                                    ↓ (on error)
                              Google TTS Fallback → Audio Playback
                                    ↓ (on error)
                              Browser TTS → Speech Synthesis
```

### Files Modified

1. **`hooks/useVoice.ts`** - Core voice handling hook
   - Added `speakWithSarvamTTS()` function as primary Malayalam TTS
   - Kept `speakWithGoogleTTS()` as fallback
   - Updated `speak()` function to prioritize Sarvam AI for Malayalam

2. **`app/api/sarvam-tts/route.ts`** - New API endpoint
   - Server-side Sarvam AI API integration
   - Uses Bulbul v2 model with 'meera' (female) voice
   - Returns base64-encoded WAV audio
   - Automatic fallback handling on errors

3. **`app/api/tts/route.ts`** - Existing Google TTS fallback
   - Kept as secondary fallback option
   - Used when Sarvam API is unavailable or errors

### Sarvam AI Configuration

#### API Settings
- **Endpoint**: `https://api.sarvam.ai/text-to-speech`
- **Model**: `bulbul:v1` (Latest natural voice model)
- **Speaker**: `meera` (Female Malayalam voice)
  - Alternative: `arvind` for male voice
- **Parameters**:
  - `pitch`: 0 (neutral)
  - `pace`: 1.0 (normal speed)
  - `loudness`: 1.5 (enhanced clarity)
  - `speech_sample_rate`: 8000 Hz
  - `enable_preprocessing`: true (better text normalization)

#### Environment Variable
```env
SARVAM_API_KEY=your-api-key-here
```
Get your API key from: https://dashboard.sarvam.ai

### Usage Across Application

All Malayalam speech output automatically uses Sarvam AI:

#### Billing Page (`app/(app)/billing/page.tsx`)
- ✅ Product addition confirmations
- ✅ Cart summary announcements  
- ✅ Payment method prompts
- ✅ Transaction completion messages
- ✅ Error messages
- ✅ Help instructions

#### Inventory Page (`app/(app)/inventory/page.tsx`)
- ✅ Stock update confirmations
- ✅ Low stock alerts
- ✅ Product search results
- ✅ Help instructions

#### Future Pages
Any page using `voice.speak()` will automatically benefit from Sarvam AI Malayalam TTS.

### Fallback Chain

1. **Primary: Sarvam AI TTS**
   - Natural Malayalam voice with Bulbul v2
   - Best quality and pronunciation
   - Requires API key and internet

2. **Fallback: Google TTS**
   - Server-side Google Translate TTS
   - Good Malayalam support
   - No API key required

3. **Final Fallback: Browser TTS**
   - Browser's built-in speech synthesis
   - Limited Malayalam support
   - Works offline

### Testing

To test Sarvam AI integration:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to Billing or Inventory page

3. Click voice button or trigger any Malayalam speech

4. Check browser console for logs:
   ```
   🔊 Speaking with Sarvam AI TTS: ...
   🔊 Sarvam audio ready, playing...
   🔊 Sarvam Malayalam speech started
   🔊 Sarvam Malayalam speech ended
   ```

### Error Handling

The implementation includes comprehensive error handling:

- **API Key Missing**: Falls back to Google TTS
- **Network Error**: Falls back to Google TTS
- **Audio Playback Error**: Falls back to Google TTS
- **All Failures**: Falls back to browser TTS

Console logs show the fallback chain in action:
```
🔊 Sarvam TTS API error: 503
🔊 Falling back to Google TTS...
```

### Performance

- **Audio Format**: WAV (8kHz sample rate)
- **Latency**: ~1-2 seconds for audio generation
- **Caching**: Browser caches Audio elements
- **Volume**: Set to 100% (1.0) for clarity

### Advantages Over Previous Implementation

| Feature | Google TTS | Sarvam AI |
|---------|-----------|-----------|
| Malayalam Pronunciation | Good | Excellent |
| Natural Voice | Basic | Very Natural |
| Emotion/Tone | Limited | Natural |
| API Key Required | No | Yes |
| Cost | Free (unofficial) | Paid (with free tier) |
| Reliability | Medium | High |
| Malayalam Support | Good | Excellent |

### Future Enhancements

1. **Voice Selection**: Allow users to choose between male/female voices
2. **Speed Control**: Add user preference for speech rate
3. **Audio Caching**: Cache frequently used phrases
4. **Batch Processing**: Generate multiple audio files in parallel
5. **Offline Mode**: Pre-generate common phrases for offline use

### Troubleshooting

**Problem**: No Sarvam voice, falls back to Google TTS
- **Solution**: Check `SARVAM_API_KEY` in `.env.local`
- **Solution**: Verify API key is valid at https://dashboard.sarvam.ai

**Problem**: Audio doesn't play
- **Solution**: Check browser console for errors
- **Solution**: Ensure browser allows audio autoplay
- **Solution**: Check network tab for API response

**Problem**: Poor audio quality
- **Solution**: Adjust `loudness` and `pitch` parameters in `app/api/sarvam-tts/route.ts`
- **Solution**: Try different sample rates (8000, 16000, 22050)

### API Rate Limits

Sarvam AI free tier limits:
- Check current limits at: https://docs.sarvam.ai/pricing
- Monitor usage in Sarvam dashboard
- Implement request throttling if needed

### Credits

- **Sarvam AI**: https://sarvam.ai
- **Bulbul Model**: https://docs.sarvam.ai/models/bulbul
- **Malayalam TTS Documentation**: https://docs.sarvam.ai/api-reference-docs/endpoints/text-to-speech
