'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  BookOpen, 
  FileText, 
  Save, 
  Upload, 
  Download, 
  Trash2,
  Hash,
  MapPin,
  Globe,
  Zap,
  Brain,
  Edit3,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Video,
  File,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// أنواع البيانات
interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
}

interface AIResult {
  success: boolean;
  result: string;
  service: string;
  metadata?: any;
}

// الخدمات المتاحة
const AI_SERVICES = [
  { id: 'generate_title', label: 'توليد عنوان', icon: BookOpen, color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { id: 'summarize', label: 'تلخيص', icon: FileText, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  { id: 'expand', label: 'توسيع', icon: Brain, color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  { id: 'rewrite', label: 'إعادة صياغة', icon: Edit3, color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  { id: 'translate', label: 'ترجمة', icon: Globe, color: 'bg-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  { id: 'analyze', label: 'تحليل', icon: Zap, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  { id: 'extract_keywords', label: 'كلمات مفتاحية', icon: Hash, color: 'bg-teal-500', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  { id: 'generate_report', label: 'تقرير كامل', icon: FileText, color: 'bg-pink-500', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
];

// أنواع الأخبار
const NEWS_TYPES = [
  { id: 'regular', label: 'خبر عادي', color: 'bg-gray-500' },
  { id: 'breaking', label: 'عاجل', color: 'bg-red-500' },
  { id: 'featured', label: 'رئيسي', color: 'bg-blue-500' },
  { id: 'gps', label: 'GPS جغرافي', color: 'bg-green-500' },
];

// خيارات النشر
const PUBLISH_OPTIONS = [
  { id: 'draft', label: 'مسودة', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700', icon: FileText },
  { id: 'review', label: 'بانتظار مراجعة', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', icon: Eye },
  { id: 'publish', label: 'نشر فوري', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', icon: Play },
];

export default function AIEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // الحالة الرئيسية
  const [initialContent, setInitialContent] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedNewsType, setSelectedNewsType] = useState('regular');
  const [selectedPublishOption, setSelectedPublishOption] = useState('draft');
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [keywords, setKeywords] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ lat: '', lng: '' });
  const [isGPSSent, setIsGPSSent] = useState(false);
  
  // حالة التحميل
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  // سجل العمليات
  const [operations, setOperations] = useState<Array<{
    id: string;
    service: string;
    timestamp: string;
    success: boolean;
    result: string;
  }>>([]);
  
  // مراجع
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?status=active');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('خطأ في جلب التصنيفات:', error);
      }
    };
    fetchCategories();
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (autoSave && editorContent) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // كل 30 ثانية
    }
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [editorContent, autoSave]);

  // استدعاء خدمة الذكاء الاصطناعي
  const callAIService = async (service: string, content: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          content,
          context: {
            category: categories.find(c => c.id === selectedCategory)?.name,
            type: selectedNewsType,
            title,
            gps: selectedNewsType === 'gps' ? gpsLocation : null
          }
        })
      });

      const data: AIResult = await response.json();
      
      if (data.success) {
        // إضافة العملية للسجل
        const operation = {
          id: Date.now().toString(),
          service,
          timestamp: new Date().toLocaleString('ar-SA'),
          success: true,
          result: data.result
        };
        setOperations(prev => [operation, ...prev.slice(0, 9)]); // الاحتفاظ بـ 10 عمليات فقط
        
        // تطبيق النتيجة
        applyAIResult(service, data.result);
        
        toast({
          title: 'نجح التنفيذ',
          description: `تم تنفيذ ${AI_SERVICES.find(s => s.id === service)?.label} بنجاح`,
          variant: 'default'
        });
      } else {
        throw new Error('خطأ في التنفيذ');
      }
    } catch (error) {
      console.error('خطأ في استدعاء AI:', error);
      toast({
        title: 'خطأ في التنفيذ',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق نتيجة الذكاء الاصطناعي
  const applyAIResult = (service: string, result: string) => {
    switch (service) {
      case 'generate_title':
        setTitle(result);
        break;
      case 'extract_keywords':
        setKeywords(result);
        break;
      case 'summarize':
      case 'expand':
      case 'rewrite':
      case 'translate':
      case 'analyze':
      case 'generate_report':
        setEditorContent(result);
        break;
    }
  };

  // رفع المرفقات
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const formData = new FormData();
      formData.append('file', file);
      
      fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const attachment: Attachment = {
            id: Date.now().toString(),
            name: file.name,
            url: data.url,
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'document',
            size: file.size
          };
          setAttachments(prev => [...prev, attachment]);
          
          toast({
            title: 'تم رفع الملف',
            description: `تم رفع ${file.name} بنجاح`,
            variant: 'default'
          });
        }
      })
      .catch(error => {
        console.error('خطأ في رفع الملف:', error);
        toast({
          title: 'خطأ في رفع الملف',
          description: 'فشل في رفع الملف',
          variant: 'destructive'
        });
      });
    });
  };

  // حذف مرفق
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // حفظ تلقائي
  const handleAutoSave = () => {
    if (editorContent) {
      localStorage.setItem('ai-editor-draft', JSON.stringify({
        content: editorContent,
        title,
        category: selectedCategory,
        type: selectedNewsType,
        keywords,
        gpsLocation,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // حفظ كمسودة
  const handleSaveDraft = async () => {
    setIsSaving(true);
    
    try {
      const articleData = {
        title: title || 'مسودة المحرر الذكي',
        content: editorContent,
        excerpt: editorContent.substring(0, 200) + '...',
        category_id: selectedCategory,
        status: selectedPublishOption === 'publish' ? 'published' : 
                selectedPublishOption === 'review' ? 'pending' : 'draft',
        featured_image: attachments.find(att => att.type === 'image')?.url,
        metadata: {
          isSmartDraft: true,
          aiEditor: true,
          keywords: keywords.split(',').map(k => k.trim()),
          newsType: selectedNewsType,
          gpsLocation: selectedNewsType === 'gps' ? gpsLocation : null,
          attachments: attachments,
          operations: operations,
          publishOption: selectedPublishOption,
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });

      const data = await response.json();
      
      if (data.success) {
        const statusMessage = selectedPublishOption === 'publish' ? 'تم النشر بنجاح' :
                             selectedPublishOption === 'review' ? 'تم إرسال المادة للمراجعة' :
                             'تم حفظ المقال كمسودة';
        
        toast({
          title: 'تم الحفظ',
          description: statusMessage,
          variant: 'default'
        });
        
        // مسح البيانات المحلية
        localStorage.removeItem('ai-editor-draft');
        
        // الانتقال إلى لوحة إدارة الأخبار
        router.push('/dashboard/news');
      } else {
        throw new Error(data.error || 'خطأ في الحفظ');
      }
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error instanceof Error ? error.message : 'فشل في حفظ المقال',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // إرسال المادة إلى إدارة الأخبار كـ GPS
  const handleSendToGPS = async () => {
    if (!editorContent.trim()) {
      toast({
        title: 'محتوى فارغ',
        description: 'يرجى إضافة محتوى قبل الإرسال',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const gpsData = {
        title: title || 'مادة GPS من المحرر الذكي',
        content: editorContent,
        excerpt: editorContent.substring(0, 200) + '...',
        category_id: selectedCategory,
        status: 'pending',
        featured_image: attachments.find(att => att.type === 'image')?.url,
        metadata: {
          isSmartDraft: true,
          aiEditor: true,
          isGPS: true,
          keywords: keywords.split(',').map(k => k.trim()),
          newsType: 'gps',
          gpsLocation: gpsLocation,
          attachments: attachments,
          operations: operations,
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpsData)
      });

      const data = await response.json();
      
      if (data.success) {
        setIsGPSSent(true);
        toast({
          title: 'تم الإرسال بنجاح',
          description: 'تم إرسال المادة إلى إدارة الأخبار كـ GPS',
          variant: 'default'
        });
      } else {
        throw new Error(data.error || 'خطأ في الإرسال');
      }
    } catch (error) {
      console.error('خطأ في إرسال GPS:', error);
      toast({
        title: 'خطأ في الإرسال',
        description: 'فشل في إرسال المادة إلى إدارة الأخبار',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // مسح المحتوى
  const handleClearContent = () => {
    setInitialContent('');
    setEditorContent('');
    setTitle('');
    setKeywords('');
    setAttachments([]);
    setOperations([]);
    localStorage.removeItem('ai-editor-draft');
  };

  // استعادة المسودة المحفوظة
  const loadDraft = () => {
    const saved = localStorage.getItem('ai-editor-draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setEditorContent(draft.content || '');
        setTitle(draft.title || '');
        setSelectedCategory(draft.category || '');
        setSelectedNewsType(draft.type || 'regular');
        setKeywords(draft.keywords || '');
        setGpsLocation(draft.gpsLocation || { lat: '', lng: '' });
      } catch (error) {
        console.error('خطأ في تحميل المسودة:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            المحرر الذكي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            محرر ذكي متقدم بأسلوب صحيفة سبق
          </p>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDraft}
            disabled={isLoading}
          >
            <div className="p-1 rounded-full bg-blue-50 text-blue-700 ml-2">
              <RotateCcw className="w-4 h-4" />
            </div>
            استعادة مسودة
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <div className="p-1 rounded-full bg-red-50 text-red-700 ml-2">
                  <Trash2 className="w-4 h-4" />
                </div>
                مسح الكل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد المسح</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من مسح جميع المحتويات؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearContent}>
                  مسح الكل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الأيسر - المحتوى الأولي */}
        <div className="lg:col-span-1 space-y-6">
          {/* المحتوى الأولي/الفكرة الأساسية */}
          <Card>
            <CardHeader>
                        <CardTitle className="flex items-center">
            <div className="p-1 rounded-full bg-blue-50 text-blue-700 ml-2">
              <BookOpen className="w-5 h-5" />
            </div>
            المحتوى الأولي
          </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="initial-content">الفكرة الأساسية أو البداية</Label>
                <Textarea
                  id="initial-content"
                  placeholder="اكتب فكرتك الأساسية أو بداية المحتوى هنا..."
                  value={initialContent}
                  onChange={(e) => setInitialContent(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  size="sm"
                  onClick={() => callAIService('generate_report', initialContent)}
                  disabled={!initialContent || isLoading}
                  className="flex-1"
                >
                  <div className="p-1 rounded-full bg-yellow-50 text-yellow-700 ml-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  توليد تقرير كامل
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* أدوات الذكاء الاصطناعي */}
          <Card>
            <CardHeader>
                        <CardTitle className="flex items-center">
            <div className="p-1 rounded-full bg-purple-50 text-purple-700 ml-2">
              <Brain className="w-5 h-5" />
            </div>
            أدوات الذكاء الاصطناعي
          </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AI_SERVICES.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    size="sm"
                    onClick={() => callAIService(service.id, editorContent || initialContent)}
                    disabled={(!editorContent && !initialContent) || isLoading}
                    className={`h-auto p-4 flex flex-col items-center space-y-2 hover:${service.bgColor} hover:${service.textColor} transition-colors`}
                  >
                    <div className={`p-2 rounded-full ${service.bgColor} ${service.textColor}`}>
                      <service.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{service.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* إعدادات المقال */}
          <Card>
            <CardHeader>
                        <CardTitle className="flex items-center">
            <div className="p-1 rounded-full bg-gray-50 text-gray-700 ml-2">
              <Settings className="w-5 h-5" />
            </div>
            إعدادات المقال
          </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* العنوان */}
              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان المقال..."
                  className="mt-2"
                />
              </div>

              {/* التصنيف */}
              <div>
                <Label htmlFor="category">التصنيف</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع الخبر */}
              <div>
                <Label>نوع الخبر</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {NEWS_TYPES.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedNewsType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedNewsType(type.id)}
                      className="h-auto p-2"
                    >
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* إعدادات GPS */}
              {selectedNewsType === 'gps' && (
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <div className="p-1 rounded-full bg-green-50 text-green-700 ml-2">
                      <MapPin className="w-4 h-4" />
                    </div>
                    الموقع الجغرافي
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="خط العرض"
                      value={gpsLocation.lat}
                      onChange={(e) => setGpsLocation(prev => ({ ...prev, lat: e.target.value }))}
                    />
                    <Input
                      placeholder="خط الطول"
                      value={gpsLocation.lng}
                      onChange={(e) => setGpsLocation(prev => ({ ...prev, lng: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* الكلمات المفتاحية */}
              <div>
                <Label htmlFor="keywords" className="flex items-center">
                  <div className="p-1 rounded-full bg-teal-50 text-teal-700 ml-2">
                    <Hash className="w-5 h-5" />
                  </div>
                  الكلمات المفتاحية
                </Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="كلمات مفتاحية مفصولة بفواصل..."
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* المرفقات */}
          <Card>
            <CardHeader>
                        <CardTitle className="flex items-center">
            <div className="p-1 rounded-full bg-green-50 text-green-700 ml-2">
              <Upload className="w-5 h-5" />
            </div>
            المرفقات
          </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <div className="p-1 rounded-full bg-green-50 text-green-700 ml-2">
                  <Upload className="w-4 h-4" />
                </div>
                رفع ملفات
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {attachment.type === 'image' && (
                      <div className="p-1 rounded-full bg-blue-50 text-blue-700">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    {attachment.type === 'video' && (
                      <div className="p-1 rounded-full bg-red-50 text-red-700">
                        <Video className="w-5 h-5" />
                      </div>
                    )}
                    {attachment.type === 'document' && (
                      <div className="p-1 rounded-full bg-green-50 text-green-700">
                        <File className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-sm">{attachment.name}</span>
                  </div>
                                        <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <div className="p-1 rounded-full bg-red-50 text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* العمود الأوسط - المحرر */}
        <div className="lg:col-span-2 space-y-6">
          {/* المحرر الذكي */}
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="p-1 rounded-full bg-orange-50 text-orange-700 ml-2">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  المحرر الذكي
                </span>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoSave(!autoSave)}
                  >
                    {autoSave ? (
                      <div className="p-1 rounded-full bg-green-50 text-green-700 ml-2">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-yellow-50 text-yellow-700 ml-2">
                        <Pause className="w-4 h-4" />
                      </div>
                    )}
                    حفظ تلقائي
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="ابدأ بكتابة محتوى المقال هنا... أو استخدم أدوات الذكاء الاصطناعي لتوليد المحتوى"
                className="min-h-[500px] resize-none"
              />
            </CardContent>
          </Card>

          {/* خيارات النشر */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="p-1 rounded-full bg-purple-50 text-purple-700 ml-2">
                  <Settings className="w-5 h-5" />
                </div>
                خيارات النشر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>حالة النشر</Label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                  {PUBLISH_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.id}
                        variant={selectedPublishOption === option.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPublishOption(option.id)}
                        className={`${selectedPublishOption === option.id ? option.color : ''}`}
                      >
                        <div className={`p-1 rounded-full ${selectedPublishOption === option.id ? 'bg-white/20' : option.bgColor} ${selectedPublishOption === option.id ? 'text-white' : option.textColor} ml-2`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* شارة GPS */}
              {selectedNewsType === 'gps' && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="p-1 rounded-full bg-green-100 text-green-700 ml-2">
                      <MapPin className="w-4 h-4" />
                    </div>
                    GPS جغرافي
                  </Badge>
                  {isGPSSent && (
                    <Badge variant="default" className="bg-blue-50 text-blue-700">
                      <div className="p-1 rounded-full bg-blue-100 text-blue-700 ml-2">
                        <Check className="w-4 h-4" />
                      </div>
                      تم الإرسال
                    </Badge>
                  )}
                </div>
              )}

              {/* شارة المحرر الذكي */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <div className="p-1 rounded-full bg-purple-100 text-purple-700 ml-2">
                    <Brain className="w-4 h-4" />
                  </div>
                  محرر ذكي
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <div className="p-1 rounded-full bg-orange-100 text-orange-700 ml-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  GPT-4
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* أزرار الحفظ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                onClick={handleAutoSave}
                disabled={isLoading}
              >
                <div className="p-1 rounded-full bg-blue-50 text-blue-700 ml-2">
                  <Save className="w-4 h-4" />
                </div>
                حفظ مؤقت
              </Button>

              {/* زر إرسال GPS */}
              {selectedNewsType === 'gps' && (
                <Button
                  variant="outline"
                  onClick={handleSendToGPS}
                  disabled={!editorContent || isLoading || isGPSSent}
                  className={isGPSSent ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  <div className={`p-1 rounded-full ${isGPSSent ? 'bg-green-100 text-green-700' : 'bg-green-50 text-green-700'} ml-2`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  {isGPSSent ? 'تم الإرسال' : 'إرسال إلى GPS'}
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleSaveDraft}
              disabled={!editorContent || isSaving || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <div className="p-1 rounded-full bg-green-50 text-green-700 ml-2">
                    <Save className="w-4 h-4" />
                  </div>
                  {selectedPublishOption === 'publish' ? 'نشر فوري' :
                   selectedPublishOption === 'review' ? 'إرسال للمراجعة' : 'حفظ كمسودة'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* سجل العمليات */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center">
            <div className="p-1 rounded-full bg-indigo-50 text-indigo-700 ml-2">
              <Eye className="w-5 h-5" />
            </div>
            سجل العمليات
          </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                      <Badge variant={operation.success ? "default" : "destructive"}>
                        {AI_SERVICES.find(s => s.id === operation.service)?.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {operation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {operation.result.substring(0, 100)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyAIResult(operation.service, operation.result)}
                  >
                    <div className="p-1 rounded-full bg-blue-50 text-blue-700">
                      <Copy className="w-4 h-4" />
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* مؤشر التحميل */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>جاري معالجة الطلب...</span>
          </div>
        </div>
      )}
    </div>
  );
} 