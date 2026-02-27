'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { registrationsApi } from '@/lib/api';

const GENDER_OPTIONS = [
  { value: 'male', label: 'גבר' },
  { value: 'female', label: 'אישה' },
  { value: 'other', label: 'אחר' },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
  { value: 'other', label: 'אחר' },
];

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    relationshipStatus: '',
    facebookUrl: '',
    instagramUrl: '',
    aboutText: '',
    lookingForText: '',
    consentTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName) newErrors.fullName = 'שדה חובה';
    if (!form.phone) newErrors.phone = 'שדה חובה';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'אימייל לא תקין';
    }
    if (!form.birthDate) newErrors.birthDate = 'שדה חובה';
    if (!form.gender) newErrors.gender = 'שדה חובה';
    if (!form.relationshipStatus) newErrors.relationshipStatus = 'שדה חובה';
    if (!form.facebookUrl) newErrors.facebookUrl = 'שדה חובה';
    if (form.aboutText.length < 100) {
      newErrors.aboutText = `נדרשים לפחות 100 תווים (${form.aboutText.length}/100)`;
    }
    if (!form.lookingForText) newErrors.lookingForText = 'שדה חובה';
    if (!form.consentTerms) newErrors.consentTerms = 'יש לאשר את התנאים';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await registrationsApi.create(eventId, form);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'שגיאה בהגשת הטופס';
      if (err.response?.data?.code === 'already_registered' || msg.includes('already_registered')) {
        setErrors({ _form: 'כבר נרשמת לאירוע זה' });
      } else {
        setErrors({ _form: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">הבקשה התקבלה!</h2>
          <p className="text-gray-600 mb-6">הבקשה שלך לאירוע התקבלה וממתינה לאישור. נשלח אליך עדכון בקרוב.</p>
          <button onClick={() => router.push(`/events/${eventId}`)} className="btn-secondary">
            חזרה לאירוע
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card">
          <h1 className="text-2xl font-bold text-primary-700 mb-6">טופס הרשמה לאירוע</h1>

          {errors._form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
              {errors._form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">שם מלא *</label>
                <input
                  className={`input ${errors.fullName ? 'border-red-400' : ''}`}
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="ישראל ישראלי"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="label">טלפון *</label>
                <input
                  className={`input ${errors.phone ? 'border-red-400' : ''}`}
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+972501234567"
                  dir="ltr"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="label">אימייל *</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'border-red-400' : ''}`}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="user@example.com"
                  dir="ltr"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="label">תאריך לידה *</label>
                <input
                  type="date"
                  className={`input ${errors.birthDate ? 'border-red-400' : ''}`}
                  value={form.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
              </div>

              <div>
                <label className="label">מגדר *</label>
                <select
                  className={`input ${errors.gender ? 'border-red-400' : ''}`}
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                >
                  <option value="">בחר/י</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="label">סטטוס זוגי *</label>
                <select
                  className={`input ${errors.relationshipStatus ? 'border-red-400' : ''}`}
                  value={form.relationshipStatus}
                  onChange={(e) => update('relationshipStatus', e.target.value)}
                >
                  <option value="">בחר/י</option>
                  {RELATIONSHIP_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.relationshipStatus && <p className="text-red-500 text-xs mt-1">{errors.relationshipStatus}</p>}
              </div>
            </div>

            <div>
              <label className="label">לינק לפרופיל פייסבוק *</label>
              <input
                type="url"
                className={`input ${errors.facebookUrl ? 'border-red-400' : ''}`}
                value={form.facebookUrl}
                onChange={(e) => update('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/..."
                dir="ltr"
              />
              {errors.facebookUrl && <p className="text-red-500 text-xs mt-1">{errors.facebookUrl}</p>}
            </div>

            <div>
              <label className="label">לינק לאינסטגרם (אופציונלי)</label>
              <input
                type="url"
                className="input"
                value={form.instagramUrl}
                onChange={(e) => update('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="label">
                על עצמי * <span className="text-gray-400 text-xs">({form.aboutText.length}/100 תווים מינימום)</span>
              </label>
              <textarea
                className={`input h-32 resize-none ${errors.aboutText ? 'border-red-400' : ''}`}
                value={form.aboutText}
                onChange={(e) => update('aboutText', e.target.value)}
                placeholder="ספר/י על עצמך – מה אתה/את אוהב/ת, מה מאפיין אותך..."
              />
              {errors.aboutText && <p className="text-red-500 text-xs mt-1">{errors.aboutText}</p>}
            </div>

            <div>
              <label className="label">מה אני מחפש/ת *</label>
              <textarea
                className={`input h-24 resize-none ${errors.lookingForText ? 'border-red-400' : ''}`}
                value={form.lookingForText}
                onChange={(e) => update('lookingForText', e.target.value)}
                placeholder="מה אתה/את מחפש/ת בפגישה?"
              />
              {errors.lookingForText && <p className="text-red-500 text-xs mt-1">{errors.lookingForText}</p>}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent"
                checked={form.consentTerms}
                onChange={(e) => update('consentTerms', e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
                אני מאשר/ת את <a href="#" className="text-primary-600 underline">תנאי השימוש</a> ומדיניות הפרטיות
              </label>
            </div>
            {errors.consentTerms && <p className="text-red-500 text-xs">{errors.consentTerms}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-3"
            >
              {loading ? 'שולח...' : 'שלח הרשמה'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
