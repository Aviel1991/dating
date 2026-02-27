'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { eventsApi } from '@/lib/api';
import { Event } from '@/types';
import { format } from 'date-fns';

export default function EventPublicPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, statusData] = await Promise.all([
          eventsApi.getEvent(eventId),
          eventsApi.getStatus(eventId),
        ]);
        setEvent(eventData);
        setStatus(statusData);
      } catch (err: any) {
        setError('האירוע לא נמצא');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">טוען...</div></div>;
  if (error || !event) return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500">{error || 'האירוע לא נמצא'}</div></div>;

  const isOpen = status?.isRegistrationOpen;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative w-full bg-gray-200" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-400 to-pink-500">
            <span className="text-white text-6xl">💕</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Event Info */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-medium">{format(new Date(event.startsAt), 'dd/MM/yyyy')}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(event.startsAt), 'HH:mm')} – {format(new Date(event.endsAt), 'HH:mm')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-2xl">📍</span>
              <div>
                <div className="font-medium">{event.locationName}</div>
                {event.locationAddress && (
                  <div className="text-sm text-gray-500">{event.locationAddress}</div>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-700 leading-relaxed mt-4">{event.description}</p>
          )}
        </div>

        {/* CTA */}
        <div className="card text-center">
          {isOpen ? (
            <>
              <p className="text-green-600 font-medium mb-4">ההרשמה פתוחה עד {format(new Date(event.registrationCloseAt), 'dd/MM/yyyy HH:mm')}</p>
              <button
                onClick={() => router.push(`/events/${eventId}/register`)}
                className="btn-primary text-lg px-10 py-3"
              >
                להרשמה
              </button>
            </>
          ) : (
            <div className="text-gray-500">
              {new Date() < new Date(event.registrationOpenAt) ? (
                <p>ההרשמה תיפתח ב-{format(new Date(event.registrationOpenAt), 'dd/MM/yyyy HH:mm')}</p>
              ) : (
                <p>ההרשמה נסגרה</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
