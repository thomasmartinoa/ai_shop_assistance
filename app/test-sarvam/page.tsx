'use client';

import { useState } from 'react';

const SPEAKERS = [
  { name: 'Anushka', gender: 'Female', description: 'Natural female voice' },
  { name: 'Manisha', gender: 'Female', description: 'Warm female voice' },
  { name: 'Vidya', gender: 'Female', description: 'Clear female voice' },
  { name: 'Arya', gender: 'Female', description: 'Young female voice' },
  { name: 'Abhilash', gender: 'Male', description: 'Natural male voice' },
  { name: 'Karun', gender: 'Male', description: 'Deep male voice' },
  { name: 'Hitesh', gender: 'Male', description: 'Clear male voice' },
];

const SAMPLE_TEXTS = [
  { label: 'Greeting', text: 'നമസ്കാരം, ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?' },
  { label: 'Product Added', text: 'അരി രണ്ട് കിലോ ചേർത്തു. ആകെ ഇരുപത് രൂപ' },
  { label: 'Cart Total', text: 'നിങ്ങളുടെ കാർട്ടിൽ മൂന്ന് ഇനങ്ങൾ ഉണ്ട്. ആകെ തുക നൂറ്റി അമ്പത് രൂപ' },
  { label: 'Confirmation', text: 'പേയ്‌മെന്റ് വിജയകരമായി. നന്ദി!' },
  { label: 'English Mix', text: 'Welcome! 2 kg rice added to cart.' },
];

export default function TestSarvamPage() {
  const [selectedSpeaker, setSelectedSpeaker] = useState('Anushka');
  const [customText, setCustomText] = useState('');
  const [pace, setPace] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{
    provider?: string;
    format?: string;
    error?: string;
    time?: number;
  } | null>(null);

  const playAudio = async (text: string) => {
    if (!text.trim()) return;
    
    setIsPlaying(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speaker: selectedSpeaker,
          pace,
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;

      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          setResult({ error: 'Audio playback failed' });
        };
        await audio.play();
        
        setResult({
          provider: data.provider,
          format: data.format,
          time: elapsed,
        });
      } else {
        setIsPlaying(false);
        setResult({ error: data.error || 'Failed to generate audio' });
      }
    } catch (error) {
      setIsPlaying(false);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          🎙️ Sarvam AI Voice Test
        </h1>
        <p className="text-purple-200 mb-8">
          Test the generative AI Malayalam voice powered by Sarvam Bulbul v2
        </p>

        {/* Status Card */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.error ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
            {result.error ? (
              <p className="text-red-300">❌ Error: {result.error}</p>
            ) : (
              <div className="text-green-300">
                <p>✅ Audio generated successfully!</p>
                <p className="text-sm mt-1">
                  Provider: <span className="font-bold">{result.provider === 'sarvam' ? '🌟 Sarvam AI (Generative)' : '🔄 Google Translate (Fallback)'}</span>
                  {' | '}Format: {result.format?.toUpperCase()}
                  {' | '}Time: {result.time}ms
                </p>
              </div>
            )}
          </div>
        )}

        {/* Speaker Selection */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">🗣️ Select Speaker</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SPEAKERS.map((speaker) => (
              <button
                key={speaker.name}
                onClick={() => setSelectedSpeaker(speaker.name)}
                className={`p-3 rounded-lg transition-all ${
                  selectedSpeaker === speaker.name
                    ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <div className="font-medium">{speaker.name}</div>
                <div className="text-xs opacity-75">{speaker.gender}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pace Control */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">⚡ Speech Pace</h2>
          <div className="flex items-center gap-4">
            <span className="text-white">Slow</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pace}
              onChange={(e) => setPace(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white">Fast</span>
            <span className="bg-purple-500 text-white px-3 py-1 rounded-lg font-mono">
              {pace.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Sample Texts */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">📝 Quick Test Phrases</h2>
          <div className="space-y-3">
            {SAMPLE_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => playAudio(sample.text)}
                disabled={isPlaying}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  isPlaying
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <div className="text-purple-300 text-sm font-medium">{sample.label}</div>
                <div className="text-white">{sample.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Text */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">✍️ Custom Text</h2>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type or paste Malayalam text here..."
            className="w-full p-4 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/20 focus:border-purple-400 focus:outline-none resize-none"
            rows={3}
          />
          <button
            onClick={() => playAudio(customText)}
            disabled={isPlaying || !customText.trim()}
            className={`mt-4 w-full py-3 rounded-lg font-semibold transition-all ${
              isPlaying || !customText.trim()
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            {isPlaying ? '🔊 Playing...' : '▶️ Play Custom Text'}
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-yellow-300 mb-3">⚙️ Setup Instructions</h2>
          <ol className="list-decimal list-inside text-yellow-100 space-y-2">
            <li>Go to <a href="https://dashboard.sarvam.ai" target="_blank" rel="noopener noreferrer" className="text-yellow-300 underline">dashboard.sarvam.ai</a> and create an account</li>
            <li>Navigate to API Keys section and generate a new key</li>
            <li>Add to your <code className="bg-black/30 px-2 py-0.5 rounded">.env.local</code> file:</li>
          </ol>
          <pre className="mt-3 p-3 bg-black/30 rounded-lg text-sm text-green-300 overflow-x-auto">
            SARVAM_API_KEY=your-api-key-here
          </pre>
          <p className="mt-3 text-yellow-200 text-sm">
            Without the API key, the system will fallback to Google Translate (robotic voice).
          </p>
        </div>
      </div>
    </div>
  );
}
