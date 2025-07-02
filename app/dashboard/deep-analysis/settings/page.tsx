'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  AlertCircle, 
  Brain,
  Key,
  FileText,
  Sparkles,
  RotateCcw,
  Zap
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import toast from 'react-hot-toast';

interface SettingsData {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customPrompt: string;
  enableAutoAnalysis: boolean;
  analysisDepth: 'basic' | 'intermediate' | 'advanced';
  includeReferences: boolean;
  includeStatistics: boolean;
  autoTranslate: boolean;
  language: 'ar' | 'en';
}

const defaultPrompt = `أنت محلل استراتيجي خبير في وكالة سبق الإخبارية. مهمتك هي إنشاء تحليل عميق وشامل باللغة العربية للموضوع المعطى.

يجب أن يتضمن التحليل الأقسام التالية:

1. **المقدمة** (150-200 كلمة):
   - نظرة عامة جذابة عن الموضوع
   - أهمية الموضوع في السياق الحالي
   - الأسئلة الرئيسية التي سيجيب عنها التحليل

2. **الوضع الراهن والسياق** (300-400 كلمة):
   - الخلفية التاريخية والتطورات الحديثة
   - العوامل المؤثرة والأطراف المعنية
   - البيانات والإحصائيات الحالية

3. **التحديات الرئيسية** (400-500 كلمة):
   - تحديد وتحليل 3-5 تحديات رئيسية
   - تأثير كل تحدي على المدى القصير والطويل
   - العقبات المحتملة وسيناريوهات المخاطر

4. **الفرص المستقبلية والابتكارات** (400-500 كلمة):
   - الفرص الناشئة والاتجاهات المستقبلية
   - التقنيات والحلول المبتكرة
   - أفضل الممارسات العالمية القابلة للتطبيق

5. **الأثر المتوقع** (300-400 كلمة):
   - التأثيرات الاقتصادية والاجتماعية
   - التغييرات المتوقعة في السلوك والممارسات
   - المؤشرات الرئيسية لقياس النجاح

6. **دراسات الحالة والأمثلة** (200-300 كلمة):
   - أمثلة محلية أو عالمية ذات صلة
   - الدروس المستفادة
   - قابلية التطبيق في السياق المحلي

7. **التوصيات الاستراتيجية** (400-500 كلمة):
   - 5-7 توصيات محددة وقابلة للتنفيذ
   - خطة العمل المقترحة مع الجدول الزمني
   - مؤشرات الأداء الرئيسية

8. **الخلاصة والنظرة المستقبلية** (150-200 كلمة):
   - ملخص النقاط الرئيسية
   - الرسالة الختامية
   - دعوة للعمل

متطلبات الأسلوب:
- استخدم لغة عربية فصحى واضحة ومهنية
- تجنب المصطلحات المعقدة غير الضرورية
- استخدم العناوين الفرعية والتنسيق لتحسين القراءة
- ادعم النقاط بالبيانات والمصادر عند الإمكان
- حافظ على التوازن بين العمق التحليلي وسهولة الفهم`;

export default function DeepAnalysisSettingsPage() {
  const { darkMode } = useDarkMode();
  const [settings, setSettings] = useState<SettingsData>({
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    customPrompt: defaultPrompt,
    enableAutoAnalysis: false,
    analysisDepth: 'advanced',
    includeReferences: true,
    includeStatistics: true,
    autoTranslate: false,
    language: 'ar'
  });
  
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState('prompt');

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('deepAnalysisSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          apiKey: parsed.apiKey || '',
          model: parsed.model || 'gpt-4',
          temperature: parsed.temperature || 0.7,
          maxTokens: parsed.maxTokens || 4000,
          customPrompt: parsed.customPrompt || defaultPrompt,
          enableAutoAnalysis: parsed.enableAutoAnalysis || false,
          analysisDepth: parsed.analysisDepth || 'advanced',
          includeReferences: parsed.includeReferences !== false,
          includeStatistics: parsed.includeStatistics !== false,
          autoTranslate: parsed.autoTranslate || false,
          language: parsed.language || 'ar'
        });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // حفظ الإعدادات في localStorage
      localStorage.setItem('deepAnalysisSettings', JSON.stringify(settings));
      
      // في الإنتاج، سيتم إرسال الإعدادات إلى API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.apiKey) {
      toast.error('الرجاء إدخال مفتاح API أولاً');
      return;
    }

    setTestingConnection(true);

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: settings.apiKey })
      });

      if (response.ok) {
        toast.success('تم الاتصال بنجاح مع OpenAI');
      } else {
        toast.error('فشل الاتصال. تأكد من صحة المفتاح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء اختبار الاتصال');
    } finally {
      setTestingConnection(false);
    }
  };

  const resetPrompt = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين البرومبت إلى الإعدادات الافتراضية؟')) {
      setSettings({ ...settings, customPrompt: defaultPrompt });
      toast.success('تم إعادة تعيين البرومبت');
    }
  };

  const tabsConfig = [
    { 
      id: 'prompt', 
      name: 'البرومبت', 
      icon: <FileText className="w-5 h-5" />
    },
    { 
      id: 'ai', 
      name: 'إعدادات AI', 
      icon: <Brain className="w-5 h-5" />
    },
    { 
      id: 'api', 
      name: 'API', 
      icon: <Key className="w-5 h-5" />
    },
    { 
      id: 'features', 
      name: 'المميزات', 
      icon: <Sparkles className="w-5 h-5" />
    }
  ];

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إعدادات التحليل العميق</h1>
        <p className={`text-sm sm:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>قم بتخصيص إعدادات الذكاء الاصطناعي والبرومبت المستخدم في توليد التحليلات</p>
      </div>

      {/* قسم المعلومات */}
      <div className="mb-6 sm:mb-8">
        <div className={`rounded-2xl p-4 sm:p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700' 
            : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>تكوين نظام التحليل الذكي</h2>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>اضبط معاملات الذكاء الاصطناعي للحصول على أفضل النتائج</p>
            </div>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`h-auto p-1.5 rounded-2xl shadow-sm w-full transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/90 backdrop-blur-sm border border-gray-100'
        }`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabsConfig.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`min-w-[100px] sm:min-w-[120px] lg:flex-1 flex flex-col items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 data-[state=inactive]:hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=inactive]:hover:bg-gray-50'
                }`}
              >
                {/* خط سفلي للتاب النشط */}
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-white/30 rounded-full opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300" />
                
                <div className="transition-transform duration-300 group-data-[state=active]:scale-110">
                  {React.cloneElement(tab.icon, { 
                    className: `w-4 h-4 sm:w-5 sm:h-5` 
                  })}
                </div>
                <div className="text-center">
                  <div className="whitespace-nowrap font-medium">
                    {tab.name}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </div>
        </TabsList>

        {/* محتوى التبويبات */}
        <div className="space-y-6 mt-6">
          {/* تبويب البرومبت */}
          <TabsContent value="prompt" className="mt-0">
          <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  تخصيص البرومبت
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetPrompt}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                    نص البرومبت المخصص
                  </Label>
                  <Textarea
                    id="prompt"
                    value={settings.customPrompt}
                    onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                    className={`min-h-[400px] font-mono text-sm ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-200'
                    }`}
                    dir="rtl"
                  />
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    هذا البرومبت سيستخدم عند توليد التحليلات بالذكاء الاصطناعي
                  </p>
                </div>
              </div>
            </div>
          </div>
          </TabsContent>

          {/* تبويب إعدادات AI */}
          <TabsContent value="ai" className="mt-0">
          <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                إعدادات نموذج الذكاء الاصطناعي
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="model" className="text-sm font-medium mb-2 block">
                    النموذج
                  </Label>
                  <select 
                    id="model"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-purple-500' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="temperature" className="text-sm font-medium mb-2 block">
                    درجة الإبداع (Temperature): {settings.temperature}
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature || 0.7}
                      onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className={`w-12 text-center font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {settings.temperature}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    قيمة أعلى = إبداع أكثر، قيمة أقل = دقة أكثر
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxTokens" className="text-sm font-medium mb-2 block">
                    الحد الأقصى للرموز
                  </Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={settings.maxTokens || 4000}
                    onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 4000 })}
                    className={darkMode ? 'bg-gray-700 border-gray-600' : ''}
                    min="1000"
                    max="8000"
                  />
                </div>

                <div>
                  <Label htmlFor="depth" className="text-sm font-medium mb-2 block">
                    عمق التحليل
                  </Label>
                  <select 
                    id="depth"
                    value={settings.analysisDepth}
                    onChange={(e) => setSettings({ ...settings, analysisDepth: e.target.value as 'basic' | 'intermediate' | 'advanced' })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-purple-500' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  >
                    <option value="basic">أساسي</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">متقدم</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          </TabsContent>

          {/* تبويب API */}
          <TabsContent value="api" className="mt-0">
          <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                إعدادات API
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="apiKey" className="text-sm font-medium mb-2 block">
                    مفتاح OpenAI API
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      value={settings.apiKey || ''}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className={`flex-1 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                    />
                    <Button
                      onClick={testConnection}
                      disabled={testingConnection}
                      className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300"
                      title="اختبار الاتصال مع OpenAI API"
                    >
                      {testingConnection ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          جاري الاختبار...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 ml-2" />
                          🧪 اختبار الاتصال
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Alert className={`${darkMode ? 'border-yellow-800 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>
                    احتفظ بمفتاح API الخاص بك بسرية تامة. لا تشاركه مع أي شخص.
                  </AlertDescription>
                </Alert>

                <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    كيفية الحصول على مفتاح API:
                  </h4>
                  <ol className={`list-decimal list-inside space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>قم بزيارة <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">platform.openai.com</a></li>
                    <li>قم بتسجيل الدخول أو إنشاء حساب جديد</li>
                    <li>اذهب إلى قسم API Keys</li>
                    <li>انقر على "Create new secret key"</li>
                    <li>انسخ المفتاح والصقه هنا</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          </TabsContent>

          {/* تبويب المميزات */}
          <TabsContent value="features" className="mt-0">
          <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                المميزات الإضافية
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div>
                    <Label htmlFor="autoAnalysis" className="text-sm font-medium">
                      التحليل التلقائي
                    </Label>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      تفعيل التحليل التلقائي للمقالات الجديدة
                    </p>
                  </div>
                  <Switch
                    id="autoAnalysis"
                    checked={settings.enableAutoAnalysis}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableAutoAnalysis: checked })}
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div>
                    <Label htmlFor="references" className="text-sm font-medium">
                      تضمين المراجع
                    </Label>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      إضافة مراجع ومصادر للتحليل
                    </p>
                  </div>
                  <Switch
                    id="references"
                    checked={settings.includeReferences}
                    onCheckedChange={(checked) => setSettings({ ...settings, includeReferences: checked })}
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div>
                    <Label htmlFor="statistics" className="text-sm font-medium">
                      تضمين الإحصائيات
                    </Label>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      إضافة رسوم بيانية وإحصائيات
                    </p>
                  </div>
                  <Switch
                    id="statistics"
                    checked={settings.includeStatistics}
                    onCheckedChange={(checked) => setSettings({ ...settings, includeStatistics: checked })}
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div>
                    <Label htmlFor="translate" className="text-sm font-medium">
                      الترجمة التلقائية
                    </Label>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ترجمة التحليلات تلقائياً
                    </p>
                  </div>
                  <Switch
                    id="translate"
                    checked={settings.autoTranslate}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoTranslate: checked })}
                  />
                </div>

                {settings.autoTranslate && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Label htmlFor="language" className="text-sm font-medium mb-2 block">
                      اللغة المستهدفة
                    </Label>
                    <select 
                      id="language"
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value as 'ar' | 'en' })}
                      className={`w-full md:w-[200px] px-3 py-2 text-sm rounded-lg border transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-gray-200 focus:border-purple-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* أزرار الإجراءات */}
      <div className="flex justify-end gap-3 mt-8">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className={darkMode ? 'border-gray-600 hover:bg-gray-700' : ''}
        >
          إلغاء
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          title="حفظ إعدادات التحليل العميق"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              🔬 حفظ إعدادات التحليل العميق
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 