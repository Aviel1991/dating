'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Event } from '@/types';

interface EventFormProps {
  event?: Partial<Event>;
  eventId?: string;
}

export default function EventForm({ event, eventId }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startsAt: event?.startsAt ? event.startsAt.slice(0, 16) : '',
    endsAt: event?.endsAt ? event.endsAt.slice(0, 16) : '',
    locationName: event?.locationName || '',
    locationAddress: event?.locationAddress || '',
    capacityTotal: event?.capacityTotal || 20,
    capacityMale: event?.capacityMale || '',
    capacityFemale: event?.capacityFemale || '',
    registrationOpenAt: event?.registrationOpenAt ? event.registrationOpenAt.slice(0, 16) : '',
    registrationCloseAt: event?.registrationCloseAt ? event.registrationCloseAt.slice(0, 16) : '',
    coverImageUrl: event?.coverImageUrl || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const update = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title) newErrors.title = 'שדה חובה';
    if (!form.startsAt) newErrors.startsAt = 'שדה חובה';
    if (!form.endsAt) newErrors.endsAt = 'שדה חובה';
    if (form.endsAt && form.startsAt && form.endsAt <= form.startsAt) {
      newErrors.endsAt = 'תאריך סיום חייב להיות אחרי תאריך התחלה';
    }
    if (!form.locationName) newErrors.locationName = 'שדה חובה';
    if (!form.capacityTotal || Number(form.capacityTotal) < 1) {
      newErrors.capacityTotal = 'קיבולת חייבת להיות לפחות 1';
    }
    if (!form.registrationOpenAt) newErrors.registrationOpenAt = 'שדה חובה';
    if (!form.registrationCloseAt) newErrors.registrationCloseAt = 'שדה חובה';
    return newErrors;
  };

  const handleSave = async (publish = false) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      ...form,
      capacityTotal: Number(form.capacityTotal),
      capacityMale: form.capacityMale ? Number(form.capacityMale) : undefined,
      capacityFemale: form.capacityFemale ? Number(form.capacityFemale) : undefined,
    };

    if (publish) {
      setPublishing(true);
    } else {
      setLoading(true);
    }

    try {
      let savedEvent: Event;
      if (eventId) {
        savedEvent = await adminApi.updateEvent(eventId, payload);
      } else {
        savedEvent = await adminApi.createEvent(payload);
      }

      if (publish && savedEvent.id) {
        await adminApi.publishEvent(savedEvent.id);
      }

      router.push('/admin/events');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'שגיאה בשמירה';
      setErrors({ _form: msg });
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">
        {eventId ? 'עריכת אירוע' : 'אירוע חדש'}
      </h1>

      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
          {errors._form}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="label">שם האירוע *</label>
          <input
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="ספיד-דייטינג תל אביב - ינואר 2025"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="label">תיאור</label>
          <textarea
            className="input h-24 resize-none"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="תיאור האירוע..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">תחילת האירוע *</label>
            <input
              type="datetime-local"
              className={`input ${errors.startsAt ? 'border-red-400' : ''}`}
              value={form.startsAt}
              onChange={(e) => update('startsAt', e.target.value)}
            />
            {errors.startsAt && <p className="text-red-500 text-xs mt-1">{errors.startsAt}</p>}
          </div>
          <div>
            <label className="label">סיום האירוע *</label>
            <input
              type="datetime-local"
              className={`input ${errors.endsAt ? 'border-red-400' : ''}`}
              value={form.endsAt}
              onChange={(e) => update('endsAt', e.target.value)}
            />
            {errors.endsAt && <p className="text-red-500 text-xs mt-1">{errors.endsAt}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">שם המיקום *</label>
            <input
              className={`input ${errors.locationName ? 'border-red-400' : ''}`}
              value={form.locationName}
              onChange={(e) => update('locationName', e.target.value)}
              placeholder="מועדון פלוני"
            />
            {errors.locationName && <p className="text-red-500 text-xs mt-1">{errors.locationName}</p>}
          </div>
          <div>
            <label className="label">כתובת</label>
            <input
              className="input"
              value={form.locationAddress}
              onChange={(e) => update('locationAddress', e.target.value)}
              placeholder="רחוב הרצל 10, תל אביב"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">קיבולת כוללת *</label>
            <input
              type="number"
              min="1"
              className={`input ${errors.capacityTotal ? 'border-red-400' : ''}`}
              value={form.capacityTotal}
              onChange={(e) => update('capacityTotal', e.target.value)}
            />
            {errors.capacityTotal && <p className="text-red-500 text-xs mt-1">{errors.capacityTotal}</p>}
          </div>
          <div>
            <label className="label">גברים (אופציונלי)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.capacityMale}
              onChange={(e) => update('capacityMale', e.target.value)}
            />
          </div>
          <div>
            <label className="label">נשים (אופציונלי)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.capacityFemale}
              onChange={(e) => update('capacityFemale', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">פתיחת הרשמה *</label>
            <input
              type="datetime-local"
              className={`input ${errors.registrationOpenAt ? 'border-red-400' : ''}`}
              value={form.registrationOpenAt}
              onChange={(e) => update('registrationOpenAt', e.target.value)}
            />
            {errors.registrationOpenAt && <p className="text-red-500 text-xs mt-1">{errors.registrationOpenAt}</p>}
          </div>
          <div>
            <label className="label">סגירת הרשמה *</label>
            <input
              type="datetime-local"
              className={`input ${errors.registrationCloseAt ? 'border-red-400' : ''}`}
              value={form.registrationCloseAt}
              onChange={(e) => update('registrationCloseAt', e.target.value)}
            />
            {errors.registrationCloseAt && <p className="text-red-500 text-xs mt-1">{errors.registrationCloseAt}</p>}
          </div>
        </div>

        <div>
          <label className="label">URL תמונת קאבר (PNG/JPG, 1920×1080)</label>
          <input
            className="input"
            value={form.coverImageUrl}
            onChange={(e) => update('coverImageUrl', e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
          <p className="text-xs text-gray-400 mt-1">
            העלה תמונה לשרת ה-CDN והדבק כאן את ה-URL. גודל מומלץ: 1920×1080 (16:9)
          </p>
          {form.coverImageUrl && (
            <img src={form.coverImageUrl} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover" />
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => handleSave(false)}
          disabled={loading || publishing}
          className="btn-secondary flex-1"
        >
          {loading ? 'שומר...' : 'שמור טיוטה'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={loading || publishing || !form.coverImageUrl}
          className="btn-primary flex-1"
          title={!form.coverImageUrl ? 'נדרשת תמונת קאבר לפרסום' : ''}
        >
          {publishing ? 'מפרסם...' : 'פרסם'}
        </button>
      </div>
      {!form.coverImageUrl && (
        <p className="text-orange-500 text-xs text-center mt-2">
          נדרשת תמונת קאבר כדי לפרסם את האירוע
        </p>
      )}
    </div>
  );
}
