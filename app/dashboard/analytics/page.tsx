'use client';

import React, { useState, useEffect } from 'react';
import { Database, Brain, TrendingUp, Target, Clock, Cpu } from 'lucide-react';

export default function AnalyticsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dataPoints: 0,
    todayPredictions: 0,
    modelsAccuracy: 0,
    discoveredPatterns: 0,
    processingTime: 0,
    activeModels: 0
  });
  const [insights, setInsights] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // جلب البيانات الحقيقية
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);

        // جلب إحصائيات التحليلات (إن وجدت)
        try {
          const statsRes = await fetch('/api/analytics-stats');
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats({
              dataPoints: statsData.dataPoints || 0,
              todayPredictions: statsData.todayPredictions || 0,
              modelsAccuracy: statsData.modelsAccuracy || 0,
              discoveredPatterns: statsData.discoveredPatterns || 0,
              processingTime: statsData.processingTime || 0,
              activeModels: statsData.activeModels || 0
            });
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // جلب الاكتشافات (إن وجدت)
        try {
          const insightsRes = await fetch('/api/ai-insights');
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json();
            setInsights(insightsData || []);
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // جلب أداء النماذج (إن وجدت)
        try {
          const modelsRes = await fetch('/api/model-performance');
          if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            setModelPerformance(modelsData || []);
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // تصفير جميع الإحصائيات إذا لم يكن هناك بيانات
        setStats({
          dataPoints: 0,
          todayPredictions: 0,
          modelsAccuracy: 0,
          discoveredPatterns: 0,
          processingTime: 0,
          activeModels: 0
        });

      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>تحليلات الذكاء الاصطناعي 🤖</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>رؤى متقدمة حول سلوك المستخدمين وتفضيلاتهم باستخدام الذكاء الاصطناعي</p>
      </div>

      <div className="grid grid-cols-6 gap-6 mb-8">
        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>نقاط البيانات</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.dataPoints}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>توقعات اليوم</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.todayPredictions}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>دقة النماذج</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : `${stats.modelsAccuracy}%`}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>أنماط مكتشفة</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.discoveredPatterns}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>وقت المعالجة</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : `${stats.processingTime}s`}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Cpu className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>نماذج نشطة</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.activeModels}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              جارٍ تحميل البيانات...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>📊 أهم الاكتشافات</h3>
            {insights.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد اكتشافات متاحة حالياً
              </p>
            ) : (
              <div className="space-y-4">
                {insights.map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>{item.insight}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${item.confidence || 0}%` }}
                        />
                      </div>
                      <span className={`text-xs transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{item.confidence || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>🎯 أداء النماذج</h3>
            {modelPerformance.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد نماذج نشطة حالياً
              </p>
            ) : (
              <div className="space-y-4">
                {modelPerformance.map((model, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{model.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        model.accuracy >= 92 ? 'bg-green-100 text-green-700' :
                        model.accuracy >= 88 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {model.status || 'متوقف'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          model.accuracy >= 92 ? 'bg-green-600' :
                          model.accuracy >= 88 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${model.accuracy || 0}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <span className={`text-xs transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{model.accuracy || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
