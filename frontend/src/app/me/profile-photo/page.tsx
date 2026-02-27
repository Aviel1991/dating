'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { photoApi } from '@/lib/api';

export default function ProfilePhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrorMsg('ניתן להעלות קבצי JPG או PNG בלבד');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('גודל הקובץ לא יעלה על 10MB');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setErrorMsg('');

    try {
      // Get presigned URL
      const { uploadUrl, fileKey } = await photoApi.getUploadUrl();

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });

      // Confirm upload
      await photoApi.confirmUpload(fileKey);

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'שגיאה בהעלאת התמונה');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">התמונה הועלתה בהצלחה!</h2>
          <p className="text-gray-600 mb-6">כעת את/ה כשיר/ה להשתתף באירוע.</p>
          <button onClick={() => router.back()} className="btn-primary">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="card">
          <h1 className="text-2xl font-bold text-primary-700 mb-2">העלאת תמונת פרופיל</h1>
          <p className="text-gray-600 text-sm mb-6">
            נדרשת תמונת פרופיל כדי להשתתף באירוע. ניתן להעלות קבצי JPG או PNG.
          </p>

          {/* Preview */}
          {preview ? (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors mb-4"
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-500">לחץ/י לבחירת תמונה</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG עד 10MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-600 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3">
            {preview && (
              <button
                onClick={() => { setPreview(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="btn-secondary flex-1"
              >
                החלף תמונה
              </button>
            )}
            <button
              onClick={preview ? handleUpload : () => fileInputRef.current?.click()}
              disabled={status === 'uploading'}
              className="btn-primary flex-1"
            >
              {status === 'uploading' ? 'מעלה...' : preview ? 'שמור תמונה' : 'בחר תמונה'}
            </button>
          </div>

          <button onClick={() => router.back()} className="text-sm text-gray-500 w-full text-center mt-4 hover:underline">
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
