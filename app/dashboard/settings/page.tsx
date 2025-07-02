'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, Shield, Brain, Database, Search, CheckCircle, 
  Upload, Download, AlertCircle, Loader, Eye, EyeOff, Share2,
  Building, Mail, Phone, Twitter, Instagram, Facebook,
  Youtube, Smartphone, Lock, Bell, RefreshCw, FileText, 
  Type, Bot, Languages, ShieldAlert, Key, HardDrive, History, Info, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TabsEnhanced, TabItem } from '@/components/ui/tabs-enhanced';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('identity');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { darkMode } = useDarkModeContext();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [siteName, setSiteName] = useState('صحيفة سبق الإلكترونية');
  const [siteDescription, setSiteDescription] = useState('موقع إخباري رائد يقدم أحدث الأخبار والتحليلات');
  const [logoUrl, setLogoUrl] = useState('');
  const [previewLogo, setPreviewLogo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🏷️ إعدادات الهوية
  const [identitySettings, setIdentitySettings] = useState({
    siteName: 'صحيفة سبق الإلكترونية',
    logo: '',
    miniLogo: '',
    siteDescription: 'صحيفة سبق الإلكترونية - أول صحيفة سعودية تأسست على الإنترنت',
    baseUrl: 'https://sabq.org',
    defaultLanguage: 'ar',
    defaultCountry: 'SA',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD MMMM YYYY - h:mm A'
  });

  // 🌐 إعدادات SEO
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: 'صحيفة سبق الإلكترونية - آخر الأخبار السعودية والعالمية',
    metaDescription: 'تابع آخر الأخبار السعودية والعربية والعالمية مع صحيفة سبق الإلكترونية',
    keywords: 'سبق, أخبار, السعودية, عاجل, اقتصاد, رياضة, تقنية',
    ogImage: '/og-image.jpg',
    ogType: 'website',
    canonicalUrl: 'https://sabq.org',
    robotsTxt: 'User-agent: *\\nAllow: /',
    sitemapAutoGeneration: true,
    internalPagesSeo: {
      about: { title: 'عن صحيفة سبق', description: 'تعرف على صحيفة سبق الإلكترونية' },
      contact: { title: 'تواصل معنا', description: 'تواصل مع فريق صحيفة سبق' }
    }
  });

  // 📲 إعدادات المشاركة والتواصل
  const [socialSettings, setSocialSettings] = useState({
    twitter: 'https://twitter.com/sabqorg',
    instagram: 'https://instagram.com/sabqorg',
    facebook: 'https://facebook.com/sabqorg',
    youtube: 'https://youtube.com/sabqorg',
    iosAppUrl: 'https://apps.apple.com/app/sabq',
    androidAppUrl: 'https://play.google.com/store/apps/sabq',
    officialEmail: 'info@sabq.org',
    supportPhone: '9200XXXXX'
  });

  // 🧠 إعدادات الذكاء الاصطناعي
  const [aiSettings, setAiSettings] = useState({
    openaiKey: '',
    enableSuggestedTitles: true,
    enableAutoSummary: true,
    showAIHints: true,
    useCustomModel: false,
    aiOutputLanguage: 'auto',
    enableDeepAnalysis: false
  });

  // 🔐 إعدادات الأمان والإدارة
  const [securitySettings, setSecuritySettings] = useState({
    enable2FA: true,
    lockoutAttempts: 5,
    allowedIPs: [] as string[],
    notifyOnSettingsChange: true
  });

  // 🧩 إعدادات النسخ الاحتياطي
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: 'daily',
    notifyOnBackup: true,
    notifyOnUpdate: true,
    keepChangeLog: true
  });

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // جلب الإعدادات من قاعدة البيانات PlanetScale
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // تحديث الإعدادات من قاعدة البيانات
            if (data.data.identity) setIdentitySettings(data.data.identity);
            if (data.data.seo) setSeoSettings(data.data.seo);
            if (data.data.social) setSocialSettings(data.data.social);
            if (data.data.ai) setAiSettings(data.data.ai);
            if (data.data.security) setSecuritySettings(data.data.security);
            if (data.data.backup) setBackupSettings(data.data.backup);
          }
        } else {
          // إذا فشل الاتصال بقاعدة البيانات، استخدم localStorage
          console.warn('فشل في جلب الإعدادات من قاعدة البيانات، استخدام localStorage');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading settings from database:', error);
        // استخدام localStorage كبديل
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedIdentity = localStorage.getItem('settings_identity');
      const savedSeo = localStorage.getItem('settings_seo');
      const savedSocial = localStorage.getItem('settings_social');
      const savedAi = localStorage.getItem('settings_ai');
      const savedSecurity = localStorage.getItem('settings_security');
      const savedBackup = localStorage.getItem('settings_backup');
      
      if (savedIdentity) setIdentitySettings(JSON.parse(savedIdentity));
      if (savedSeo) setSeoSettings(JSON.parse(savedSeo));
      if (savedSocial) setSocialSettings(JSON.parse(savedSocial));
      if (savedAi) setAiSettings(JSON.parse(savedAi));
      if (savedSecurity) setSecuritySettings(JSON.parse(savedSecurity));
      if (savedBackup) setBackupSettings(JSON.parse(savedBackup));
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    // جلب الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('siteSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSiteName(settings.siteName || 'صحيفة سبق الإلكترونية');
      setSiteDescription(settings.siteDescription || 'موقع إخباري رائد يقدم أحدث الأخبار والتحليلات');
      setLogoUrl(settings.logoUrl || '');
      setPreviewLogo(settings.logoUrl || '');
    }
  }, []);

  const showSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const testOpenAIConnection = async () => {
    if (!aiSettings.openaiKey) {
      setTestResult({ success: false, message: 'يرجى إدخال مفتاح OpenAI أولاً' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiSettings.openaiKey })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: data.message || 'تم الاتصال بنجاح! المفتاح صالح.' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: data.error || 'فشل الاتصال. تحقق من صحة المفتاح.' 
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'فشل الاتصال. تحقق من صحة المفتاح.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveSettings = async (section: string) => {
    let settings;
    switch(section) {
      case 'identity': settings = identitySettings; break;
      case 'seo': settings = seoSettings; break;
      case 'social': settings = socialSettings; break;
      case 'ai': settings = aiSettings; break;
      case 'security': settings = securitySettings; break;
      case 'backup': settings = backupSettings; break;
    }
    
    try {
      // حفظ في قاعدة البيانات PlanetScale
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          data: settings
        })
      });
      
      if (response.ok) {
        // حفظ في localStorage كنسخة احتياطية
        localStorage.setItem(`settings_${section}`, JSON.stringify(settings));
        showSuccess();
        toast.success('تم حفظ الإعدادات في قاعدة البيانات بنجاح');
      } else {
        const errorData = await response.json();
        toast.error(`فشل في حفظ الإعدادات: ${errorData.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات. تحقق من الاتصال بقاعدة البيانات.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار ملف صورة صالح');
        return;
      }

      // التحقق من حجم الملف (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      // عرض معاينة الصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewLogo(result);
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl('');
    setPreviewLogo('');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // حفظ الإعدادات في localStorage
      const settings = {
        siteName,
        siteDescription,
        logoUrl,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('siteSettings', JSON.stringify(settings));
      
      // تحديث الصفحة لتطبيق التغييرات
      toast.success('تم حفظ الإعدادات بنجاح');
      
      // إعادة تحميل الصفحة بعد ثانية
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: TabItem[] = [
    { id: 'identity', name: 'الهوية', icon: Building },
    { id: 'seo', name: 'SEO', icon: Search },
    { id: 'social', name: 'المشاركة', icon: Share2 },
    { id: 'ai', name: 'الذكاء الاصطناعي', icon: Brain },
    { id: 'security', name: 'الأمان', icon: Shield },
    { id: 'backup', name: 'النسخ الاحتياطي', icon: Database }
  ];

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`}>
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          تم حفظ الإعدادات بنجاح!
        </div>
      )}

      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>إعدادات الصحيفة</h1>
        <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>إدارة الإعدادات العامة لصحيفة سبق الإلكترونية</p>
      </div>

      {/* Navigation Tabs */}
      <TabsEnhanced
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* محتوى التبويبات */}
      <div className={`rounded-2xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="p-6">
          
          {/* 🏷️ تبويب الهوية */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏷️ إعدادات الهوية</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الهوية البصرية والمعلومات الأساسية للصحيفة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>اسم الصحيفة</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الرابط الأساسي</label>
                  <input
                    type="url"
                    value={identitySettings.baseUrl}
                    onChange={(e) => setIdentitySettings({...identitySettings, baseUrl: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الشعار الرئيسي</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="رابط الشعار أو اضغط رفع"
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    />
                    <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300">
                      <Upload className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الشعار المصغر</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={identitySettings.miniLogo}
                      onChange={(e) => setIdentitySettings({...identitySettings, miniLogo: e.target.value})}
                      placeholder="رابط الشعار المصغر"
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    />
                    <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300">
                      <Upload className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>لغة الموقع الافتراضية</label>
                  <select
                    value={identitySettings.defaultLanguage}
                    onChange={(e) => setIdentitySettings({...identitySettings, defaultLanguage: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الدولة الافتراضية</label>
                  <select
                    value={identitySettings.defaultCountry}
                    onChange={(e) => setIdentitySettings({...identitySettings, defaultCountry: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="SA">السعودية</option>
                    <option value="AE">الإمارات</option>
                    <option value="KW">الكويت</option>
                    <option value="BH">البحرين</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>المنطقة الزمنية</label>
                  <select
                    value={identitySettings.timezone}
                    onChange={(e) => setIdentitySettings({...identitySettings, timezone: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="Asia/Riyadh">Asia/Riyadh</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Asia/Kuwait">Asia/Kuwait</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تنسيق التاريخ والوقت</label>
                  <select
                    value={identitySettings.dateFormat}
                    onChange={(e) => setIdentitySettings({...identitySettings, dateFormat: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="DD MMMM YYYY - h:mm A">15 يونيو 2025 - 2:30 م</option>
                    <option value="DD/MM/YYYY - HH:mm">15/06/2025 - 14:30</option>
                    <option value="YYYY-MM-DD HH:mm:ss">2025-06-15 14:30:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الوصف التعريفي</label>
                <textarea
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <button 
                onClick={() => saveSettings('identity')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات الهوية
              </button>
            </div>
          )}

          {/* 🌐 تبويب SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🌐 إعدادات SEO الأساسية</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>تحسين محركات البحث والتسويق الرقمي</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meta Title</label>
                  <input
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={(e) => setSeoSettings({...seoSettings, metaTitle: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">العنوان الذي يظهر في Google</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meta Description</label>
                  <textarea
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings({...seoSettings, metaDescription: e.target.value})}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">وصف قصير يعكس محتوى الموقع</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Keywords</label>
                  <input
                    type="text"
                    value={seoSettings.keywords}
                    onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                    placeholder="كلمة1, كلمة2, كلمة3"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">كلمات مفتاحية مفصولة بفواصل</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>OG Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={seoSettings.ogImage}
                        onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
                        placeholder="/og-image.jpg"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                      <button className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300">
                        <Upload className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">صورة OpenGraph لروابط السوشيال ميديا</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>OG Type</label>
                    <select
                      value={seoSettings.ogType}
                      onChange={(e) => setSeoSettings({...seoSettings, ogType: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Canonical URL</label>
                  <input
                    type="url"
                    value={seoSettings.canonicalUrl}
                    onChange={(e) => setSeoSettings({...seoSettings, canonicalUrl: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">رابط مرجعي للموقع لمنع التكرار</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Robots.txt</label>
                  <textarea
                    value={seoSettings.robotsTxt}
                    onChange={(e) => setSeoSettings({...seoSettings, robotsTxt: e.target.value})}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border font-mono text-sm transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">تعديل سياسة الفهرسة</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sitemap"
                    checked={seoSettings.sitemapAutoGeneration}
                    onChange={(e) => setSeoSettings({...seoSettings, sitemapAutoGeneration: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="sitemap" className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sitemap Auto-generation - توليد sitemap.xml تلقائياً
                  </label>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>SEO للصفحات الداخلية</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">صفحة "عن الصحيفة"</label>
                      <input
                        type="text"
                        placeholder="العنوان"
                        value={seoSettings.internalPagesSeo.about.title}
                        onChange={(e) => setSeoSettings({
                          ...seoSettings,
                          internalPagesSeo: {
                            ...seoSettings.internalPagesSeo,
                            about: { ...seoSettings.internalPagesSeo.about, title: e.target.value }
                          }
                        })}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                      />
                      <input
                        type="text"
                        placeholder="الوصف"
                        value={seoSettings.internalPagesSeo.about.description}
                        onChange={(e) => setSeoSettings({
                          ...seoSettings,
                          internalPagesSeo: {
                            ...seoSettings.internalPagesSeo,
                            about: { ...seoSettings.internalPagesSeo.about, description: e.target.value }
                          }
                        })}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">صفحة "تواصل معنا"</label>
                      <input
                        type="text"
                        placeholder="العنوان"
                        value={seoSettings.internalPagesSeo.contact.title}
                        onChange={(e) => setSeoSettings({
                          ...seoSettings,
                          internalPagesSeo: {
                            ...seoSettings.internalPagesSeo,
                            contact: { ...seoSettings.internalPagesSeo.contact, title: e.target.value }
                          }
                        })}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                      />
                      <input
                        type="text"
                        placeholder="الوصف"
                        value={seoSettings.internalPagesSeo.contact.description}
                        onChange={(e) => setSeoSettings({
                          ...seoSettings,
                          internalPagesSeo: {
                            ...seoSettings.internalPagesSeo,
                            contact: { ...seoSettings.internalPagesSeo.contact, description: e.target.value }
                          }
                        })}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => saveSettings('seo')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات SEO
              </button>
            </div>
          )}

          {/* 📲 تبويب المشاركة والتواصل */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📲 إعدادات المشاركة والتواصل</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>روابط التواصل الاجتماعي والتطبيقات</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>روابط السوشيال ميديا</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Twitter className="w-5 h-5 text-blue-400" />
                      <input
                        type="url"
                        value={socialSettings.twitter}
                        onChange={(e) => setSocialSettings({...socialSettings, twitter: e.target.value})}
                        placeholder="https://twitter.com/sabqorg"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <input
                        type="url"
                        value={socialSettings.instagram}
                        onChange={(e) => setSocialSettings({...socialSettings, instagram: e.target.value})}
                        placeholder="https://instagram.com/sabqorg"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <input
                        type="url"
                        value={socialSettings.facebook}
                        onChange={(e) => setSocialSettings({...socialSettings, facebook: e.target.value})}
                        placeholder="https://facebook.com/sabqorg"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Youtube className="w-5 h-5 text-red-600" />
                      <input
                        type="url"
                        value={socialSettings.youtube}
                        onChange={(e) => setSocialSettings({...socialSettings, youtube: e.target.value})}
                        placeholder="https://youtube.com/sabqorg"
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>روابط التطبيقات</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>رابط تطبيق iOS</label>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <input
                          type="url"
                          value={socialSettings.iosAppUrl}
                          onChange={(e) => setSocialSettings({...socialSettings, iosAppUrl: e.target.value})}
                          placeholder="https://apps.apple.com/app/sabq"
                          className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>رابط تطبيق Android</label>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <input
                          type="url"
                          value={socialSettings.androidAppUrl}
                          onChange={(e) => setSocialSettings({...socialSettings, androidAppUrl: e.target.value})}
                          placeholder="https://play.google.com/store/apps/sabq"
                          className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>معلومات التواصل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>البريد الرسمي</label>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <input
                          type="email"
                          value={socialSettings.officialEmail}
                          onChange={(e) => setSocialSettings({...socialSettings, officialEmail: e.target.value})}
                          className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>رقم الدعم الفني</label>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <input
                          type="tel"
                          value={socialSettings.supportPhone}
                          onChange={(e) => setSocialSettings({...socialSettings, supportPhone: e.target.value})}
                          className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => saveSettings('social')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات المشاركة
              </button>
            </div>
          )}

          {/* 🧠 تبويب الذكاء الاصطناعي */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🧠 إعدادات الذكاء الاصطناعي</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إدارة مفاتيح API والميزات الذكية</p>
                </div>
              </div>
              
              <div className={`p-6 rounded-xl border transition-colors duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>مفتاح OpenAI API</h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={aiSettings.openaiKey}
                          onChange={(e) => setAiSettings({...aiSettings, openaiKey: e.target.value})}
                          placeholder="sk-..."
                          className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button 
                        onClick={() => saveSettings('ai')}
                        className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2 transition-all duration-300"
                      >
                        <Save className="w-4 h-4" />
                        حفظ
                      </button>
                      <button 
                        onClick={testOpenAIConnection}
                        disabled={isTestingConnection}
                        className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
                      >
                        {isTestingConnection ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        اختبار
                      </button>
                    </div>
                    
                    {testResult && (
                      <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl border transition-colors duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>الميزات النشطة</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-gray-600" />
                      <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تفعيل العناوين المقترحة من AI</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.enableSuggestedTitles}
                      onChange={(e) => setAiSettings({...aiSettings, enableSuggestedTitles: e.target.checked})}
                      className="w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تفعيل التلخيص التلقائي</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.enableAutoSummary}
                      onChange={(e) => setAiSettings({...aiSettings, enableAutoSummary: e.target.checked})}
                      className="w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-gray-600" />
                      <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>عرض إشارات AI للمحرر (مثل: هذا العنوان ضعيف)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.showAIHints}
                      onChange={(e) => setAiSettings({...aiSettings, showAIHints: e.target.checked})}
                      className="w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-gray-600" />
                      <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>استخدام نموذج مخصص (Fine-tuned)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.useCustomModel}
                      onChange={(e) => setAiSettings({...aiSettings, useCustomModel: e.target.checked})}
                      className="w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تفعيل نظام التحليل العميق</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiSettings.enableDeepAnalysis}
                      onChange={(e) => {
                        setAiSettings({...aiSettings, enableDeepAnalysis: e.target.checked});
                        // حفظ حالة التحليل العميق مباشرة
                        localStorage.setItem('deep_analysis_enabled', e.target.checked.toString());
                      }}
                      className="w-4 h-4"
                    />
                  </label>

                  <div className="p-3">
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Languages className="inline w-4 h-4 ml-2" />
                      لغة الإخراج من AI
                    </label>
                    <select
                      value={aiSettings.aiOutputLanguage}
                      onChange={(e) => setAiSettings({...aiSettings, aiOutputLanguage: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="auto">تلقائي حسب لغة المقال</option>
                      <option value="ar">عربي</option>
                      <option value="en">إنجليزي</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => saveSettings('ai')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات الذكاء الاصطناعي
              </button>
            </div>
          )}

          {/* 🔐 تبويب الأمان والإدارة */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🔐 إعدادات الأمان والإدارة</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>حماية النظام وإدارة الصلاحيات</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-xl border transition-colors duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>إعدادات الأمان</h4>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-600" />
                        <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تشغيل المصادقة الثنائية (2FA)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.enable2FA}
                        onChange={(e) => setSecuritySettings({...securitySettings, enable2FA: e.target.checked})}
                        className="w-4 h-4"
                      />
                    </label>

                    <div className="p-3">
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Lock className="inline w-4 h-4 ml-2" />
                        تعطيل الحساب بعد محاولات دخول خاطئة
                      </label>
                      <input
                        type="number"
                        value={securitySettings.lockoutAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, lockoutAttempts: parseInt(e.target.value)})}
                        min="3"
                        max="10"
                        className={`w-32 px-4 py-2 rounded-lg border transition-all duration-300 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                      <span className="mr-2 text-sm text-gray-500">محاولات</span>
                    </div>

                    <div className="p-3">
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <ShieldAlert className="inline w-4 h-4 ml-2" />
                        تحديد IPs مسموحة للدخول للوحة التحكم
                      </label>
                      <textarea
                        value={securitySettings.allowedIPs.join('\n')}
                        onChange={(e) => setSecuritySettings({...securitySettings, allowedIPs: e.target.value.split('\n').filter(ip => ip.trim())})}
                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                        rows={3}
                        className={`w-full px-4 py-2 rounded-lg border font-mono text-sm transition-all duration-300 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      />
                      <p className="text-xs text-gray-500 mt-1">IP واحد في كل سطر (اتركه فارغاً للسماح للجميع)</p>
                    </div>

                    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>إرسال إشعار عند أي تعديل في الإعدادات</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.notifyOnSettingsChange}
                        onChange={(e) => setSecuritySettings({...securitySettings, notifyOnSettingsChange: e.target.checked})}
                        className="w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => saveSettings('security')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات الأمان
              </button>
            </div>
          )}

          {/* 🧩 تبويب النسخ الاحتياطي */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🧩 إعدادات النسخ الاحتياطي والتحديث</h3>
                  <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إدارة النسخ الاحتياطي وتحديثات النظام</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-xl border transition-colors duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>النسخ الاحتياطي</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <HardDrive className="inline w-4 h-4 ml-2" />
                        نسخ احتياطي تلقائي للبيانات
                      </label>
                      <select
                        value={backupSettings.autoBackup}
                        onChange={(e) => setBackupSettings({...backupSettings, autoBackup: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="daily">يومي</option>
                        <option value="weekly">أسبوعي</option>
                        <option value="manual">يدوي</option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>إشعار عند كل عملية نسخ احتياطي</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={backupSettings.notifyOnBackup}
                        onChange={(e) => setBackupSettings({...backupSettings, notifyOnBackup: e.target.checked})}
                        className="w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                        <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>تنبيه عند توفر تحديث للنظام</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={backupSettings.notifyOnUpdate}
                        onChange={(e) => setBackupSettings({...backupSettings, notifyOnUpdate: e.target.checked})}
                        className="w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-gray-600" />
                        <span className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>حفظ سجل التعديلات على الإعدادات</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={backupSettings.keepChangeLog}
                        onChange={(e) => setBackupSettings({...backupSettings, keepChangeLog: e.target.checked})}
                        className="w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl flex items-center gap-2 font-medium transition-all duration-300">
                    <Download className="w-5 h-5" />
                    تنزيل نسخة احتياطية الآن
                  </button>
                  <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl flex items-center gap-2 font-medium transition-all duration-300">
                    <Upload className="w-5 h-5" />
                    استعادة نسخة احتياطية
                  </button>
                </div>
              </div>

              <button 
                onClick={() => saveSettings('backup')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                حفظ إعدادات النسخ الاحتياطي
              </button>
            </div>
          )}
        </div>
      </div>

      {/* معاينة مباشرة */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">معاينة الشعار</h2>
        <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center">
          {previewLogo ? (
            <img
              src={previewLogo}
              alt="معاينة الشعار"
              className="max-h-16"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <ImageIcon className="w-12 h-12 mb-2" />
              <span className="text-sm">لم يتم رفع شعار بعد</span>
            </div>
          )}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
