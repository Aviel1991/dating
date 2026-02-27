'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminApi } from '@/lib/api';
import EventForm from '@/components/admin/EventForm';
import { Event } from '@/types';

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch event details for admin
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    })
      .then((r) => r.json())
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-gray-500">טוען...</div></div>;
  if (!event) return <div className="text-red-500">אירוע לא נמצא</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">עריכת אירוע</h1>
      <EventForm event={event} eventId={eventId} />
    </div>
  );
}
