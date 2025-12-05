import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Dialogflow Intent Detection
 * 
 * This server-side route handles Dialogflow API calls to protect credentials.
 * Uses Google Cloud Service Account for authentication.
 */

export async function POST(request: NextRequest) {
  try {
    const { text, sessionId, languageCode } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const projectId = process.env.DIALOGFLOW_PROJECT_ID;
    const privateKey = process.env.DIALOGFLOW_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.DIALOGFLOW_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      return NextResponse.json(
        { error: 'Dialogflow credentials not configured' },
        { status: 500 }
      );
    }

    // Get access token using service account
    const accessToken = await getAccessToken(clientEmail, privateKey);

    // Build Dialogflow API request
    const sessionPath = `projects/${projectId}/agent/sessions/${sessionId || 'default'}`;
    const url = `https://dialogflow.googleapis.com/v2/${sessionPath}:detectIntent`;

    const dialogflowResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryInput: {
          text: {
            text: text,
            languageCode: languageCode || 'ml', // Malayalam
          },
        },
      }),
    });

    if (!dialogflowResponse.ok) {
      const errorText = await dialogflowResponse.text();
      console.error('Dialogflow API error:', errorText);
      return NextResponse.json(
        { error: 'Dialogflow API error', details: errorText },
        { status: dialogflowResponse.status }
      );
    }

    const data = await dialogflowResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Dialogflow route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get Google Cloud access token using service account credentials
 * Uses JWT for authentication
 */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Create JWT payload
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://dialogflow.googleapis.com/',
    iat: now,
    exp: expiry,
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signature = await signWithPrivateKey(signatureInput, privateKey);
  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Base64 URL encode (without padding)
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sign data with RSA private key
 */
async function signWithPrivateKey(data: string, privateKey: string): Promise<string> {
  // Import the private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the data
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataBuffer);

  // Convert to base64url
  const signatureArray = new Uint8Array(signatureBuffer);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
  return signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
