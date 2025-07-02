'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Eye, 
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Edit,
  ExternalLink,
  Link as LinkIcon,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  User,
  Hash,
  Sparkles,
  Brain,
  ChevronRight,
  Star,
  Copy,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeepAnalysis {
  id: string;
  title: string;
  summary: string;
  content: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'editing' | 'published' | 'archived';
  source: 'manual' | 'gpt' | 'hybrid';
  analysisAngle?: string;
  depthLevel?: number;
  articleId?: string;
  author: string;
  createdAt: string;
  publishedAt?: string;
  wordCount: number;
  readingTime: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  sources?: string[];
  keyTakeaways?: string[];
  aiQualityScore?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeepAnalysisDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const [copied, setCopied] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>('');
  
  // معلومات المستخدم الحالي
  const currentUser = {
    name: 'علي الحازمي',
    role: 'محرر رئيسي',
    isAdmin: true
  };

  useEffect(() => {
    // استخراج id من params
    params.then((resolvedParams) => {
      setAnalysisId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  const fetchAnalysis = async () => {
    try {
      // محاكاة بيانات التحليل
      const mockAnalysis: DeepAnalysis = {
        id: analysisId,
        title: 'تحليل عميق: مستقبل الذكاء الاصطناعي في المملكة العربية السعودية',
        summary: 'دراسة شاملة لتأثير تقنيات الذكاء الاصطناعي على الاقتصاد السعودي وفرص التحول الرقمي في إطار رؤية 2030، مع التركيز على القطاعات الحيوية والتحديات المستقبلية.',
        content: `
          <h2>المقدمة</h2>
          <p>يشهد العالم ثورة تقنية غير مسبوقة في مجال الذكاء الاصطناعي، والمملكة العربية السعودية ليست بمعزل عن هذا التحول. في إطار رؤية 2030، تسعى المملكة لتكون رائدة في مجال التقنيات الناشئة.</p>
          
          <h2>التحديات الحالية</h2>
          <ul>
            <li>نقص الكوادر المتخصصة في الذكاء الاصطناعي</li>
            <li>الحاجة إلى بنية تحتية رقمية متطورة</li>
            <li>التحديات التنظيمية والقانونية</li>
            <li>مقاومة التغيير في بعض القطاعات</li>
          </ul>
          
          <h2>الفرص المستقبلية</h2>
          <p>تتمتع المملكة بفرص هائلة لتطبيق الذكاء الاصطناعي في قطاعات متعددة:</p>
          <ul>
            <li><strong>قطاع الطاقة:</strong> تحسين كفاءة الإنتاج وتطوير الطاقة المتجددة</li>
            <li><strong>القطاع الصحي:</strong> التشخيص المبكر والطب الشخصي</li>
            <li><strong>المدن الذكية:</strong> نيوم كنموذج للمدن المستقبلية</li>
            <li><strong>التعليم:</strong> التعلم التكيفي والتعليم عن بعد</li>
          </ul>
          
          <h2>التوصيات الاستراتيجية</h2>
          <ol>
            <li>إنشاء مراكز تميز وطنية للذكاء الاصطناعي</li>
            <li>تطوير برامج تدريبية متخصصة في الجامعات</li>
            <li>تحفيز الاستثمار في الشركات الناشئة التقنية</li>
            <li>وضع إطار تنظيمي مرن يواكب التطورات</li>
            <li>بناء شراكات دولية مع الدول الرائدة</li>
          </ol>
        `,
        categories: ['الذكاء الاصطناعي', 'الاقتصاد', 'رؤية 2030', 'التقنية'],
        tags: ['استراتيجية', 'ابتكار', 'اقتصاد رقمي', 'تحول رقمي', 'نيوم'],
        status: 'published',
        source: 'hybrid',
        analysisAngle: 'economic',
        depthLevel: 4,
        author: 'د. محمد الرشيد',
        createdAt: '2024-01-15T10:30:00Z',
        publishedAt: '2024-01-15T14:00:00Z',
        wordCount: 2500,
        readingTime: 12,
        views: 15420,
        likes: 342,
        comments: 28,
        shares: 156,
        saves: 89,
        sources: [
          'https://vision2030.gov.sa',
          'https://www.mcit.gov.sa/ar/media-center/news',
          'تقرير منظمة التعاون الاقتصادي والتنمية 2023'
        ],
        keyTakeaways: [
          'المملكة تستثمر 20 مليار دولار في الذكاء الاصطناعي بحلول 2030',
          'توقع خلق 300 ألف وظيفة جديدة في قطاع التقنية',
          'نيوم ستكون أول مدينة ذكية متكاملة بالذكاء الاصطناعي',
          'القطاع الصحي سيشهد أكبر تحول رقمي'
        ],
        aiQualityScore: 92
      };
      
      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('خطأ في جلب التحليل:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (analysis) {
      setAnalysis({
        ...analysis,
        likes: liked ? analysis.likes - 1 : analysis.likes + 1
      });
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    if (analysis) {
      setAnalysis({
        ...analysis,
        saves: saved ? analysis.saves - 1 : analysis.saves + 1
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: analysis?.title,
          text: analysis?.summary,
          url: window.location.href
        });
        if (analysis) {
          setAnalysis({
            ...analysis,
            shares: analysis.shares + 1
          });
        }
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا التحليل؟')) {
      // منطق الحذف
      router.push('/dashboard/deep-analysis');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getAngleLabel = (angle: string) => {
    const angles: Record<string, { label: string; icon: string }> = {
      economic: { label: 'اقتصادي', icon: '💰' },
      social: { label: 'اجتماعي', icon: '👥' },
      political: { label: 'سياسي', icon: '🏛️' },
      environmental: { label: 'بيئي', icon: '🌱' },
      technological: { label: 'تقني', icon: '💻' },
      security: { label: 'أمني', icon: '🔒' }
    };
    return angles[angle] || { label: angle, icon: '📊' };
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      manual: { label: 'يدوي', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      gpt: { label: 'AI Generated', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      hybrid: { label: 'AI Assisted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    };
    return badges[source as keyof typeof badges] || badges.manual;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">التحليل غير موجود</p>
            <Button onClick={() => router.back()} className="mt-4">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* شريط الأدوات العلوي */}
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
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>التحليلات العميقة</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white">{analysis.title}</span>
          </div>
        </div>

        {/* الخيارات الإدارية */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/deep-analysis/${analysis.id}/edit`)}
          >
            <Edit className="w-4 h-4 ml-1" />
            تحرير
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/deep-analysis/${analysis.id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 ml-1" />
            عرض في الموقع
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 ml-1" />
                نسخ الرابط
              </>
            )}
          </Button>

          {currentUser.isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {/* منطق إلغاء النشر */}}
                  className="text-orange-600"
                >
                  إلغاء النشر
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {/* منطق الأرشفة */}}
                >
                  أرشفة
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {/* العنوان والملخص */}
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                {analysis.title}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {analysis.summary}
              </p>

              {/* التصنيفات والوسوم */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">التصنيفات:</span>
                  {analysis.categories.map((category: any) => (
                    <Badge key={typeof category === 'string' ? category : category.id} variant="default" className="cursor-pointer">
                      {typeof category === 'string' ? category : (category.name_ar || category.name || 'عام')}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الوسوم:</span>
                  {analysis.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      <Hash className="w-3 h-3 ml-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* معلومات النشر */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{analysis.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(analysis.publishedAt || analysis.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{analysis.readingTime} دقيقة قراءة</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* محتوى التحليل */}
          <Card>
            <CardContent className="pt-6">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: analysis.content }}
              />
            </CardContent>
          </Card>

          {/* النقاط المميزة */}
          {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  النقاط المميزة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* المصادر */}
          {analysis.sources && analysis.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  المصادر والمراجع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.sources.map((source, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-blue-500">•</span>
                      {source.startsWith('http') ? (
                        <a 
                          href={source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {source}
                        </a>
                      ) : (
                        <span>{source}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* نظام التفاعل */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant={liked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="flex items-center gap-2"
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    <span>{analysis.likes}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{analysis.shares}</span>
                  </Button>
                  
                  <Button
                    variant={saved ? "default" : "outline"}
                    size="sm"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
                    <span>{analysis.saves}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{analysis.comments}</span>
                  </Button>
                </div>

                {/* تقييم التحليل */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">قيم التحليل:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star
                          className={cn(
                            "w-5 h-5",
                            star <= rating 
                              ? "text-yellow-500 fill-current" 
                              : "text-gray-300 dark:text-gray-600"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                إحصائيات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span>المشاهدات</span>
                </div>
                <span className="font-semibold text-lg">{analysis.views.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Heart className="w-4 h-4" />
                  <span>الإعجابات</span>
                </div>
                <span className="font-semibold text-lg">{analysis.likes}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>التعليقات</span>
                </div>
                <span className="font-semibold text-lg">{analysis.comments}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Share2 className="w-4 h-4" />
                  <span>المشاركات</span>
                </div>
                <span className="font-semibold text-lg">{analysis.shares}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Bookmark className="w-4 h-4" />
                  <span>الحفظ</span>
                </div>
                <span className="font-semibold text-lg">{analysis.saves}</span>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">معدل التفاعل</span>
                  <span className="text-sm font-semibold text-green-600">
                    {((analysis.likes + analysis.comments + analysis.shares + analysis.saves) / analysis.views * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(((analysis.likes + analysis.comments + analysis.shares + analysis.saves) / analysis.views * 100), 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الذكاء الاصطناعي */}
          {(analysis.source === 'gpt' || analysis.source === 'hybrid') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  معلومات الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">طريقة الإنتاج</span>
                  <Badge className={getSourceBadge(analysis.source).color}>
                    {getSourceBadge(analysis.source).label}
                  </Badge>
                </div>
                
                {analysis.analysisAngle && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">زاوية الرؤية</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{getAngleLabel(analysis.analysisAngle).icon}</span>
                      <span className="text-sm font-medium">{getAngleLabel(analysis.analysisAngle).label}</span>
                    </div>
                  </div>
                )}
                
                {analysis.depthLevel && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مستوى العمق</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Layers
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < analysis.depthLevel!
                              ? "text-blue-500"
                              : "text-gray-300 dark:text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {analysis.aiQualityScore && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">تقييم الجودة</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {analysis.aiQualityScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${analysis.aiQualityScore}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    تم إنشاؤه بواسطة الذكاء الاصطناعي
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* معلومات إضافية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                معلومات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">عدد الكلمات</span>
                <span className="font-semibold">{analysis.wordCount.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">وقت القراءة</span>
                <span className="font-semibold">{analysis.readingTime} دقيقة</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">الحالة</span>
                <Badge variant={analysis.status === 'published' ? 'default' : 'secondary'}>
                  {analysis.status === 'published' ? 'منشور' : 
                   analysis.status === 'draft' ? 'مسودة' :
                   analysis.status === 'editing' ? 'قيد التحرير' : 'مؤرشف'}
                </Badge>
              </div>
              
              {analysis.articleId && (
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/article/${analysis.articleId}`)}
                  >
                    <LinkIcon className="w-4 h-4 ml-1" />
                    عرض المقال الأصلي
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* إضافات مستقبلية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                تحليلات مشابهة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                بناءً على هذا التحليل، قد تهمك:
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ChevronRight className="w-4 h-4 ml-1" />
                  تأثير الذكاء الاصطناعي على التوظيف
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ChevronRight className="w-4 h-4 ml-1" />
                  الاستثمار في التقنيات الناشئة
                </Button>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button className="w-full" size="sm">
                  <Sparkles className="w-4 h-4 ml-1" />
                  اطلب تحليلاً مشابهاً
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 