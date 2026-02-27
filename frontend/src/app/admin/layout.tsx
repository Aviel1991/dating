'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isLoggedIn, isAdmin, removeToken } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/events" className="font-bold text-primary-700 text-lg">
              💕 SpeedDating Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/events"
                className={`hover:text-primary-600 ${pathname === '/admin/events' ? 'text-primary-600 font-medium' : 'text-gray-600'}`}
              >
                אירועים
              </Link>
            </nav>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
            יציאה
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
