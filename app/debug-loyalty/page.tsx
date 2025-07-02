'use client';

import { useState, useEffect } from 'react';
import { getMembershipLevel } from '@/lib/loyalty';

export default function DebugLoyaltyPage() {
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [loyaltyAPIData, setLoyaltyAPIData] = useState<any>(null);
  const [usersAPIData, setUsersAPIData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    // 1. بيانات localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setLocalStorageData(JSON.parse(userData));
    }

    // 2. بيانات API نقاط الولاء
    if (userData) {
      const user = JSON.parse(userData);
      try {
        const loyaltyResponse = await fetch(`/api/loyalty/points?user_id=${user.id}`);
        if (loyaltyResponse.ok) {
          const data = await loyaltyResponse.json();
          setLoyaltyAPIData(data);
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      }
    }

    // 3. بيانات API المستخدمين
    try {
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        const users = Array.isArray(data) ? data : data.users || [];
        const currentUser = users.find((u: any) => u.email === 'ali@alhazm.org');
        setUsersAPIData(currentUser);
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }

    setLoading(false);
  };

  const clearAndRefresh = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 تشخيص نظام الولاء</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* localStorage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">1️⃣ localStorage</h2>
          {localStorageData ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {localStorageData.id}</p>
              <p><strong>الاسم:</strong> {localStorageData.name}</p>
              <p><strong>البريد:</strong> {localStorageData.email}</p>
              <p><strong>النقاط:</strong> <span className="text-2xl font-bold text-amber-600">{localStorageData.loyaltyPoints || 0}</span></p>
              <p><strong>المستوى المحسوب:</strong> 
                <span className="font-bold" style={{ color: getMembershipLevel(localStorageData.loyaltyPoints || 0).color }}>
                  {getMembershipLevel(localStorageData.loyaltyPoints || 0).name}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">لا توجد بيانات</p>
          )}
        </div>

        {/* API نقاط الولاء */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-green-600">2️⃣ API نقاط الولاء</h2>
          {loyaltyAPIData ? (
            <div className="space-y-2">
              {(() => {
                const data = loyaltyAPIData.data || loyaltyAPIData;
                return (
                  <>
                    <p><strong>user_id:</strong> {data.user_id}</p>
                    <p><strong>النقاط:</strong> <span className="text-2xl font-bold text-amber-600">{data.total_points || 0}</span></p>
                    <p><strong>المستوى المحسوب:</strong> 
                      <span className="font-bold" style={{ color: getMembershipLevel(data.total_points || 0).color }}>
                        {getMembershipLevel(data.total_points || 0).name}
                      </span>
                    </p>
                    <p><strong>آخر تحديث:</strong> {data.last_updated ? new Date(data.last_updated).toLocaleString('ar-SA') : 'غير محدد'}</p>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500">لا توجد بيانات</p>
          )}
        </div>

        {/* API المستخدمين */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">3️⃣ API المستخدمين</h2>
          {usersAPIData ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {usersAPIData.id}</p>
              <p><strong>الاسم:</strong> {usersAPIData.name}</p>
              <p><strong>البريد:</strong> {usersAPIData.email}</p>
              <p><strong>النقاط:</strong> <span className="text-2xl font-bold text-amber-600">{usersAPIData.loyaltyPoints || 0}</span></p>
              <p><strong>المستوى المحسوب:</strong> 
                <span className="font-bold" style={{ color: getMembershipLevel(usersAPIData.loyaltyPoints || 0).color }}>
                  {getMembershipLevel(usersAPIData.loyaltyPoints || 0).name}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* الملخص */}
      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">📊 الملخص</h3>
        
        <div className="space-y-3">
          {/* التحقق من التطابق */}
          {(() => {
            const localPoints = localStorageData?.loyaltyPoints || 0;
            const loyaltyData = loyaltyAPIData?.data || loyaltyAPIData;
            const loyaltyPoints = loyaltyData?.total_points || 0;
            const usersPoints = usersAPIData?.loyaltyPoints || 0;
            
            const allMatch = localPoints === loyaltyPoints && loyaltyPoints === usersPoints;
            
            return (
              <>
                <div className={`p-3 rounded ${allMatch ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="font-semibold">
                    {allMatch ? '✅ جميع المصادر متطابقة!' : '❌ يوجد عدم تطابق في البيانات!'}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>localStorage: {localPoints} نقطة → {getMembershipLevel(localPoints).name}</li>
                    <li>API نقاط الولاء: {loyaltyPoints} نقطة → {getMembershipLevel(loyaltyPoints).name}</li>
                    <li>API المستخدمين: {usersPoints} نقطة → {getMembershipLevel(usersPoints).name}</li>
                  </ul>
                </div>
                
                {!allMatch && (
                  <div className="mt-4">
                    <button
                      onClick={clearAndRefresh}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🔄 مسح البيانات المحلية وإعادة تسجيل الدخول
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">💡 معلومات مفيدة</h3>
        <ul className="space-y-2 text-sm">
          <li>• صفحة الملف الشخصي تستخدم: <code className="bg-gray-200 px-2 py-1 rounded">loyaltyData?.total_points || user.loyaltyPoints</code></li>
          <li>• لوحة التحكم تستخدم: <code className="bg-gray-200 px-2 py-1 rounded">user.loyaltyPoints</code></li>
          <li>• UserDropdown يستخدم: <code className="bg-gray-200 px-2 py-1 rounded">API نقاط الولاء</code></li>
          <li>• المستويات: برونزي (0-100)، فضي (101-500)، ذهبي (501-2000)، سفير (2001+)</li>
        </ul>
      </div>
    </div>
  );
} 