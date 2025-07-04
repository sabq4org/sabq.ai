'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Calendar, Clock, Eye, Plus, Edit, Trash2, 
  Sun, Moon, Sunrise, Sunset, Sparkles, 
  BookOpen, Cloud, Headphones, TrendingUp,
  Save, RefreshCw, CheckCircle, AlertCircle,
  ArrowUp, ArrowDown, Wand2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDarkMode } from '@/hooks/useDarkMode';

interface DoseContent {
  id?: string;
  articleId?: string;
  contentType: 'article' | 'weather' | 'quote' | 'tip' | 'audio' | 'analysis';
  title: string;
  summary: string;
  imageUrl?: string;
  audioUrl?: string;
  displayOrder: number;
  article?: {
    title: string;
    category?: {
      name: string;
    };
  };
}

interface DailyDose {
  id: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  subtitle: string;
  date: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: string;
  views: number;
  contents: DoseContent[];
}

const periodOptions = [
  { value: 'morning', label: 'الصباح', icon: Sunrise, color: 'text-blue-500' },
  { value: 'afternoon', label: 'الظهيرة', icon: Sun, color: 'text-orange-500' },
  { value: 'evening', label: 'المساء', icon: Sunset, color: 'text-purple-500' },
  { value: 'night', label: 'الليل', icon: Moon, color: 'text-indigo-500' }
];

const contentTypeOptions = [
  { value: 'article', label: 'مقال', icon: BookOpen },
  { value: 'weather', label: 'طقس', icon: Cloud },
  { value: 'quote', label: 'اقتباس', icon: Sparkles },
  { value: 'tip', label: 'نصيحة', icon: Sparkles },
  { value: 'audio', label: 'صوتي', icon: Headphones },
  { value: 'analysis', label: 'تحليل', icon: TrendingUp }
];

export default function DailyDosesManagementPage() {
  const { darkMode } = useDarkMode();
  const [doses, setDoses] = useState<DailyDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('morning');
  const [editingDose, setEditingDose] = useState<DailyDose | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [editingContent, setEditingContent] = useState<DoseContent | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  // جلب الجرعات
  const fetchDoses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/daily-doses?date=${selectedDate}`);
      const data = await response.json();
      
      // تنظيم الجرعات حسب الفترة
      const dosesArray = periodOptions.map(period => {
        // إذا كان data كائن واحد وليس مصفوفة
        if (!Array.isArray(data)) {
          if (data && data.period === period.value) {
            return data;
          }
          return {
            id: `new-${period.value}`,
            period: period.value,
            title: '',
            subtitle: '',
            date: selectedDate,
            status: 'draft',
            views: 0,
            contents: []
          };
        }
        
        // إذا كان data مصفوفة
        const existingDose = data.find((d: DailyDose) => d.period === period.value);
        return existingDose || {
          id: `new-${period.value}`,
          period: period.value,
          title: '',
          subtitle: '',
          date: selectedDate,
          status: 'draft',
          views: 0,
          contents: []
        };
      });
      
      setDoses(dosesArray);
    } catch (error) {
      console.error('Error fetching doses:', error);
      toast.error('حدث خطأ في جلب الجرعات');
    } finally {
      setLoading(false);
    }
  };

  // جلب المقالات المتاحة
  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?status=published&limit=50');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  useEffect(() => {
    fetchDoses();
    fetchArticles();
  }, [selectedDate]);

  // توليد جرعة بالذكاء الاصطناعي
  const generateAIDose = async (period: string) => {
    try {
      setGeneratingAI(true);
      const response = await fetch('/api/daily-doses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, period })
      });

      if (!response.ok) throw new Error('Failed to generate');

      const generatedDose = await response.json();
      
      // تحديث الجرعة المحلية
      setDoses(prev => prev.map(dose => 
        dose.period === period ? { ...dose, ...generatedDose } : dose
      ));

      toast.success('تم توليد الجرعة بنجاح');
    } catch (error) {
      console.error('Error generating dose:', error);
      toast.error('حدث خطأ في توليد الجرعة');
    } finally {
      setGeneratingAI(false);
    }
  };

  // حفظ الجرعة
  const saveDose = async (dose: DailyDose) => {
    try {
      const isNew = dose.id.startsWith('new-');
      const url = isNew ? '/api/daily-doses' : `/api/daily-doses/${dose.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dose)
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('تم حفظ الجرعة بنجاح');
      fetchDoses();
    } catch (error) {
      console.error('Error saving dose:', error);
      toast.error('حدث خطأ في حفظ الجرعة');
    }
  };

  // نشر الجرعة
  const publishDose = async (dose: DailyDose) => {
    try {
      const response = await fetch(`/api/daily-doses/${dose.id}/publish`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to publish');

      toast.success('تم نشر الجرعة بنجاح');
      fetchDoses();
    } catch (error) {
      console.error('Error publishing dose:', error);
      toast.error('حدث خطأ في نشر الجرعة');
    }
  };

  // إضافة/تعديل محتوى
  const saveContent = () => {
    if (!editingDose || !editingContent) return;

    const updatedContents = editingContent.id
      ? editingDose.contents.map(c => c.id === editingContent.id ? editingContent : c)
      : [...editingDose.contents, { ...editingContent, id: Date.now().toString() }];

    const updatedDose = { ...editingDose, contents: updatedContents };
    setDoses(prev => prev.map(d => d.id === updatedDose.id ? updatedDose : d));
    setEditingDose(updatedDose);
    setShowContentDialog(false);
    setEditingContent(null);
  };

  // حذف محتوى
  const deleteContent = (contentId: string) => {
    if (!editingDose) return;

    const updatedContents = editingDose.contents.filter(c => c.id !== contentId);
    const updatedDose = { ...editingDose, contents: updatedContents };
    setDoses(prev => prev.map(d => d.id === updatedDose.id ? updatedDose : d));
    setEditingDose(updatedDose);
  };

  // تحريك المحتوى
  const moveContent = (contentId: string, direction: 'up' | 'down') => {
    if (!editingDose) return;

    const index = editingDose.contents.findIndex(c => c.id === contentId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editingDose.contents.length) return;

    const newContents = [...editingDose.contents];
    [newContents[index], newContents[newIndex]] = [newContents[newIndex], newContents[index]];
    
    // تحديث displayOrder
    newContents.forEach((content, i) => {
      content.displayOrder = i;
    });

    const updatedDose = { ...editingDose, contents: newContents };
    setDoses(prev => prev.map(d => d.id === updatedDose.id ? updatedDose : d));
    setEditingDose(updatedDose);
  };

  // الحصول على أيقونة الفترة
  const getPeriodIcon = (period: string) => {
    const option = periodOptions.find(p => p.value === period);
    return option ? <option.icon className={`w-5 h-5 ${option.color}`} /> : null;
  };

  // الحصول على أيقونة نوع المحتوى
  const getContentIcon = (type: string) => {
    const option = contentTypeOptions.find(t => t.value === type);
    return option ? <option.icon className="w-4 h-4" /> : null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة الجرعات اليومية</h1>
        <p className="text-gray-600 dark:text-gray-400">
          إنشاء وإدارة الجرعات المعرفية للقراء حسب فترات اليوم
        </p>
      </div>

      {/* Date Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            اختيار التاريخ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            >
              اليوم
            </Button>
            <Button variant="outline" onClick={fetchDoses}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Doses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doses.map(dose => {
            const periodOption = periodOptions.find(p => p.value === dose.period);
            const isPublished = dose.status === 'published';
            
            return (
              <Card key={dose.id} className={`border-2 ${
                isPublished ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      {getPeriodIcon(dose.period)}
                      <span>{periodOption?.label}</span>
                      {isPublished && (
                        <Badge variant="success" className="ml-2">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          منشور
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateAIDose(dose.period)}
                        disabled={generatingAI}
                      >
                        <Wand2 className="w-4 h-4 ml-1" />
                        توليد بالذكاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setEditingDose(dose)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {dose.views} مشاهدة • {dose.contents.length} عنصر
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dose.title ? (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{dose.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{dose.subtitle}</p>
                      
                      {/* عرض المحتويات */}
                      <div className="mt-4 space-y-2">
                        {dose.contents.slice(0, 3).map((content, index) => (
                          <div key={content.id || index} className="flex items-center gap-2 text-sm">
                            {getContentIcon(content.contentType)}
                            <span className="truncate">{content.title}</span>
                          </div>
                        ))}
                        {dose.contents.length > 3 && (
                          <span className="text-sm text-gray-500">
                            +{dose.contents.length - 3} عناصر أخرى
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>لم يتم إنشاء جرعة لهذه الفترة</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dose Dialog */}
      {editingDose && (
        <Dialog open={!!editingDose} onOpenChange={() => setEditingDose(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getPeriodIcon(editingDose.period)}
                تحرير جرعة {periodOptions.find(p => p.value === editingDose.period)?.label}
              </DialogTitle>
              <DialogDescription>
                {new Date(editingDose.date).toLocaleDateString('ar-SA')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>العنوان الرئيسي</Label>
                  <Input
                    value={editingDose.title}
                    onChange={(e) => setEditingDose({...editingDose, title: e.target.value})}
                    placeholder="مثال: ابدأ صباحك بالمفيد والمُلهم"
                  />
                </div>
                <div>
                  <Label>العنوان الفرعي</Label>
                  <Textarea
                    value={editingDose.subtitle}
                    onChange={(e) => setEditingDose({...editingDose, subtitle: e.target.value})}
                    placeholder="مثال: أهم ما تحتاجه اليوم… في دقائق تختصر لك كل شيء"
                    rows={2}
                  />
                </div>
              </div>

              {/* Contents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>المحتويات</Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingContent({
                        contentType: 'article',
                        title: '',
                        summary: '',
                        displayOrder: editingDose.contents.length
                      });
                      setShowContentDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة محتوى
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingDose.contents.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">لا توجد محتويات</p>
                      <p className="text-sm text-gray-400">اضغط على "إضافة محتوى" للبدء</p>
                    </div>
                  ) : (
                    editingDose.contents.map((content, index) => (
                      <div
                        key={content.id || index}
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex-shrink-0">
                          {getContentIcon(content.contentType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{content.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {content.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveContent(content.id!, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveContent(content.id!, 'down')}
                            disabled={index === editingDose.contents.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingContent(content);
                              setShowContentDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteContent(content.id!)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDose(null)}>
                إلغاء
              </Button>
              <Button onClick={() => saveDose(editingDose)}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
              {editingDose.status !== 'published' && (
                <Button
                  variant="default"
                  onClick={() => publishDose(editingDose)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  نشر الجرعة
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Content Dialog */}
      {showContentDialog && editingContent && (
        <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContent.id ? 'تعديل المحتوى' : 'إضافة محتوى جديد'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>نوع المحتوى</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={editingContent.contentType}
                  onChange={(e) => setEditingContent({
                    ...editingContent,
                    contentType: e.target.value as any
                  })}
                >
                    {contentTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
              </div>

              {editingContent.contentType === 'article' && (
                <div>
                  <Label>اختر مقال</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingContent.articleId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const article = articles.find(a => a.id === value);
                      if (article) {
                        setEditingContent({
                          ...editingContent,
                          articleId: value,
                          title: article.title,
                          summary: article.excerpt || '',
                          imageUrl: article.featuredImage
                        });
                      }
                    }}
                  >
                      <option value="">اختر مقال من القائمة</option>
                      {articles.map(article => (
                        <option key={article.id} value={article.id}>
                          {article.title} - {article.category?.name}
                        </option>
                      ))}
                    </select>
                </div>
              )}

              <div>
                <Label>العنوان</Label>
                <Input
                  value={editingContent.title}
                  onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                  placeholder="عنوان المحتوى"
                />
              </div>

              <div>
                <Label>الملخص</Label>
                <Textarea
                  value={editingContent.summary}
                  onChange={(e) => setEditingContent({...editingContent, summary: e.target.value})}
                  placeholder="ملخص أو وصف المحتوى"
                  rows={3}
                />
              </div>

              {editingContent.contentType !== 'article' && (
                <>
                  <div>
                    <Label>رابط الصورة (اختياري)</Label>
                    <Input
                      value={editingContent.imageUrl || ''}
                      onChange={(e) => setEditingContent({...editingContent, imageUrl: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {editingContent.contentType === 'audio' && (
                    <div>
                      <Label>رابط الملف الصوتي</Label>
                      <Input
                        value={editingContent.audioUrl || ''}
                        onChange={(e) => setEditingContent({...editingContent, audioUrl: e.target.value})}
                        placeholder="https://example.com/audio.mp3"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowContentDialog(false);
                setEditingContent(null);
              }}>
                إلغاء
              </Button>
              <Button onClick={saveContent}>
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 