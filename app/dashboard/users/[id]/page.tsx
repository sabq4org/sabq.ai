'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Mail, Phone, MapPin, Calendar, Eye, MessageSquare, 
  Heart, Award, Edit, Ban, UserCheck, Monitor, 
  Smartphone
} from 'lucide-react';

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const user = {
    id: id,
    name: 'أحمد محمد الأحمد',
    email: 'ahmed@example.com',
    phone: '+966501234567',
    country: 'السعودية',
    city: 'الرياض',
    isVerified: true,
    status: 'active',
    role: 'vip',
    joinedAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-06-15T14:20:00Z',
    readCount: 450,
    commentsCount: 23,
    likesCount: 156,
    loyaltyPoints: 2850
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8">
        <Link 
          href="/dashboard/users"
          className={`inline-flex items-center gap-2 text-sm transition-colors duration-300 hover:underline ${
            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة المستخدمين
        </Link>
      </div>

      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold text-xl">أح</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>{user.name}</h1>
                <UserCheck className="w-6 h-6 text-green-500" />
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">نشط</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">VIP</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{user.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{user.city}, {user.country}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>انضم في {new Date(user.joinedAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
              <Edit className="w-4 h-4" />
              تعديل
            </button>
            
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300">
              <Ban className="w-4 h-4" />
              حظر
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className={`rounded-xl p-4 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>المقالات المقروءة</p>
              <p className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{user.readCount}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>التعليقات</p>
              <p className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{user.commentsCount}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>الإعجابات</p>
              <p className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{user.likesCount}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>نقاط الولاء</p>
              <p className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>{user.loyaltyPoints}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>🏷️ الاهتمامات</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">التكنولوجيا</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">الاقتصاد</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">الرياضة</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">السفر</span>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>🔐 آخر عمليات الدخول</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-gray-400" />
              <span className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>iPhone 15 Pro - الرياض</span>
            </div>
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-gray-400" />
              <span className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>MacBook Pro - الرياض</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}