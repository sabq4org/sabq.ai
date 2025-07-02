'use client';

import React, { useState, useEffect } from 'react';
import { Users, Target, Brain, BarChart3 } from 'lucide-react';

export default function PersonalizationPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    personalizationAccuracy: 0,
    aiModels: 0,
    improvementRate: 0
  });
  const [personalizationRules, setPersonalizationRules] = useState<any[]>([]);
  const [aiModels, setAIModels] = useState<any[]>([]);

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

        // جلب تفضيلات المستخدمين النشطة (إن وجدت)
        try {
          const prefsRes = await fetch('/api/user-preferences');
          if (prefsRes.ok) {
            const prefsData = await prefsRes.json();
            // حساب عدد المستخدمين النشطين من البيانات الحقيقية
            setStats(prev => ({ ...prev, activeUsers: 0 }));
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // جلب قواعد التخصيص (إن وجدت)
        try {
          const rulesRes = await fetch('/api/personalization-rules');
          if (rulesRes.ok) {
            const rulesData = await rulesRes.json();
            setPersonalizationRules(rulesData || []);
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // جلب نماذج الذكاء الاصطناعي (إن وجدت)
        try {
          const modelsRes = await fetch('/api/ai-models');
          if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            setAIModels(modelsData || []);
          }
        } catch (error) {
          // في حالة عدم وجود API
        }

        // تصفير جميع الإحصائيات
        setStats({
          activeUsers: 0,
          personalizationAccuracy: 0,
          aiModels: 0,
          improvementRate: 0
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
        }`}>التخصيص الذكي 🎯</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>إدارة أنظمة التخصيص وخوارزميات الذكاء الاصطناعي</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>المستخدمون النشطون</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>دقة التخصيص</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : `${stats.personalizationAccuracy}%`}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>نماذج AI نشطة</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : stats.aiModels}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>معدل التحسن</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{loading ? '...' : `${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate}%`}</p>
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
            }`}>🎯 قواعد التخصيص النشطة</h3>
            {personalizationRules.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد قواعد تخصيص مفعلة حالياً
              </p>
            ) : (
              <div className="space-y-4">
                {personalizationRules.map((rule, index) => (
                  <div key={index} className={`p-4 rounded-lg border transition-colors duration-300 ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium transition-colors duration-300 ${
                          darkMode ? 'text-white' : 'text-gray-800'
                        }`}>{rule.name}</p>
                        <p className={`text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>{rule.users || 0} مستخدم</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rule.status || 'متوقف'}
                      </span>
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
            }`}>🧠 نماذج الذكاء الاصطناعي</h3>
            {aiModels.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                لا توجد نماذج ذكاء اصطناعي مفعلة حالياً
              </p>
            ) : (
              <div className="space-y-4">
                {aiModels.map((model, index) => (
                  <div key={index} className={`p-4 rounded-lg border transition-colors duration-300 ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-medium transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>{model.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        model.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {model.status || 'متوقف'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>دقة النموذج</span>
                      <span className={`font-bold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>{model.accuracy || '0%'}</span>
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