'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, Edit3, Trash2, Copy, Eye, Calendar, User, Clock, Activity, FileText, BarChart3, Brain
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  author_id: string;
  author_name?: string;
  category_id: number;
  status: 'published' | 'draft' | 'pending' | 'deleted';
  is_breaking: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  views_count: number;
  reading_time: number;
  content_blocks: any[];
  created_at: string;
  updated_at: string;
  published_at?: string;
  is_deleted: boolean;
}

// بيانات التصنيفات
const categories: { [key: number]: { name: string; color: string } } = {
  1: { name: 'محليات', color: '#EF4444' },
  2: { name: 'تقنية', color: '#8B5CF6' },
  3: { name: 'اقتصاد', color: '#10B981' },
  4: { name: 'رياضة', color: '#F59E0B' },
  5: { name: 'سياسة', color: '#3B82F6' },
  6: { name: 'ترفيه', color: '#EC4899' },
  7: { name: 'صحة', color: '#06B6D4' },
  8: { name: 'تعليم', color: '#6366F1' },
  9: { name: 'ثقافة', color: '#14B8A6' },
  10: { name: 'دولي', color: '#F97316' }
};

export default function ArticleViewPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params?.id as string;
  const [activeTab, setActiveTab] = useState('content');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // استرجاع حالة الوضع الليلي من localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // جلب بيانات المقال
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) {
          throw new Error('فشل في جلب المقال');
        }
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
        toast.error('خطأ في جلب بيانات المقال');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // حساب عدد الكلمات الحقيقي
  const calculateWordCount = (text: string): number => {
    // إزالة المسافات الزائدة والأسطر الفارغة
    const cleanText = text.trim().replace(/\s+/g, ' ');
    // حساب الكلمات العربية والإنجليزية
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  // حساب وقت القراءة الحقيقي (200 كلمة في الدقيقة)
  const calculateReadingTime = (text: string): number => {
    const wordCount = calculateWordCount(text);
    const readingTime = Math.ceil(wordCount / 200);
    return readingTime || 1; // على الأقل دقيقة واحدة
  };

  // إنشاء ملخص تلقائي إذا لم يكن موجوداً
  const generateSummary = (content: string): string => {
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    const firstParagraph = paragraphs[0] || '';
    // أخذ أول 200 حرف من الفقرة الأولى
    return firstParagraph.length > 200 
      ? firstParagraph.substring(0, 200) + '...' 
      : firstParagraph;
  };

  // وظائف التنسيق
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Riyadh'
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Riyadh'
    });
    return formatter.format(date);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    return `منذ ${Math.floor(diffInHours / 24)} يوم`;
  };

  const handleCopyLink = () => {
    const link = `https://sabq.org/news/${article?.slug || article?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ الرابط! 📎');
  };

  const handleEdit = () => {
    router.push(`/dashboard/article/edit/${article?.id}`);
  };

  const handleDelete = async () => {
    if (!article) return;
    
    try {
      const response = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [article.id] })
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المقال');
      }

      toast.success('تم نقل المقال إلى المحذوفات');
      setShowDeleteModal(false);
      router.push('/dashboard/news');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('خطأ في حذف المقال');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">المقال غير موجود</h2>
          <Link href="/dashboard/news" className="text-blue-600 hover:text-blue-700">
            العودة إلى قائمة الأخبار
          </Link>
        </div>
      </div>
    );
  }

  const categoryData = categories[article.category_id] || { name: 'غير مصنف', color: '#6B7280' };
  // حساب الإحصائيات الحقيقية
  const realWordCount = calculateWordCount(article.content);
  const realReadingTime = calculateReadingTime(article.content);
  const articleSummary = article.summary || generateSummary(article.content);

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href="/dashboard/news"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
              darkMode 
                ? 'text-gray-300 hover:bg-gray-800 border border-gray-700' 
                : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            العودة للأخبار
          </Link>
          <div className="flex items-center gap-2">
            {article.is_breaking && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                عاجل
              </span>
            )}
            {article.is_featured && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                مميز
              </span>
            )}
            {article.is_pinned && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                مثبت
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              article.status === 'published' ? 'bg-green-100 text-green-800' :
              article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              article.status === 'pending' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {article.status === 'published' ? 'منشور' :
               article.status === 'draft' ? 'مسودة' :
               article.status === 'pending' ? 'في الانتظار' :
               'محذوف'}
            </span>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              {(article.views_count || 0).toLocaleString()} مشاهدة
            </div>
          </div>
        </div>
        
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>{article.title}</h1>
      </div>

      {/* شريط الأدوات */}
      <div className={`rounded-2xl p-4 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            تعديل الخبر
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            حذف الخبر
          </button>
          <button 
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-xl border transition-colors duration-300 flex items-center gap-2 ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Copy className="w-4 h-4" />
            نسخ الرابط
          </button>
          <button className={`px-4 py-2 rounded-xl border transition-colors duration-300 flex items-center gap-2 ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
            <Brain className="w-4 h-4" />
            مراجعة AI
          </button>
          <button className={`px-4 py-2 rounded-xl border transition-colors duration-300 flex items-center gap-2 ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
            <BarChart3 className="w-4 h-4" />
            تحليل الأداء
          </button>
        </div>
      </div>

      {/* التبويبات */}
      <div className={`rounded-2xl p-2 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2">
          {[
            { id: 'content', name: 'المحتوى', icon: FileText },
            { id: 'timeline', name: 'التاريخ والإصدارات', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* العمود الأيمن - محتوى المقال */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* الملخص */}
              <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>📝 ملخص الخبر</h3>
                <div className={`p-4 rounded-xl border-r-4 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-blue-400' 
                    : 'bg-blue-50 border-blue-500'
                }`}>
                  <p className={`leading-relaxed transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {articleSummary}
                  </p>
                </div>
              </div>
              
              {/* المحتوى */}
              <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
              }`}>
                <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>📖 المحتوى الكامل</h3>
                <div className="prose prose-lg max-w-none" style={{ direction: 'rtl' }}>
                  <div className={`whitespace-pre-wrap leading-relaxed transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {article.content}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* الخريطة الزمنية */}
              <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-100'
              }`}>
                <h3 className={`text-lg font-bold mb-6 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>⏳ الخريطة الزمنية للمقال</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>تم إنشاء المقال</h4>
                          <span className="text-xs text-gray-500">{formatRelativeTime(article.created_at)}</span>
                        </div>
                        <p className={`text-sm mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>إنشاء المقال الأول</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{article.author_name || 'غير معروف'}</span>
                          <span>•</span>
                          <span>{formatDate(article.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {article.updated_at !== article.created_at && (
                    <div className="relative">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Edit3 className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold transition-colors duration-300 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>تم تحديث المقال</h4>
                            <span className="text-xs text-gray-500">{formatRelativeTime(article.updated_at)}</span>
                          </div>
                          <p className={`text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>آخر تحديث للمحتوى</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDate(article.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* العمود الأيسر - معلومات المقال */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* معلومات أساسية */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>📄 معلومات المقال</h2>
            
            {/* معلومات الكاتب */}
            <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl transition-colors duration-300 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`font-semibold transition-colors duration-300 ${
                  darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{article.author_name || 'غير معروف'}</p>
                <p className={`text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>كاتب المقال</p>
              </div>
            </div>

            {/* التصنيف */}
            <div className="mb-4">
              <label className={`text-sm font-medium mb-1 block transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>التصنيف</label>
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium inline-block"
                style={{ 
                  backgroundColor: categoryData.color + '20',
                  color: categoryData.color
                }}
              >
                {categoryData.name}
              </span>
            </div>

            {/* التواريخ */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className={`transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>تاريخ النشر:</span>
                <span className={`font-medium transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {article.published_at ? formatDate(article.published_at) : 'غير منشور'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className={`transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>آخر تحديث:</span>
                <span className={`font-medium transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>{formatFullDate(article.updated_at)}</span>
              </div>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-xl text-center transition-colors duration-300 ${
                darkMode ? 'bg-blue-900' : 'bg-blue-50'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  darkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>{realReadingTime} دقائق</div>
                <div className={`text-xs transition-colors duration-300 ${
                  darkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>وقت القراءة</div>
              </div>
              <div className={`p-3 rounded-xl text-center transition-colors duration-300 ${
                darkMode ? 'bg-green-900' : 'bg-green-50'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  darkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  {realWordCount.toLocaleString()}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  darkMode ? 'text-green-400' : 'text-green-700'
                }`}>كلمة</div>
              </div>
            </div>

            {/* معرف المقال */}
            <div className="mb-6">
              <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>معرف المقال</label>
              <code className={`px-3 py-1 rounded text-xs font-mono transition-colors duration-300 ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                {article.id}
              </code>
            </div>
          </div>

          {/* إحصائيات التفاعل */}
          <div className="grid grid-cols-2 gap-4">
            <CircularStatsCard
              title="المشاهدات"
              value={(article.views_count || 0).toLocaleString()}
              subtitle="مشاهدة"
              icon={Eye}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <CircularStatsCard
              title="القراءة"
              value={realReadingTime.toString()}
              subtitle="دقيقة"
              icon={Clock}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
          </div>
        </div>
      </div>

      {/* نافذة حذف المقال */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ تأكيد الحذف</h3>
            <p className={`mb-6 transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              هل أنت متأكد من حذف هذا المقال؟ سيتم نقله إلى سلة المحذوفات.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 px-4 py-2 rounded-xl border transition-colors duration-300 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                إلغاء
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                حذف المقال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}