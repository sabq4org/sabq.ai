'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, User, Mail, Lock, Bell,
  Shield, Globe, Moon, Sun, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newsAlerts: true,
    weeklyDigest: false
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData({
      ...formData,
      name: parsedUser.name,
      email: parsedUser.email
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    
    try {
      // هنا يمكن إضافة API call لتحديث البيانات
      
      // تحديث البيانات المحلية
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في حفظ التغييرات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* رأس الصفحة */}
          <div className="mb-8">
            <Link 
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للملف الشخصي
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800">إعدادات الحساب</h1>
            <p className="text-gray-600 mt-2">قم بإدارة معلوماتك الشخصية وتفضيلاتك</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* القائمة الجانبية */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <nav className="space-y-2">
                  <a href="#account" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-600">
                    <User className="w-5 h-5" />
                    معلومات الحساب
                  </a>
                  <a href="#security" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Lock className="w-5 h-5" />
                    الأمان وكلمة المرور
                  </a>
                  <a href="#notifications" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Bell className="w-5 h-5" />
                    الإشعارات
                  </a>
                  <a href="#privacy" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Shield className="w-5 h-5" />
                    الخصوصية
                  </a>
                  <a href="#preferences" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700">
                    <Globe className="w-5 h-5" />
                    التفضيلات
                  </a>
                </nav>
              </div>
            </div>

            {/* المحتوى الرئيسي */}
            <div className="lg:col-span-2 space-y-8">
              {/* معلومات الحساب */}
              <div id="account" className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">معلومات الحساب</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </form>
              </div>

              {/* الأمان وكلمة المرور */}
              <div id="security" className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">تغيير كلمة المرور</h2>
                
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كلمة المرور الحالية
                    </label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Lock className="w-5 h-5" />
                    تحديث كلمة المرور
                  </button>
                </form>
              </div>

              {/* الإشعارات */}
              <div id="notifications" className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">إعدادات الإشعارات</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">إشعارات البريد الإلكتروني</p>
                        <p className="text-sm text-gray-500">تلقي تحديثات عبر البريد الإلكتروني</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">الإشعارات الفورية</p>
                        <p className="text-sm text-gray-500">إشعارات المتصفح للأخبار العاجلة</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                      className="w-5 h-5 text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">تنبيهات الأخبار</p>
                        <p className="text-sm text-gray-500">إشعارات للأخبار في اهتماماتك</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.newsAlerts}
                      onChange={(e) => setNotifications({...notifications, newsAlerts: e.target.checked})}
                      className="w-5 h-5 text-blue-600"
                    />
                  </label>
                </div>

                <button className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Check className="w-5 h-5" />
                  حفظ الإعدادات
                </button>
              </div>

              {/* التفضيلات */}
              <div id="preferences" className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">التفضيلات العامة</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      المظهر
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setDarkMode(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          !darkMode ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        فاتح
                      </button>
                      <button
                        onClick={() => setDarkMode(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          darkMode ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        داكن
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اللغة المفضلة
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
