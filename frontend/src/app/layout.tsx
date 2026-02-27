import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpeedDating Event Manager',
  description: 'מערכת לניהול אירועי ספיד-דייטינג',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
