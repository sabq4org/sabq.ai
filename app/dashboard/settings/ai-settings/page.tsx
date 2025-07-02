'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Key, 
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube,
  Settings,
  Edit3,
  BarChart3,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISettings {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  features: {
    aiEditor: boolean;
    analytics: boolean;
    notifications: boolean;
  };
}

export default function AISettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AISettings>({
    openai: {
      apiKey: '',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7
    },
    features: {
      aiEditor: true,
      analytics: true,
      notifications: true
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // تحميل الإعدادات
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('sabq-ai-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('sabq-ai-settings', JSON.stringify(settings));
      
      // إرسال إلى API لتحديث متغيرات البيئة
      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "نجح",
          description: "تم حفظ إعدادات الذكاء الاصطناعي بنجاح",
          variant: "default"
        });
      } else {
        toast({
          title: "تحذير",
          description: "تم الحفظ محلياً - تأكد من إعداد API",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "خطأ في حفظ الإعدادات",
        variant: "destructive"
      });
      console.error('خطأ في حفظ الإعدادات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAI = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/ai/smart-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_title',
          content: 'اختبار الاتصال بـ OpenAI'
        })
      });

      const data = await response.json();
      
      if (data.result && !data.mock) {
        toast({
          title: "نجح",
          description: "✅ تم الاتصال بـ OpenAI بنجاح",
          variant: "default"
        });
      } else if (data.mock) {
        toast({
          title: "تحذير",
          description: "⚠️ يتم استخدام النصوص التجريبية - تأكد من إضافة مفتاح OpenAI",
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ",
          description: "❌ فشل في الاتصال بـ OpenAI",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "❌ خطأ في اختبار الاتصال",
        variant: "destructive"
      });
      console.error('خطأ في اختبار OpenAI:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const updateSetting = (section: keyof AISettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* العنوان الرئيسي */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات الذكاء الاصطناعي</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              تكوين OpenAI API والمحرر الذكي
            </p>
          </div>
          <Button 
            onClick={saveSettings} 
            disabled={isLoading} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <div className="p-1 rounded-full bg-green-50 text-green-700">
              <Save className="w-5 h-5" />
            </div>
            {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* إعدادات OpenAI */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-blue-50 text-blue-700">
                  <Brain className="w-5 h-5" />
                </div>
                إعدادات OpenAI
              </CardTitle>
              <CardDescription>
                تكوين OpenAI API للمحرر الذكي والخدمات الأخرى
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* مفتاح API */}
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-yellow-50 text-yellow-700">
                    <Key className="w-4 h-4" />
                  </div>
                  مفتاح API
                </Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.openai.apiKey}
                    onChange={(e) => updateSetting('openai', 'apiKey', e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <div className="p-1 rounded-full bg-red-50 text-red-700">
                        <EyeOff className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-green-50 text-green-700">
                        <Eye className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* اختبار الاتصال */}
              <Button 
                onClick={testOpenAI} 
                disabled={isTesting} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <div className="p-1 rounded-full bg-purple-50 text-purple-700">
                  <TestTube className="w-4 h-4" />
                </div>
                {isTesting ? 'جاري الاختبار...' : 'اختبار الاتصال'}
              </Button>
            </CardContent>
          </Card>

          {/* إعدادات المميزات */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-green-50 text-green-700">
                  <Settings className="w-5 h-5" />
                </div>
                إعدادات المميزات
              </CardTitle>
              <CardDescription>
                تفعيل وتعطيل المميزات المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* المحرر الذكي */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-3">
                  <div className="p-1 rounded-full bg-orange-50 text-orange-700">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base">المحرر الذكي</Label>
                    <p className="text-sm text-gray-500">
                      تفعيل المحرر الذكي المدعوم بالذكاء الاصطناعي
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.features.aiEditor}
                  onCheckedChange={(checked) => updateSetting('features', 'aiEditor', checked)}
                />
              </div>

              <Separator />

              {/* التحليلات */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-3">
                  <div className="p-1 rounded-full bg-blue-50 text-blue-700">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base">التحليلات</Label>
                    <p className="text-sm text-gray-500">
                      تفعيل نظام التحليلات والإحصائيات
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.features.analytics}
                  onCheckedChange={(checked) => updateSetting('features', 'analytics', checked)}
                />
              </div>

              <Separator />

              {/* الإشعارات */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-3">
                  <div className="p-1 rounded-full bg-purple-50 text-purple-700">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base">الإشعارات</Label>
                    <p className="text-sm text-gray-500">
                      تفعيل نظام الإشعارات والتنبيهات
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.features.notifications}
                  onCheckedChange={(checked) => updateSetting('features', 'notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* حالة النظام */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-gray-50 text-gray-700">
                <CheckCircle className="w-5 h-5" />
              </div>
              حالة النظام
            </CardTitle>
            <CardDescription>
              نظرة عامة على حالة النظام والمميزات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">النظام</p>
                  <p className="text-sm text-green-600 dark:text-green-400">يعمل بشكل طبيعي</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">الذكاء الاصطناعي</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {settings.openai.apiKey ? 'مفعل' : 'غير مفعل'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">المميزات</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {Object.values(settings.features).filter(Boolean).length}/3 مفعلة
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 