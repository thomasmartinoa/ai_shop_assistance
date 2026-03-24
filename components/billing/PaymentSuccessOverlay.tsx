'use client';

import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  amount: number;
  paymentMethod: 'cash' | 'upi';
  onDismiss: () => void;
}

const PARTICLES = [
  { color: 'bg-yellow-400', left: '15%', delay: '0ms',   size: 'w-3 h-3' },
  { color: 'bg-green-400',  left: '30%', delay: '80ms',  size: 'w-2 h-2' },
  { color: 'bg-orange-400', left: '50%', delay: '40ms',  size: 'w-4 h-4' },
  { color: 'bg-pink-400',   left: '65%', delay: '120ms', size: 'w-2 h-2' },
  { color: 'bg-blue-400',   left: '80%', delay: '60ms',  size: 'w-3 h-3' },
  { color: 'bg-yellow-300', left: '22%', delay: '150ms', size: 'w-2 h-2' },
  { color: 'bg-green-300',  left: '72%', delay: '20ms',  size: 'w-3 h-3' },
];

export function PaymentSuccessOverlay({ amount, paymentMethod, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-overlay-in"
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-5 px-8 select-none">

        {/* Checkmark circle */}
        <div className="relative">
          {/* Ping ring */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
          {/* Main circle */}
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-2xl flex items-center justify-center animate-pop-in">
            {/* SVG checkmark for crisp rendering */}
            <svg viewBox="0 0 52 52" className="w-16 h-16" fill="none">
              <circle cx="26" cy="26" r="25" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
              <polyline
                points="14,27 22,35 38,18"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Amount & label */}
        <div className="text-center animate-pop-in" style={{ animationDelay: '120ms' }}>
          <p className="text-6xl font-black text-white drop-shadow-lg leading-none">
            {formatCurrency(amount)}
          </p>
          <p className="text-3xl font-bold text-green-300 mt-2 drop-shadow">
            പൈസ കിട്ടി!
          </p>
          <p className="text-sm text-white/70 mt-1 font-medium tracking-wide uppercase">
            {paymentMethod === 'upi' ? 'UPI Payment' : 'Cash Payment'} · Done
          </p>
        </div>

        {/* Floating particles */}
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 pointer-events-none w-80 h-20">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className={`absolute bottom-0 rounded-full ${p.color} ${p.size} animate-float-up`}
              style={{ left: p.left, animationDelay: p.delay }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
