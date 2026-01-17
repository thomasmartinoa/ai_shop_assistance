'use client';

import { useState } from 'react';
import { detectIntent, isDialogflowConfigured } from '@/lib/nlp/dialogflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DialogflowTestPage() {
  const [testText, setTestText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const isConfigured = isDialogflowConfigured();

  const testDialogflow = async () => {
    if (!testText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const response = await detectIntent(testText);
      const duration = Date.now() - startTime;

      if (response) {
        setResult({ ...response, duration });
        setHistory(prev => [{
          text: testText,
          result: response,
          duration,
          timestamp: new Date().toLocaleTimeString(),
          success: true,
        }, ...prev.slice(0, 9)]);
      } else {
        setError('Dialogflow returned null - check console for errors');
        setHistory(prev => [{
          text: testText,
          error: 'Returned null',
          timestamp: new Date().toLocaleTimeString(),
          success: false,
        }, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setHistory(prev => [{
        text: testText,
        error: errorMsg,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const testPhrases = [
    'രണ്ട് കിലോ അരി',
    'ബിൽ ചെയ്യൂ',
    'ടോട്ടൽ എത്ര',
    'QR കാണിക്കുക',
    'test',
    'hello',
  ];

  const checkEnvVars = () => {
    console.log('🔍 Checking Dialogflow Environment Variables:');
    console.log('NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID:', process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID ? '✅ Set' : '❌ Not set');
    console.log('DIALOGFLOW_PROJECT_ID:', process.env.DIALOGFLOW_PROJECT_ID ? '✅ Set (server-side)' : '❌ Not set');
    console.log('DIALOGFLOW_CLIENT_EMAIL:', process.env.DIALOGFLOW_CLIENT_EMAIL ? '✅ Set (server-side)' : '❌ Not set');
    console.log('DIALOGFLOW_PRIVATE_KEY:', process.env.DIALOGFLOW_PRIVATE_KEY ? '✅ Set (server-side)' : '❌ Not set');
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🤖 Dialogflow Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className={`p-4 rounded-lg border ${isConfigured ? 'bg-green-50 border-green-200 dark:bg-green-950' : 'bg-red-50 border-red-200 dark:bg-red-950'}`}>
            {isConfigured ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-400">Dialogflow Configured</div>
                  <div className="text-sm text-green-600">
                    NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID is set. The app will attempt to use Dialogflow.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-700 dark:text-red-400">Dialogflow Not Configured</div>
                  <div className="text-sm text-red-600">
                    NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID is not set. The app will use local pattern matching only.
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={checkEnvVars} variant="outline" size="sm">
            Check Environment Variables (see console)
          </Button>

          {/* Test Input */}
          <div className="flex gap-2">
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testDialogflow()}
              placeholder="Type a Malayalam or English phrase to test..."
              disabled={!isConfigured || loading}
              className="text-lg"
            />
            <Button 
              onClick={testDialogflow} 
              disabled={!isConfigured || loading || !testText.trim()}
            >
              {loading ? 'Testing...' : 'Test'}
            </Button>
          </div>

          {/* Quick Test Buttons */}
          {isConfigured && (
            <div>
              <div className="text-sm font-semibold mb-2">Quick Test:</div>
              <div className="flex flex-wrap gap-2">
                {testPhrases.map((phrase, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTestText(phrase);
                      setTimeout(() => testDialogflow(), 100);
                    }}
                    disabled={loading}
                  >
                    {phrase}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-700 dark:text-red-400">Error</div>
                  <div className="font-mono text-xs text-red-600 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2 border border-green-200">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">
                ✅ Dialogflow Response Received ({result.duration}ms)
              </div>
              <div className="space-y-1 text-sm">
                <div><strong>Intent:</strong> <span className="text-blue-600 font-mono">{result.intent}</span></div>
                <div><strong>Confidence:</strong> <span className={result.confidence > 0.7 ? 'text-green-600' : 'text-orange-600'}>
                  {(result.confidence * 100).toFixed(0)}%
                </span></div>
                {result.fulfillmentText && (
                  <div><strong>Response:</strong> {result.fulfillmentText}</div>
                )}
                {result.entities && Object.keys(result.entities).length > 0 && (
                  <div>
                    <strong>Entities:</strong>
                    <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded mt-1">
                      {JSON.stringify(result.entities, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded text-sm ${
                    item.success 
                      ? 'bg-green-50 dark:bg-green-950 border border-green-200' 
                      : 'bg-red-50 dark:bg-red-950 border border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs">{item.text}</span>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                  <div className="text-xs mt-1">
                    {item.success ? (
                      <>
                        <span className="text-green-600">✓</span>
                        {' '}
                        <span className="text-blue-600">{item.result.intent}</span>
                        {' · '}
                        <span>{(item.result.confidence * 100).toFixed(0)}%</span>
                        {' · '}
                        <span>{item.duration}ms</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-600">✗</span>
                        {' '}
                        <span className="text-red-600">{item.error}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Diagnostics Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <strong>If Dialogflow is configured but not working:</strong>
            <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
              <li>Check browser console (F12) for error messages</li>
              <li>Click "Check Environment Variables" and verify all are set</li>
              <li>Test with simple phrases like "test" or "hello"</li>
              <li>Check server terminal for API errors</li>
              <li>Verify service account has Dialogflow API access</li>
              <li>Ensure Dialogflow agent is created in correct project</li>
            </ol>
          </div>
          
          <div>
            <strong>Common Issues:</strong>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>❌ <strong>"Dialogflow returned null"</strong> - API route error or auth failure</li>
              <li>❌ <strong>"401 Unauthorized"</strong> - Invalid service account credentials</li>
              <li>❌ <strong>"404 Not Found"</strong> - Wrong project ID or agent not created</li>
              <li>❌ <strong>"Connection timeout"</strong> - Network or firewall issue</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-700 dark:text-blue-400">Note</div>
                <div className="text-sm text-blue-600">
                  Even if Dialogflow is not working, the app will fall back to local pattern matching 
                  (enhanced-matcher.ts) which should handle most Malayalam commands correctly.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
