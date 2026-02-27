'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { selectionsApi } from '@/lib/api';
import { SelectionParticipant } from '@/types';
import { format } from 'date-fns';

interface ChoiceState {
  interestedRomantic?: boolean | null;
  interestedFriend?: boolean | null;
  notInterested?: boolean | null;
}

export default function SelectionsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [available, setAvailable] = useState<any>(null);
  const [participants, setParticipants] = useState<SelectionParticipant[]>([]);
  const [choices, setChoices] = useState<Record<string, ChoiceState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const avail = await selectionsApi.getAvailable(eventId);
        setAvailable(avail);

        if (avail.isOpen) {
          const parts = await selectionsApi.getParticipants(eventId);
          setParticipants(parts);

          // Initialize choices from existing data
          const initialChoices: Record<string, ChoiceState> = {};
          parts.forEach((p: SelectionParticipant) => {
            if (p.choice) {
              initialChoices[p.userId] = {
                interestedRomantic: p.choice.interestedRomantic ?? null,
                interestedFriend: p.choice.interestedFriend ?? null,
                notInterested: p.choice.notInterested ?? null,
              };
            }
          });
          setChoices(initialChoices);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const updateChoice = async (userId: string, field: keyof ChoiceState, value: boolean | null) => {
    const current = choices[userId] || {};
    let updated: ChoiceState = { ...current };

    if (field === 'notInterested' && value === true) {
      updated = { interestedRomantic: null, interestedFriend: null, notInterested: true };
    } else if ((field === 'interestedRomantic' || field === 'interestedFriend') && value === true) {
      updated = { ...updated, [field]: true, notInterested: null };
    } else {
      updated = { ...updated, [field]: value };
    }

    setChoices((prev) => ({ ...prev, [userId]: updated }));
    setSaving(userId);

    try {
      await selectionsApi.upsertChoice(eventId, userId, updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await selectionsApi.submitChoices(eventId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשליחה');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">טוען...</div></div>;

  if (!available?.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-600 text-lg">הבחירות עדיין לא נפתחו</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">הבחירות נשלחו!</h2>
          <p className="text-gray-600">תודה! אם יהיו מאצ'ים, נעדכן אותך.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-700">סמן/י בחירות</h1>
            {available.selectionCloseAt && (
              <span className="text-sm text-gray-500">
                סגירה: {format(new Date(available.selectionCloseAt), 'dd/MM HH:mm')}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            סמן/י עבור כל משתתף את סוג הבחירה שלך
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {participants.length === 0 && (
            <div className="card text-center text-gray-500">אין משתתפים אחרים עדיין</div>
          )}

          {participants.map((participant) => {
            const choice = choices[participant.userId] || {};
            const isSaving = saving === participant.userId;

            return (
              <div key={participant.userId} className="card">
                <div className="flex items-center gap-4">
                  {participant.photoUrl ? (
                    <img
                      src={participant.photoUrl}
                      alt={participant.displayName}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-medium">{participant.displayName}</p>
                    {isSaving && <p className="text-xs text-gray-400">שומר...</p>}
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <ChoiceButton
                      label="💕 אהבה"
                      active={choice.interestedRomantic === true}
                      onClick={() => updateChoice(
                        participant.userId,
                        'interestedRomantic',
                        choice.interestedRomantic === true ? null : true,
                      )}
                    />
                    <ChoiceButton
                      label="🤝 חברות"
                      active={choice.interestedFriend === true}
                      onClick={() => updateChoice(
                        participant.userId,
                        'interestedFriend',
                        choice.interestedFriend === true ? null : true,
                      )}
                    />
                    <ChoiceButton
                      label="❌ לא"
                      active={choice.notInterested === true}
                      danger
                      onClick={() => updateChoice(
                        participant.userId,
                        'notInterested',
                        choice.notInterested === true ? null : true,
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {participants.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full text-lg py-3"
            >
              {submitting ? 'שולח...' : 'שלח בחירות סופית'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              לאחר השליחה לא ניתן לשנות את הבחירות
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  active,
  danger,
  onClick,
}: {
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const base = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';
  const activeClass = danger
    ? 'bg-red-500 text-white'
    : 'bg-primary-500 text-white';
  const inactiveClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <button onClick={onClick} className={`${base} ${active ? activeClass : inactiveClass}`}>
      {label}
    </button>
  );
}
