'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';

const MATCH_TYPE_LABELS = {
  romantic: { label: 'רומנטי', icon: '💕' },
  friend: { label: 'חברות', icon: '🤝' },
  both: { label: 'רומנטי + חברות', icon: '💕🤝' },
};

export default function ApprovedMatchesPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getMatches(eventId, 'approved').then(setMatches).finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <Link href={`/admin/events/${eventId}/matches/pending`} className="hover:text-primary-600">מאצ'ים ממתינים</Link>
        <span>/</span>
        <span>מאצ'ים מאושרים</span>
      </div>

      <h1 className="text-xl font-bold mb-6">מאצ'ים מאושרים</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-500">טוען...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-gray-600">זוג</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">סוג</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">אושר</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">הודעה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map((match) => {
                const typeConfig = MATCH_TYPE_LABELS[match.matchType as keyof typeof MATCH_TYPE_LABELS];
                return (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{match.userA?.fullName}</span>
                        <span className="text-gray-400">+</span>
                        <span className="font-medium">{match.userB?.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span>{typeConfig?.icon} {typeConfig?.label}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {match.reviewedAt ? format(new Date(match.reviewedAt), 'dd/MM HH:mm') : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {match.notifiedAt ? format(new Date(match.notifiedAt), 'dd/MM HH:mm') : '-'}
                    </td>
                  </tr>
                );
              })}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">אין מאצ'ים מאושרים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
