'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Save, Eye, Send, AlertTriangle, Image, Video,
  Sparkles, Brain, Globe, Settings, Hash, FileText, CheckCircle,
  XCircle, Lightbulb, Target, RefreshCw,
  Wand2, PenTool, BarChart3, Rocket, ArrowLeft, Loader2
} from 'lucide-react';

// استيراد المكونات
import ContentEditorWithBlocks from '../../../../../components/ContentEditorWithBlocks';
import FeaturedImageUpload from '../../../../../components/FeaturedImageUpload';
import { logActions, getCurrentUser } from '../../../../../lib/log-activity';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

// ===============================
// أنواع البيانات
// ===============================

interface ArticleFormData {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  category_id: number;
  subcategory_id?: number;
  is_breaking: boolean;
  is_featured: boolean;
  is_smart_newsletter: boolean;
  ai_category_suggestion?: string;
  ai_summary?: string;
  keywords: string[];
  cover_image?: string;
  cover_video?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  publish_time: string;
  author_id: string;
  scope: 'local' | 'international';
  status: 'draft' | 'review' | 'published';
  content_blocks: ContentBlock[];
  featured_image?: string;
  featured_image_alt?: string;
}

// استخدام أنواع Block من محرر البلوكات
import { Block } from '../../../../../components/BlockEditor/types';

// ContentBlock سيكون مرادف لـ Block
type ContentBlock = Block;

interface Category {
  id: number;
  name_ar: string;
  name_en?: string;
  color_hex: string;
  icon?: string;
  children?: Category[];
  position?: number;
  is_active?: boolean;
}

export default function EditArticlePage() {
  const { darkMode } = useDarkModeContext();
  const params = useParams();
  const router = useRouter();
  const articleId = params?.id as string;

  const [formData, setFormData] = useState<ArticleFormData>({
    id: articleId,
    title: '',
    subtitle: '',
    description: '',
    category_id: 1,
    is_breaking: false,
    is_featured: false,
    is_smart_newsletter: false,
    keywords: [],
    publish_time: '',
    author_id: 'current_user',
    scope: 'local',
    status: 'draft',
    content_blocks: []
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [articleLoading, setArticleLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo' | 'ai' | 'publish'>('content');
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [qualityScore, setQualityScore] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<{ id: string; name: string; role?: string }[]>([]);

  // تحميل بيانات المقال الحالية
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setArticleLoading(true);
        const res = await fetch(`/api/articles/${articleId}`);
        
        if (!res.ok) {
          throw new Error('فشل في جلب المقال');
        }
        
        const articleData = await res.json();
        
        // تحويل البيانات إلى تنسيق النموذج
        setFormData({
          id: articleData.id,
          title: articleData.title || '',
          subtitle: articleData.subtitle || '',
          description: articleData.summary || articleData.seo_description || '',
          category_id: articleData.category_id || 1,
          subcategory_id: articleData.subcategory_id,
          is_breaking: articleData.is_breaking || false,
          is_featured: articleData.is_featured || false,
          is_smart_newsletter: articleData.is_smart_newsletter || false,
          keywords: Array.isArray(articleData.seo_keywords) 
            ? articleData.seo_keywords 
            : typeof articleData.seo_keywords === 'string' 
            ? articleData.seo_keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
            : [],
          cover_image: articleData.featured_image || '',
          featured_image: articleData.featured_image || '',
          featured_image_alt: articleData.featured_image_alt || '',
          publish_time: articleData.publish_at || articleData.published_at || new Date().toISOString(),
          author_id: articleData.author_id || 'current_user',
          scope: articleData.scope || 'local',
          status: articleData.status || 'draft',
          content_blocks: articleData.content_blocks || []
        });
      } catch (err) {
        console.error('خطأ في تحميل المقال:', err);
        setLoadError(err instanceof Error ? err.message : 'المقال غير موجود أو حدث خطأ');
      } finally {
        setArticleLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // تحميل التصنيفات الحقيقية من API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/categories?active_only=true');
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.error || 'فشل تحميل التصنيفات');

        const categoriesData = result.categories || result.data || [];
        const sorted = (categoriesData as Category[])
          .filter(cat => cat.is_active)
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        setCategories(sorted);
      } catch (err) {
        console.error('خطأ في تحميل التصنيفات:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAuthors = async () => {
      try {
        console.log('🔄 جلب المراسلين...');
        const response = await fetch('/api/authors?role=correspondent,editor,author');
        const data = await response.json();
        
        if (data.success) {
          const authorsData = Array.isArray(data.data) ? data.data : [];
          console.log(`✅ تم جلب ${authorsData.length} مراسل:`, authorsData.map((a: any) => `${a.name} (${a.role})`));
          setAuthors(authorsData);
        } else {
          console.error('❌ خطأ في جلب المراسلين:', data.error);
          setAuthors([]);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب المراسلين:', error);
        setAuthors([]);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  // حساب عدد الكلمات ووقت القراءة
  useEffect(() => {
    const text = formData.content_blocks
      .filter(b => b.type === 'paragraph' || b.type === 'heading')
      .map(b => {
        const blockData = b.data[b.type];
        return (blockData && typeof blockData === 'object' && 'text' in blockData) ? blockData.text : '';
      })
      .join(' ');
    
    const words = text.trim().split(/\s+/).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // متوسط 200 كلمة في الدقيقة
  }, [formData.content_blocks]);

  // حفظ تلقائي كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title.trim()) {
        autoSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  // تحليل جودة المقال
  useEffect(() => {
    calculateQualityScore();
  }, [formData.title, formData.description, formData.content_blocks, formData.keywords]);

  const autoSave = useCallback(async () => {
    setAutoSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
    }
  }, [formData]);

  const calculateQualityScore = () => {
    let score = 0;
    
    // العنوان (20 نقطة)
    if (formData.title.length > 10 && formData.title.length < 80) score += 20;
    else if (formData.title.length > 0) score += 10;
    
    // الوصف (15 نقطة)
    if (formData.description.length > 50 && formData.description.length < 160) score += 15;
    else if (formData.description.length > 0) score += 8;
    
    // المحتوى (30 نقطة)
    const textBlocks = formData.content_blocks.filter(b => b.type === 'paragraph');
    if (textBlocks.length >= 3) score += 30;
    else if (textBlocks.length > 0) score += 15;
    
    // الصور (15 نقطة)
    const imageBlocks = formData.content_blocks.filter(b => b.type === 'image');
    if (imageBlocks.length >= 1) score += 15;
    
    // التصنيف (10 نقطة)
    if (formData.category_id > 0) score += 10;
    
    // الكلمات المفتاحية (10 نقطة)
    if (formData.keywords.length >= 3) score += 10;
    else if (formData.keywords.length > 0) score += 5;
    
    setQualityScore(score);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) errors.push('العنوان الرئيسي مطلوب');
    if (formData.title.length > 100) errors.push('العنوان طويل جداً (أكثر من 100 حرف)');
    if (!formData.category_id) errors.push('يجب اختيار تصنيف');
    if (formData.content_blocks.length === 0) errors.push('المحتوى فارغ - أضف بعض الفقرات');
    if (formData.description.length > 160) errors.push('الوصف طويل جداً (أكثر من 160 حرف)');
    
    setValidationErrors(errors);
    return errors;
  };

  // دوال الذكاء الاصطناعي
  const generateTitle = async () => {
    setAiLoading({ ...aiLoading, title: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const suggestions = [
        'الذكاء الاصطناعي يعيد تشكيل مستقبل الإعلام في السعودية',
        'تطورات جديدة في قطاع التقنية تعزز رؤية 2030',
        'ابتكارات سعودية تقود التحول الرقمي في المنطقة'
      ];
      setFormData(prev => ({ 
        ...prev, 
        title: suggestions[Math.floor(Math.random() * suggestions.length)]
      }));
    } finally {
      setAiLoading({ ...aiLoading, title: false });
    }
  };

  const generateDescription = async () => {
    setAiLoading({ ...aiLoading, description: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const description = 'وصف مولد تلقائياً يلخص محتوى المقال بطريقة جذابة ومناسبة لمحركات البحث، يحتوي على الكلمات المفتاحية الرئيسية.';
      setFormData(prev => ({ ...prev, description }));
    } finally {
      setAiLoading({ ...aiLoading, description: false });
    }
  };

  const generateKeywords = async () => {
    setAiLoading({ ...aiLoading, keywords: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const keywords = ['تقنية', 'ذكاء اصطناعي', 'رؤية 2030', 'ابتكار', 'السعودية'];
      setFormData(prev => ({ ...prev, keywords }));
    } finally {
      setAiLoading({ ...aiLoading, keywords: false });
    }
  };

  const handleSave = async (status: 'draft' | 'review' | 'published') => {
    const errors = validateForm();
    if (errors.length > 0) return;

    setSaving(true);
    try {
      // إنشاء محتوى نصي بسيط كـ fallback
      const textContent = formData.content_blocks
        .map((b) => {
          const blockData = b.data?.[b.type] || b.data || {};
          
          switch (b.type) {
            case 'paragraph':
              return (blockData as any).text || '';
            case 'heading':
              return (blockData as any).text || '';
            case 'quote':
              const quoteData = blockData as any;
              return `"${quoteData.text || ''}"${quoteData.author ? ` — ${quoteData.author}` : ''}`;
            case 'list':
              const listData = blockData as any;
              const items = listData.items || [];
              return items.map((item: string) => `• ${item}`).join('\n');
            case 'divider':
              return '---';
            default:
              return (blockData as any).text || '';
          }
        })
        .filter((text: string) => text.trim())
        .join('\n\n');

      const articleData = {
        title: formData.title,
        content_blocks: formData.content_blocks,
        content: textContent || 'محتوى المقال', // fallback نصي للتوافق
        summary: formData.description,
        category_id: formData.category_id,
        status,
        is_breaking: formData.is_breaking,
        is_featured: formData.is_featured,
        featured_image: formData.featured_image || formData.cover_image,
        featured_image_alt: formData.featured_image_alt,
        seo_title: formData.title,
        seo_description: formData.description,
        seo_keywords: formData.keywords,
        publish_at: formData.publish_time
      };

      // استخدام PUT للتحديث
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      const result = await res.json();
      
      if (!res.ok || !result.success) throw new Error(result.error || 'فشل التحديث');

      // تسجيل الحدث في سجلات النظام
      const userInfo = getCurrentUser();
      await logActions.updateArticle(userInfo, articleId, formData.title);
      
      if (status === 'published') {
        await logActions.publishArticle(userInfo, articleId, formData.title);
      }

      alert(status === 'published' ? 'تم تحديث ونشر المقال بنجاح' : 'تم حفظ التعديلات بنجاح');
      router.push('/dashboard/news');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  // عرض حالة التحميل
  if (articleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">جارٍ تحميل المقال</h2>
          <p className="text-gray-600">يرجى الانتظار بينما نحضر البيانات...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
              <XCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ في تحميل المقال</h2>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <button
            onClick={() => router.push('/dashboard/news')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى قائمة الأخبار
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header الإبداعي الجديد */}
        <div className="relative mb-8">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
          
          {/* نمط الخلفية */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          <div className="relative z-10 p-8 lg:p-12">
            {/* العنوان الرئيسي */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform">
                    <PenTool className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                    تعديل المقال
                    <span className="text-2xl">✏️</span>
                  </h1>
                  <p className="text-xl text-blue-100 flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    حدث وطور محتوى إعلامي مميز بدعم الذكاء الاصطناعي
                  </p>
                </div>
              </div>

              {/* معلومات المقال */}
              <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="text-center px-4 border-r border-white/30">
                  <div className="text-3xl font-bold text-white">{wordCount}</div>
                  <div className="text-sm text-blue-100">كلمة</div>
                </div>
                <div className="text-center px-4 border-r border-white/30">
                  <div className="text-3xl font-bold text-white">{readingTime}</div>
                  <div className="text-sm text-blue-100">دقيقة قراءة</div>
                </div>
                <div className="text-center px-4">
                  <div className="text-3xl font-bold text-white">{qualityScore}%</div>
                  <div className="text-sm text-blue-100">جودة</div>
                </div>
              </div>
            </div>

            {/* شريط التقدم والحالة */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              {/* حالة الحفظ */}
              <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border transition-all ${
                autoSaveStatus === 'saved' 
                  ? 'bg-green-500/20 border-green-400/50 text-green-100' 
                  : autoSaveStatus === 'saving' 
                  ? 'bg-blue-500/20 border-blue-400/50 text-blue-100' 
                  : 'bg-red-500/20 border-red-400/50 text-red-100'
              }`}>
                <div className="relative">
                  {autoSaveStatus === 'saved' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : autoSaveStatus === 'saving' ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {autoSaveStatus === 'saved' ? 'تم الحفظ' : autoSaveStatus === 'saving' ? 'جارٍ الحفظ' : 'خطأ في الحفظ'}
                  </div>
                  <div className="text-xs opacity-80">آخر حفظ منذ دقيقتين</div>
                </div>
              </div>

              {/* مؤشر الجودة */}
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">جودة المحتوى</span>
                  <span className="text-white font-bold">{qualityScore}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      qualityScore >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      qualityScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      'bg-gradient-to-r from-red-400 to-pink-500'
                    }`}
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/70">ضعيف</span>
                  <span className="text-xs text-white/70">ممتاز</span>
                </div>
              </div>

              {/* إحصائيات سريعة */}
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs text-white/80">صور</div>
                    <div className="text-lg font-bold text-white">
                      {formData.content_blocks.filter(b => b.type === 'image').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs text-white/80">فيديو</div>
                    <div className="text-lg font-bold text-white">
                      {formData.content_blocks.filter(b => b.type === 'video').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Hash className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-xs text-white/80">وسوم</div>
                    <div className="text-lg font-bold text-white">{formData.keywords.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التنقل */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => router.push('/dashboard/news')}
                className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">العودة للقائمة</span>
              </button>

              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg backdrop-blur-md border border-white/20"
              >
                <Save className="w-5 h-5" />
                <span className="font-medium">حفظ كمسودة</span>
              </button>
              
              <button
                onClick={() => handleSave('review')}
                disabled={saving}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg backdrop-blur-md border border-white/20"
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">إرسال للمراجعة</span>
              </button>
              
              <button
                onClick={() => handleSave('published')}
                disabled={saving || validationErrors.length > 0}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg backdrop-blur-md border border-white/20"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                <Eye className="w-5 h-5" />
                )}
                <span className="font-medium">تحديث ونشر</span>
              </button>
        </div>

            {/* التبويبات المحسنة */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'content', name: 'المحتوى', icon: FileText, color: 'from-blue-500 to-blue-600', desc: 'محرر المحتوى الأساسي' },
                { id: 'ai', name: 'مساعد AI', icon: Brain, color: 'from-purple-500 to-pink-600', desc: 'أدوات الذكاء الاصطناعي' },
                { id: 'publish', name: 'إعدادات النشر', icon: Rocket, color: 'from-orange-500 to-red-600', desc: 'خيارات النشر والتوقيت' },
                { id: 'settings', name: 'الإعدادات', icon: Settings, color: 'from-cyan-500 to-blue-600', desc: 'خيارات العرض' },
                { id: 'seo', name: 'تحسين SEO', icon: Target, color: 'from-green-500 to-emerald-600', desc: 'محركات البحث' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-xl`
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">{tab.name}</div>
                      <div className="text-xs opacity-80">{tab.desc}</div>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                    )}
                </button>
              );
            })}
          </div>
        </div>
        </div>

        {/* تنبيهات الأخطاء المحسنة */}
        {validationErrors.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-1">
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">يرجى تصحيح الأخطاء التالية</h3>
                  <ul className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-center gap-2 text-red-700">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* منطقة المحتوى الرئيسية */}
          <div className="xl:col-span-2">
        {activeTab === 'content' && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">محرر المحتوى</h2>
                    <p className="text-gray-600">تحديث محتوى احترافي بأدوات متقدمة</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* العنوان الرئيسي */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      العنوان الرئيسي <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                    <textarea
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="اكتب عنواناً جذاباً ومميزاً للمقال..."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      />
                      <button
                        onClick={generateTitle}
                        disabled={aiLoading.title}
                        className="absolute left-2 top-2 p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        {aiLoading.title ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs ${formData.title.length > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                        {formData.title.length} / 100 حرف
                      </span>
                    </div>
                  </div>

                  {/* العنوان الفرعي */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      العنوان الفرعي (اختياري)
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="عنوان فرعي يدعم العنوان الرئيسي..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* المراسل/الكاتب */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      المراسل/الكاتب <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.author_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, author_id: e.target.value }))}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر المراسل...</option>
                      {authors.map(author => (
                        <option key={author.id} value={author.id}>
                          {author.name} ({author.role || 'مراسل'})
                        </option>
                      ))}
                    </select>
                    {authors.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">لا يوجد مراسلين متاحين</p>
                    )}
                  </div>

                  {/* التصنيف والنطاق */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        التصنيف الرئيسي <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: Number(e.target.value) }))}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>اختر التصنيف...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        النطاق
                      </label>
                      <select
                        value={formData.scope}
                        onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as 'local' | 'international' }))}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="local">🏠 محلي</option>
                        <option value="international">🌍 دولي</option>
                      </select>
                    </div>
                  </div>

                  {/* الوصف الموجز */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      الوصف الموجز
                    </label>
                    <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف موجز يظهر في نتائج البحث ومعاينة المقال..."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      />
                      <button
                        onClick={generateDescription}
                        disabled={aiLoading.description}
                        className="absolute left-2 top-2 p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        {aiLoading.description ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs ${formData.description.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                        {formData.description.length} / 160 حرف
                      </span>
                    </div>
                  </div>

                  {/* محرر المحتوى */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      محتوى المقال <span className="text-red-500">*</span>
                    </label>
                    <ContentEditorWithBlocks 
                      formData={formData}
                      setFormData={setFormData}
                      categories={categories}
                      aiLoading={aiLoading}
                      onGenerateTitle={generateTitle}
                      onGenerateDescription={generateDescription}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'ai' && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">مساعد الذكاء الاصطناعي</h2>
                    <p className="text-gray-600">استخدم قوة AI لتحسين المحتوى</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Wand2, title: 'تحسين العنوان', desc: 'اقتراحات عناوين مُحسّنة', color: 'from-blue-500 to-indigo-600', action: generateTitle },
                    { icon: FileText, title: 'تطوير الوصف', desc: 'وصف مُحسّن لمحركات البحث', color: 'from-purple-500 to-pink-600', action: generateDescription },
                    { icon: Hash, title: 'تحديث الوسوم', desc: 'كلمات مفتاحية ذكية', color: 'from-green-500 to-emerald-600', action: generateKeywords },
                    { icon: Sparkles, title: 'تحسين المحتوى', desc: 'مراجعة وتحسين النص', color: 'from-orange-500 to-red-600', action: () => {} },
                    { icon: Target, title: 'تحليل SEO', desc: 'نصائح لتحسين الظهور', color: 'from-cyan-500 to-blue-600', action: () => {} },
                    { icon: Globe, title: 'ترجمة ذكية', desc: 'ترجمة احترافية للإنجليزية', color: 'from-indigo-500 to-purple-600', action: () => {} }
                  ].map((tool, index) => {
                    const Icon = tool.icon;
                    const isLoading = aiLoading[tool.title];
                    return (
                      <button
                        key={index}
                        onClick={tool.action}
                        disabled={isLoading}
                        className={`group relative bg-gradient-to-r ${tool.color} p-6 rounded-2xl text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            {isLoading ? (
                              <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg">{tool.title}</h3>
                            <p className="text-sm opacity-90">{tool.desc}</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Sparkles className="w-4 h-4 opacity-50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* باقي التبويبات تبقى كما هي مع نفس التصميم من صفحة الإنشاء */}
            {/* يمكن إضافتها لاحقاً حسب الحاجة */}
            </div>

            {/* الشريط الجانبي */}
          <div className="xl:col-span-1 space-y-6">
            {/* بطاقة الجودة المحسنة */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                جودة المقال
              </h3>
                <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">نسبة الاكتمال</span>
                    <span className="text-2xl font-bold text-green-600">{qualityScore}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        qualityScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        qualityScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                        'bg-gradient-to-r from-red-500 to-pink-600'
                      }`}
                      style={{ width: `${qualityScore}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {qualityScore >= 80 ? '🎉 ممتاز! المقال جاهز للنشر' :
                   qualityScore >= 60 ? '👍 جيد، يمكن تحسينه أكثر' :
                   '💡 يحتاج لمزيد من التطوير'}
                </div>
                </div>
              </div>

            {/* بطاقة النشر */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                خيارات التحديث
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  حفظ كمسودة
                </button>
                
                <button
                  onClick={() => handleSave('review')}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors disabled:opacity-50"
                >
                  <Eye className="w-5 h-5" />
                  إرسال للمراجعة
                </button>
                
                <button
                  onClick={() => handleSave('published')}
                  disabled={saving || validationErrors.length > 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  تحديث ونشر
                </button>
              </div>
            </div>

            {/* بطاقة الوسائط */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                الوسائط المتعددة
              </h3>
                <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">الصورة البارزة</label>
                  <FeaturedImageUpload
                    value={formData.featured_image || ''}
                    onChange={(url) => setFormData(prev => ({ ...prev, featured_image: url }))}
                    darkMode={darkMode}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">الصور في المقال</span>
                  <span className="font-semibold text-purple-600">
                    {formData.content_blocks.filter(b => b.type === 'image').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">مقاطع الفيديو</span>
                  <span className="font-semibold text-purple-600">
                    {formData.content_blocks.filter(b => b.type === 'video').length}
                  </span>
                </div>
              </div>
            </div>

            {/* نصائح التحديث */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                نصائح للتحديث
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>راجع العنوان ليكون أكثر جاذبية (50-60 حرف)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>حدث الوصف ليعكس التطورات الجديدة (120-160 حرف)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>أضف صوراً حديثة وذات جودة عالية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>حدث الكلمات المفتاحية حسب الاتجاهات الحالية</span>
                </li>
              </ul>
          </div>
          </div>
          </div>
      </div>
    </div>
  );
} 