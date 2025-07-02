'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FixAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState('جاري إصلاح المصادقة...');

  useEffect(() => {
    const fixAuth = async () => {
      try {
        // جلب بيانات المستخدم من localStorage
        const userStr = localStorage.getItem('user');
        const userId = localStorage.getItem('user_id');

        if (!userStr || !userId) {
          setStatus('لا توجد بيانات مستخدم محفوظة');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        const user = JSON.parse(userStr);

        // إرسال طلب للتحقق وإنشاء token
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id || userId,
            email: user.email
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          setStatus('تم إصلاح المصادقة بنجاح! جاري إعادة التوجيه...');
          
          // تحديث localStorage بالبيانات الجديدة
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // إعادة التوجيه للصفحة الرئيسية
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          setStatus('فشل إصلاح المصادقة: ' + data.error);
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error('خطأ في إصلاح المصادقة:', error);
        setStatus('حدث خطأ في إصلاح المصادقة');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    fixAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-gray-700 dark:text-gray-300">{status}</p>
      </div>
    </div>
  );
} 