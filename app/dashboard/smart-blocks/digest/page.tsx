'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Clock,
  Eye,
  EyeOff,
  Sun,
  Cloud,
  Moon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DigestSettings {
  enabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // بالدقائق
  titles: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  subtitles: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  filters: {
    maxAge: number; // بالساعات
    minImportanceScore: number;
    minRelevanceScore: number;
    minEngagementScore: number;
  };
}

export default function SmartDigestSettingsPage() {
  const [settings, setSettings] = useState<DigestSettings>({
    enabled: true,
    autoRefresh: true,
    refreshInterval: 60,
    titles: {
      morning: 'ابدأ صباحك بالمفيد والهادئ',
      afternoon: 'متابعات الظهيرة… اللحظة الآن بين يديك',
      evening: 'ختام يومك… باختصار تستحقه'
    },
    subtitles: {
      morning: 'كل شيء بوضوح قبل أن تبدأ يومك',
      afternoon: 'استراحة معرفية وسط يومك المتسارع',
      evening: 'ملخص ذكي قبل أن تنهي يومك'
    },
    filters: {
      maxAge: 48,
      minImportanceScore: 6,
      minRelevanceScore: 5,
      minEngagementScore: 5
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // جلب الإعدادات الحالية
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // محاكاة جلب الإعدادات من localStorage أو API
      const savedSettings = localStorage.getItem('smartDigestSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // حفظ في localStorage (يمكن تغييرها لـ API)
      localStorage.setItem('smartDigestSettings', JSON.stringify(settings));
      
      // محاكاة تأخير الحفظ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: DigestSettings = {
      enabled: true,
      autoRefresh: true,
      refreshInterval: 60,
      titles: {
        morning: 'ابدأ صباحك بالمفيد والهادئ',
        afternoon: 'متابعات الظهيرة… اللحظة الآن بين يديك',
        evening: 'ختام يومك… باختصار تستحقه'
      },
      subtitles: {
        morning: 'كل شيء بوضوح قبل أن تبدأ يومك',
        afternoon: 'استراحة معرفية وسط يومك المتسارع',
        evening: 'ملخص ذكي قبل أن تنهي يومك'
      },
      filters: {
        maxAge: 48,
        minImportanceScore: 6,
        minRelevanceScore: 5,
        minEngagementScore: 5
      }
    };
    
    setSettings(defaultSettings);
    toast.success('تم استعادة الإعدادات الافتراضية');
  };

  const getPreviewIcon = () => {
    switch (previewMode) {
      case 'morning': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'afternoon': return <Cloud className="w-5 h-5 text-blue-500" />;
      case 'evening': return <Moon className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إعدادات بلوك الجرعات الذكي</h1>
        <p className="text-gray-600">تحكم في كيفية عرض الجرعات المعرفية للزوار حسب وقت اليوم</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* الإعدادات الأساسية */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* تفعيل البلوك */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enabled">تفعيل بلوك الجرعات</Label>
                  <p className="text-sm text-gray-500">عرض أو إخفاء البلوك من الصفحة الرئيسية</p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
                />
              </div>

              {/* التحديث التلقائي */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoRefresh">التحديث التلقائي</Label>
                  <p className="text-sm text-gray-500">تحديث المحتوى تلقائياً</p>
                </div>
                <Switch
                  id="autoRefresh"
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => setSettings({...settings, autoRefresh: checked})}
                />
              </div>

              {/* فترة التحديث */}
              {settings.autoRefresh && (
                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">فترة التحديث (بالدقائق)</Label>
                  <Input
                    id="refreshInterval"
                    type="number"
                    min="15"
                    max="180"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value) || 60})}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* فلاتر المحتوى */}
          <Card>
            <CardHeader>
              <CardTitle>فلاتر المحتوى الذكي</CardTitle>
              <CardDescription>تحديد معايير اختيار المقالات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxAge">أقصى عمر للمقال (بالساعات)</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.filters.maxAge}
                  onChange={(e) => setSettings({
                    ...settings,
                    filters: {...settings.filters, maxAge: parseInt(e.target.value) || 48}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minImportanceScore">الحد الأدنى لنقاط الأهمية (الصباح)</Label>
                <Input
                  id="minImportanceScore"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.filters.minImportanceScore}
                  onChange={(e) => setSettings({
                    ...settings,
                    filters: {...settings.filters, minImportanceScore: parseInt(e.target.value) || 6}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRelevanceScore">الحد الأدنى لنقاط الصلة (الظهيرة)</Label>
                <Input
                  id="minRelevanceScore"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.filters.minRelevanceScore}
                  onChange={(e) => setSettings({
                    ...settings,
                    filters: {...settings.filters, minRelevanceScore: parseInt(e.target.value) || 5}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minEngagementScore">الحد الأدنى لنقاط التفاعل (المساء)</Label>
                <Input
                  id="minEngagementScore"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.filters.minEngagementScore}
                  onChange={(e) => setSettings({
                    ...settings,
                    filters: {...settings.filters, minEngagementScore: parseInt(e.target.value) || 5}
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تخصيص النصوص */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تخصيص النصوص</CardTitle>
              <CardDescription>تعديل العناوين والنصوص الفرعية حسب الوقت</CardDescription>
            </CardHeader>
            <CardContent>
              {/* اختيار الفترة للمعاينة */}
              <div className="flex items-center gap-2 mb-6">
                <Button
                  variant={previewMode === 'morning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('morning')}
                >
                  <Sun className="w-4 h-4 ml-2" />
                  صباح
                </Button>
                <Button
                  variant={previewMode === 'afternoon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('afternoon')}
                >
                  <Cloud className="w-4 h-4 ml-2" />
                  ظهر
                </Button>
                <Button
                  variant={previewMode === 'evening' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('evening')}
                >
                  <Moon className="w-4 h-4 ml-2" />
                  مساء
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان الرئيسي</Label>
                  <Input
                    value={settings.titles[previewMode]}
                    onChange={(e) => setSettings({
                      ...settings,
                      titles: {...settings.titles, [previewMode]: e.target.value}
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>النص الفرعي</Label>
                  <Textarea
                    rows={2}
                    value={settings.subtitles[previewMode]}
                    onChange={(e) => setSettings({
                      ...settings,
                      subtitles: {...settings.subtitles, [previewMode]: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معاينة مباشرة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                معاينة البلوك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-6 rounded-xl border-2 ${
                settings.enabled 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {getPreviewIcon()}
                    <h3 className="text-xl font-bold">{settings.titles[previewMode]}</h3>
                  </div>
                  <p className="text-gray-600">{settings.subtitles[previewMode]}</p>
                </div>
                
                {/* معاينة البطاقات */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="h-20 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* رسائل الحالة */}
              <div className="mt-4 space-y-2">
                {settings.enabled ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    البلوك مفعل وسيظهر في الصفحة الرئيسية
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    البلوك معطل ولن يظهر في الصفحة الرئيسية
                  </div>
                )}
                
                {settings.autoRefresh && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <RefreshCw className="w-4 h-4" />
                    سيتم تحديث المحتوى كل {settings.refreshInterval} دقيقة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between mt-8 pt-8 border-t">
        <Button variant="outline" onClick={resetToDefaults}>
          استعادة الإعدادات الافتراضية
        </Button>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            إلغاء
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 