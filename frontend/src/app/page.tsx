import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-pink-100">
      <div className="text-center max-w-lg mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary-700 mb-4">
          SpeedDating Event Manager
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          מערכת לניהול אירועי ספיד-דייטינג מקצה לקצה
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/login"
            className="btn-primary text-lg px-8 py-3"
          >
            כניסה למערכת
          </Link>
          <Link
            href="/admin/events"
            className="btn-secondary text-lg px-8 py-3"
          >
            ניהול אירועים (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
