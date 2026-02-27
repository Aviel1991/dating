'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { registrationsApi } from '@/lib/api';
import { Registration } from '@/types';
import Link from 'next/link';

const STATUS_CONFIG = {
  pending: {
    label: 'ממתין לאישור',
    color: 'badge-pending',
    message: 'הבקשה שלך לאירוע התקבלה וממתינה לאישור המנהלת.',
    icon: '⏳',
  },
  approved: {
    label: 'מאושר',
    color: 'badge-approved',
    message: 'הרשמתך אושרה! הצ\'ק-אין יתבצע בכניסה לאירוע.',
    icon: '✅',
  },
  rejected: {
    label: 'לא אושר',
    color: 'badge-rejected',
    message: 'לצערנו לא ניתן לאשר את הבקשה שלך לאירוע זה.',
    icon: '❌',
  },
  waitlisted: {
    label: 'רשימת המתנה',
    color: 'badge-waitlisted',
    message: 'את/ה ברשימת המתנה לאירוע. נעדכן אם יתפנה מקום.',
    icon: '📋',
  },
  cancelled: {
    label: 'בוטל',
    color: 'badge-rejected',
    message: 'ביטלת את הרשמתך לאירוע.',
    icon: '🚫',
  },
};

export default function MyRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    registrationsApi
      .getMyRegistration(eventId)
      .then(setRegistration)
      .catch(() => setError('לא נמצאה הרשמה לאירוע זה'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">טוען...</div></div>;
  if (error || !registration) return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500">{error}</div></div>;

  const config = STATUS_CONFIG[registration.status] || STATUS_CONFIG.pending;
  const needsPhoto = registration.eligibilityStatus === 'needs_photo';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="card text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          <span className={`${config.color} mb-3 inline-block`}>{config.label}</span>
          <p className="text-gray-700 text-lg mb-6">{config.message}</p>

          {needsPhoto && registration.status === 'approved' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-700 font-medium mb-3">
                נדרשת העלאת תמונת פרופיל כדי להשתתף באירוע
              </p>
              <Link href="/me/profile-photo" className="btn-primary">
                העלה תמונה
              </Link>
            </div>
          )}

          {registration.status === 'approved' && !needsPhoto && (
            <div className="space-y-3">
              <Link href={`/events/${eventId}/selections`} className="btn-primary block">
                סמן בחירות
              </Link>
              <Link href={`/events/${eventId}/matches`} className="btn-secondary block">
                המאצ'ים שלי
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href={`/events/${eventId}`} className="text-primary-600 text-sm hover:underline">
              חזרה לדף האירוע
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
