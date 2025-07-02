'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, ArrowLeft, Upload, Loader2, Eye, Sparkles, Plus, FileText, Image as ImageIcon, User, Tag, Globe, Zap, Palette, Link2, Search, Clock, TrendingUp, BookOpen, Hash, Type, Target, Lightbulb, Info, Star, Send, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

// تحميل المحرر بشكل ديناميكي
const Editor = dynamic(() => import('@/components/Editor/Editor'), { ssr: false });

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug: string;
  color?: string;
  color_hex?: string;
  icon?: string;
  children?: Category[];
  position?: number;
  display_order?: number;
  is_active?: boolean;
}

interface Author {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface UploadedImage {
  id: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const { darkMode } = useDarkModeContext();
  const articleId = params?.id as string;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [saving, setSaving] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [articleLoading, setArticleLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // مرجع للمحرر
  const editorRef = useRef<any>(null);

  // حالة النموذج
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    excerpt: '',
    content: '',
    authorId: '',
    categoryId: '',
    type: 'local',
    isBreaking: false,
    isFeatured: false,
    featuredImage: '',
    gallery: [] as UploadedImage[],
    externalLink: '',
    publishType: 'now',
    scheduledDate: '',
    keywords: [] as string[],
    seoTitle: '',
    seoDescription: '',
    status: 'draft' as 'draft' | 'pending_review' | 'published'
  });

  // تحميل بيانات المقال
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
          title: articleData.title || '',
          subtitle: articleData.subtitle || '',
          excerpt: articleData.summary || '',
          content: articleData.content || '',
          authorId: articleData.author_id || '',
          categoryId: articleData.category_id || '',
          type: articleData.scope || 'local',
          isBreaking: articleData.is_breaking || false,
          isFeatured: articleData.is_featured || false,
          featuredImage: articleData.featured_image || '',
          gallery: articleData.gallery || [],
          externalLink: articleData.external_link || '',
          publishType: 'now',
          scheduledDate: articleData.scheduled_for || '',
          keywords: (() => {
            const keywordsData = articleData.seo_keywords || articleData.keywords || articleData.tags || [];
            if (Array.isArray(keywordsData)) {
              return keywordsData.filter(k => k && typeof k === 'string' && k.trim());
            } else if (typeof keywordsData === 'string' && keywordsData.trim()) {
              return keywordsData.split(',').map((k: string) => k.trim()).filter((k: string) => k);
            }
            return [];
          })(),
          seoTitle: articleData.seo_title || '',
          seoDescription: articleData.seo_description || '',
          status: articleData.status || 'draft'
        });
        
        // تحميل المحتوى في المحرر
        if (editorRef.current && articleData.content) {
          editorRef.current.setContent(articleData.content);
        }
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

  // تحميل البيانات الأساسية
  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?active_only=true');
      const data = await response.json();
      const categoriesData = data.categories || data.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('خطأ في تحميل التصنيفات:', error);
      setCategories([]);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors?role=correspondent,editor,author');
      const data = await response.json();
      // التأكد من أن البيانات في شكل مصفوفة
      setAuthors(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('خطأ في تحميل المراسلين:', error);
      setAuthors([]); // تعيين مصفوفة فارغة في حالة الخطأ
    }
  };

  // رفع الصورة البارزة
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مسموح. يسمح فقط بملفات الصور (JPEG, PNG, GIF, WebP)');
      return;
    }

    // التحقق من حجم الملف (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'featured');

    try {
      setUploadingImage(true);
      toast.loading('جاري رفع الصورة...', { id: 'upload' });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
        toast.success('تم رفع الصورة بنجاح', { id: 'upload' });
        console.log('✅ تم رفع الصورة:', data.url);
      } else {
        console.error('❌ خطأ في رفع الصورة:', data);
        toast.error(data.error || 'فشل في رفع الصورة', { id: 'upload' });
      }
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      toast.error('حدث خطأ في الاتصال', { id: 'upload' });
    } finally {
      setUploadingImage(false);
    }
  };

  // رفع صور الألبوم
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // التحقق من الملفات
    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`نوع الملف ${file.name} غير مسموح`);
        return;
      }
      if (file.size > maxSize) {
        toast.error(`حجم الملف ${file.name} كبير جداً`);
        return;
      }
    }

    setUploadingImage(true);
    const uploadedImages: UploadedImage[] = [];
    let successCount = 0;
    let errorCount = 0;

    toast.loading(`جاري رفع ${files.length} صورة...`, { id: 'gallery-upload' });

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'gallery');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          uploadedImages.push(data);
          successCount++;
          console.log(`✅ تم رفع الصورة ${file.name}:`, data.url);
        } else {
          errorCount++;
          console.error(`❌ فشل في رفع الصورة ${file.name}:`, data);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في رفع الصورة ${file.name}:`, error);
      }
    }

    setFormData(prev => ({ 
      ...prev, 
      gallery: [...prev.gallery, ...uploadedImages] 
    }));
    setUploadingImage(false);

    // عرض رسالة النتيجة
    if (successCount > 0 && errorCount === 0) {
      toast.success(`تم رفع جميع الصور بنجاح (${successCount})`, { id: 'gallery-upload' });
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`تم رفع ${successCount} صورة، فشل ${errorCount}`, { id: 'gallery-upload' });
    } else {
      toast.error('فشل في رفع جميع الصور', { id: 'gallery-upload' });
    }
  };

  // استدعاء الذكاء الاصطناعي
  const callAI = async (type: string, content: string, context?: any) => {
    setIsAILoading(true);
    try {
      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, context })
      });
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('حدث خطأ في الذكاء الاصطناعي');
      return null;
    } finally {
      setIsAILoading(false);
    }
  };

  // توليد فقرة تمهيدية
  const generateIntro = async () => {
    if (!formData.title) {
      toast.error('يرجى كتابة العنوان أولاً');
      return;
    }
    
    const result = await callAI('generate_paragraph', formData.title);
    if (result && editorRef.current) {
      editorRef.current.setContent(result);
      toast.success('تم توليد المقدمة بنجاح');
    }
  };

  // اقتراح عناوين
  const suggestTitles = async () => {
    if (!formData.excerpt) {
      toast.error('يرجى كتابة الموجز أولاً');
      return;
    }
    
    const result = await callAI('title', formData.excerpt);
    if (result) {
      setAiSuggestions({ ...aiSuggestions, titles: result.split('\n') });
      toast.success('تم اقتراح عناوين جديدة');
    }
  };

  // اقتراح كلمات مفتاحية
  const suggestKeywords = async () => {
    let textContent = formData.excerpt;
    
    if (editorRef.current) {
      const editorContent = editorRef.current.getHTML();
      if (editorContent && editorContent.length > 50) {
        textContent = editorContent.replace(/<[^>]*>/g, '');
      }
    }
    
    if (!textContent || textContent.length < 20) {
      toast.error('يرجى كتابة محتوى أولاً');
      return;
    }
    
    const result = await callAI('keywords', textContent);
    if (result) {
      const keywords = result.split(',').map((k: string) => k.trim()).filter((k: string) => k);
      setFormData(prev => ({ ...prev, keywords }));
      toast.success('تم اقتراح الكلمات المفتاحية');
    }
  };

  // كتابة مقال كامل
  const generateFullArticle = async () => {
    if (!formData.title) {
      toast.error('يرجى كتابة العنوان أولاً');
      return;
    }
    
    const confirmed = confirm('هل تريد توليد مقال كامل بالذكاء الاصطناعي؟ سيستبدل المحتوى الحالي.');
    if (!confirmed) return;
    
    const result = await callAI('full_article', formData.title, { excerpt: formData.excerpt });
    if (result && editorRef.current) {
      editorRef.current.setContent(result);
      toast.success('تم توليد المقال بنجاح');
    }
  };

  // تحليل جودة الموجز
  const analyzeExcerpt = (excerpt: string) => {
    const minLength = 50;
    const maxLength = 160;
    const idealLength = 120;
    
    if (excerpt.length < minLength) {
      return { 
        quality: 'poor', 
        message: `الموجز قصير جداً (${excerpt.length} حرف). يُفضل ${minLength} حرف على الأقل.`,
        color: 'text-red-600'
      };
    } else if (excerpt.length > maxLength) {
      return { 
        quality: 'poor', 
        message: `الموجز طويل جداً (${excerpt.length} حرف). الحد الأقصى ${maxLength} حرف.`,
        color: 'text-red-600'
      };
    } else if (excerpt.length >= idealLength - 20 && excerpt.length <= idealLength + 20) {
      return { 
        quality: 'excellent', 
        message: `ممتاز! (${excerpt.length} حرف)`,
        color: 'text-green-600'
      };
    } else {
      return { 
        quality: 'good', 
        message: `جيد (${excerpt.length} حرف)`,
        color: 'text-yellow-600'
      };
    }
  };

  // التحقق من البيانات قبل الحفظ
  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('العنوان الرئيسي مطلوب');
    }
    
    if (!formData.excerpt.trim()) {
      errors.push('الموجز مطلوب');
    }
    
    const editorContent = editorRef.current ? editorRef.current.getHTML() : '';
    const plainText = editorContent.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText || plainText.length < 10) {
      errors.push('محتوى المقال مطلوب');
    }
    
    if (!formData.authorId) {
      errors.push('يجب اختيار المراسل/الكاتب');
    }
    
    if (!formData.categoryId) {
      errors.push('يجب اختيار التصنيف');
    }
    
    const excerptAnalysis = analyzeExcerpt(formData.excerpt);
    if (excerptAnalysis.quality === 'poor') {
      errors.push(excerptAnalysis.message);
    }
    
    return errors;
  };

  // تحديث المقال
  const handleSubmit = async (status: 'draft' | 'pending_review' | 'published') => {
    const errors = validateForm();
    if (errors.length > 0 && status !== 'draft') {
      toast.error('يرجى تصحيح الأخطاء التالية:\n\n' + errors.join('\n'));
      return;
    }
    setSaving(true);

    try {
      toast.loading(`جاري ${status === 'draft' ? 'حفظ' : status === 'pending_review' ? 'إرسال' : 'نشر'} المقال...`, { id: 'save' });
      
      const articleData: any = {
        title: formData.title.trim(),
        content: editorRef.current ? editorRef.current.getHTML() : formData.content,
        summary: formData.excerpt.trim(),
        author_id: formData.authorId || undefined,
        category_id: formData.categoryId || undefined,
        is_featured: formData.isFeatured,
        is_breaking: formData.isBreaking,
        featured_image: formData.featuredImage || undefined,
        keywords: formData.keywords,
        seo_title: formData.seoTitle,
        seo_description: formData.seoDescription,
        status,
      };

      if (formData.publishType === 'scheduled' && formData.scheduledDate) {
        articleData.scheduled_for = formData.scheduledDate;
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = status === 'draft'
          ? 'تم حفظ التعديلات بنجاح'
          : status === 'pending_review'
          ? 'تم إرسال المقال للمراجعة'
          : 'تم نشر المقال بنجاح';
        toast.success(successMessage, { id: 'save' });
        console.log('✅ تم حفظ المقال:', result);
        
        // تأخير قصير قبل الانتقال
        setTimeout(() => {
          router.push('/dashboard/news');
        }, 1000);
      } else {
        console.error('❌ خطأ في حفظ المقال:', result);
        toast.error(result.error || 'فشل تحديث المقال', { id: 'save' });
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث المقال:', error);
      toast.error('حدث خطأ في الاتصال', { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  // إضافة كلمة مفتاحية
  const addKeyword = (keyword: string) => {
    if (!formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  // حذف كلمة مفتاحية
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  // إضافة دالة generateSlug للاستخدام في معاينة SEO
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // عرض حالة التحميل
  if (articleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">جارٍ تحميل المقال</h2>
          <p className="text-gray-600 mb-4">نقوم بتحضير محرر التعديل لك...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطأ في تحميل المقال</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <Button
            onClick={() => router.push('/dashboard/news')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة إلى قائمة المقالات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`} dir="rtl">
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/news')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى القائمة
        </Button>
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>تعديل المقال</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>قم بتحديث المحتوى وتحسينه بمساعدة الذكاء الاصطناعي</p>
      </div>

      {/* قسم نظام المحرر الذكي */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700' 
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>محرر المقالات الذكي</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>استخدم قوة الذكاء الاصطناعي لتحسين محتواك</p>
            </div>
            <div className="mr-auto flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className={darkMode ? 'border-gray-600' : ''}
              >
                {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ كمسودة
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSubmit('pending_review')}
                disabled={saving}
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال للمراجعة
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={saving || formData.publishType === 'scheduled'}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Eye className="w-4 h-4 ml-2" />
                نشر المقال
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التنقل */}
      <TabsEnhanced
        tabs={[
          { id: 'content', name: 'المحتوى', icon: FileText },
          { id: 'media', name: 'الوسائط', icon: ImageIcon },
          { id: 'seo', name: 'تحسين البحث', icon: Search },
          { id: 'ai', name: 'مساعد الذكاء', icon: Sparkles }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* العمود الرئيسي */}
        <div className="xl:col-span-3 space-y-6">
          {/* تاب المحتوى */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* العنوان */}
                  <div>
                    <Label htmlFor="title">العنوان *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="عنوان المقال"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={suggestTitles}
                        disabled={isAILoading || !formData.excerpt}
                        title="اقتراح عناوين بناءً على الموجز"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="mr-1">اقتراح</span>
                      </Button>
                    </div>
                    
                    {/* عرض العناوين المقترحة */}
                    {aiSuggestions.titles && aiSuggestions.titles.length > 0 && (
                      <div className="mt-2 p-3 bg-secondary/20 rounded-lg">
                        <p className="text-sm font-medium mb-2">عناوين مقترحة:</p>
                        <div className="space-y-2">
                          {aiSuggestions.titles.map((title: string, index: number) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, title: title.replace(/^\d+\.\s*/, '') }))}
                              className="w-full text-right p-2 hover:bg-secondary/50 rounded transition-colors text-sm"
                            >
                              {title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="subtitle">العنوان الفرعي</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="عنوان فرعي اختياري"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excerpt">الموجز / Lead *</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="موجز المقال (يظهر في صفحة المقال)"
                      rows={3}
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-muted-foreground">
                        {formData.excerpt.length} / 160 حرف (الموصى به)
                      </p>
                      {formData.excerpt.length > 0 && (
                        <p className={`text-sm font-medium ${analyzeExcerpt(formData.excerpt).color}`}>
                          {analyzeExcerpt(formData.excerpt).message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* المحتوى */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>محتوى المقال</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={generateIntro}
                        disabled={isAILoading || !formData.title}
                        title="توليد مقدمة بناءً على العنوان"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="mr-1">مقدمة تلقائية</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={generateFullArticle}
                        disabled={isAILoading || !formData.title}
                        title="كتابة مقال كامل بالذكاء الاصطناعي"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="mr-1">مقال كامل</span>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Editor
                    ref={editorRef}
                    content={formData.content}
                    onChange={(content) => {
                      if (typeof content === 'object' && content.html) {
                        setFormData(prev => ({ ...prev, content: content.html }));
                      } else if (typeof content === 'string') {
                        setFormData(prev => ({ ...prev, content }));
                      }
                    }}
                    placeholder="اكتب محتوى المقال هنا..."
                    enableAI={true}
                    onAIAction={async (action, content) => {
                      const result = await callAI(action, content);
                      if (result && editorRef.current) {
                        if (action === 'rewrite') {
                          editorRef.current.setContent(result);
                        } else {
                          const currentContent = editorRef.current.getHTML();
                          editorRef.current.setContent(currentContent + '<p>' + result + '</p>');
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* تاب الوسائط */}
          {activeTab === 'media' && (
            <Card>
              <CardHeader>
                <CardTitle>الصور والوسائط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* الصورة البارزة */}
                <div>
                  <Label>الصورة البارزة</Label>
                  <div className="mt-2">
                    {formData.featuredImage ? (
                      <div className="relative">
                        <img
                          src={formData.featuredImage}
                          alt="الصورة البارزة"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => window.open(formData.featuredImage, '_blank')}
                            title="عرض الصورة في نافذة جديدة"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                            title="حذف الصورة"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          الصورة البارزة
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        {uploadingImage ? (
                          <div className="space-y-2">
                            <Loader2 className="w-12 h-12 mx-auto text-primary mb-2 animate-spin" />
                            <p className="text-sm text-gray-600">جاري رفع الصورة...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <Label htmlFor="featured-image" className="cursor-pointer text-primary hover:text-primary/80 transition-colors">
                              انقر لرفع الصورة البارزة
                            </Label>
                            <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP - الحد الأقصى 10MB</p>
                          </div>
                        )}
                        <Input
                          id="featured-image"
                          type="file"
                          accept="image/*"
                          onChange={handleFeaturedImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ألبوم الصور */}
                <div>
                  <Label>ألبوم الصور</Label>
                  {formData.gallery.length > 1 && (
                    <Alert className="mt-2 mb-2 bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        سيتم عرض الصور كألبوم تلقائي في المقال ({formData.gallery.length} صور)
                      </AlertDescription>
                    </Alert>
                  )}
                                      <div className="mt-2 space-y-2">
                      {formData.gallery.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {formData.gallery.map((image, index) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.url}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <div className="flex gap-1">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(image.url, '_blank')}
                                    title="عرض الصورة"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        gallery: prev.gallery.filter(img => img.id !== image.id)
                                      }));
                                    }}
                                    title="حذف الصورة"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        {uploadingImage ? (
                          <div className="space-y-2">
                            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                            <p className="text-sm text-gray-600">جاري رفع الصور...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="gallery" className="cursor-pointer text-primary hover:text-primary/80 transition-colors">
                              <Plus className="w-8 h-8 mx-auto mb-1" />
                              إضافة صور للألبوم
                            </Label>
                            <p className="text-xs text-gray-500">يمكنك اختيار عدة صور مرة واحدة</p>
                          </div>
                        )}
                        <Input
                          id="gallery"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </div>
                    </div>
                </div>

                {/* رابط خارجي */}
                <div>
                  <Label htmlFor="external-link">رابط خارجي (اختياري)</Label>
                  <Input
                    id="external-link"
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
                    placeholder="https://example.com"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* تاب SEO */}
          {activeTab === 'seo' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">تحسين محركات البحث</CardTitle>
                    <p className="text-muted-foreground mt-1">حسّن ظهور مقالك في نتائج البحث</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* معاينة نتيجة البحث */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">معاينة في نتائج البحث</h3>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-blue-600 text-lg font-medium mb-1 hover:underline cursor-pointer">
                      {formData.seoTitle || formData.title || 'عنوان المقال سيظهر هنا...'}
                    </h4>
                    <p className="text-green-700 text-sm mb-2">
                      sabq.org › article › {formData.title ? generateSlug(formData.title) : new Date().toISOString().split('T')[0]}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {formData.seoDescription || formData.excerpt || 'وصف المقال سيظهر هنا. اكتب وصفاً جذاباً يشجع على النقر...'}
                    </p>
                  </div>
                </div>

                {/* نصائح SEO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      title: 'طول العنوان', 
                      current: formData.seoTitle ? formData.seoTitle.length : formData.title.length, 
                      ideal: '50-60', 
                      status: formData.seoTitle || formData.title
                        ? ((formData.seoTitle || formData.title).length >= 50 && (formData.seoTitle || formData.title).length <= 60 ? 'good' 
                          : (formData.seoTitle || formData.title).length > 0 ? 'warning' 
                          : 'bad')
                        : 'bad'
                    },
                    { 
                      title: 'طول الوصف', 
                      current: formData.seoDescription ? formData.seoDescription.length : formData.excerpt.length, 
                      ideal: '120-160', 
                      status: formData.seoDescription || formData.excerpt
                        ? ((formData.seoDescription || formData.excerpt).length >= 120 && (formData.seoDescription || formData.excerpt).length <= 160 ? 'good' 
                          : (formData.seoDescription || formData.excerpt).length > 0 ? 'warning' 
                          : 'bad')
                        : 'bad'
                    },
                    { 
                      title: 'الكلمات المفتاحية', 
                      current: formData.keywords.length, 
                      ideal: '3-5', 
                      status: formData.keywords.length >= 3 && formData.keywords.length <= 5 ? 'good' 
                        : formData.keywords.length > 0 ? 'warning' 
                        : 'bad'
                    },
                    { 
                      title: 'الصور', 
                      current: formData.gallery.length + (formData.featuredImage ? 1 : 0), 
                      ideal: '2+', 
                      status: (formData.gallery.length + (formData.featuredImage ? 1 : 0)) >= 2 ? 'good' 
                        : (formData.gallery.length + (formData.featuredImage ? 1 : 0)) > 0 ? 'warning'
                        : 'bad'
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">{item.current}</span>
                        <span className="text-sm text-gray-500">الموصى به: {item.ideal}</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            item.status === 'good' ? 'bg-green-500' : 
                            item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (item.current / parseInt(item.ideal)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* حقول SEO */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="seo-title">عنوان SEO (اختياري)</Label>
                    <Input
                      id="seo-title"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="اتركه فارغاً لاستخدام العنوان الرئيسي"
                    />
                  </div>

                  <div>
                    <Label htmlFor="seo-description">وصف SEO (اختياري)</Label>
                    <Textarea
                      id="seo-description"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="اتركه فارغاً لاستخدام الموجز"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords">الكلمات المفتاحية</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="keywords"
                        placeholder="أضف كلمة مفتاحية واضغط Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              addKeyword(input.value.trim());
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={suggestKeywords}
                        disabled={isAILoading}
                      >
                        {isAILoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="mr-1">اقتراح</span>
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                        >
                          <Hash className="w-3 h-3" />
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تاب مساعد الذكاء */}
          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">مساعد الذكاء الاصطناعي</CardTitle>
                    <p className="text-muted-foreground mt-1">استخدم قوة AI لتحسين محتواك</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={suggestTitles}
                    disabled={isAILoading || !formData.excerpt}
                    className="h-auto py-4 px-6 justify-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">اقتراح عناوين</div>
                        <div className="text-sm text-muted-foreground">احصل على عناوين جذابة</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={generateIntro}
                    disabled={isAILoading || !formData.title}
                    className="h-auto py-4 px-6 justify-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">كتابة مقدمة</div>
                        <div className="text-sm text-muted-foreground">مقدمة احترافية للمقال</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={suggestKeywords}
                    disabled={isAILoading}
                    className="h-auto py-4 px-6 justify-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">كلمات مفتاحية</div>
                        <div className="text-sm text-muted-foreground">اقتراحات ذكية للـ SEO</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={generateFullArticle}
                    disabled={isAILoading || !formData.title}
                    className="h-auto py-4 px-6 justify-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">مقال كامل</div>
                        <div className="text-sm text-muted-foreground">كتابة مقال بالذكاء الاصطناعي</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-4 w-full">
          {/* ملخص سريع */}
          <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                ملخص سريع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">حالة المقال:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  formData.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  formData.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {formData.status === 'draft' ? 'مسودة' :
                   formData.status === 'pending_review' ? 'قيد المراجعة' : 'منشور'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">طول العنوان:</span>
                <span className={`font-medium ${
                  formData.title.length < 50 ? 'text-red-600' :
                  formData.title.length < 100 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formData.title.length} حرف
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">طول الموجز:</span>
                <span className={`font-medium ${
                  formData.excerpt.length < 50 ? 'text-red-600' :
                  formData.excerpt.length < 160 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formData.excerpt.length} حرف
                </span>
              </div>
            </CardContent>
          </Card>
          {/* التصنيف والكاتب */}
          <Card className="w-full border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                معلومات النشر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">التصنيف *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  required
                >
                  <option value="">اختر التصنيف...</option>
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="text-sm">
                        {cat.name_ar || cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>جاري تحميل التصنيفات...</option>
                  )}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground">لا توجد تصنيفات متاحة</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-medium">المراسل/الكاتب *</Label>
                <select
                  id="author"
                  value={formData.authorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorId: e.target.value }))}
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  required
                >
                  <option value="">اختر الكاتب...</option>
                  {authors.length > 0 ? (
                    authors.map(author => (
                      <option key={author.id} value={author.id} className="text-sm">
                        {author.name} ({author.role === 'admin' ? 'مدير' : author.role === 'editor' ? 'محرر' : author.role === 'author' ? 'كاتب' : 'مستخدم'})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>جاري تحميل المراسلين...</option>
                  )}
                </select>
                {authors.length === 0 && (
                  <p className="text-xs text-muted-foreground">لا يوجد مراسلين متاحين</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">نوع المقال</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'local' | 'international' }))}
                  className="w-full p-2 border rounded-md text-sm bg-background"
                >
                  <option value="local">محلي</option>
                  <option value="international">دولي</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* خيارات العرض */}
          <Card className="w-full border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                خيارات العرض
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="breaking-news"
                  checked={formData.isBreaking}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="breaking-news" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Zap className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>خبر عاجل</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="featured-article"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                />
                <label htmlFor="featured-article" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span>مقال مميز</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* توقيت النشر */}
          <Card className="w-full border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                توقيت النشر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">نوع النشر</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="radio"
                      id="publish-now"
                      name="publishType"
                      value="now"
                      checked={formData.publishType === 'now'}
                      onChange={() => setFormData(prev => ({ ...prev, publishType: 'now' }))}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="publish-now" className="text-sm cursor-pointer">نشر فوري</label>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="radio"
                      id="publish-scheduled"
                      name="publishType"
                      value="scheduled"
                      checked={formData.publishType === 'scheduled'}
                      onChange={() => setFormData(prev => ({ ...prev, publishType: 'scheduled' }))}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="publish-scheduled" className="text-sm cursor-pointer">نشر مجدول</label>
                  </div>
                </div>
              </div>

              {formData.publishType === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date" className="text-sm font-medium">تاريخ ووقت النشر</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    required={formData.publishType === 'scheduled'}
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 