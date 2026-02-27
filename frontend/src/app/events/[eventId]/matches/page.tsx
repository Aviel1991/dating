'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { matchesApi } from '@/lib/api';
import { MyMatch } from '@/types';

const MATCH_TYPE_LABELS = {
  romantic: { label: 'חיבה רומנטית', icon: '💕' },
  friend: { label: 'חברות', icon: '🤝' },
  both: { label: 'רומנטי וחברות', icon: '💕🤝' },
};

export default function MyMatchesPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [matches, setMatches] = useState<MyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    matchesApi
      .getMyMatches(eventId)
      .then(setMatches)
      .catch(() => setError('שגיאה בטעינת המאצ\'ים'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">טוען...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card mb-6">
          <h1 className="text-2xl font-bold text-primary-700">המאצ'ים שלי</h1>
          <p className="text-gray-600 text-sm mt-1">מאצ'ים מאושרים בלבד מוצגים כאן</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">💔</div>
            <p className="text-gray-500 text-lg">אין מאצ'ים מאושרים עדיין</p>
            <p className="text-gray-400 text-sm mt-2">נחזור אחרי שהמנהלת תאשר את המאצ'ים</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const typeConfig = MATCH_TYPE_LABELS[match.matchType];
              return (
                <div key={match.matchId} className="card">
                  <div className="flex items-center gap-4">
                    {match.otherUser.photoUrl ? (
                      <img
                        src={match.otherUser.photoUrl}
                        alt={match.otherUser.fullName}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{match.otherUser.fullName}</h3>
                      <span className="text-sm text-primary-600">
                        {typeConfig.icon} {typeConfig.label}
                      </span>

                      <div className="mt-3 space-y-1">
                        <a
                          href={`tel:${match.otherUser.phone}`}
                          className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                        >
                          <span>📞</span>
                          <span dir="ltr" className="font-mono">{match.otherUser.phone}</span>
                        </a>

                        {match.otherUser.instagramUrl && (
                          <a
                            href={match.otherUser.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                          >
                            <span>📸</span>
                            <span>{match.otherUser.instagramUrl.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
