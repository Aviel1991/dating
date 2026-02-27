'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.requestOtp(phone);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשליחת קוד');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.verifyOtp(phone, otp);
      setToken(token);
      setUser(user);
      if (user.isAdmin) {
        router.push('/admin/events');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'קוד לא תקין');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-primary-700 mb-6">
          כניסה למערכת
        </h1>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="label">מספר טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+972501234567"
                className="input"
                required
                dir="ltr"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !phone}
              className="btn-primary w-full"
            >
              {loading ? 'שולח...' : 'שלח קוד אימות'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-gray-600 text-sm text-center">
              קוד נשלח למספר <span className="font-mono font-bold" dir="ltr">{phone}</span>
            </p>
            <div>
              <label className="label">קוד אימות</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="input text-center text-2xl tracking-widest"
                maxLength={8}
                required
                dir="ltr"
                autoComplete="one-time-code"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="btn-primary w-full"
            >
              {loading ? 'מאמת...' : 'אישור'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-sm text-primary-600 w-full text-center hover:underline"
            >
              חזרה לשינוי מספר
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
