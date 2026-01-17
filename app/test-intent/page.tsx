'use client';

import { useState } from 'react';
import { detectIntentEnhanced } from '@/lib/nlp/enhanced-matcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TestIntentPage() {
  const [testText, setTestText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const testPhrases = [
    'രണ്ട് കിലോ അരി',
    'പഞ്ചസാര മൂന്ന് കിലോ',
    'ബിൽ ചെയ്യൂ',
    'മതി',
    'കഴിഞ്ഞു',
    'ടോട്ടൽ എത്ര',
    'ഇനിയും വേണം',
    'കൂടി',
    'അരി മാറ്റുക',
    'QR കാണിക്കുക',
    'കാഷ്',
    '5 kg rice',
    'add sugar',
    'bill it',
    'done',
    'more',
  ];

  const handleTest = () => {
    if (!testText.trim()) return;
    
    const result = detectIntentEnhanced(testText);
    setResult(result);
    setHistory(prev => [{
      text: testText,
      result,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev.slice(0, 9)]);
  };

  const handleQuickTest = (phrase: string) => {
    setTestText(phrase);
    const result = detectIntentEnhanced(phrase);
    setResult(result);
    setHistory(prev => [{
      text: phrase,
      result,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev.slice(0, 9)]);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🧠 Intent Detection Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTest()}
              placeholder="Type Malayalam or English command..."
              className="text-lg"
            />
            <Button onClick={handleTest}>Test</Button>
          </div>

          {result && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2">
              <div className="text-lg font-bold">
                Intent: <span className="text-blue-600">{result.intent}</span>
              </div>
              <div className="text-md">
                Confidence: <span className={result.confidence > 0.7 ? 'text-green-600' : 'text-orange-600'}>
                  {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              {result.entities && Object.keys(result.entities).length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold">Entities:</div>
                  <pre className="text-sm bg-white dark:bg-slate-900 p-2 rounded">
                    {JSON.stringify(result.entities, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="text-sm font-semibold mb-2">Quick Test Phrases:</div>
            <div className="flex flex-wrap gap-2">
              {testPhrases.map((phrase, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickTest(phrase)}
                  className="text-xs"
                >
                  {phrase}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">{item.text}</span>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-blue-600">{item.result.intent}</span>
                    {' · '}
                    <span className={item.result.confidence > 0.7 ? 'text-green-600' : 'text-orange-600'}>
                      {(item.result.confidence * 100).toFixed(0)}%
                    </span>
                    {item.result.entities?.product && (
                      <span> · 📦 {item.result.entities.product}</span>
                    )}
                    {item.result.entities?.quantity && (
                      <span> · 🔢 {item.result.entities.quantity} {item.result.entities.unit || ''}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📝 Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Open Browser Console (F12)</strong> to see detailed logs with the 🔍 emoji showing the matching process.</p>
          <p>Test various Malayalam phrases and check:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Intent accuracy (should match what you intended)</li>
            <li>Confidence score (higher is better, {'>'} 70% is good)</li>
            <li>Entity extraction (product name, quantity, unit)</li>
          </ul>
          <p className="text-amber-600">
            <strong>Note:</strong> The console logs will show the fuzzy matching process and which patterns matched.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
