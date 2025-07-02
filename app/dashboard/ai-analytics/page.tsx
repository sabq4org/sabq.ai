'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Cpu, 
  Database,
  BarChart3,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Gauge,
  Server,
  Network,
  Bot,
  Lightbulb,
  ChartLine
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
  color: string;
}

interface AIModel {
  id: string;
  name: string;
  type: 'content_generation' | 'sentiment_analysis' | 'recommendation' | 'classification';
  accuracy: number;
  status: 'active' | 'training' | 'inactive';
  lastTrained: string;
  predictions: number;
  errors: number;
  responseTime: number;
  throughput: number;
  description: string;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  timestamp: string;
  actionable: boolean;
  impact: string;
}

interface PerformanceData {
  timestamp: string;
  accuracy: number;
  throughput: number;
  latency: number;
  errors: number;
}

export default function AIAnalyticsPage() {
  const { darkMode } = useDarkModeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  // بيانات تجريبية محسنة للعرض
  const mockMetrics: AIMetric[] = [
    {
      id: '1',
      name: 'نقاط البيانات المعالجة',
      value: 2456800,
      previousValue: 1984500,
      unit: 'نقطة',
      trend: 'up',
      change: 23.8,
      status: 'healthy',
      icon: <Database className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: '2',
      name: 'توقعات اليوم',
      value: 18470,
      previousValue: 19230,
      unit: 'توقع',
      trend: 'down',
      change: -4.0,
      status: 'warning',
      icon: <Target className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: '3',
      name: 'دقة النماذج',
      value: 94.2,
      previousValue: 92.8,
      unit: '%',
      trend: 'up',
      change: 1.5,
      status: 'healthy',
      icon: <Gauge className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: '4',
      name: 'أنماط مكتشفة',
      value: 1270,
      previousValue: 1190,
      unit: 'نمط',
      trend: 'up',
      change: 6.7,
      status: 'healthy',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: '5',
      name: 'وقت المعالجة',
      value: 1.8,
      previousValue: 2.8,
      unit: 'ثانية',
      trend: 'up',
      change: -35.7,
      status: 'healthy',
      icon: <Clock className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: '6',
      name: 'معدل النجاح',
      value: 98.5,
      previousValue: 97.2,
      unit: '%',
      trend: 'up',
      change: 1.3,
      status: 'healthy',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-lime-500'
    },
    {
      id: '7',
      name: 'طلبات API',
      value: 45670,
      previousValue: 38920,
      unit: 'طلب',
      trend: 'up',
      change: 17.3,
      status: 'healthy',
      icon: <Network className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: '8',
      name: 'استهلاك الموارد',
      value: 72.4,
      previousValue: 68.1,
      unit: '%',
      trend: 'up',
      change: 6.3,
      status: 'warning',
      icon: <Server className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const mockModels: AIModel[] = [
    {
      id: '1',
      name: 'محرك توليد المحتوى المتقدم GPT-4',
      type: 'content_generation',
      accuracy: 96.8,
      status: 'active',
      lastTrained: '2024-01-20',
      predictions: 154200,
      errors: 23,
      responseTime: 1.2,
      throughput: 2400,
      description: 'نموذج متقدم لتوليد المحتوى الإبداعي والمقالات الصحفية'
    },
    {
      id: '2',
      name: 'محلل المشاعر الذكي BERT',
      type: 'sentiment_analysis',
      accuracy: 94.5,
      status: 'active',
      lastTrained: '2024-01-18',
      predictions: 89300,
      errors: 45,
      responseTime: 0.8,
      throughput: 3200,
      description: 'تحليل مشاعر القراء وردود أفعالهم على المحتوى'
    },
    {
      id: '3',
      name: 'نظام التوصيات الشخصية',
      type: 'recommendation',
      accuracy: 92.1,
      status: 'training',
      lastTrained: '2024-01-15',
      predictions: 123400,
      errors: 67,
      responseTime: 2.1,
      throughput: 1800,
      description: 'توصيات محتوى مخصصة بناءً على سلوك المستخدم'
    },
    {
      id: '4',
      name: 'مصنف المحتوى التلقائي',
      type: 'classification',
      accuracy: 89.7,
      status: 'active',
      lastTrained: '2024-01-22',
      predictions: 67800,
      errors: 89,
      responseTime: 0.6,
      throughput: 4100,
      description: 'تصنيف تلقائي للمقالات والمحتوى حسب الفئات'
    },
    {
      id: '5',
      name: 'كاشف الاتجاهات',
      type: 'sentiment_analysis',
      accuracy: 91.3,
      status: 'active',
      lastTrained: '2024-01-19',
      predictions: 45600,
      errors: 34,
      responseTime: 1.5,
      throughput: 2800,
      description: 'تحليل الاتجاهات والتوقعات في المحتوى'
    }
  ];

  const mockInsights: AIInsight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: '🚀 فرصة ذهبية للمحتوى الرياضي',
      description: 'رصدنا ارتفاعاً حاداً في الاهتمام بالمحتوى الرياضي بنسبة 156%. الآن هو الوقت المثالي لنشر محتوى رياضي عالي الجودة.',
      priority: 'high',
      confidence: 94.5,
      timestamp: 'منذ 12 دقيقة',
      actionable: true,
      impact: 'زيادة متوقعة في المشاهدات بـ 45%'
    },
    {
      id: '2',
      type: 'warning',
      title: '⚠️ انخفاض في جودة العناوين',
      description: 'لاحظنا انخفاضاً في فعالية العناوين بنسبة 23% هذا الأسبوع. ننصح بمراجعة استراتيجية كتابة العناوين.',
      priority: 'medium',
      confidence: 87.2,
      timestamp: 'منذ ساعة',
      actionable: true,
      impact: 'تحسن محتمل في معدل النقر بـ 18%'
    },
    {
      id: '3',
      type: 'recommendation',
      title: '⏰ أفضل وقت للنشر اليوم',
      description: 'بناءً على تحليل سلوك المستخدمين، الساعة 8:30 مساءً هي الوقت الأمثل لنشر المحتوى اليوم.',
      priority: 'high',
      confidence: 91.8,
      timestamp: 'منذ 3 ساعات',
      actionable: true,
      impact: 'زيادة في التفاعل بـ 32%'
    },
    {
      id: '4',
      type: 'trend',
      title: '📈 اتجاه صاعد: التكنولوجيا المالية',
      description: 'نلاحظ اهتماماً متزايداً بمواضيع التكنولوجيا المالية والعملات الرقمية. زيادة 78% في البحث عن هذه المواضيع.',
      priority: 'medium',
      confidence: 85.4,
      timestamp: 'منذ 6 ساعات',
      actionable: false,
      impact: 'فرصة لزيادة الجمهور المستهدف'
    },
    {
      id: '5',
      type: 'warning',
      title: 'ارتفاع في زمن الاستجابة',
      description: 'زمن استجابة نموذج التوصيات ارتفع إلى 2.1 ثانية. قد يؤثر على تجربة المستخدم.',
      priority: 'high',
      confidence: 96.1,
      timestamp: 'منذ 30 دقيقة',
      actionable: true,
      impact: 'تحسن في سرعة التحميل بـ 40%'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // محاكاة تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMetrics(mockMetrics);
      setModels(mockModels);
      setInsights(mockInsights);
      setLoading(false);
    };

    fetchData();
  }, [timeRange, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'content_generation': return <FileText className="w-5 h-5" />;
      case 'sentiment_analysis': return <Activity className="w-5 h-5" />;
      case 'recommendation': return <Target className="w-5 h-5" />;
      case 'classification': return <BarChart3 className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Target className="w-6 h-6 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'opportunity': return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'trend': return <BarChart3 className="w-6 h-6 text-purple-500" />;
      default: return <Brain className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
            <Brain className="w-8 h-8 text-blue-500 absolute top-6 left-6" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            🤖 جارٍ تحميل تحليلات الذكاء الاصطناعي
          </h2>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            نقوم بمعالجة البيانات وتحليل الأنماط...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 min-h-screen' : 'bg-gray-50 min-h-screen'
    }`} dir="rtl">
      {/* الرأس المحسن مع تصميم متطور */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`relative p-4 rounded-2xl shadow-xl ${
              darkMode 
                ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600' 
                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500'
            }`}>
              <Brain className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            </div>
            
            <div>
              <h1 className={`text-4xl font-bold mb-1 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                🤖 تحليلات الذكاء الاصطناعي
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    النظام نشط
                  </span>
                </div>
                <div className="w-1 h-4 bg-gray-300 rounded-full"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  آخر تحديث: منذ دقيقتين
                </span>
              </div>
              <p className={`text-lg mt-2 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                📊 رؤى متقدمة وتحليلات ذكية لأداء النماذج والمحتوى
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Download className="w-4 h-4" />
              تصدير
            </Button>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <option value="1h">⏰ آخر ساعة</option>
              <option value="1d">📅 آخر يوم</option>
              <option value="7d">📊 آخر أسبوع</option>
              <option value="30d">📈 آخر شهر</option>
              <option value="90d">📉 آخر 3 أشهر</option>
            </select>
          </div>
        </div>
      </div>

      {/* المقاييس الرئيسية المحسنة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.id} className={`transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                  <div className="text-white">
                    {metric.icon}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(metric.status)}`}>
                  {metric.status === 'healthy' ? '✅ صحي' : 
                   metric.status === 'warning' ? '⚠️ تحذير' : '🚨 حرج'}
                </div>
              </div>
              
              <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {metric.name}
              </h3>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <span className={`text-3xl font-bold transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {metric.value.toLocaleString()}
                  </span>
                  <span className={`text-sm mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {metric.unit}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : metric.trend === 'down' ? (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-400 rounded-full" />
                  )}
                  <span className={`text-sm font-bold ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* التابات المحسنة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`h-auto p-1.5 rounded-2xl shadow-sm w-full transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/90 backdrop-blur-sm border border-gray-100'
        }`}>
          <div className="grid grid-cols-3 gap-2">
            <TabsTrigger 
              value="overview" 
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 data-[state=inactive]:hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=inactive]:hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger 
              value="models" 
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 data-[state=inactive]:hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=inactive]:hover:bg-gray-50'
              }`}
            >
              <Bot className="w-4 h-4" />
              النماذج النشطة
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 data-[state=inactive]:hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 data-[state=inactive]:hover:bg-gray-50'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              الرؤى الذكية
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* إحصائيات شاملة */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <ChartLine className="w-5 h-5" />
                  📈 أداء النماذج اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>دقة التوقعات</span>
                    <span className="font-bold text-green-600">94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>سرعة المعالجة</span>
                    <span className="font-bold text-blue-600">1.8s</span>
                  </div>
                  <Progress value={82} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>معدل النجاح</span>
                    <span className="font-bold text-purple-600">98.5%</span>
                  </div>
                  <Progress value={98.5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Activity className="w-5 h-5" />
                  🔄 النشاط الحالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-medium">توليد محتوى نشط</span>
                    </div>
                    <span className="text-green-600 font-bold">12 مهمة</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-800 font-medium">تحليل مشاعر</span>
                    </div>
                    <span className="text-blue-600 font-bold">8 مهمة</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-purple-800 font-medium">توصيات شخصية</span>
                    </div>
                    <span className="text-purple-600 font-bold">5 مهام</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id} className={`transition-all duration-300 hover:shadow-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        model.status === 'active' ? 'bg-green-100 text-green-600' :
                        model.status === 'training' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getModelTypeIcon(model.type)}
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {model.name}
                        </CardTitle>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {model.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                      {model.status === 'active' ? '🟢 نشط' : 
                       model.status === 'training' ? '🟡 تدريب' : '🔴 غير نشط'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{model.accuracy}%</div>
                      <div className="text-sm text-blue-800">الدقة</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{model.predictions.toLocaleString()}</div>
                      <div className="text-sm text-green-800">التوقعات</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{model.responseTime}s</div>
                      <div className="text-sm text-purple-800">زمن الاستجابة</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{model.throughput}/h</div>
                      <div className="text-sm text-orange-800">المعدل</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`transition-all duration-300 hover:shadow-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {insight.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={insight.priority === 'high' ? 'destructive' : 
                                        insight.priority === 'medium' ? 'default' : 'secondary'}>
                            {insight.priority === 'high' ? '🔴 عالي' : 
                             insight.priority === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
                          </Badge>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {insight.timestamp}
                          </span>
                        </div>
                      </div>
                      <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">الثقة:</span>
                            <span className="text-sm font-bold text-blue-600">{insight.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">التأثير:</span>
                            <span className="text-sm text-green-600">{insight.impact}</span>
                          </div>
                        </div>
                        {insight.actionable && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            اتخاذ إجراء
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 