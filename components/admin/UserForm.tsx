'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface UserFormProps {
  userId?: string;
  isEdit?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'reader' | 'editor' | 'admin';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  two_factor: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'reader' | 'editor' | 'admin';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  two_factor: boolean;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  status?: string;
  general?: string;
}

const UserForm: React.FC<UserFormProps> = ({ userId, isEdit = false }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'reader',
    status: 'active',
    two_factor: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
  });
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Load user data if editing
  useEffect(() => {
    if (isEdit && userId) {
      fetchUserData();
    }
  }, [isEdit, userId]);

  // Check email availability
  useEffect(() => {
    if (formData.email && !isEdit) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.email, isEdit]);

  // Check password strength
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength();
    }
  }, [formData.password]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المستخدم');
      }

      const data = await response.json();
      
      if (data.success) {
        const user = data.data.user;
        setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          password: '',
          confirmPassword: '',
          role: user.role,
          status: user.status,
          two_factor: user.two_factor_enabled || false,
        });
      } else {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEmailAvailability = async () => {
    try {
      setCheckingEmail(true);
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailAvailable(data.available);
      }
    } catch (err) {
      // Ignore errors for email checking
    } finally {
      setCheckingEmail(false);
    }
  };

  const checkPasswordStrength = () => {
    const password = formData.password;
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('يجب أن تحتوي على رقم واحد على الأقل');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    setPasswordStrength({ score, feedback });
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'الاسم يجب أن يكون أكثر من حرفين';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'الاسم طويل جداً';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    } else if (!isEdit && emailAvailable === false) {
      newErrors.email = 'البريد الإلكتروني مستخدم بالفعل';
    }

    // Phone validation (optional)
    if (formData.phone && !/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    // Password validation (required for new users)
    if (!isEdit || formData.password) {
      if (!formData.password) {
        newErrors.password = 'كلمة المرور مطلوبة';
      } else if (passwordStrength.score < 3) {
        newErrors.password = 'كلمة المرور ضعيفة';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const submitData: any = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        status: formData.status,
        two_factor: formData.two_factor,
      };

      if (!isEdit || formData.password) {
        submitData.password = formData.password;
      }

      const url = isEdit ? `/api/admin/users/${userId}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ البيانات');
      }

      const data = await response.json();
      
      if (data.success) {
        router.push('/admin/users');
      } else {
        if (data.details) {
          const fieldErrors: ValidationErrors = {};
          data.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || 'حدث خطأ غير متوقع' });
        }
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'ضعيفة';
    if (score <= 3) return 'متوسطة';
    if (score <= 4) return 'قوية';
    return 'قوية جداً';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEdit ? 'تعديل بيانات المستخدم' : 'إنشاء حساب مستخدم جديد'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 ml-2" />
              <span className="text-red-800">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">المعلومات الأساسية</h2>
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`block w-full pr-10 border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isEdit}
                className={`block w-full pr-10 border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } ${isEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="أدخل البريد الإلكتروني"
              />
              {!isEdit && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  {checkingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : emailAvailable === true ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : emailAvailable === false ? (
                    <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
            {!isEdit && emailAvailable === true && (
              <p className="mt-1 text-sm text-green-600">البريد الإلكتروني متاح</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`block w-full pr-10 border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل رقم الهاتف (اختياري)"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Password Section */}
        {(!isEdit || formData.password) && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              {isEdit ? 'تغيير كلمة المرور' : 'كلمة المرور'}
            </h2>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور {!isEdit && '*'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pr-10 pl-10 border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={isEdit ? 'اتركها فارغة إذا كنت لا تريد تغييرها' : 'أدخل كلمة المرور'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              
              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">قوة كلمة المرور:</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-600' :
                      passwordStrength.score <= 3 ? 'text-yellow-600' :
                      passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{feedback}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {formData.password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`block w-full pr-10 pl-10 border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 ml-1" />
                    كلمات المرور متطابقة
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Role and Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">الصلاحيات والحالة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الدور *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value as 'reader' | 'editor' | 'admin')}
                className={`block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="reader">قارئ</option>
                <option value="editor">محرر</option>
                <option value="admin">مشرف</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive' | 'banned' | 'pending')}
                className={`block w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="pending">معلق</option>
                <option value="banned">محظور</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Security Options */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">خيارات الأمان</h2>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="two_factor"
              checked={formData.two_factor}
              onChange={(e) => handleInputChange('two_factor', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="two_factor" className="mr-2 block text-sm text-gray-900">
              تفعيل المصادقة الثنائية
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || (emailAvailable === false && !isEdit)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </div>
            ) : (
              isEdit ? 'حفظ التعديلات' : 'إنشاء المستخدم'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm; 