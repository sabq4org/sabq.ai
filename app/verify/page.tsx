'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(15); // بدء العد من 15 ثانية
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // جلب البريد الإلكتروني من URL params
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    // عداد تنازلي لإعادة الإرسال
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    // الانتقال التلقائي للحقل التالي
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const values = pastedData.split('');
    const newValues = [...otpValues];
    
    values.forEach((value, index) => {
      if (index < 6 && /\d/.test(value)) {
        newValues[index] = value;
      }
    });
    
    setOtpValues(newValues);
    
    // التركيز على أول حقل فارغ
    const firstEmptyIndex = newValues.findIndex(v => !v);
    if (firstEmptyIndex !== -1) {
      inputRefs.current[firstEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = otpValues.join('');
    
    if (!email || code.length !== 6) {
      toast.error('يرجى إدخال البريد الإلكتروني ورمز التحقق الكامل');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        toast.success('تم تأكيد بريدك الإلكتروني بنجاح!');
        
        // حفظ بيانات المستخدم
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // الانتقال لصفحة اختيار الاهتمامات بعد ثانيتين
        setTimeout(() => {
          router.push('/welcome/preferences');
        }, 2000);
      } else {
        toast.error(data.error || 'حدث خطأ في التحقق');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تم إرسال رمز جديد إلى بريدك الإلكتروني');
        setResendTimer(60); // انتظار 60 ثانية قبل إعادة الإرسال
        setOtpValues(['', '', '', '', '', '']); // مسح الحقول
        inputRefs.current[0]?.focus(); // التركيز على أول حقل
      } else {
        toast.error(data.error || 'حدث خطأ في إعادة الإرسال');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
            تم التحقق بنجاح!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
            تم تأكيد بريدك الإلكتروني بنجاح، يتم تحويلك الآن...
          </p>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-8 max-w-md w-full">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <Mail className="w-8 h-8 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تأكيد البريد الإلكتروني
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
            تم إرسال رمز إلى بريدك، أدخله أدناه لإكمال التسجيل
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
              placeholder="example@email.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رمز التحقق
            </label>
            <div className="flex gap-2 justify-center" dir="ltr">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-10 h-12 md:w-12 md:h-14 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-center text-lg md:text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="0"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpValues.some(v => !v)}
            className="w-full bg-indigo-600 text-white py-3 md:py-3.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-sm md:text-base"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                جاري التحقق...
              </>
            ) : (
              <>
                تأكيد البريد
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">
            لم يصلك الرمز؟ {resendTimer > 0 && `انتظر قليلاً ثم أعد الإرسال`}
          </p>
          <button
            onClick={handleResendCode}
            disabled={isLoading || resendTimer > 0}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm md:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {resendTimer > 0 
              ? `إعادة الإرسال بعد ${resendTimer} ثانية`
              : 'إعادة إرسال الرمز'
            }
          </button>
        </div>

        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2 md:gap-3">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">ملاحظة مهمة:</p>
              <p>رمز التحقق صالح لمدة 10 دقائق فقط.</p>
              {process.env.NODE_ENV !== 'production' && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 px-2 py-1 rounded hidden md:block">
                  🔓 للتطوير: يمكنك استخدام الكود 000000
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
} 