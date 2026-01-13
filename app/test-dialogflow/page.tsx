'use client';

/**
 * Dialogflow Test Page
 * 
 * Use this page to debug your Dialogflow setup and see exactly what's happening.
 * Access at: http://localhost:3000/test-dialogflow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { detectIntent } from '@/lib/nlp/dialogflow';

export default function DialogflowTestPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPhrases = [
    'രണ്ട് കിലോ അരി',
    'ഒരു കിലോ പഞ്ചസാര',
    '3 litre വെളിച്ചെണ്ണ',
    'അരി മാറ്റുക',
    'ബിൽ ക്ലിയർ',
    'ടോട്ടൽ എത്ര',
    'അരി എത്ര ഉണ്ട്',
    'QR കാണിക്കുക',
    'നമസ്കാരം',
  ];

  const testDialogflow = async (testText: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setText(testText);

    try {
      console.log('[Test] Sending to Dialogflow:', testText);
      const response = await detectIntent(testText);
      
      if (response) {
        console.log('[Test] Dialogflow Response:', response);
        setResult(response);
      } else {
        setError('No response from Dialogflow. Check console logs.');
      }
    } catch (err) {
      console.error('[Test] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      testDialogflow(text.trim());
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔧 Dialogflow Test Page</h1>
      
      {/* Instructions */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>📋 How to Use This Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Open Browser Console (F12)</strong> - This shows detailed Dialogflow responses</p>
          <p><strong>2. Click a test phrase below</strong> - Or type your own</p>
          <p><strong>3. Check the results:</strong></p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Intent:</strong> Should match what you expect (e.g., billing.add)</li>
            <li><strong>Confidence:</strong> Should be {">"} 0.8 for good accuracy</li>
            <li><strong>Entities:</strong> Product, quantity, unit should be extracted</li>
          </ul>
          <p className="text-blue-700 font-semibold mt-3">
            ⚠️ If confidence is low or entities missing, check DIALOGFLOW_FIX.md guide
          </p>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Custom Text</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type Malayalam/English text to test..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !text.trim()}>
              {loading ? 'Testing...' : 'Test'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Test Buttons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Test Phrases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testPhrases.map((phrase, idx) => (
              <Button
                key={idx}
                onClick={() => testDialogflow(phrase)}
                variant="outline"
                disabled={loading}
                className="justify-start"
              >
                {phrase}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Dialogflow Response
              <span className="text-sm font-normal text-gray-600">[dialogflow]</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Intent */}
            <div>
              <div className="text-sm font-semibold text-gray-600">Intent Detected:</div>
              <div className="text-lg font-mono bg-white p-2 rounded border">
                {result.intent}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="text-sm font-semibold text-gray-600">Confidence Score:</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {result.confidence >= 0.8 && '✅ Excellent - This should work well'}
                {result.confidence >= 0.5 && result.confidence < 0.8 && '⚠️ Fair - Add more training phrases'}
                {result.confidence < 0.5 && '❌ Poor - Check intent configuration'}
              </div>
            </div>

            {/* Entities */}
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">Entities Extracted:</div>
              <div className="bg-white p-3 rounded border space-y-2">
                {result.entities.product && (
                  <div className="flex gap-2">
                    <span className="font-semibold">Product:</span>
                    <span className="font-mono">{result.entities.product}</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                {result.entities.quantity && (
                  <div className="flex gap-2">
                    <span className="font-semibold">Quantity:</span>
                    <span className="font-mono">{result.entities.quantity}</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                {result.entities.unit && (
                  <div className="flex gap-2">
                    <span className="font-semibold">Unit:</span>
                    <span className="font-mono">{result.entities.unit}</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
                {!result.entities.product && !result.entities.quantity && !result.entities.unit && (
                  <div className="text-gray-500 italic">No entities extracted</div>
                )}
              </div>
            </div>

            {/* Raw Query */}
            <div>
              <div className="text-sm font-semibold text-gray-600">Your Query:</div>
              <div className="text-gray-700 bg-white p-2 rounded border">
                {result.rawQuery}
              </div>
            </div>

            {/* Fulfillment Text */}
            {result.fulfillmentText && (
              <div>
                <div className="text-sm font-semibold text-gray-600">Dialogflow Response:</div>
                <div className="text-gray-700 bg-white p-2 rounded border">
                  {result.fulfillmentText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <div className="mt-4 text-sm">
              <p className="font-semibold">Common Issues:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Dialogflow API not enabled in Google Cloud</li>
                <li>Credentials not configured in .env.local</li>
                <li>No intents created in Dialogflow Console</li>
                <li>Service account doesn't have "Dialogflow API Client" role</li>
              </ul>
              <p className="mt-3 text-blue-600">
                👉 Check the browser console (F12) for detailed error messages
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle>🔍 Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold">Project ID:</span>
            <span className="font-mono">
              {process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID || '❌ Not configured'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">Dialogflow Status:</span>
            <span className={process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID ? '✅ Configured' : '❌ Not configured'}
            </span>
          </div>
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="font-semibold mb-2">Next Steps:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Check browser console (F12) for detailed logs</li>
              <li>Read <strong>DIALOGFLOW_FIX.md</strong> for complete setup guide</li>
              <li>Verify intents created in Dialogflow Console</li>
              <li>Test each intent with 3+ variations</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Console Hint */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm">
          <strong>💡 Pro Tip:</strong> Keep the browser console (F12) open while testing.
          You'll see detailed logs like:
        </p>
        <pre className="text-xs mt-2 bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
{`[Dialogflow Response] { queryText: "രണ്ട് കിലോ അരി", intent: "billing.add", ... }
[Dialogflow Parsed] { intent: "billing.add", confidence: 0.95, entities: {...} }`}
        </pre>
      </div>
    </div>
  );
}
