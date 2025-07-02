'use client';

import { useState, useEffect } from 'react';
import { ReaderProfile } from '@/types/reader-profile';
import { getCookie } from '@/lib/cookies';

interface UseReaderProfileReturn {
  profile: ReaderProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReaderProfile(): UseReaderProfileReturn {
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // الحصول على معرف المستخدم من cookie
      const userCookie = getCookie('user');
      if (!userCookie) {
        setError('لم يتم تسجيل الدخول');
        return;
      }

      let userId;
      try {
        const userData = JSON.parse(userCookie);
        userId = userData.id;
      } catch {
        setError('خطأ في قراءة بيانات المستخدم');
        return;
      }

      if (!userId) {
        setError('معرف المستخدم غير موجود');
        return;
      }

      const response = await fetch('/api/user/reader-profile', {
        headers: {
          'x-user-id': userId
        }
      });

      console.log('[useReaderProfile] Fetch status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[useReaderProfile] Error body:', errText);
        throw new Error('فشل جلب ملف القارئ');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile
  };
} 