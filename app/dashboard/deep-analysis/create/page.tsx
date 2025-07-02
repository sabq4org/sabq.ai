'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Sparkles, 
  FileText,
  Brain,
  Layers,
  Save,
  Send,
  Loader2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  PenTool,
  BookOpen,
  Zap,
  FileCheck,
  RefreshCw,
  Eye,
  Edit,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Hash,
  Info
} from 'lucide-react';
import { CreateAnalysisRequest, SourceType, CreationType, DisplayPosition } from '@/types/deep-analysis';
import toast from 'react-hot-toast';

const CreateDeepAnalysisPage = () => {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // حقول النموذج
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>('original');
  const [creationType, setCreationType] = useState<CreationType>('manual');
  const [analysisType, setAnalysisType] = useState<'manual' | 'ai' | 'mixed'>('manual');
  const [externalLink, setExternalLink] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [gptPrompt, setGptPrompt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayPosition, setDisplayPosition] = useState<DisplayPosition>('middle');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeepAnalysisEnabled, setIsDeepAnalysisEnabled] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const mainCategories = [
    'الاقتصاد', 'التقنية', 'رؤية 2030', 'الأمن السيبراني', 
    'التعليم', 'الصحة', 'البيئة', 'السياسة', 'الرياضة', 
    'الثقافة', 'السياحة', 'الطاقة'
  ];

  // استرجاع حالة الوضع الليلي من localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // جلب المقالات والتحقق من تفعيل التحليل العميق
  useEffect(() => {
    fetchArticles();
    // التحقق من تفعيل التحليل العميق من الإعدادات
    const deepAnalysisSettings = localStorage.getItem('deep_analysis_enabled');
    if (deepAnalysisSettings === 'true') {
      setIsDeepAnalysisEnabled(true);
    }
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?status=published&limit=10&sort=published_at&order=desc');
      const data = await response.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  // إضافة تصنيف
  const addCategory = () => {
    if (currentCategory && !categories.includes(currentCategory)) {
      setCategories([...categories, currentCategory]);
      setCurrentCategory('');
    }
  };

  // إضافة وسم
  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  // معالجة رفع الصورة
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingImage(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setUploadingImage(false);
        toast.success('تم تحميل الصورة بنجاح!');
      };
      reader.onerror = () => {
        setUploadingImage(false);
        toast.error('فشل تحميل الصورة');
      };
      reader.readAsDataURL(file);
    }
  };

  // رفع الصورة
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('فشل رفع الصورة');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
      return null;
    }
  };

  // توليد المحتوى بالذكاء الاصطناعي
  const generateWithGPT = async () => {
    if (!gptPrompt) {
      toast.error('يرجى كتابة وصف للمحتوى المطلوب');
      return;
    }

    setGenerating(true);
    try {
      // الحصول على مفتاح OpenAI من الإعدادات المحفوظة
      const savedAiSettings = localStorage.getItem('settings_ai');
      let openaiKey = '';
      
      if (savedAiSettings) {
        const aiSettings = JSON.parse(savedAiSettings);
        openaiKey = aiSettings.openaiKey;
      }
      
      if (!openaiKey) {
        toast.error('يرجى إضافة مفتاح OpenAI من إعدادات الذكاء الاصطناعي');
        setGenerating(false);
        return;
      }
      
      const response = await fetch('/api/deep-analyses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: gptPrompt,
          sourceArticleId: selectedArticle?.id,
          categories,
          openaiKey, // إرسال المفتاح مع الطلب
          title: title || 'تحليل عميق',
          creationType: sourceType === 'article' ? 'from_article' : 'topic',
          articleUrl: selectedArticle?.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTitle(data.title || 'تحليل عميق');
        setSummary(data.summary || '');
        // المحتوى الآن يأتي منسقاً من الخادم
        setContent(data.content || '');
        setTags(data.tags || []);
        
        // إضافة رسالة نجاح مع معلومات إضافية
        if (data.qualityScore) {
          toast.success(`تم توليد المحتوى بنجاح (جودة: ${data.qualityScore}%)`);
        } else {
          toast.success('تم توليد المحتوى بنجاح');
        }
      } else {
        toast.error(data.error || 'فشل توليد المحتوى');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('حدث خطأ أثناء توليد المحتوى');
    } finally {
      setGenerating(false);
    }
  };

  // حفظ التحليل
  const handleSubmit = async (status: 'draft' | 'published' = 'published') => {
    if (!title || !summary) {
      toast.error('يرجى ملء العنوان والملخص على الأقل');
      return;
    }

    setLoading(true);
    try {
      // رفع الصورة إذا كانت موجودة
      let uploadedImageUrl = featuredImage;
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
      }
      // الحصول على مفتاح OpenAI من localStorage
      const openaiKey = localStorage.getItem('openai_api_key');
      
      // تحديد ما إذا كان يجب استخدام GPT
      const shouldUseGPT = (creationType === 'gpt' || creationType === 'mixed') && !content;
      
              const analysisData: CreateAnalysisRequest = {
          title,
          summary,
          content,
          sourceType,
          creationType,
          analysisType,
          categories,
          tags,
          authorName,
          isActive,
          isFeatured,
          displayPosition,
          status: status === 'published' ? 'published' : 'draft',
          sourceArticleId: selectedArticle?.id,
          externalLink: sourceType === 'external' ? externalLink : undefined,
          generateWithGPT: shouldUseGPT,
          gptPrompt: shouldUseGPT ? (gptPrompt || title) : undefined,
          openaiApiKey: openaiKey || undefined,
          featuredImage: uploadedImageUrl
        };

      console.log('Submitting analysis with data:', {
        ...analysisData,
        openaiApiKey: analysisData.openaiApiKey ? 'PROVIDED' : 'NOT PROVIDED'
      });

      const response = await fetch('/api/deep-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(status === 'published' ? 'تم نشر التحليل بنجاح' : 'تم حفظ المسودة بنجاح');
        router.push('/dashboard/deep-analysis');
      } else {
        console.error('Error response:', data);
        toast.error(data.error || 'فشل حفظ التحليل');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('حدث خطأ أثناء حفظ التحليل');
    } finally {
      setLoading(false);
    }
  };

  // مكون بطاقة النوع
  const TypeCard = ({ 
    type, 
    title, 
    description, 
    icon: Icon, 
    isSelected, 
    onClick,
    color = 'blue'
  }: {
    type: string;
    title: string;
    description: string;
    icon: any;
    isSelected: boolean;
    onClick: () => void;
    color?: string;
  }) => {
    // تحديد الكلاسات بناءً على اللون
    const getColorClasses = () => {
      if (!isSelected) return '';
      
      switch (color) {
        case 'blue':
          return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-blue-600 transform scale-[1.02]';
        case 'purple':
          return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-purple-600 transform scale-[1.02]';
        case 'orange':
          return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-orange-600 transform scale-[1.02]';
        case 'green':
          return 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-green-600 transform scale-[1.02]';
        case 'indigo':
          return 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl border-indigo-600 transform scale-[1.02]';
        default:
          return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-blue-600 transform scale-[1.02]';
      }
    };

    return (
      <button
        onClick={onClick}
        className={`relative w-full p-6 rounded-2xl border-2 transition-all duration-300 text-right overflow-hidden ${
          isSelected
            ? getColorClasses()
            : darkMode
              ? 'text-gray-300 hover:bg-gray-700 border-gray-700 hover:border-gray-600'
              : 'text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
        }`}
      >
      {/* شريط جانبي للعنصر المختار */}
      {isSelected && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
      )}
      
      {/* أيقونة التحديد */}
      {isSelected && (
        <div className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-white/20 scale-110'
            : darkMode
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-white' : ''}`}>{title}</h3>
          <p className={`text-sm ${isSelected ? 'text-white/90' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        </div>
      </div>
    </button>
    );
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`} dir="rtl">
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>إنشاء تحليل عميق جديد</h1>
            <p className={`transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>أضف تحليلاً عميقاً جديداً بمحتوى غني ومفصل</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/deep-analysis')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        </div>
      </div>

      {/* قسم نظام التحليل العميق */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700' 
            : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام التحليل العميق المتقدم</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>إنشاء محتوى تحليلي عميق بالذكاء الاصطناعي أو يدوياً</p>
            </div>
            <div className="mr-auto">
              <button
                onClick={fetchArticles}
                className={`p-2 rounded-lg shadow-sm transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* رسالة ترحيب ذكية */}
      {title === '' && summary === '' && (
        <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
          darkMode 
            ? 'bg-blue-900/20 border border-blue-700' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              مرحباً! ابدأ بتحديد طريقة الإنشاء ونوع المصدر، ثم املأ تفاصيل التحليل العميق.
            </p>
          </div>
        </div>
      )}

      {/* أنواع الإنشاء */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <Layers className="w-5 h-5 text-purple-600" />
          طريقة الإنشاء
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <TypeCard
            type="manual"
            title="يدوي"
            description="كتابة التحليل بشكل كامل يدوياً"
            icon={PenTool}
            isSelected={creationType === 'manual'}
            onClick={() => {
              setCreationType('manual');
              setAnalysisType('manual');
            }}
            color="blue"
          />
          <TypeCard
            type="gpt"
            title="ذكاء اصطناعي"
            description="توليد التحليل بواسطة GPT-4"
            icon={Sparkles}
            isSelected={creationType === 'gpt'}
            onClick={() => {
              setCreationType('gpt');
              setAnalysisType('ai');
            }}
            color="purple"
          />
          <TypeCard
            type="mixed"
            title="مختلط"
            description="دمج الكتابة اليدوية مع الذكاء الاصطناعي"
            icon={Zap}
            isSelected={creationType === 'mixed'}
            onClick={() => {
              setCreationType('mixed');
              setAnalysisType('mixed');
            }}
            color="orange"
          />
        </div>
      </div>

      {/* نوع المصدر */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <FileText className="w-5 h-5 text-blue-600" />
          نوع المصدر
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <TypeCard
            type="original"
            title="محتوى أصلي"
            description="تحليل جديد تماماً بدون مصدر"
            icon={BookOpen}
            isSelected={sourceType === 'original'}
            onClick={() => setSourceType('original')}
            color="green"
          />
          <TypeCard
            type="article"
            title="من مقال"
            description="تحليل مبني على مقال موجود"
            icon={FileText}
            isSelected={sourceType === 'article'}
            onClick={() => setSourceType('article')}
            color="indigo"
          />
        </div>
      </div>

      {/* اختيار المقال */}
      {sourceType === 'article' && (
        <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-all duration-500 animate-slideIn ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <Label>اختر المقال المصدر</Label>
          <select
            value={selectedArticle?.id || ''}
            onChange={(e) => {
              const article = articles.find(a => a.id === e.target.value);
              setSelectedArticle(article);
            }}
            className={`w-full mt-2 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <option value="">اختر مقالاً...</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* محتوى GPT */}
      {(creationType === 'gpt' || creationType === 'mixed') && (
        <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-all duration-500 animate-slideIn ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="space-y-4">
            <div>
              <Label>وصف المحتوى المطلوب من GPT</Label>
              <Textarea
                placeholder="اكتب وصفاً تفصيلياً للتحليل المطلوب..."
                value={gptPrompt}
                onChange={(e) => setGptPrompt(e.target.value)}
                rows={4}
                className={`mt-2 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>
            <Button
              onClick={generateWithGPT}
              disabled={generating || !gptPrompt}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جارٍ التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  توليد بـ GPT
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* محتوى التحليل */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <FileCheck className="w-5 h-5 text-green-600" />
          محتوى التحليل
        </h3>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">عنوان التحليل *</Label>
            <Input
              id="title"
              placeholder="أدخل عنوان التحليل العميق..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-2 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-200'
              }`}
            />
          </div>

          <div>
            <Label htmlFor="summary">الملخص *</Label>
            <Textarea
              id="summary"
              placeholder="ملخص قصير للتحليل..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className={`mt-2 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-200'
              }`}
            />
          </div>

          {/* صورة مميزة */}
          <div>
            <Label htmlFor="featuredImage">الصورة المميزة</Label>
            <div className={`mt-2 space-y-4`}>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="معاينة الصورة"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setFeaturedImage(null);
                    }}
                    className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 ${
                  darkMode 
                    ? 'border-gray-600 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
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
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Upload className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        اضغط لرفع صورة
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        PNG, JPG, GIF حتى 5 ميجابايت
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">المحتوى التفصيلي</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? (
                  <>
                    <Edit className="w-4 h-4" />
                    تحرير
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    معاينة
                  </>
                )}
              </Button>
            </div>
            {showPreview ? (
              <div className={`mt-2 p-4 rounded-lg border min-h-[300px] overflow-auto transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="prose prose-lg max-w-none" dir="rtl">
                  {content.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-semibold mt-3 mb-2">{line.substring(4)}</h3>;
                    } else if (line.startsWith('- ')) {
                      const text = line.substring(2);
                      const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <li key={index} className="mr-6 mb-1" 
                            dangerouslySetInnerHTML={{ __html: formattedText }} />
                      );
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      const formattedText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <p key={index} className="mb-2" 
                           dangerouslySetInnerHTML={{ __html: formattedText }} />
                      );
                    }
                  })}
                </div>
              </div>
            ) : (
              <Textarea
                id="content"
                placeholder="المحتوى الكامل للتحليل..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className={`mt-2 transition-colors duration-300 font-mono ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200'
                }`}
              />
            )}
          </div>

          {/* التصنيفات */}
          <div>
            <Label>التصنيفات</Label>
            <div className="flex gap-2 mt-2">
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="">اختر تصنيفاً...</option>
                {mainCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Button
                onClick={addCategory}
                disabled={!currentCategory}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  {cat}
                  <button
                    onClick={() => setCategories(categories.filter(c => c !== cat))}
                    className="mr-2 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* الوسوم */}
          <div>
            <Label>الوسوم</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="أضف وسماً..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className={`flex-1 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200'
                }`}
              />
              <Button
                onClick={addTag}
                disabled={!currentTag}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-3 py-1"
                >
                  #{tag}
                  <button
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="mr-2 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* الإعدادات المتقدمة */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-full flex items-center justify-between text-lg font-bold transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            الإعدادات المتقدمة
          </span>
          {showAdvanced ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="author">اسم الكاتب</Label>
              <Input
                id="author"
                placeholder="اسم كاتب التحليل..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={`mt-2 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  نشط
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  مميز
                </span>
              </label>
            </div>

            <div>
              <Label>موضع العرض</Label>
              <select
                value={displayPosition}
                onChange={(e) => setDisplayPosition(e.target.value as DisplayPosition)}
                className={`w-full mt-2 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <option value="normal">عادي</option>
                <option value="featured">مميز</option>
                <option value="top">أعلى الصفحة</option>
                <option value="sidebar">الشريط الجانبي</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ملخص سريع للاختيارات */}
      <div className={`rounded-xl p-4 mb-6 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600' 
          : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-semibold flex items-center gap-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            ملخص الاختيارات
          </h4>
          <div className="flex gap-4 text-sm">
            <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Layers className="w-4 h-4" />
              {creationType === 'manual' ? 'يدوي' : creationType === 'gpt' ? 'ذكاء اصطناعي' : 'مختلط'}
            </span>
            <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <FileText className="w-4 h-4" />
              {sourceType === 'original' ? 'محتوى أصلي' : 'من مقال'}
            </span>
          </div>
        </div>
      </div>

      {/* معاينة الخيارات المختارة - تفصيلية */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <Eye className="w-5 h-5 text-indigo-600" />
          معاينة تفصيلية
        </h3>

        {/* تنبيه التحليل العميق */}
        {isDeepAnalysisEnabled && (
          <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            darkMode 
              ? 'bg-purple-900/30 border border-purple-700' 
              : 'bg-purple-50 border border-purple-200'
          }`}>
            <Info className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                تحليل عميق مفعّل
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                هذا المحتوى سيتم معالجته كتحليل عميق وسيُعرض في البلوك المخصص له
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* طريقة الإنشاء */}
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                طريقة الإنشاء
              </span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {creationType === 'manual' && 'يدوي'}
              {creationType === 'gpt' && 'ذكاء اصطناعي'}
              {creationType === 'mixed' && 'مختلط'}
            </p>
          </div>

          {/* نوع المصدر */}
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                نوع المصدر
              </span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {sourceType === 'original' && 'محتوى أصلي'}
              {sourceType === 'article' && selectedArticle ? `من مقال: ${selectedArticle.title}` : sourceType === 'article' ? 'من مقال (غير محدد)' : ''}
            </p>
          </div>

          {/* الكلمات المفتاحية */}
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-green-600" />
              <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                الكلمات المفتاحية
              </span>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <span key={index} className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                لم يتم إضافة كلمات مفتاحية
              </p>
            )}
          </div>

          {/* الصورة المميزة */}
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-orange-600" />
              <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                الصورة المميزة
              </span>
            </div>
            {uploadingImage ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ رفع الصورة...
              </p>
            ) : imagePreview ? (
              <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-2`}>
                <CheckCircle2 className="w-4 h-4" />
                تم رفع الصورة بنجاح
              </p>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                لم يتم رفع صورة
              </p>
            )}
          </div>
        </div>

        {/* التحقق من البيانات المطلوبة */}
        {(!title || !summary) && (
          <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
            darkMode 
              ? 'bg-red-900/30 border border-red-700' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                بيانات مطلوبة
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                يرجى ملء العنوان والملخص قبل النشر
              </p>
            </div>
          </div>
        )}
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/deep-analysis')}
          className={darkMode ? 'border-gray-600 hover:bg-gray-800' : ''}
        >
          إلغاء
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={loading}
          className={darkMode ? 'bg-gray-700 hover:bg-gray-600' : ''}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              حفظ كمسودة
            </>
          )}
        </Button>
        <Button
          onClick={() => handleSubmit('published')}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جارٍ النشر...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              نشر التحليل
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateDeepAnalysisPage; 