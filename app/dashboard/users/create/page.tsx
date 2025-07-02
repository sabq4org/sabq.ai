'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Mail, Phone, Shield, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    bio: '',
    avatar: null as File | null,
    permissions: [] as string[],
    isActive: true,
    sendWelcomeEmail: true
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const availableRoles = [
    'رئيس التحرير',
    'محرر أول', 
    'محرر',
    'مدقق لغوي',
    'مطور',
    'مسوق المحتوى',
    'محلل البيانات',
    'مشرف تعليقات',
    'مراجع وسائط'
  ];

  const availableDepartments = [
    'إدارة المحتوى',
    'التقنية',
    'التسويق',
    'إدارة التفاعل',
    'تحليل البيانات',
    'إدارة الوسائط',
    'الأمان والحماية'
  ];

  const availablePermissions = [
    { id: 'create_articles', name: 'إنشاء المقالات', category: 'المحتوى' },
    { id: 'edit_articles', name: 'تعديل المقالات', category: 'المحتوى' },
    { id: 'delete_articles', name: 'حذف المقالات', category: 'المحتوى' },
    { id: 'publish_articles', name: 'نشر المقالات', category: 'المحتوى' },
    { id: 'review_articles', name: 'مراجعة المقالات', category: 'المحتوى' },
    { id: 'manage_users', name: 'إدارة المستخدمين', category: 'المستخدمين' },
    { id: 'view_analytics', name: 'عرض الإحصائيات', category: 'النظام' },
    { id: 'manage_settings', name: 'إدارة الإعدادات', category: 'النظام' },
    { id: 'backup_system', name: 'النسخ الاحتياطي', category: 'النظام' },
    { id: 'moderate_comments', name: 'إدارة التعليقات', category: 'التفاعل' },
    { id: 'manage_media', name: 'إدارة الوسائط', category: 'الوسائط' }
  ];

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'الاسم الأول مطلوب';
    if (!formData.lastName.trim()) newErrors.lastName = 'الاسم الأخير مطلوب';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    if (!formData.email.includes('@')) newErrors.email = 'البريد الإلكتروني غير صالح';
    if (!formData.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    if (formData.username.length < 3) newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    if (formData.password.length < 8) newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    if (!formData.role) newErrors.role = 'الدور مطلوب';
    if (!formData.department) newErrors.department = 'القسم مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // محاكاة إرسال البيانات
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // حفظ في localStorage كمثال
      const userData = {
        id: Date.now(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        role: formData.role,
        department: formData.department,
        bio: formData.bio,
        permissions: formData.permissions,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        avatar: '/api/placeholder/40/40'
      };

      const existingUsers = JSON.parse(localStorage.getItem('sabq_users') || '[]');
      existingUsers.push(userData);
      localStorage.setItem('sabq_users', JSON.stringify(existingUsers));

      setShowSuccessMessage(true);
      
      // إرسال بريد ترحيب إذا كان مطلوباً
      if (formData.sendWelcomeEmail) {
        console.log('إرسال بريد ترحيب إلى:', formData.email);
      }

      setTimeout(() => {
        router.push('/dashboard/team');
      }, 2000);

    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('يرجى اختيار ملف صورة صالح (PNG أو JPG)');
      return;
    }

    // التحقق من حجم الملف (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, avatar: data.url }));
          console.log('تم رفع الصورة بنجاح:', data.url);
        } else {
          alert(data.error || 'فشل في رفع الصورة');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'فشل في رفع الصورة');
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert('حدث خطأ في رفع الصورة');
    }
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* رسالة النجاح */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          تم إنشاء المستخدم بنجاح! جاري التوجيه...
        </div>
      )}

      {/* العنوان والتنقل */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={() => router.back()}
            className={`p-2 rounded-lg transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'}`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>إنشاء مستخدم جديد</h1>
        </div>
        <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>إضافة عضو جديد إلى فريق صحيفة سبق</p>
      </div>

      {/* النموذج */}
      <div className={`rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* المعلومات الشخصية */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>المعلومات الشخصية</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>البيانات الأساسية للمستخدم</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    الاسم الأول *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.firstName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                    placeholder="أدخل الاسم الأول"
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.firstName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    الاسم الأخير *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.lastName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                    placeholder="أدخل الاسم الأخير"
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.lastName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border transition-all duration-300 ${
                        errors.email 
                          ? 'border-red-500 focus:ring-red-500' 
                          : darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } focus:ring-2`}
                      placeholder="example@sabq.org"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      } focus:ring-2`}
                      placeholder="+966501234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* معلومات الحساب */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>معلومات الحساب</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>بيانات تسجيل الدخول والأمان</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.username 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                    placeholder="username"
                  />
                  {errors.username && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.password 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.password}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    تأكيد كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* الدور والقسم */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    الدور الوظيفي *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.role 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                  >
                    <option value="">اختر الدور</option>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {errors.role && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.role}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    القسم *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                      errors.department 
                        ? 'border-red-500 focus:ring-red-500' 
                        : darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    } focus:ring-2`}
                  >
                    <option value="">اختر القسم</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">{errors.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* الصلاحيات */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>الصلاحيات</h3>
              <div className="space-y-4">
                {['المحتوى', 'المستخدمين', 'النظام', 'التفاعل', 'الوسائط'].map((category) => (
                  <div key={category}>
                    <h4 className={`text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {availablePermissions.filter(p => p.category === category).map((permission) => (
                        <label key={permission.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* إعدادات إضافية */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تفعيل الحساب فوراً</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sendWelcomeEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>إرسال بريد ترحيب</span>
                </label>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    إنشاء المستخدم
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={() => router.back()}
                className={`px-6 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
