'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Shield, Moon, Sun, Globe, Save, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export default function SettingsPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useDarkModeContext();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      showProfile: true,
      showActivity: true
    },
    language: 'ar',
    theme: darkMode ? 'dark' : 'light'
  });

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // حفظ الإعدادات في localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // تطبيق تغيير الثيم
      if (settings.theme === 'dark' && !darkMode) {
        toggleDarkMode();
      } else if (settings.theme === 'light' && darkMode) {
        toggleDarkMode();
      }
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* رأس الصفحة */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
            </div>
          </div>
        </div>

        {/* المحتوى */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            
            {/* إعدادات المظهر */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  المظهر
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">الوضع المظلم</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">تفعيل الوضع المظلم للحماية من إجهاد العين</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        theme: prev.theme === 'dark' ? 'light' : 'dark' 
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* إعدادات الإشعارات */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  الإشعارات
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">تلقي تحديثات عبر البريد الإلكتروني</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, email: !prev.notifications.email }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.email ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">الإشعارات الفورية</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">تلقي إشعارات فورية على جهازك</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, push: !prev.notifications.push }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.push ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* إعدادات الخصوصية */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  الخصوصية
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">عرض الملف الشخصي</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">السماح للآخرين بمشاهدة ملفك الشخصي</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, showProfile: !prev.privacy.showProfile }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.privacy.showProfile ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.privacy.showProfile ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">عرض النشاط</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">السماح بعرض نشاطك للآخرين</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, showActivity: !prev.privacy.showActivity }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.privacy.showActivity ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.privacy.showActivity ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* إعدادات اللغة */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-500" />
                  اللغة
                </h2>
              </div>
              <div className="p-6">
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* زر الحفظ */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 