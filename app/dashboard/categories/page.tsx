'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import CategoryFormModal from '../../../components/CategoryFormModal';
import CategoriesAnalytics from '../../../components/dashboard/CategoriesAnalytics';
import { TabsEnhanced, TabItem } from '@/components/ui/tabs-enhanced';
import { Category } from '@/types/category';
import { 
  Plus, 
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  FolderOpen,
  Folder,
  Tag,
  Hash,
  Palette,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Download,
  Upload,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

import { useDarkModeContext } from '@/contexts/DarkModeContext';

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { darkMode } = useDarkModeContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة جلب التصنيفات من API الحقيقي
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setNotification(null); // مسح أي إشعارات سابقة
      
      const response = await fetch('/api/categories');
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        setCategories(data.categories || data.data || []);
      } else {
        // إذا فشل الطلب، حاول مرة أخرى بعد 3 ثواني
        setTimeout(fetchCategories, 3000);
        setNotification({
          type: 'error',
          message: data.error || 'فشل في جلب التصنيفات'
        });
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
      setNotification({
        type: 'error',
        message: 'حدث خطأ في تحميل التصنيفات'
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل التصنيفات عند بدء التطبيق
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // دالة معالجة حفظ التصنيف (للنموذج الجديد)
  const handleSaveCategory = async (formData: any) => {
    try {
      setLoading(true);

      // إعداد البيانات للإرسال
      const categoryData = {
        name_ar: formData.name_ar.trim(),
        name_en: formData.name_en.trim() || undefined,
        description: formData.description.trim() || undefined,
        slug: formData.slug.trim(),
        color_hex: formData.color_hex,
        icon: formData.icon,
        parent_id: formData.parent_id,
        position: formData.position,
        is_active: formData.is_active,
        meta_title: formData.meta_title.trim() || undefined,
        meta_description: formData.meta_description.trim() || undefined,
        og_image_url: formData.og_image_url.trim() || undefined,
        canonical_url: formData.canonical_url.trim() || undefined,
        noindex: formData.noindex,
        og_type: formData.og_type.trim() || 'website'
      };

      let response;
      
      if (showEditModal && selectedCategory) {
        // تحديث التصنيف الموجود
        response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });
      } else {
        // إضافة تصنيف جديد
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حفظ التصنيف');
      }

      const result = await response.json();
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: showEditModal ? 'تم تحديث التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح'
        });
        
        // إعادة تحميل التصنيفات
        await fetchCategories();
        
        // إغلاق النموذج
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedCategory(null);
        
        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error(result.error || 'فشل في حفظ التصنيف');
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
      setTimeout(() => setNotification(null), 5000);
      throw error; // Re-throw to let the modal handle it
    } finally {
      setLoading(false);
    }
  };

  // وظائف إدارة التصنيفات
  const handleToggleStatus = async (categoryId: string) => {
    try {
      // TODO: إضافة API call لتغيير حالة التصنيف
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, is_active: !cat.is_active }
          : {
              ...cat,
              children: cat.children?.map(child =>
                child.id === categoryId ? { ...child, is_active: !child.is_active } : child
              )
            }
      ));
      
      setNotification({
        type: 'success',
        message: 'تم تحديث حالة التصنيف بنجاح'
      });
      
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'حدث خطأ في تحديث التصنيف'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId) || 
                     categories.find(cat => cat.children?.some(child => child.id === categoryId));
    
    const articleCount = category?.articles_count || category?.article_count || 0;
    if (category && !category.can_delete && articleCount > 0) {
      setNotification({
        type: 'warning',
        message: 'لا يمكن حذف تصنيف يحتوي على مقالات. يرجى نقل المقالات أولاً.'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        // TODO: إضافة API call لحذف التصنيف
        setCategories(prev => 
          prev.filter(cat => cat.id !== categoryId)
            .map(cat => ({
              ...cat,
              children: cat.children?.filter(child => child.id !== categoryId)
            }))
        );
        
        setNotification({
          type: 'success',
          message: 'تم حذف التصنيف بنجاح'
        });
        
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        setNotification({
          type: 'error',
          message: 'حدث خطأ في حذف التصنيف'
        });
      }
    }
  };

  // ألوان التصنيفات المتاحة - مجموعة موسعة من الألوان الهادئة والفاتحة
  const categoryColors = [
    { name: 'أزرق سماوي', value: '#E5F1FA', textColor: '#1E40AF' },
    { name: 'أخضر ناعم', value: '#E3FCEF', textColor: '#065F46' },
    { name: 'برتقالي دافئ', value: '#FFF5E5', textColor: '#C2410C' },
    { name: 'وردي خفيف', value: '#FDE7F3', textColor: '#BE185D' },
    { name: 'بنفسجي فاتح', value: '#F2F6FF', textColor: '#6366F1' },
    { name: 'أصفر ذهبي', value: '#FEF3C7', textColor: '#D97706' },
    { name: 'أخضر زمردي', value: '#F0FDF4', textColor: '#047857' },
    { name: 'أزرق غامق', value: '#EFF6FF', textColor: '#1D4ED8' },
    { name: 'بنفسجي وردي', value: '#FAF5FF', textColor: '#7C3AED' },
    { name: 'برتقالي فاتح', value: '#FFF7ED', textColor: '#EA580C' },
    { name: 'رمادي هادئ', value: '#F9FAFB', textColor: '#374151' },
    { name: 'تركوازي ناعم', value: '#F0FDFA', textColor: '#0F766E' }
  ];

  // الأيقونات المتاحة - مجموعة موسعة مع تنوع أكبر
  const categoryIcons = [
    '📰', '🏛️', '💼', '⚽', '🎭', '💡', '🌍', '📱', 
    '🏥', '🚗', '✈️', '🏠', '🎓', '💰', '⚖️', '🔬',
    '🎨', '🎵', '📺', '🍽️', '👗', '💊', '🌱', '🔥',
    '💎', '⭐', '🎯', '🚀', '🏆', '📊', '🎪', '🌈'
  ];

  // مكون بطاقة الإحصائية الدائرية
  const CircularStatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor,
    iconColor
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
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

  // تعريف التابات
  const tabs: TabItem[] = [
    { id: 'list', name: 'قائمة التصنيفات', icon: Folder, count: categories.filter(cat => !cat.parent_id).length },
    { id: 'hierarchy', name: 'التسلسل الهرمي', icon: FolderOpen, count: categories.length },
    { id: 'analytics', name: 'إحصائيات الاستخدام', icon: Tag },
    { id: 'settings', name: 'إعدادات التصنيفات', icon: Palette }
  ];

  // مكون شجرة التصنيفات
  const CategoryTree = ({ categories, level = 0 }: { categories: Category[], level?: number }) => {
    return (
      <div className={level > 0 ? 'mr-6' : ''}>
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            <div className={`p-4 rounded-xl border transition-colors duration-200 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {category.children && category.children.length > 0 && (
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedCategories);
                        if (expandedCategories.has(category.id)) {
                          newExpanded.delete(category.id);
                        } else {
                          newExpanded.add(category.id);
                        }
                        setExpandedCategories(newExpanded);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ 
                      backgroundColor: category.color_hex,
                      color: categoryColors.find(c => c.value === category.color_hex)?.textColor || '#000'
                    }}
                  >
                    {category.icon}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{category.name_ar}</h3>
                      {category.name_en && (
                        <span className={`text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>({category.name_en})</span>
                      )}
                      {!category.is_active && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          مخفي
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{category.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>/{category.slug}</span>
                      <span>{category.articles_count || category.article_count || 0} مقال</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowEditModal(true);
                    }}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      darkMode 
                        ? 'text-blue-400 hover:bg-blue-900/20' 
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(category.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      category.is_active
                        ? darkMode 
                          ? 'text-yellow-400 hover:bg-yellow-900/20' 
                          : 'text-yellow-600 hover:bg-yellow-50'
                        : darkMode 
                          ? 'text-green-400 hover:bg-green-900/20' 
                          : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={category.is_active ? 'إخفاء التصنيف' : 'إظهار التصنيف'}
                  >
                    {category.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={(category.articles_count || category.article_count || 0) > 0 && !category.can_delete}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      ((category.articles_count || category.article_count || 0) > 0 && !category.can_delete)
                        ? darkMode 
                          ? 'text-gray-600 cursor-not-allowed' 
                          : 'text-gray-400 cursor-not-allowed'
                        : darkMode 
                          ? 'text-red-400 hover:bg-red-900/20' 
                          : 'text-red-600 hover:bg-red-50'
                    }`}
                    title={
                      ((category.articles_count || category.article_count || 0) > 0 && !category.can_delete)
                        ? 'لا يمكن حذف تصنيف يحتوي على مقالات'
                        : 'حذف التصنيف'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      darkMode 
                        ? 'text-gray-400 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* التصنيفات الفرعية */}
            {category.children && 
             category.children.length > 0 && 
             expandedCategories.has(category.id) && (
              <div className="mt-2">
                <CategoryTree categories={category.children} level={level + 1} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // مكون الإشعارات
  const NotificationComponent = () => {
    if (!notification) return null;
    
    const getNotificationIcon = () => {
      switch (notification.type) {
        case 'success':
          return <CheckCircle className="w-5 h-5" />;
        case 'error':
          return <XCircle className="w-5 h-5" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5" />;
        case 'info':
          return <Info className="w-5 h-5" />;
        default:
          return <Info className="w-5 h-5" />;
      }
    };

    const getNotificationColor = () => {
      switch (notification.type) {
        case 'success':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'error':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'info':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };
    
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${getNotificationColor()}`}>
          {getNotificationIcon()}
          <span className="font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // تصدير التصنيفات كملف JSON
  const handleExport = () => {
    window.location.href = '/api/categories/export';
  };

  // استيراد التصنيفات من ملف JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/categories/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`${result.message} (الجديدة: ${result.created}, المحدثة: ${result.updated})`);
        // إعادة تحميل البيانات
        await fetchCategories();
      } else {
        toast.error(`فشل الاستيراد: ${result.error}`);
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع أثناء استيراد الملف.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">جارٍ تحميل التصنيفات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8 flex items-center justify-between">
        <div>
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إدارة التصنيفات</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>تنظيم وإدارة تصنيفات الأخبار بنظام هرمي ذكي مع دعم SEO متقدم</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Button onClick={handleImportClick} variant="outline">
            <Upload className="ml-2 h-4 w-4" />
            استيراد
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImport}
            accept=".json"
          />
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة تصنيف جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات التصنيفات */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <CircularStatsCard
          title="إجمالي التصنيفات"
          value={categories.length.toString()}
          subtitle="تصنيف"
          icon={Tag}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <CircularStatsCard
          title="التصنيفات النشطة"
          value={categories.filter(cat => cat.is_active).length.toString()}
          subtitle="نشط"
          icon={FolderOpen}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <CircularStatsCard
          title="التصنيفات الفرعية"
          value={categories.filter(cat => cat.parent_id).length.toString()}
          subtitle="فرعي"
          icon={Folder}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <CircularStatsCard
          title="إجمالي المقالات"
          value={categories.reduce((sum, cat) => sum + (cat.articles_count || cat.article_count || 0), 0).toString()}
          subtitle="مقال"
          icon={Hash}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* تبويبات التنقل */}
      <TabsEnhanced
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* محتوى التبويبات */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        {activeTab === 'list' && (
          <div className="p-6">
            <h3 className={`text-lg font-bold mb-6 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>🗂️ قائمة التصنيفات</h3>
            <CategoryTree categories={categories} />
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="p-6">
            <h3 className={`text-lg font-bold mb-6 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>🌳 التسلسل الهرمي</h3>
            <p className={`text-center py-8 transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              عرض تفاعلي لشجرة التصنيفات مع إمكانية السحب والإفلات (قريباً)
            </p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <CategoriesAnalytics 
            categories={categories} 
            darkMode={darkMode} 
          />
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className={`text-lg font-bold mb-6 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>⚙️ إعدادات التصنيفات</h3>
            <p className={`text-center py-8 transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              إعدادات عامة للتصنيفات ونظام العرض (قريباً)
            </p>
          </div>
        )}
      </div>

      {/* النماذج */}
      {(showAddModal || showEditModal) && (
        <CategoryFormModal
          isOpen={showAddModal || showEditModal}
          isEdit={showEditModal}
          category={selectedCategory}
          categories={categories}
          darkMode={darkMode}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          onSave={handleSaveCategory}
          loading={loading}
        />
      )}

      {/* مكون الإشعارات */}
      <NotificationComponent />
    </div>
  );
} 