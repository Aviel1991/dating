'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { Registration } from '@/types';
import { format, differenceInYears } from 'date-fns';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'badge-pending' },
  approved: { label: 'מאושר', color: 'badge-approved' },
  rejected: { label: 'נדחה', color: 'badge-rejected' },
  waitlisted: { label: 'המתנה', color: 'badge-waitlisted' },
  cancelled: { label: 'בוטל', color: 'badge-rejected' },
};

const GENDER_LABELS: Record<string, string> = {
  male: 'גבר',
  female: 'אישה',
  other: 'אחר',
};

export default function RegistrationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRegistrations(eventId, filter ? { status: filter } : {});
      setRegistrations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegistrations(); }, [eventId, filter]);

  const handleAction = async (regId: string, action: 'approve' | 'reject' | 'waitlist') => {
    setActionLoading(regId + action);
    try {
      if (action === 'approve') await adminApi.approveRegistration(regId);
      else if (action === 'reject') await adminApi.rejectRegistration(regId);
      else await adminApi.waitlistRegistration(regId);
      await fetchRegistrations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'שגיאה');
    } finally {
      setActionLoading(null);
    }
  };

  // Count gender stats
  const pendingMale = registrations.filter((r) => r.status === 'pending' && r.user?.gender === 'male').length;
  const pendingFemale = registrations.filter((r) => r.status === 'pending' && r.user?.gender === 'female').length;
  const approvedMale = registrations.filter((r) => r.status === 'approved' && r.user?.gender === 'male').length;
  const approvedFemale = registrations.filter((r) => r.status === 'approved' && r.user?.gender === 'female').length;

  const showImbalanceWarning = Math.abs(approvedMale - approvedFemale) > 2;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin/events" className="hover:text-primary-600">אירועים</Link>
        <span>/</span>
        <span>נרשמים</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">נרשמים לאירוע</h1>
        <div className="flex gap-2">
          <Link href={`/admin/events/${eventId}/checkin`} className="btn-secondary text-sm">
            צ'ק-אין
          </Link>
          <Link href={`/admin/events/${eventId}/participants`} className="btn-secondary text-sm">
            משתתפים
          </Link>
          <Link href={`/admin/events/${eventId}/selections`} className="btn-secondary text-sm">
            בחירות
          </Link>
          <Link href={`/admin/events/${eventId}/matches/pending`} className="btn-secondary text-sm">
            מאצ'ים
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'ממתינים', value: registrations.filter((r) => r.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'מאושרים', value: registrations.filter((r) => r.status === 'approved').length, color: 'bg-green-50 text-green-700' },
          { label: 'נדחו', value: registrations.filter((r) => r.status === 'rejected').length, color: 'bg-red-50 text-red-700' },
          { label: 'המתנה', value: registrations.filter((r) => r.status === 'waitlisted').length, color: 'bg-blue-50 text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg p-3 ${color} text-center`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm">{label}</div>
          </div>
        ))}
      </div>

      {showImbalanceWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-700 text-sm">
          ⚠️ אזהרה: חוסר איזון מגדרי בין המאושרים — גברים: {approvedMale}, נשים: {approvedFemale}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'pending', 'approved', 'rejected', 'waitlisted'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-lg text-sm ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s === '' ? 'הכל' : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">טוען...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-gray-600">שם</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">גיל</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">מגדר</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">סטטוס</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">תמונה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">הגשה</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map((reg) => {
                const age = reg.user?.birthDate
                  ? differenceInYears(new Date(), new Date(reg.user.birthDate))
                  : '?';
                const statusConfig = STATUS_LABELS[reg.status] || STATUS_LABELS.pending;
                const hasPhoto = !!reg.user?.profilePhotoUrl;

                return (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {reg.user?.profilePhotoUrl ? (
                          <img src={reg.user.profilePhotoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">👤</div>
                        )}
                        <span className="font-medium">{reg.user?.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{age}</td>
                    <td className="py-3 px-4 text-gray-600">{GENDER_LABELS[reg.user?.gender || ''] || reg.user?.gender}</td>
                    <td className="py-3 px-4">
                      <span className={statusConfig.color}>{statusConfig.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      {hasPhoto ? <span className="text-green-600">✓</span> : <span className="text-red-400">✗</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {format(new Date(reg.submittedAt), 'dd/MM HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(reg.id, 'approve')}
                              disabled={!!actionLoading}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              אשר
                            </button>
                            <button
                              onClick={() => handleAction(reg.id, 'reject')}
                              disabled={!!actionLoading}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              דחה
                            </button>
                            <button
                              onClick={() => handleAction(reg.id, 'waitlist')}
                              disabled={!!actionLoading}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              המתנה
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">אין נרשמים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
