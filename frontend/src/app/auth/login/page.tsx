'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

type Tab = 'admin' | 'user';
type UserMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('user');

  // Admin form
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // User form
  const [userMode, setUserMode] = useState<UserMode>('login');
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSuccess = (token: string, user: any) => {
    setToken(token);
    setUser(user);
    router.push(user.isAdmin ? '/admin/events' : '/');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.adminLogin(adminUsername, adminPassword);
      onSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שם משתמש או סיסמא שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authApi.userLogin(userEmail, userPassword);
      onSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'אימייל או סיסמא שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (userPassword !== userPasswordConfirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    if (userPassword.length < 6) {
      setError('הסיסמא חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.userRegister(userFullName, userEmail, userPassword);
      onSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-pink-100">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => switchTab('user')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              tab === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👤 משתתף/ת
          </button>
          <button
            onClick={() => switchTab('admin')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              tab === 'admin'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🛡️ מנהלת
          </button>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {tab === 'admin' ? 'כניסת מנהלת' : userMode === 'login' ? 'כניסה' : 'הרשמה'}
          </h1>

          {/* ─── Admin Login ─── */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="label">שם משתמש</label>
                <input
                  className="input"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Sarah"
                  autoComplete="username"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="label">סיסמא</label>
                <input
                  type="password"
                  className="input"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}
              <button
                type="submit"
                disabled={loading || !adminUsername || !adminPassword}
                className="btn-primary w-full py-3"
              >
                {loading ? 'נכנס...' : 'כניסה'}
              </button>
            </form>
          )}

          {/* ─── User Login / Register ─── */}
          {tab === 'user' && (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setUserMode('login'); setError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    userMode === 'login' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                  }`}
                >
                  כניסה
                </button>
                <button
                  type="button"
                  onClick={() => { setUserMode('register'); setError(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    userMode === 'register' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                  }`}
                >
                  הרשמה ראשונה
                </button>
              </div>

              {userMode === 'login' ? (
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div>
                    <label className="label">אימייל</label>
                    <input
                      type="email"
                      className="input"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoComplete="email"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">סיסמא</label>
                    <input
                      type="password"
                      className="input"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !userEmail || !userPassword}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? 'נכנס...' : 'כניסה'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUserRegister} className="space-y-4">
                  <div>
                    <label className="label">שם מלא</label>
                    <input
                      className="input"
                      value={userFullName}
                      onChange={(e) => setUserFullName(e.target.value)}
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">אימייל</label>
                    <input
                      type="email"
                      className="input"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoComplete="email"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">סיסמא <span className="text-gray-400 text-xs">(לפחות 6 תווים)</span></label>
                    <input
                      type="password"
                      className="input"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">אימות סיסמא</label>
                    <input
                      type="password"
                      className={`input ${
                        userPasswordConfirm && userPassword !== userPasswordConfirm
                          ? 'border-red-400'
                          : ''
                      }`}
                      value={userPasswordConfirm}
                      onChange={(e) => setUserPasswordConfirm(e.target.value)}
                      placeholder="••••••"
                      autoComplete="new-password"
                      required
                    />
                    {userPasswordConfirm && userPassword !== userPasswordConfirm && (
                      <p className="text-red-500 text-xs mt-1">הסיסמאות אינן תואמות</p>
                    )}
                  </div>
                  {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !userEmail || !userPassword || !userFullName}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? 'נרשם...' : 'צור חשבון'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
