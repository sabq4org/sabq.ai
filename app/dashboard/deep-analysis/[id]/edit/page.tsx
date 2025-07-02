'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Brain,
  X,
  FileText,
  Upload
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { DeepAnalysis } from '@/types/deep-analysis';
import toast from 'react-hot-toast';

const Editor = dynamic(() => import('@/components/Editor/Editor'), { ssr: false });

export default function EditDeepAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    categories: [] as string[],
    tags: [] as string[],
    content: '',
    featuredImage: null as string | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTag, setCurrentTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [params.id]);

  useEffect(() => {
    if (analysis) {
      let contentToLoad = '';
      
      // محاولة تحميل المحتوى من مصادر مختلفة
      if (analysis.rawContent && typeof analysis.rawContent === 'string') {
        // تنظيف المحتوى الخام من [object Object]
        contentToLoad = analysis.rawContent.replace(/\[object Object\]/g, '');
      } else if (analysis.content) {
        if (typeof analysis.content === 'string') {
          contentToLoad = (analysis.content as string).replace(/\[object Object\]/g, '');
        } else if (typeof analysis.content === 'object' && analysis.content !== null && 'sections' in analysis.content) {
          // تحويل الأقسام إلى HTML
          contentToLoad = formatSectionsToHTML(analysis.content);
        }
      }
      
      // التأكد من أن المحتوى يبدأ بشكل صحيح
      if (contentToLoad && !contentToLoad.trim().startsWith('<')) {
        // إذا كان المحتوى نص عادي، نحوله إلى فقرات
        contentToLoad = contentToLoad
          .split('\n\n')
          .filter(p => p.trim())
          .map(p => `<p>${p.trim()}</p>`)
          .join('\n');
      }
      
      // إضافة مساحة في البداية إذا لم تكن موجودة
      if (contentToLoad && !contentToLoad.trim().startsWith('<h') && !contentToLoad.trim().startsWith('<p>&nbsp;')) {
        contentToLoad = '<p>&nbsp;</p>' + contentToLoad;
      }
      
      setFormData({
        title: analysis.title,
        summary: analysis.summary || '',
        categories: analysis.categories || [],
        tags: analysis.tags || [],
        content: contentToLoad,
        featuredImage: (analysis as any).featuredImage || null
      });
      
      // إذا كانت هناك صورة محفوظة، قم بتعيينها كمعاينة
      if ((analysis as any).featuredImage) {
        setImagePreview((analysis as any).featuredImage);
      }
    }
  }, [analysis]);

  // معالجة رفع الصورة
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('الرجاء اختيار ملف صورة صالح');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // رفع الصورة
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('type', 'analysis');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل رفع الصورة');
      }

      const data = await response.json();
      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.error || 'فشل رفع الصورة');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
      return null;
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/deep-analyses/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      
      const data: DeepAnalysis = await response.json();
      setAnalysis(data);
      
      // استخدام rawContent إذا كان موجوداً، أو تحويل الأقسام إلى HTML
      let content = data.rawContent;
      
      if (!content && data.content && data.content.sections) {
        // تحويل الأقسام إلى HTML منسق
        content = formatSectionsToHTML(data.content);
      }
      
      setFormData({
        title: data.title,
        summary: data.summary,
        categories: data.categories,
        tags: data.tags || [],
        content: content || '',
        featuredImage: (data as any).featuredImage || null
      });
      
      // إذا كانت هناك صورة محفوظة، قم بتعيينها كمعاينة
      if ((data as any).featuredImage) {
        setImagePreview((data as any).featuredImage);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('فشل في تحميل التحليل');
    } finally {
      setLoading(false);
    }
  };

  // دالة تحويل الأقسام إلى HTML
  const formatSectionsToHTML = (content: any): string => {
    const parts: string[] = [];

    // إضافة مقدمة إذا كانت موجودة
    if (content.introduction) {
      parts.push(`<h2>مقدمة</h2>`);
      parts.push(`<p>${content.introduction}</p>`);
    }

    // الفهرس
    if (content.tableOfContents?.length) {
      parts.push('<h2>الفهرس</h2>');
      parts.push('<ul>');
      content.tableOfContents.forEach((item: any) => {
        // تحويل كائن الفهرس إلى نص
        const title = typeof item === 'string' ? item : 
                     (item.title || item.name || item.text || 'قسم');
        parts.push(`<li>${title}</li>`);
      });
      parts.push('</ul>');
    }

    // الأقسام
    if (content.sections?.length) {
      content.sections.forEach((section: any) => {
        if (section.title && section.content) {
          parts.push(`<h2>${section.title}</h2>`);
          // التأكد من أن المحتوى نص وليس كائن
          const sectionContent = typeof section.content === 'string' 
            ? section.content 
            : JSON.stringify(section.content);
          
          // تنظيف المحتوى من [object Object]
          const cleanContent = sectionContent.replace(/\[object Object\]/g, '');
          
          // تحويل الأسطر الجديدة إلى فقرات
          const paragraphs = cleanContent.split('\n\n').filter((p: string) => p.trim());
          paragraphs.forEach((paragraph: string) => {
            parts.push(`<p>${paragraph.trim()}</p>`);
          });
        }
      });
    }

    // الرؤى
    if (content.keyInsights?.length) {
      parts.push('<h2>أبرز الرؤى</h2>');
      parts.push('<ul>');
      content.keyInsights.forEach((insight: string) => {
        parts.push(`<li>${insight}</li>`);
      });
      parts.push('</ul>');
    }

    // التوصيات
    if (content.recommendations?.length) {
      parts.push('<h2>التوصيات</h2>');
      parts.push('<ul>');
      content.recommendations.forEach((rec: string) => {
        parts.push(`<li>${rec}</li>`);
      });
      parts.push('</ul>');
    }

    // تنظيف المحتوى النهائي
    let finalHTML = parts.join('\n');
    
    // إزالة أي [object Object] متبقي
    finalHTML = finalHTML.replace(/\[object Object\]/g, '');
    
    // إزالة الفراغات الزائدة
    finalHTML = finalHTML.replace(/\n{3,}/g, '\n\n');
    
    return finalHTML;
  };

  const handleCategoryToggle = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category]
      });
    }
  };

  const handleRegenerate = async () => {
    if (!analysis || analysis.sourceType !== 'gpt') return;

    setRegenerating(true);
    try {
      // الحصول على مفتاح OpenAI من localStorage
      const openaiApiKey = localStorage.getItem('openai_api_key');
      
      const response = await fetch('/api/deep-analyses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          sourceType: 'topic',
          topic: formData.title,
          category: formData.categories[0],
          openaiApiKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // استخدام المحتوى المنسق مباشرة من الاستجابة
        setFormData({
          ...formData,
          content: data.content, // هذا الآن HTML منسق جاهز للمحرر
          summary: data.summary || formData.summary
        });
        
        toast.success('تم إعادة توليد المحتوى بنجاح');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في إعادة توليد المحتوى');
      }
    } catch (error) {
      console.error('خطأ في إعادة توليد التحليل:', error);
      toast.error('حدث خطأ في إعادة توليد التحليل');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSubmit = async (publish = false) => {
    // التحقق من المدخلات
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'العنوان مطلوب';
    if (!formData.content) newErrors.content = 'المحتوى مطلوب';
    if (formData.categories.length === 0) newErrors.categories = 'اختر تصنيف واحد على الأقل';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      // رفع الصورة إذا كانت موجودة
      let uploadedImageUrl = formData.featuredImage;
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
      }
      const response = await fetch(`/api/deep-analyses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          featuredImage: uploadedImageUrl,
          status: publish ? 'published' : analysis?.status
        })
      });

      if (response.ok) {
        toast.success(publish ? 'تم نشر التحليل بنجاح' : 'تم حفظ التغييرات بنجاح');
        router.push(`/dashboard/deep-analysis`);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('خطأ في حفظ التحليل:', error);
      toast.error('حدث خطأ في حفظ التحليل');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['سياسة', 'اقتصاد', 'تقنية', 'رياضة', 'ثقافة', 'صحة', 'بيئة', 'مجتمع'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل التحليل...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">التحليل غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              تحرير التحليل
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              قم بتحديث وتحسين التحليل العميق
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{errors.general}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* معلومات أساسية */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  عنوان التحليل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setErrors({ ...errors, title: '' });
                  }}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg",
                    "bg-white dark:bg-gray-800 dark:border-gray-700",
                    errors.title && "border-red-500"
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  الملخص
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  التصنيفات <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className="focus:outline-none"
                    >
                      <Badge
                        variant={formData.categories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                        {category}
                      </Badge>
                    </button>
                  ))}
                </div>
                {errors.categories && (
                  <p className="text-red-500 text-sm mt-1">{errors.categories}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  الوسوم
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (currentTag && !formData.tags.includes(currentTag)) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, currentTag]
                            });
                            setCurrentTag('');
                          }
                        }
                      }}
                      placeholder="أدخل وسم واضغط Enter"
                      className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (currentTag && !formData.tags.includes(currentTag)) {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, currentTag]
                          });
                          setCurrentTag('');
                        }
                      }}
                    >
                      إضافة
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags.filter(t => t !== tag)
                          })}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* صورة مميزة */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  الصورة المميزة
                </label>
                <div className="space-y-4">
                  {(imagePreview || formData.featuredImage) ? (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.featuredImage || ''}
                        alt="معاينة الصورة"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setFormData({ ...formData, featuredImage: null });
                        }}
                        className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                      <input
                        type="file"
                        id="featuredImage"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="featuredImage"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            اضغط لرفع صورة
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF حتى 5 ميجابايت
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* محرر المحتوى */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>محتوى التحليل</CardTitle>
              <div className="flex gap-2">
                {(analysis.sourceType === 'gpt' || analysis.sourceType === 'hybrid') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-2"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري إعادة التوليد...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        إعادة توليد بالذكاء الاصطناعي
                      </>
                    )}
                  </Button>
                )}
                {analysis.rawContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // تحميل المحتوى الخام في المحرر
                      let cleanContent = analysis.rawContent || '';
                      // إزالة [object Object] إن وجد
                      cleanContent = cleanContent.replace(/\[object Object\]/g, '');
                      setFormData({ ...formData, content: cleanContent });
                      toast.success('تم تحميل المحتوى الأصلي');
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    استعادة المحتوى الأصلي
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px] border rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                <div className="p-6 pt-8">
                  <Editor
                    content={formData.content}
                    onChange={(content) => {
                      // حفظ HTML المنسق
                      const htmlContent = typeof content === 'string' ? content : content.html;
                      setFormData({ ...formData, content: htmlContent });
                      setErrors({ ...errors, content: '' });
                    }}
                    autoSaveKey={`deep-analysis-draft-${params.id}`}
                    autoSaveInterval={15000} // حفظ كل 15 ثانية
                  />
                </div>
              </div>
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* معلومات التحليل */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات التحليل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">المصدر:</span>
                  <Badge variant="outline">
                    {analysis.sourceType === 'manual' && 'يدوي'}
                    {analysis.sourceType === 'gpt' && 'ذكاء اصطناعي'}
                    {analysis.sourceType === 'hybrid' && 'مزيج'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">الحالة:</span>
                  <Badge variant={analysis.status === 'published' ? 'default' : 'secondary'}>
                    {analysis.status === 'published' && 'منشور'}
                    {analysis.status === 'draft' && 'مسودة'}
                    {analysis.status === 'archived' && 'مؤرشف'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">المشاهدات:</span>
                  <span className="font-medium">{analysis.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">جودة المحتوى:</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-1 rounded",
                          i < Math.round(analysis.qualityScore * 5)
                            ? "bg-blue-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إجراءات الحفظ */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات الحفظ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={saving || regenerating}
                variant="outline"
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
              
              {analysis.status !== 'published' && (
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={saving || regenerating}
                  className="w-full"
                >
                  <Send className="w-4 h-4 ml-2" />
                  حفظ ونشر
                </Button>
              )}
            </CardContent>
          </Card>

          {/* نصائح التحرير */}
          <Card>
            <CardHeader>
              <CardTitle>نصائح التحرير</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>تأكد من وضوح العنوان ودقته</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>راجع المحتوى للتأكد من الدقة والشمولية</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>أضف المصادر والمراجع إن وجدت</span>
                </li>
                {(analysis.sourceType === 'gpt' || analysis.sourceType === 'hybrid') && (
                  <li className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span>يمكنك إعادة توليد المحتوى بالذكاء الاصطناعي</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 