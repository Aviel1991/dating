'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Event } from '@/types';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'טיוטה', color: 'badge-pending' },
  published: { label: 'פורסם', color: 'badge-approved' },
  closed: { label: 'סגור', color: 'badge-rejected' },
  completed: { label: 'הושלם', color: 'badge-waitlisted' },
  cancelled: { label: 'בוטל', color: 'badge-rejected' },
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-gray-500">טוען...</div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול אירועים</h1>
        <Link href="/admin/events/new" className="btn-primary">
          + אירוע חדש
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-gray-500 text-lg mb-4">אין אירועים עדיין</p>
          <Link href="/admin/events/new" className="btn-primary">
            צור אירוע ראשון
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const statusConfig = STATUS_LABELS[event.status] || STATUS_LABELS.draft;
            return (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-gray-800">{event.title}</h2>
                      <span className={statusConfig.color}>{statusConfig.label}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span>📅 {format(new Date(event.startsAt), 'dd/MM/yyyy HH:mm')}</span>
                      <span>📍 {event.locationName}</span>
                      <span>👥 קיבולת: {event.capacityTotal}</span>
                    </div>

                    {event.stats && (
                      <div className="flex gap-4 text-sm">
                        <span className="badge-pending">ממתינים: {event.stats.pending}</span>
                        <span className="badge-approved">מאושרים: {event.stats.approved}</span>
                        <span className="badge-needs-photo">חסרי תמונה: {event.stats.needsPhoto}</span>
                        <span className="badge-waitlisted">הגיעו: {event.stats.arrived}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mr-4">
                    <Link
                      href={`/admin/events/${event.id}/registrations`}
                      className="btn-secondary text-sm"
                    >
                      ניהול
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="text-sm text-primary-600 text-center hover:underline"
                    >
                      עריכה
                    </Link>
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
