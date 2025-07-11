'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginError {
  message: string;
  field?: string;
}

export default function LoginForm({ redirectTo = '/', onSuccess, onError }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          router.push(redirectTo);
        }
      } catch (error) {
        // User not logged in, continue
      }
    };
    checkSession();
  }, [router, redirectTo]);

  // Handle rate limiting countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setAttemptCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setGeneralError(`محاولات كثيرة. يرجى المحاولة بعد ${blockTimeRemaining} ثانية`);
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        // Handle different error types
        switch (result.error) {
          case 'CredentialsSignin':
            setGeneralError('بيانات تسجيل الدخول غير صحيحة');
            break;
          case 'AccountLocked':
            setGeneralError('الحساب مقفل مؤقتاً بسبب محاولات دخول متعددة');
            break;
          case 'AccountInactive':
            setGeneralError('الحساب غير نشط. يرجى التواصل مع الدعم');
            break;
          case 'EmailNotVerified':
            setGeneralError('يرجى التحقق من بريدك الإلكتروني أولاً');
            break;
          case 'RateLimitExceeded':
            setGeneralError('تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول');
            setIsBlocked(true);
            setBlockTimeRemaining(300); // 5 minutes
            break;
          default:
            setGeneralError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى');
        }

        // Block after 5 failed attempts
        if (newAttemptCount >= 5) {
          setIsBlocked(true);
          setBlockTimeRemaining(300); // 5 minutes
          setGeneralError('تم حظر تسجيل الدخول لمدة 5 دقائق بسبب المحاولات المتعددة');
        }

        onError?.(result.error);
      } else if (result?.ok) {
        // Success
        setAttemptCount(0);
        onSuccess?.();
        
        // Redirect to intended page
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
      onError?.('خطأ في الشبكة');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تسجيل الدخول
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            أدخل بياناتك للوصول إلى حسابك
          </p>
        </div>

        {/* Rate Limiting Warning */}
        {isBlocked && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5 mr-2" />
              <div>
                <p className="font-medium">تم حظر تسجيل الدخول مؤقتاً</p>
                <p className="text-sm mt-1">
                  الوقت المتبقي: {formatTime(blockTimeRemaining)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {generalError && !isBlocked && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{generalError}</p>
            </div>
          </div>
        )}

        {/* Attempt Counter */}
        {attemptCount > 0 && attemptCount < 5 && !isBlocked && (
          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              محاولة {attemptCount} من 5. {5 - attemptCount} محاولات متبقية
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="أدخل بريدك الإلكتروني"
                disabled={isLoading || isBlocked}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="أدخل كلمة المرور"
                disabled={isLoading || isBlocked}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isBlocked}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading || isBlocked}
              />
              <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                تذكرني
              </label>
            </div>
            <a
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              نسيت كلمة المرور؟
            </a>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isBlocked}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ليس لديك حساب؟{' '}
            <a
              href="/auth/register"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              إنشاء حساب جديد
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 