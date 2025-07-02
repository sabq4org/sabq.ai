'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Layout,
  FileText,
  Image,
  Menu,
  Calendar,
  Palette,
  Settings2,
  Download,
  Upload,
  Eye,
  Code,
  Save
} from 'lucide-react';
// import { TemplatesList } from './components/TemplatesList';
// import { TemplateEditor } from './components/TemplateEditor';
// import { Template, TemplateType } from '@/types/template';

type TemplateType = 'header' | 'footer' | 'sidebar' | 'article' | 'category' | 'special';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<TemplateType>('header');
  const [showEditor, setShowEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // التحقق من الوضع الليلي من localStorage
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);
  
  // إذا لم تكن الصفحة محملة بعد، نعرض شاشة تحميل
  if (!mounted) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'header', 
      name: 'الهيدر', 
      count: 3,
      icon: Layout
    },
    { 
      id: 'footer', 
      name: 'الفوتر', 
      count: 2,
      icon: Menu
    },
    { 
      id: 'sidebar', 
      name: 'الشريط الجانبي', 
      count: 4,
      icon: FileText
    },
    { 
      id: 'article', 
      name: 'المقالات', 
      count: 6,
      icon: FileText
    },
    { 
      id: 'category', 
      name: 'الأقسام', 
      count: 5,
      icon: Image
    },
    { 
      id: 'special', 
      name: 'المناسبات', 
      count: 8,
      icon: Calendar
    }
  ];

  // مكون بطاقة الإحصائيات
  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color?: string;
  }) => {
    const getColorClasses = () => {
      switch (color) {
        case 'green':
          return 'bg-green-100 text-green-700 border-green-200';
        case 'yellow':
          return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'purple':
          return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'red':
          return 'bg-red-100 text-red-700 border-red-200';
        default:
          return 'bg-blue-100 text-blue-700 border-blue-200';
      }
    };

    return (
      <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses()}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className={`text-sm mb-1 transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{title}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{value}</span>
              <span className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{subtitle}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCreate = () => {
    alert('ميزة إنشاء القالب قيد التطوير');
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إدارة القوالب</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>إدارة وتخصيص قوالب الموقع للمناسبات والفعاليات المختلفة</p>
      </div>

      {/* قسم النظام الذكي للقوالب */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-700' 
            : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام القوالب الذكي</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>تخصيص تلقائي للقوالب حسب المناسبات والأحداث</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-indigo-600' 
                : 'bg-white border-indigo-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>جدولة تلقائية</p>
                  <p className={`text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>نشط</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-indigo-600' 
                : 'bg-white border-indigo-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>معاينة مباشرة</p>
                  <p className={`text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>متاح</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-indigo-600' 
                : 'bg-white border-indigo-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>محرر متقدم</p>
                  <p className={`text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>تفاعلي</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl p-4 border transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-indigo-600' 
                : 'bg-white border-indigo-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>تخصيص ديناميكي</p>
                  <p className={`text-xs transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>ذكي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-6 gap-6 mb-8">
        <StatsCard
          title="إجمالي القوالب"
          value="28"
          subtitle="قالب نشط"
          icon={Layout}
          color="blue"
        />
        <StatsCard
          title="القوالب النشطة"
          value="24"
          subtitle="قيد الاستخدام"
          icon={Eye}
          color="green"
        />
        <StatsCard
          title="قوالب المناسبات"
          value="8"
          subtitle="موسمية"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="المسودات"
          value="4"
          subtitle="قيد التطوير"
          icon={FileText}
          color="yellow"
        />
        <StatsCard
          title="معدل الاستخدام"
          value="85%"
          subtitle="كفاءة عالية"
          icon={Settings2}
          color="green"
        />
        <StatsCard
          title="آخر تحديث"
          value="اليوم"
          subtitle="محدث"
          icon={Save}
          color="blue"
        />
      </div>

      {/* شريط الأدوات */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث في القوالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pr-10 pl-4 py-3 border rounded-xl w-80 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <Filter className="w-4 h-4" />
            فلترة
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
            <Upload className="w-4 h-4" />
            استيراد
          </button>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors duration-300"
          >
            <Plus className="w-4 h-4" />
            قالب جديد
          </button>
        </div>
      </div>

      {/* تبويبات أنواع القوالب - مبسطة */}
      <div className={`rounded-2xl p-2 shadow-sm border mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 justify-start pr-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TemplateType)}
                className={`w-48 flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {/* خط سفلي للتاب النشط */}
                {isActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-1 bg-white/30 rounded-full" />
                )}
                
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className={isActive ? 'font-semibold' : ''}>{tab.name}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-md'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* قائمة القوالب - مؤقتاً */}
      <div className={`mt-8 p-8 rounded-2xl border text-center ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-300' 
          : 'bg-white border-gray-200 text-gray-600'
      }`}>
        <p className="text-lg mb-2">قائمة القوالب</p>
        <p className="text-sm">سيتم عرض قوالب {tabs.find(t => t.id === activeTab)?.name} هنا</p>
      </div>
    </div>
  );
} 