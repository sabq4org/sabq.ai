'use client';

import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'checking';
  message: string;
  timestamp: string;
  responseTime?: number;
}

export default function HealthCheckPage() {
  const [healthData, setHealthData] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    const startTime = Date.now();
    const services = [
      { name: 'Frontend', url: '/api/health', key: 'frontend' },
      { name: 'Backend API', url: '/api/articles', key: 'backend' },
      { name: 'Authentication', url: '/api/auth/login', key: 'auth', method: 'OPTIONS' },
      { name: 'Analytics', url: '/api/analytics/events', key: 'analytics', method: 'OPTIONS' },
    ];

    const results: HealthStatus[] = [];

    for (const service of services) {
      try {
        const serviceStartTime = Date.now();
        const response = await fetch(service.url, {
          method: service.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const responseTime = Date.now() - serviceStartTime;
        const isHealthy = response.status < 400;

        results.push({
          service: service.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          message: isHealthy 
            ? `✅ يعمل بشكل طبيعي` 
            : `❌ خطأ ${response.status}`,
          timestamp: new Date().toISOString(),
          responseTime,
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'unhealthy',
          message: `❌ فشل الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    setHealthData(results);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkHealth();
    // فحص دوري كل 30 ثانية
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      case 'checking': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatus = () => {
    if (loading) return 'checking';
    const unhealthy = healthData.filter(item => item.status === 'unhealthy');
    return unhealthy.length === 0 ? 'healthy' : 'unhealthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏥 فحص صحة نظام سبق الذكي
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            مراقبة مستمرة لحالة جميع خدمات النظام للتأكد من الأداء الأمثل
          </p>
        </div>

        {/* حالة النظام العامة */}
        <Card className={`mb-8 p-6 border-2 ${getStatusColor(overallStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className={`w-4 h-4 rounded-full ${
                overallStatus === 'healthy' ? 'bg-green-500' :
                overallStatus === 'unhealthy' ? 'bg-red-500' : 'bg-yellow-500'
              } animate-pulse`}></div>
              <div>
                <h2 className="text-xl font-semibold">
                  {overallStatus === 'healthy' ? '✅ النظام يعمل بصحة ممتازة' :
                   overallStatus === 'unhealthy' ? '❌ يوجد مشاكل في النظام' : 
                   '🔄 جاري الفحص...'}
                </h2>
                <p className="text-sm opacity-75">
                  آخر فحص: {lastCheck ? lastCheck.toLocaleString('ar-SA') : 'لم يتم الفحص بعد'}
                </p>
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 جاري الفحص...' : '🔄 فحص الآن'}
            </button>
          </div>
        </Card>

        {/* تفاصيل كل خدمة */}
        <div className="grid gap-6 md:grid-cols-2">
          {healthData.map((item, index) => (
            <Card key={index} className={`p-6 border ${getStatusColor(item.status)}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{item.service}</h3>
                  <p className="text-sm opacity-75">
                    {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'healthy' ? 'bg-green-100 text-green-800' :
                  item.status === 'unhealthy' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status === 'healthy' ? 'يعمل' :
                   item.status === 'unhealthy' ? 'معطل' : 'فحص'}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">{item.message}</p>
                {item.responseTime && (
                  <p className="text-xs opacity-75">
                    وقت الاستجابة: {item.responseTime}ms
                  </p>
                )}
              </div>

              {/* مؤشر بصري للأداء */}
              {item.responseTime && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>وقت الاستجابة</span>
                    <span>{item.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.responseTime < 100 ? 'bg-green-500' :
                        item.responseTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((item.responseTime / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* معلومات إضافية */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">📋 معلومات الفحص</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><strong>تكرار الفحص:</strong> كل 30 ثانية</p>
              <p><strong>نوع الفحص:</strong> HTTP Health Check</p>
            </div>
            <div>
              <p><strong>الخدمات المراقبة:</strong> {healthData.length}</p>
              <p><strong>الخدمات السليمة:</strong> {healthData.filter(h => h.status === 'healthy').length}</p>
            </div>
          </div>
        </Card>

        {/* أزرار إضافية */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex justify-center space-x-4 space-x-reverse">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔗 API Health Endpoint
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🏠 العودة للرئيسية
            </a>
          </div>
          
          <p className="text-gray-500 text-sm">
            للمطورين: يمكن الوصول لبيانات الفحص عبر <code className="bg-gray-100 px-2 py-1 rounded">/api/health</code>
          </p>
        </div>
      </div>
    </div>
  );
} 