'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Match } from '@/types';

const MATCH_TYPE_LABELS = {
  romantic: { label: 'רומנטי', icon: '💕' },
  friend: { label: 'חברות', icon: '🤝' },
  both: { label: 'רומנטי + חברות', icon: '💕🤝' },
};

export default function PendingMatchesPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    const data = await adminApi.getMatches(eventId, 'pending_admin_approval');
    setMatches(data);
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, [eventId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await adminApi.generateMatches(eventId);
      alert(`נוצרו ${result.created} מאצ'ים חדשים (${result.skipped} קיימים כבר)`);
      await fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (matchId: string) => {
    setActionLoading(matchId + 'approve');
    try {
      await adminApi.approveMatch(matchId);
      await fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId: string) => {
    setActionLoading(matchId + 'reject');
    try {
      await adminApi.rejectMatch(matchId);
      await fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <span>מאצ'ים ממתינים לאישור</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">מאצ'ים ממתינים לאישור</h1>
        <div className="flex gap-2">
          <Link href={`/admin/events/${eventId}/matches/approved`} className="btn-secondary text-sm">
            מאצ'ים מאושרים
          </Link>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? 'מייצר...' : 'ייצר מאצ\'ים'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">טוען...</div>
      ) : (
        <div className="space-y-4">
          {matches.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-gray-500 text-lg mb-2">אין מאצ'ים ממתינים</p>
              <p className="text-gray-400 text-sm">לחץ "ייצר מאצ'ים" לאחר סגירת חלון הבחירות</p>
            </div>
          )}

          {matches.map((match) => {
            const typeConfig = MATCH_TYPE_LABELS[match.matchType as keyof typeof MATCH_TYPE_LABELS];
            const isActing = actionLoading?.startsWith(match.id);

            return (
              <div key={match.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* User A */}
                    <div className="flex items-center gap-2">
                      {match.userA?.profilePhotoUrl ? (
                        <img src={match.userA.profilePhotoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">👤</div>
                      )}
                      <span className="font-medium">{match.userA?.fullName}</span>
                    </div>

                    <div className="text-center">
                      <div className="text-xl">{typeConfig?.icon}</div>
                      <div className="text-xs text-gray-500">{typeConfig?.label}</div>
                    </div>

                    {/* User B */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.userB?.fullName}</span>
                      {match.userB?.profilePhotoUrl ? (
                        <img src={match.userB.profilePhotoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">👤</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(match.id)}
                      disabled={!!isActing}
                      className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm hover:bg-green-200 disabled:opacity-50"
                    >
                      ✓ אשר
                    </button>
                    <button
                      onClick={() => handleReject(match.id)}
                      disabled={!!isActing}
                      className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                    >
                      ✗ דחה
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
