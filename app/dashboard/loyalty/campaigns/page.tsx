'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus, Calendar, Users, TrendingUp, Play, Pause, Edit } from 'lucide-react';

export default function CampaignsPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const campaigns = [
    {
      id: 'C001',
      name: 'حملة العيد - نقاط مضاعفة',
      description: 'احصل على نقاط مضاعفة على قراءة الأخبار خلال إجازة العيد',
      type: 'bonus',
      startDate: '2024-06-15',
      endDate: '2024-06-25',
      multiplier: 2,
      participants: 1250,
      status: 'نشط',
      totalPoints: 45600
    },
    {
      id: 'C002',
      name: 'تحدي القراءة الأسبوعي',
      description: 'اقرأ 20 مقال في الأسبوع واحصل على 100 نقطة إضافية',
      type: 'challenge',
      startDate: '2024-06-10',
      endDate: '2024-06-17',
      target: 20,
      participants: 890,
      status: 'منتهي',
      totalPoints: 34500
    },
    {
      id: 'C003',
      name: 'اليوم الوطني - هديا خاصة',
      description: 'مكافآت حصرية للمستخدمين النشطين في اليوم الوطني',
      type: 'special',
      startDate: '2024-09-23',
      endDate: '2024-09-24',
      participants: 0,
      status: 'مجدول',
      totalPoints: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-700';
      case 'منتهي': return 'bg-gray-100 text-gray-700';
      case 'مجدول': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bonus': return TrendingUp;
      case 'challenge': return Target;
      case 'special': return Calendar;
      default: return Target;
    }
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>إدارة الحملات</h1>
          <p className={`transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>إنشاء وإدارة الحملات الترويجية وتحديات الولاء</p>
        </div>
        
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
          <Plus className="w-4 h-4" />
          حملة جديدة
        </button>
      </div>

      <div className="space-y-6">
        {campaigns.map((campaign) => {
          const Icon = getTypeIcon(campaign.type);
          return (
            <div key={campaign.id} className={`rounded-2xl p-6 border transition-colors duration-300 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    campaign.type === 'bonus' ? 'bg-green-100' :
                    campaign.type === 'challenge' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      campaign.type === 'bonus' ? 'text-green-600' :
                      campaign.type === 'challenge' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-bold transition-colors duration-300 ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}>{campaign.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-4 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{campaign.description}</p>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>تاريخ البداية</p>
                        <p className={`font-medium transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{new Date(campaign.startDate).toLocaleDateString('ar-SA')}</p>
                      </div>
                      
                      <div>
                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>تاريخ النهاية</p>
                        <p className={`font-medium transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{new Date(campaign.endDate).toLocaleDateString('ar-SA')}</p>
                      </div>
                      
                      <div>
                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>المشاركون</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-500" />
                          <p className={`font-medium transition-colors duration-300 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{campaign.participants.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className={`text-xs mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>النقاط الموزعة</p>
                        <p className={`font-medium transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>{campaign.totalPoints.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {campaign.status === 'نشط' && (
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
                      <Pause className="w-4 h-4" />
                      إيقاف
                    </button>
                  )}
                  
                  {campaign.status === 'مجدول' && (
                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
                      <Play className="w-4 h-4" />
                      تفعيل
                    </button>
                  )}
                  
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 