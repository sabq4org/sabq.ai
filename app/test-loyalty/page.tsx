'use client';

import { useState } from 'react';
import { getMembershipLevel, getProgressToNextLevel, getPointsToNextLevel } from '@/lib/loyalty';

export default function TestLoyaltyPage() {
  const [points, setPoints] = useState(0);
  
  const testPoints = [0, 50, 100, 101, 250, 500, 501, 1000, 2000, 2001, 5000];
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">اختبار نظام الولاء الموحد</h1>
      
      {/* اختبار يدوي */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">اختبار يدوي</h2>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            className="px-4 py-2 border rounded"
            placeholder="أدخل عدد النقاط"
          />
          <span className="text-lg">نقطة</span>
        </div>
        
        {(() => {
          const level = getMembershipLevel(points);
          const progress = getProgressToNextLevel(points);
          const pointsToNext = getPointsToNextLevel(points);
          
          return (
            <div className="space-y-2">
              <p>المستوى: <strong className="text-xl" style={{ color: level.color }}>{level.icon} {level.name}</strong></p>
              <p>التقدم نحو المستوى التالي: <strong>{progress}%</strong></p>
              {pointsToNext && (
                <p>النقاط المتبقية للمستوى التالي: <strong>{pointsToNext} نقطة</strong></p>
              )}
              {!pointsToNext && (
                <p className="text-green-600 font-bold">🎉 وصلت لأعلى مستوى!</p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* جدول اختبار تلقائي */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50">اختبار تلقائي</h2>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-right">النقاط</th>
              <th className="px-4 py-2 text-right">المستوى</th>
              <th className="px-4 py-2 text-right">التقدم</th>
              <th className="px-4 py-2 text-right">نقاط للمستوى التالي</th>
            </tr>
          </thead>
          <tbody>
            {testPoints.map((p) => {
              const level = getMembershipLevel(p);
              const progress = getProgressToNextLevel(p);
              const pointsToNext = getPointsToNextLevel(p);
              
              return (
                <tr key={p} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{p}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: level.color }}>
                      {level.icon} {level.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">{progress}%</td>
                  <td className="px-4 py-3">
                    {pointsToNext ? `${pointsToNext} نقطة` : '✅ أعلى مستوى'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* ملخص المستويات */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">🥉</div>
          <h3 className="font-semibold text-orange-800">برونزي</h3>
          <p className="text-sm text-gray-600">0 - 100 نقطة</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">🥈</div>
          <h3 className="font-semibold text-gray-800">فضي</h3>
          <p className="text-sm text-gray-600">101 - 500 نقطة</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">🥇</div>
          <h3 className="font-semibold text-yellow-800">ذهبي</h3>
          <p className="text-sm text-gray-600">501 - 2000 نقطة</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl mb-2">👑</div>
          <h3 className="font-semibold text-purple-800">سفير</h3>
          <p className="text-sm text-gray-600">2001+ نقطة</p>
        </div>
      </div>
    </div>
  );
} 