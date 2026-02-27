'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { EventParticipant } from '@/types';

const ELIGIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  eligible: { label: 'כשיר', color: 'badge-approved' },
  needs_photo: { label: 'חסר תמונה', color: 'badge-needs-photo' },
  disabled: { label: 'מושבת', color: 'badge-rejected' },
};

const GENDER_LABELS: Record<string, string> = {
  male: 'גבר',
  female: 'אישה',
  other: 'אחר',
};

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'' | 'eligible' | 'needs_photo'>('');
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getParticipants(eventId, activeTab ? { eligibility: activeTab } : {})
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [eventId, activeTab]);

  const handleRemindPhoto = async () => {
    setReminding(true);
    try {
      const result = await adminApi.remindPhoto(eventId);
      alert(`נשלחו ${result.reminded} תזכורות`);
    } catch {
      alert('שגיאה בשליחת תזכורות');
    } finally {
      setReminding(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('auth_token');
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/events/${eventId}/participants/export.csv`,
      '_blank',
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <Link href={`/admin/events/${eventId}/registrations`} className="hover:text-primary-600">נרשמים</Link>
        <span>/</span>
        <span>משתתפים</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">משתתפים מאושרים</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRemindPhoto}
            disabled={reminding}
            className="btn-secondary text-sm"
          >
            {reminding ? 'שולח...' : 'שלח תזכורת תמונה'}
          </button>
          <button onClick={handleExportCsv} className="btn-secondary text-sm">
            ייצא CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: '', label: 'הכל' },
          { key: 'eligible', label: 'כשירים' },
          { key: 'needs_photo', label: 'חסרי תמונה' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm ${activeTab === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">טוען...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => {
            const eligibilityConfig = ELIGIBILITY_LABELS[participant.eligibilityStatus];
            return (
              <div key={participant.id} className="card">
                <div className="flex items-center gap-3">
                  {participant.displayPhotoUrl ? (
                    <img
                      src={participant.displayPhotoUrl}
                      alt={participant.displayName}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
                      👤
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{participant.displayName}</p>
                    <p className="text-sm text-gray-500">{GENDER_LABELS[participant.gender]}</p>
                    <span className={eligibilityConfig.color}>{eligibilityConfig.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {participants.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-500">אין משתתפים</div>
          )}
        </div>
      )}
    </div>
  );
}
