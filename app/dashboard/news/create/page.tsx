'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Upload, Save, Send, Eye, Sparkles, AlertCircle, X, Plus, Loader2, FileText, Image as ImageIcon, User, Tag, Globe, Zap, Palette, Link2, Search, Clock, TrendingUp, BookOpen, Hash, Type, Target, Lightbulb, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';

// تحميل المحرر بشكل ديناميكي
const Editor = dynamic(() => import('@/components/Editor/Editor'), { ssr: false });

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
}

interface UploadedImage {
  id: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export default function CreateArticlePage() {
  const router = useRouter();
  const { darkMode } = useDarkModeContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [saving, setSaving] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
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

  // تحميل البيانات الأساسية
  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      // التأكد من أن البيانات في شكل مصفوفة
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      console.error('خطأ في تحميل التصنيفات:', error);
      setCategories([]); // تعيين مصفوفة فارغة في حالة الخطأ
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

  // رفع الصورة البارزة
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'featured');

    try {
      setUploadingImage(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, featuredImage: data.url }));
          toast.success('تم رفع الصورة بنجاح!');
          console.log('✅ تم رفع الصورة:', data.url);
        } else {
          toast.error(data.error || 'فشل في رفع الصورة');
          console.error('❌ خطأ في رفع الصورة:', data.error);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'فشل في رفع الصورة');
        console.error('❌ خطأ في رفع الصورة:', errorData);
      }
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      toast.error('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  // رفع صور الألبوم
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImage(true);
    const uploadedImages: UploadedImage[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'gallery');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            uploadedImages.push(data);
            successCount++;
          } else {
            errorCount++;
            console.error('❌ خطأ في رفع الصورة:', data.error);
          }
        } else {
          errorCount++;
          const errorData = await response.json();
          console.error('❌ خطأ في رفع الصورة:', errorData);
        }
      } catch (error) {
        errorCount++;
        console.error('خطأ في رفع الصورة:', error);
      }
    }

    setFormData(prev => ({ 
      ...prev, 
      gallery: [...prev.gallery, ...uploadedImages] 
    }));
    setUploadingImage(false);

    // إظهار رسائل النتيجة
    if (successCount > 0) {
      toast.success(`تم رفع ${successCount} صورة بنجاح!`);
    }
    if (errorCount > 0) {
      toast.error(`فشل في رفع ${errorCount} صورة`);
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
    // الحصول على النص من المحرر أو استخدام الموجز
    let textContent = formData.excerpt;
    
    if (editorRef.current) {
      const editorContent = editorRef.current.getHTML();
      if (editorContent && editorContent.length > 50) {
        // إزالة HTML tags للحصول على النص الصافي
        textContent = editorContent.replace(/<[^>]*>/g, '');
      }
    }
    
    if (!textContent || textContent.length < 20) {
      toast.error('يرجى كتابة محتوى أولاً');
      return;
    }
    
    const result = await callAI('keywords', textContent);
    if (result) {
      // تحويل النتيجة إلى مصفوفة من الكلمات المفتاحية
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
    
    // التحقق من المحتوى من المحرر
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

  // حفظ المقال
  const handleSubmit = async (status: 'draft' | 'pending_review' | 'published') => {
    // التحقق من البيانات
    const errors = validateForm();
    if (errors.length > 0 && status !== 'draft') {
      alert('يرجى تصحيح الأخطاء التالية:\n\n' + errors.join('\n'));
      return;
    }
    setSaving(true);

    try {
      // إعداد البيانات للحفظ (مطابقة لأسماء الحقول فى الـ API)
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

      // التعامل مع النشر المجدول
      if (formData.publishType === 'scheduled' && formData.scheduledDate) {
        articleData.publish_at = formData.scheduledDate;
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        const successMessage = status === 'draft'
          ? 'تم حفظ المسودة بنجاح'
          : status === 'pending_review'
          ? 'تم إرسال المقال للمراجعة'
          : 'تم نشر المقال بنجاح';
        alert(successMessage);
        router.push(`/dashboard/news`);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'فشل حفظ المقال');
      }
    } catch (error) {
      console.error('خطأ في حفظ المقال:', error);
      alert('حدث خطأ في حفظ المقال');
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

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`} dir="rtl">
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إنشاء مقال جديد</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>أنشئ محتوى جذاب بمساعدة الذكاء الاصطناعي</p>
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
              }`}>استخدم قوة الذكاء الاصطناعي لإنشاء محتوى احترافي</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
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
                      // حفظ كل من HTML والنص العادي
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
                        // إدراج النتيجة في المحرر
                        if (action === 'rewrite') {
                          // استبدال النص المحدد
                          editorRef.current.setContent(result);
                        } else {
                          // إضافة نص جديد
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
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {uploadingImage ? (
                            <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-2 animate-spin" />
                          ) : (
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          )}
                          <Label htmlFor="featured-image" className="cursor-pointer text-primary">
                            انقر لرفع الصورة البارزة
                          </Label>
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
                            <div key={image.id} className="relative">
                              <img
                                src={image.url}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    gallery: prev.gallery.filter(img => img.id !== image.id)
                                  }));
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Label htmlFor="gallery" className="cursor-pointer text-primary">
                          <Plus className="w-6 h-6 mx-auto mb-1" />
                          إضافة صور للألبوم
                        </Label>
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
                  ].map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{metric.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          metric.status === 'good' ? 'bg-green-100 text-green-700' :
                          metric.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {metric.current} / {metric.ideal}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${
                          metric.status === 'good' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} style={{ width: metric.status === 'good' ? '100%' : metric.status === 'warning' ? '60%' : '20%' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* عنوان SEO */}
                <div>
                  <Label htmlFor="seo-title">عنوان SEO</Label>
                  <Input
                    id="seo-title"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder={formData.title || 'عنوان محركات البحث'}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.seoTitle.length} / 60 حرف (الموصى به)
                  </p>
                </div>

                {/* وصف SEO */}
                <div>
                  <Label htmlFor="seo-description">وصف SEO</Label>
                  <Textarea
                    id="seo-description"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder={formData.excerpt || 'وصف محركات البحث'}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.seoDescription.length} / 160 حرف (الموصى به)
                  </p>
                </div>

                {/* الكلمات المفتاحية المحسنة */}
                <div className="border-2 border-gray-100 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-purple-600" />
                      الكلمات المفتاحية
                      {formData.keywords.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          {formData.keywords.length}
                        </span>
                      )}
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={suggestKeywords}
                      disabled={isAILoading}
                      className="flex items-center gap-2"
                    >
                      {isAILoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      اقتراح بالذكاء الاصطناعي
                    </Button>
                  </div>
                  
                  {/* عرض الكلمات المفتاحية الحالية */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-purple-200 transition-colors">
                        <Hash className="w-3 h-3" />
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-purple-900 hover:bg-purple-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          title="حذف الكلمة المفتاحية"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    
                    {/* حقل إدخال جديد */}
                    <input
                      type="text"
                      placeholder="أضف كلمة مفتاحية واضغط Enter..."
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[200px]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !formData.keywords.includes(value)) {
                            addKeyword(value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* اقتراحات سريعة */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      اقتراحات سريعة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {['السعودية', 'الرياض', 'أخبار', 'عاجل', 'تقنية', 'اقتصاد', 'رياضة', 'صحة'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            if (!formData.keywords.includes(suggestion)) {
                              addKeyword(suggestion);
                            }
                          }}
                          disabled={formData.keywords.includes(suggestion)}
                          className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-xs hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* نصائح للكلمات المفتاحية */}
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      استخدم 3-5 كلمات مفتاحية ذات صلة بالمحتوى. تجنب تكرار نفس الكلمات وركز على المصطلحات التي يبحث عنها القراء.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تاب مساعد الذكاء */}
          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  مساعد الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* أدوات AI السريعة */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={generateIntro}
                    disabled={isAILoading || !formData.title}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <BookOpen className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">توليد مقدمة</p>
                      <p className="text-xs text-muted-foreground">بناءً على العنوان</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={generateFullArticle}
                    disabled={isAILoading || !formData.title}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-medium">مقال كامل</p>
                      <p className="text-xs text-muted-foreground">محتوى شامل</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={suggestTitles}
                    disabled={isAILoading || !formData.excerpt}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Type className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="font-medium">اقتراح عناوين</p>
                      <p className="text-xs text-muted-foreground">عناوين جذابة</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={suggestKeywords}
                    disabled={isAILoading}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Hash className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="font-medium">كلمات مفتاحية</p>
                      <p className="text-xs text-muted-foreground">تحسين SEO</p>
                    </div>
                  </Button>
                </div>

                {/* نصائح الذكاء الاصطناعي */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    نصائح ذكية
                  </h4>
                  
                  {!formData.title && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        ابدأ بكتابة عنوان جذاب لتفعيل جميع مزايا الذكاء الاصطناعي
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {formData.title && !formData.excerpt && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        أضف موجزاً للمقال لتحسين ظهوره في محركات البحث
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {formData.excerpt && analyzeExcerpt(formData.excerpt).quality !== 'excellent' && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        {analyzeExcerpt(formData.excerpt).message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* إحصائيات AI */}
                {editorRef.current && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <h4 className="font-medium mb-3">تحليل المحتوى بالذكاء الاصطناعي</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">عدد الكلمات</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {(() => {
                            const html = editorRef.current?.getHTML() || '';
                            return html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">وقت القراءة</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(() => {
                            const html = editorRef.current?.getHTML() || '';
                            const words = html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
                            return Math.ceil(words / 200);
                          })()} دقائق
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          {/* معلومات النشر */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات النشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author">المراسل / الكاتب *</Label>
                <select
                  id="author"
                  value={formData.authorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">اختر المراسل</option>
                  {authors.map(author => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="category">التصنيف *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>نوع الخبر</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="local"
                      checked={formData.type === 'local'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="ml-2"
                    />
                    محلي
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="international"
                      checked={formData.type === 'international'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="ml-2"
                    />
                    دولي
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isBreaking}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBreaking: e.target.checked }))}
                    className="ml-2"
                  />
                  خبر عاجل
                </label>
                {formData.isBreaking && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      سيظهر شريط أحمر مع الخبر
                    </AlertDescription>
                  </Alert>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="ml-2"
                  />
                  خبر رئيسي
                </label>
                {formData.isFeatured && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      سيظهر هذا المقال في قسم الأخبار البارزة
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* توقيت النشر */}
          <Card>
            <CardHeader>
              <CardTitle>توقيت النشر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="now"
                    checked={formData.publishType === 'now'}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishType: e.target.value }))}
                    className="ml-2"
                  />
                  نشر الآن
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="scheduled"
                    checked={formData.publishType === 'scheduled'}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishType: e.target.value }))}
                    className="ml-2"
                  />
                  جدولة النشر
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="draft"
                    checked={formData.publishType === 'draft'}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishType: e.target.value }))}
                    className="ml-2"
                  />
                  حفظ كمسودة
                </label>
              </div>

              {formData.publishType === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduled-date">تاريخ ووقت النشر</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
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