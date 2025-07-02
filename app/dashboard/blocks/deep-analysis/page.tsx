'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Brain, Save, Settings, Eye, EyeOff, 
  TrendingUp, Clock, Check
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import toast from 'react-hot-toast';

interface BlockSettings {
  enabled: boolean;
  displayCount: number;
  sortOrder: 'latest' | 'views' | 'manual';
  selectedInsights?: string[];
}

export default function DeepAnalysisBlockSettings() {
  const { darkMode } = useDarkMode();
  const [settings, setSettings] = useState<BlockSettings>({
    enabled: true,
    displayCount: 3,
    sortOrder: 'latest'
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // تحميل الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('deepAnalysisBlockSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // حفظ الإعدادات في localStorage
      localStorage.setItem('deepAnalysisBlockSettings', JSON.stringify(settings));
      
      // في الإنتاج، سيتم إرسال الإعدادات إلى API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const sortOptions = [
    { value: 'latest', label: 'الأحدث', icon: <Clock className="w-4 h-4" /> },
    { value: 'views', label: 'الأعلى مشاهدة', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'manual', label: 'المختار يدوياً', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان الصفحة */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إدارة بلوك التحليل العميق</h1>
        <p className={`text-sm sm:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>تحكم في إعدادات عرض التحليلات العميقة في الصفحة الرئيسية</p>
      </div>

      {/* البطاقة الرئيسية */}
      <Card className={`${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="p-6">
          {/* رأس البطاقة */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>بلوك التحليل العميق</h2>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>يعرض أحدث التحليلات العميقة أسفل الهيدر مباشرة</p>
            </div>
          </div>

          {/* الإعدادات */}
          <div className="space-y-6">
            {/* تفعيل/تعطيل البلوك */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                {settings.enabled ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <Label htmlFor="enabled" className="text-base font-medium cursor-pointer">
                    عرض البلوك في الواجهة
                  </Label>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {settings.enabled ? 'البلوك مفعل ويظهر للزوار' : 'البلوك معطل ولا يظهر للزوار'}
                  </p>
                </div>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              />
            </div>

            {/* عدد التحليلات */}
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <Label htmlFor="displayCount" className="text-base font-medium mb-3 block">
                عدد التحليلات المعروضة
              </Label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSettings({ ...settings, displayCount: count })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      settings.displayCount === count
                        ? darkMode
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-500 text-white'
                        : darkMode
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className={`text-sm mt-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                الافتراضي: 3 تحليلات
              </p>
            </div>

            {/* ترتيب العرض */}
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <Label className="text-base font-medium mb-3 block">
                ترتيب العرض
              </Label>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSettings({ ...settings, sortOrder: option.value as any })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      settings.sortOrder === option.value
                        ? darkMode
                          ? 'bg-purple-900/50 border-2 border-purple-500'
                          : 'bg-purple-50 border-2 border-purple-400'
                        : darkMode
                          ? 'bg-gray-600 hover:bg-gray-500 border-2 border-transparent'
                          : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${
                        settings.sortOrder === option.value
                          ? 'text-purple-500'
                          : darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    {settings.sortOrder === option.value && (
                      <Check className="w-5 h-5 text-purple-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* معاينة */}
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              darkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="text-center">
                <Eye className={`w-12 h-12 mx-auto mb-3 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  معاينة البلوك
                </h3>
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  شاهد كيف سيظهر البلوك في الصفحة الرئيسية
                </p>
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? 'إخفاء المعاينة' : 'عرض المعاينة'}
                </Button>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* معاينة مباشرة */}
      {previewMode && (
        <div className="mt-8">
          <h3 className={`text-xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            معاينة البلوك
          </h3>
          <div className={`rounded-lg border-2 ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <iframe
              src={`/?preview=deep-analysis&count=${settings.displayCount}&sort=${settings.sortOrder}`}
              className="w-full h-[600px] rounded-lg"
              title="معاينة بلوك التحليل العميق"
            />
          </div>
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`p-6 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className={`font-medium ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>التحليلات النشطة</h4>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>24</p>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>تحليل عميق منشور</p>
        </Card>

        <Card className={`p-6 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <h4 className={`font-medium ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>إجمالي المشاهدات</h4>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>45.2K</p>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>مشاهدة هذا الشهر</p>
        </Card>

        <Card className={`p-6 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <h4 className={`font-medium ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>معدل التفاعل</h4>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>78%</p>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>من الزوار يقرؤون التحليلات</p>
        </Card>
      </div>
    </div>
  );
} 