'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function CheckinPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const fetchList = async () => {
    const data = await adminApi.getCheckinList(eventId, search || undefined);
    setParticipants(data);
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, [eventId]);
  useEffect(() => {
    const timer = setTimeout(() => { if (!loading) fetchList(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleArrive = async (userId: string) => {
    setCheckingIn(userId);
    try {
      await adminApi.markArrived(eventId, userId);
      await fetchList();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setCheckingIn(null);
    }
  };

  const arrivedCount = participants.filter((p) => p.attendance?.status === 'arrived').length;
  const totalCount = participants.length;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <span>צ'ק-אין</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">צ'ק-אין ביום האירוע</h1>
        <div className="text-sm text-gray-600">
          הגיעו: <strong className="text-green-600">{arrivedCount}</strong> / {totalCount}
        </div>
      </div>

      <div className="mb-4">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או טלפון..."
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">טוען...</div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => {
            const arrived = participant.attendance?.status === 'arrived';
            return (
              <div
                key={participant.userId}
                className={`card flex items-center justify-between ${arrived ? 'border-green-200 bg-green-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {participant.displayPhotoUrl ? (
                    <img
                      src={participant.displayPhotoUrl}
                      alt={participant.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">👤</div>
                  )}
                  <div>
                    <p className="font-medium">{participant.displayName}</p>
                    <p className="text-sm text-gray-500" dir="ltr">{participant.user?.phone}</p>
                  </div>
                </div>

                <div>
                  {arrived ? (
                    <span className="badge-approved">✓ הגיע/ה</span>
                  ) : (
                    <button
                      onClick={() => handleArrive(participant.userId)}
                      disabled={checkingIn === participant.userId}
                      className="btn-primary text-sm"
                    >
                      {checkingIn === participant.userId ? 'מסמן...' : 'הגיע/ה'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {participants.length === 0 && (
            <div className="card text-center py-10 text-gray-500">
              {search ? 'לא נמצאו תוצאות' : 'אין משתתפים כשירים'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
