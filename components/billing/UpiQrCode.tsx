'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  size?: number;
}

/**
 * Generates a UPI payment QR code
 * UPI URL format: upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR&tn={note}
 */
export function UpiQrCode({
  upiId,
  payeeName,
  amount,
  transactionNote = 'Bill Payment',
  size = 200,
}: UpiQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;

      try {
        // Build UPI URL following NPCI specs
        const upiUrl = buildUpiUrl({
          pa: upiId, // Payee VPA
          pn: payeeName, // Payee Name
          am: amount.toFixed(2), // Amount
          cu: 'INR', // Currency
          tn: transactionNote, // Transaction Note
        });

        await QRCode.toCanvas(canvasRef.current, upiUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });

        setError(null);
      } catch (err) {
        console.error('QR generation error:', err);
        setError('Failed to generate QR code');
      }
    };

    if (upiId && amount > 0) {
      generateQR();
    }
  }, [upiId, payeeName, amount, transactionNote, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!upiId) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-muted-foreground text-center p-4">
          Configure UPI ID in Settings to enable payments
        </p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Build UPI URL from parameters
 */
function buildUpiUrl(params: Record<string, string>): string {
  const queryString = Object.entries(params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `upi://pay?${queryString}`;
}

/**
 * Generate UPI QR as data URL (for downloading/printing)
 */
export async function generateUpiQrDataUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  transactionNote?: string
): Promise<string> {
  const upiUrl = buildUpiUrl({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: transactionNote || 'Bill Payment',
  });

  return QRCode.toDataURL(upiUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}
