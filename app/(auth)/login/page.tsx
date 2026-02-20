'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Phone, ArrowRight, Loader2, Play } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, enableDemoMode } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoMode = () => {
    enableDemoMode();
    router.push('/dashboard');
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
      if (otp.length !== 6) {
        setError('Please enter the 6-digit OTP');
        setIsLoading(false);
        return;
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const { error } = await verifyOtp(cleanPhone, otp);

      if (error) {
        setError(error.message);
      } else {
        // Redirect to onboarding or dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Enter your phone number to get started'
              : `We'll verify your number +91 ${phone}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-md border">
                    <span className="text-sm text-muted-foreground">+91</span>
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
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || phone.length < 10}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Test OTP hint — only shown in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">🧪 Dev / Test Mode</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Test number: <span className="font-mono font-bold">9443129400</span><br />
                    OTP: <span className="font-mono font-bold text-lg">121212</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Verify & Login
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError(null);
                }}
                disabled={isLoading}
              >
                Change Phone Number
              </Button>
            </form>
          )}

          {/* Demo mode button */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground mb-3">
              Want to explore without logging in?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoMode}
            >
              <Play className="w-4 h-4 mr-2" />
              Try Demo Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
