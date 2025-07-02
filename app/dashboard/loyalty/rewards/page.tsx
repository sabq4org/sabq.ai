'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Plus, Edit, Trash2, Star, Crown } from 'lucide-react';

export default function RewardsPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const rewards = [
    {
      id: 'R001',
      name: 'كوبون خصم 20٪ من جرير',
      description: 'خصم 20٪ على جميع المنتجات في مكتبة جرير',
      points: 500,
      category: 'كوبونات',
      status: 'متاح',
      usedCount: 45
    },
    {
      id: 'R002',
      name: '50 ريال رصيد STC Pay',
      description: 'رصيد 50 ريال سعودي في محفظة STC Pay',
      points: 1000,
      category: 'رصيد',
      status: 'متاح',
      usedCount: 23
    },
    {
      id: 'R003',
      name: 'شارة سفير سبق الذهبية',
      description: 'شارة تميز تظهر بجانب اسمك في التعليقات',
      points: 2000,
      category: 'شارات',
      status: 'حصري',
      usedCount: 12
    }
  ];

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>إدارة المكافآت</h1>
          <p className={`transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>إدارة نظام المكافآت والجوائز لبرنامج الولاء</p>
        </div>
        
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
          <Plus className="w-4 h-4" />
          إضافة مكافأة
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <div key={reward.id} className={`rounded-2xl p-6 border transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                reward.category === 'كوبونات' ? 'bg-blue-100' :
                reward.category === 'رصيد' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {reward.category === 'شارات' ? (
                  <Crown className="w-6 h-6 text-purple-600" />
                ) : (
                  <Gift className={`w-6 h-6 ${
                    reward.category === 'كوبونات' ? 'text-blue-600' :
                    reward.category === 'رصيد' ? 'text-green-600' : 'text-purple-600'
                  }`} />
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                reward.status === 'متاح' ? 'bg-green-100 text-green-700' :
                reward.status === 'حصري' ? 'bg-purple-100 text-purple-700' :
                'bg-red-100 text-red-700'
              }`}>
                {reward.status}
              </span>
            </div>

            <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{reward.name}</h3>
            
            <p className={`text-sm mb-4 transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{reward.description}</p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className={`font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>{reward.points.toLocaleString()} نقطة</span>
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>استُخدم {reward.usedCount} مرة</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300">
                <Edit className="w-4 h-4" />
                تعديل
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 