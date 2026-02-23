/**
 * PaymentView — shows QR code and payment confirmation
 */
import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentViewProps {
  total: number;
  upiId?: string;
  shopName?: string;
  onPaymentConfirmed?: () => void;
}

export function PaymentView({ total, upiId, shopName, onPaymentConfirmed }: PaymentViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!upiId || total <= 0) return;
    setQrLoading(true);

    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName ?? 'Shop')}&am=${total.toFixed(2)}&cu=INR`;

    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(upiString, { width: 240, margin: 2 }))
      .then((url) => {
        setQrDataUrl(url);
        setQrLoading(false);
      })
      .catch(() => setQrLoading(false));
  }, [upiId, total, shopName]);

  if (!upiId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(total)}</p>
          <p className="text-gray-500 mt-1">ക്യാഷ് പേയ്‌മെൻ്റ്</p>
        </div>
        <button
          onClick={onPaymentConfirmed}
          className="bg-green-500 text-white px-8 py-3 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
        >
          ✓ ചെയ്തു
        </button>
        <p className="text-sm text-gray-400">"ശരി" അല്ലെങ്കിൽ "ഓക്കേ" എന്ന് പറഞ്ഞാലും മതി</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <p className="text-2xl font-bold text-gray-800">{formatCurrency(total)}</p>
      <p className="text-gray-500">GPay / PhonePe / UPI</p>

      {qrLoading && (
        <div className="w-[240px] h-[240px] bg-gray-50 rounded-2xl flex items-center justify-center">
          <RefreshCw size={32} className="text-gray-400 animate-spin" />
        </div>
      )}

      {qrDataUrl && !qrLoading && (
        <div className="p-3 bg-white rounded-2xl shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="UPI QR Code" width={220} height={220} />
        </div>
      )}

      {!qrDataUrl && !qrLoading && (
        <div className="w-[240px] h-[240px] bg-gray-100 rounded-2xl flex items-center justify-center">
          <p className="text-gray-400 text-sm">QR ജനറേറ്റ് ആയില്ല</p>
        </div>
      )}

      <p className="text-xs text-gray-400">{upiId}</p>

      <button
        onClick={onPaymentConfirmed}
        className="bg-green-500 text-white px-8 py-3 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
      >
        ✓ പേയ്‌മെൻ്റ് ചെയ്തു
      </button>
      <p className="text-sm text-gray-400">"ശരി" എന്ന് പറഞ്ഞാലും മതി</p>
    </div>
  );
}
