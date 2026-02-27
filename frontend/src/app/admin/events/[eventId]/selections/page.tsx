'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminSelectionsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closeAt, setCloseAt] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    })
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  const now = new Date();
  const isOpen = event?.selectionOpenAt &&
    now >= new Date(event.selectionOpenAt) &&
    (!event.selectionCloseAt || now <= new Date(event.selectionCloseAt));

  const handleOpen = async () => {
    setActing(true);
    try {
      await adminApi.openSelection(eventId, closeAt || undefined);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setActing(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('האם לסגור את חלון הבחירות?')) return;
    setActing(true);
    try {
      await adminApi.closeSelection(eventId);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">טוען...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <span>חלון בחירות</span>
      </div>

      <h1 className="text-xl font-bold mb-6">ניהול חלון הבחירות</h1>

      <div className="card max-w-lg">
        <div className="mb-4">
          <h2 className="font-medium mb-2">סטטוס נוכחי:</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isOpen ? '🟢 פתוח' : '🔴 סגור'}
          </div>
          {event?.selectionOpenAt && (
            <p className="text-sm text-gray-500 mt-1">
              נפתח: {format(new Date(event.selectionOpenAt), 'dd/MM/yyyy HH:mm')}
            </p>
          )}
          {event?.selectionCloseAt && (
            <p className="text-sm text-gray-500">
              נסגר: {format(new Date(event.selectionCloseAt), 'dd/MM/yyyy HH:mm')}
            </p>
          )}
        </div>

        {!isOpen ? (
          <div className="space-y-3">
            <div>
              <label className="label">סגירה אוטומטית (אופציונלי)</label>
              <input
                type="datetime-local"
                className="input"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
              />
            </div>
            <button
              onClick={handleOpen}
              disabled={acting}
              className="btn-primary w-full"
            >
              {acting ? 'פותח...' : 'פתח חלון בחירות'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleClose}
            disabled={acting}
            className="btn-danger w-full"
          >
            {acting ? 'סוגר...' : 'סגור חלון בחירות'}
          </button>
        )}

        <div className="mt-6 pt-4 border-t">
          <Link
            href={`/admin/events/${eventId}/matches/pending`}
            className="btn-primary w-full block text-center"
          >
            עבור לייצור מאצ'ים ←
          </Link>
        </div>
      </div>
    </div>
  );
}
