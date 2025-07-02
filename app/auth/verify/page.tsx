'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, Clock, RefreshCw, ArrowRight, Star, Shield } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setResendSuccess(true);
        setCountdown(60);
        setCanResend(false);
      }
    } catch (error) {
      console.error('فشل في إعادة إرسال البريد:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4" dir="rtl">
      <div className="max-w-md w-full">
        {/* الكارت الرئيسي */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* أيقونة البريد */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>

          {/* العنوان والوصف */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            تحقق من بريدك الإلكتروني
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            لقد أرسلنا رابط التفعيل إلى
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="font-medium text-gray-900 break-all">{email}</p>
          </div>

          {/* التعليمات */}
          <div className="text-right mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">الخطوات التالية:</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center ml-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-600">افتح بريدك الإلكتروني</p>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center ml-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-600">ابحث عن رسالة من صحيفة سبق</p>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center ml-3 mt-0.5">
                  <span className="text-sm font-medium text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-600">اضغط على رابط التفعيل</p>
              </div>
            </div>
          </div>

          {/* مكافأة التفعيل */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-6 h-6 text-green-600 ml-2" />
              <span className="font-semibold text-green-800">مكافأة التفعيل</span>
            </div>
            <p className="text-sm text-green-700">
              ستحصل على 50 نقطة ولاء إضافية عند تفعيل حسابك!
            </p>
          </div>

          {/* زر إعادة الإرسال */}
          <div className="mb-6">
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                  <span className="text-green-700 text-sm">تم إرسال رابط جديد بنجاح!</span>
                </div>
              </div>
            )}

            <button
              onClick={handleResendEmail}
              disabled={!canResend || isResending}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                canResend && !isResending
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isResending ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                  جارٍ الإرسال...
                </div>
              ) : canResend ? (
                'إعادة إرسال رابط التفعيل'
              ) : (
                <div className="flex items-center justify-center">
                  <Clock className="w-4 h-4 ml-2" />
                  إعادة الإرسال خلال {countdown} ثانية
                </div>
              )}
            </button>
          </div>

          {/* رابط العودة */}
          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              العودة للتسجيل
            </Link>
          </div>
        </div>

        {/* نصائح إضافية */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Shield className="w-4 h-4 ml-2 text-blue-600" />
            لم تجد الرسالة؟
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• تحقق من مجلد البريد المزعج/الـ Spam</li>
            <li>• تأكد من صحة عنوان البريد الإلكتروني</li>
            <li>• انتظر بضع دقائق، قد يتأخر وصول البريد</li>
            <li>• تأكد من وجود مساحة كافية في صندوق البريد</li>
          </ul>
        </div>

        {/* معلومات الدعم */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            تحتاج مساعدة؟{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              تواصل معنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
