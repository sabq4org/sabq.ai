'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, Users, Settings, Award, TrendingUp, 
  Download, Plus, Filter, Search, ChevronRight,
  Loader2, Check
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

export default function EnhancedDashboardExample() {
  const { darkMode } = useDarkModeContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    // محاكاة عملية التصدير
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            لوحة التحكم المحسّنة
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            مثال على التنسيقات الجديدة الموحدة
          </p>
        </div>
        
        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                تصدير التقرير
              </>
            )}
          </Button>
          
          <Button
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            إضافة جديد
          </Button>
        </div>
      </div>

      {/* فاصل */}
      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* التابات المحسّنة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 rounded-xl p-1 ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <TabsTrigger 
            value="overview" 
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          
          <TabsTrigger 
            value="users"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            المستخدمون
          </TabsTrigger>
          
          <TabsTrigger 
            value="rewards"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
          >
            <Award className="mr-2 h-4 w-4" />
            المكافآت
          </TabsTrigger>
          
          <TabsTrigger 
            value="settings"
            className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
          >
            <Settings className="mr-2 h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* محتوى التابات */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <Users className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center mt-1`}>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +12% من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">النقاط الممنوحة</CardTitle>
                <Award className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,678</div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center mt-1`}>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +8% من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">معدل التفاعل</CardTitle>
                <BarChart3 className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center mt-1`}>
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +5% من الشهر الماضي
                </p>
              </CardContent>
            </Card>
          </div>

          {/* جدول أو محتوى إضافي */}
          <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>النشاطات الأخيرة</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className={`flex items-center justify-between p-4 rounded-xl ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                      }`}>
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          مستخدم جديد انضم للمنصة
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          منذ 5 دقائق
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>عرض وإدارة جميع المستخدمين المسجلين</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                محتوى قسم المستخدمين...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle>برنامج المكافآت</CardTitle>
              <CardDescription>إدارة النقاط والمكافآت</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                محتوى قسم المكافآت...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle>الإعدادات</CardTitle>
              <CardDescription>إعدادات النظام والتكوين</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                محتوى قسم الإعدادات...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* أمثلة على الأزرار */}
      <Card className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardHeader>
          <CardTitle>أمثلة على الأزرار المحسّنة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              زر أساسي
            </Button>
            <Button variant="secondary" className="rounded-xl">
              زر ثانوي
            </Button>
            <Button variant="outline" className="rounded-xl">
              زر محدد
            </Button>
            <Button variant="ghost" className="rounded-xl">
              زر شفاف
            </Button>
            <Button variant="destructive" className="rounded-xl">
              زر حذف
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              زر صغير
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              زر عادي
            </Button>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              زر كبير
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button disabled className="rounded-xl">
              زر معطل
            </Button>
            <Button className="rounded-xl">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري التحميل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 