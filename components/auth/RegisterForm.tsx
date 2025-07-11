'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RegisterFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  newsletter: boolean;
  referralCode: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export default function RegisterForm({ redirectTo = '/', onSuccess, onError }: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
    newsletter: false,
    referralCode: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'red'
  });
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setCheckingEmail(true);
        try {
          const response = await fetch(`/api/auth/register?email=${encodeURIComponent(formData.email)}`);
          const result = await response.json();
          setEmailAvailable(result.available);
        } catch (error) {
          setEmailAvailable(null);
        } finally {
          setCheckingEmail(false);
        }
      } else {
        setEmailAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Check password strength
  useEffect(() => {
    const checkPasswordStrength = (password: string): PasswordStrength => {
      let score = 0;
      const feedback: string[] = [];

      if (password.length >= 8) score += 1;
      else feedback.push('8 أحرف على الأقل');

      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push('حرف كبير واحد على الأقل');

      if (/[a-z]/.test(password)) score += 1;
      else feedback.push('حرف صغير واحد على الأقل');

      if (/[0-9]/.test(password)) score += 1;
      else feedback.push('رقم واحد على الأقل');

      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
      else feedback.push('رمز خاص واحد على الأقل');

      let color = 'red';
      if (score >= 4) color = 'green';
      else if (score >= 3) color = 'yellow';
      else if (score >= 2) color = 'orange';

      return { score, feedback, color };
    };

    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    } else if (formData.name.length < 2) {
      newErrors.name = 'الاسم يجب أن يكون أكثر من حرفين';
    } else if (!/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = 'الاسم يحتوي على أحرف غير مسموحة';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    } else if (emailAvailable === false) {
      newErrors.email = 'البريد الإلكتروني مستخدم مسبقاً';
    }

    // Phone validation (optional)
    if (formData.phone && !/^(\+966|0)?[5-9]\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (passwordStrength.score < 4) {
      newErrors.password = 'كلمة المرور ضعيفة';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'يجب الموافقة على الشروط والأحكام';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
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
    
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          terms: formData.terms,
          newsletter: formData.newsletter,
          referralCode: formData.referralCode.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          // Handle validation errors
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((error: any) => {
            if (error.field) {
              fieldErrors[error.field] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          setGeneralError(result.error || 'حدث خطأ أثناء التسجيل');
        }
        onError?.(result.error || 'Registration failed');
      } else {
        // Success
        onSuccess?.();
        
        // Show success message and redirect
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى');
      onError?.('خطأ في الشبكة');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = (): string => {
    if (passwordStrength.score === 5) return 'قوية جداً';
    if (passwordStrength.score === 4) return 'قوية';
    if (passwordStrength.score === 3) return 'متوسطة';
    if (passwordStrength.score === 2) return 'ضعيفة';
    return 'ضعيفة جداً';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            انضم إلينا واستمتع بالمحتوى المميز
          </p>
        </div>

        {/* General Error */}
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{generalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الاسم الكامل
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                className={`pl-10 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="أدخل اسمك الكامل"
                disabled={isLoading}
                autoComplete="name"
                required
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

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
                className={`pl-10 pr-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : emailAvailable === true ? 'border-green-500' : ''}`}
                placeholder="أدخل بريدك الإلكتروني"
                disabled={isLoading}
                autoComplete="email"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {checkingEmail && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {!checkingEmail && emailAvailable === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {!checkingEmail && emailAvailable === false && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
            {emailAvailable === true && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">البريد الإلكتروني متاح</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رقم الهاتف (اختياري)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="05xxxxxxxx"
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
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
                placeholder="أدخل كلمة مرور قوية"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    قوة كلمة المرور: {getPasswordStrengthText()}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {passwordStrength.score}/5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.color === 'green' ? 'bg-green-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                      passwordStrength.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}`}
                placeholder="أعد إدخال كلمة المرور"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">كلمات المرور متطابقة</p>
            )}
          </div>

          {/* Referral Code Field */}
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رمز الإحالة (اختياري)
            </label>
            <Input
              id="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('referralCode', e.target.value)}
              className="uppercase"
              placeholder="أدخل رمز الإحالة إن وجد"
              disabled={isLoading}
            />
          </div>

          {/* Terms and Newsletter */}
          <div className="space-y-4">
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('terms', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                disabled={isLoading}
                required
              />
              <label htmlFor="terms" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                أوافق على{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  الشروط والأحكام
                </a>
                {' '}و{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  سياسة الخصوصية
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.terms}</p>
            )}

            <div className="flex items-center">
              <input
                id="newsletter"
                type="checkbox"
                checked={formData.newsletter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('newsletter', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="newsletter" className="mr-2 block text-sm text-gray-700 dark:text-gray-300">
                أرغب في تلقي النشرة الإخبارية والعروض الخاصة
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !formData.terms || emailAvailable === false}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              'إنشاء الحساب'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            لديك حساب بالفعل؟{' '}
            <a
              href="/auth/login"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 