'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, enableDemoMode } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoMode = () => {
    enableDemoMode();
    router.push('/voice-hub');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate phone number (10 digits for India)
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setIsLoading(false);
        return;
      }

      const { error } = await signInWithOtp(cleanPhone);
      if (error) {
        // Check if it's a network error (Supabase not configured)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setError('Supabase not configured. Use "Try Demo" button below.');
        } else {
          setError(error.message);
        }
      } else {
        setStep('otp');
      }
    } catch (err) {
      setError('Connection failed. Use "Try Demo" button below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const otpString = otp.join('');
      if (otpString.length !== 6) {
        setError('Please enter the 6-digit OTP');
        setIsLoading(false);
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const { error } = await verifyOtp(cleanPhone, otpString);

      if (error) {
        setError(error.message);
      } else {
        // Redirect to onboarding or voice hub
        router.push('/voice-hub');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ShopKeeper AI</h1>
          <p className="text-sm text-muted-foreground mt-1">ഷോപ്പ്കീപ്പർ AI — Voice-First Commerce</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Enter your phone number to get started</p>
              </div>

              {/* Dev credentials hint */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">🧪 Dev / Test Mode</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Phone: <span className="font-mono font-bold">9443129400</span>
                    {' · '}OTP: <span className="font-mono font-bold">121212</span>
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-md border border-input text-sm text-muted-foreground select-none">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1"
                    maxLength={10}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || phone.replace(/\D/g, '').length < 10}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Send OTP
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sent to +91 {phone}
                </p>
              </div>

              {/* Dev OTP hint */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">🧪 Dev / Test OTP</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Use OTP: <span className="font-mono font-bold text-base">121212</span>
                  </p>
                </div>
              )}

              {/* 6-digit OTP boxes */}
              <div className="space-y-1.5">
                <Label>6-digit OTP</Label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={isLoading}
                      className="h-12 w-11 rounded-lg border border-input bg-background text-center text-xl font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || otp.join('').length < 6}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Verify OTP
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError(null);
                }}
                disabled={isLoading}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Change number
              </button>
            </form>
          )}
        </div>

        {/* Demo mode */}
        <p className="text-center mt-6 text-xs text-muted-foreground">
          Just exploring?{' '}
          <button
            onClick={handleDemoMode}
            className="text-primary hover:underline font-medium"
          >
            Try Demo Mode
          </button>
        </p>
      </div>
    </div>
  );
}
