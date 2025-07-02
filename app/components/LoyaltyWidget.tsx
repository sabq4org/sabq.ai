'use client';

import React, { useState, useEffect } from 'react';

interface LoyaltyData {
  user_id: number;
  total_points: number;
  current_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  level_progress: {
    current_level: string;
    points_to_next: number;
    progress_percentage: number;
  };
  points_history: Array<{
    id: number;
    action: string;
    points: number;
    description: string;
    created_at: string;
  }>;
}

interface LoyaltyWidgetProps {
  userId: number;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

const LoyaltyWidget: React.FC<LoyaltyWidgetProps> = ({ 
  userId, 
  showHistory = false, 
  compact = false,
  className = '' 
}) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const levelConfig = {
    Bronze: { 
      color: '#CD7F32', 
      bgClass: 'bg-gradient-to-r from-amber-600 to-orange-600',
      textColor: 'text-white',
      icon: '🥉',
      nextLevel: 'Silver'
    },
    Silver: { 
      color: '#C0C0C0', 
      bgClass: 'bg-gradient-to-r from-gray-400 to-gray-600',
      textColor: 'text-black',
      icon: '🥈',
      nextLevel: 'Gold'
    },
    Gold: { 
      color: '#FFD700', 
      bgClass: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      textColor: 'text-black',
      icon: '🥇',
      nextLevel: 'Platinum'
    },
    Platinum: { 
      color: '#E5E4E2', 
      bgClass: 'bg-gradient-to-r from-gray-200 to-gray-400',
      textColor: 'text-black',
      icon: '💎',
      nextLevel: null
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchLoyaltyData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loyalty/register?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الولاء');
      }
      
      const data = await response.json();
      setLoyaltyData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ دقائق';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${compact ? 'h-16' : 'h-32'} bg-gray-200 rounded-lg ${className}`}></div>
    );
  }

  if (error || !loyaltyData) {
    return (
      <div className={`bg-red-100 border border-red-300 rounded-lg p-4 ${className}`}>
        <p className="text-red-700 text-sm">خطأ في جلب نقاط الولاء</p>
        <button 
          onClick={fetchLoyaltyData}
          className="text-red-600 underline text-xs mt-1"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const levelInfo = levelConfig[loyaltyData.current_level];
  const progressPercentage = loyaltyData.level_progress.progress_percentage;

  if (compact) {
    return (
      <div 
        className={`${levelInfo.bgClass} rounded-full px-4 py-2 flex items-center gap-2 shadow-md hover:scale-105 transition-transform ${className}`}
      >
        <span className="text-lg">{levelInfo.icon}</span>
        <div className={`text-sm font-bold ${levelInfo.textColor}`}>
          <span>{loyaltyData.current_level}</span>
          <span className="mx-1">•</span>
          <span>{loyaltyData.total_points} نقطة</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`${levelInfo.bgClass} p-4 text-center`}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">{levelInfo.icon}</span>
          <div>
            <h3 className={`font-bold text-lg ${levelInfo.textColor}`}>
              مستوى {loyaltyData.current_level}
            </h3>
            <p className={`text-sm opacity-90 ${levelInfo.textColor}`}>
              {loyaltyData.total_points} نقطة
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {levelInfo.nextLevel && (
        <div className="p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              التقدم إلى {levelInfo.nextLevel}
            </span>
            <span className="text-sm font-medium text-gray-800">
              {loyaltyData.level_progress.points_to_next} نقطة متبقية
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${levelInfo.bgClass} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {progressPercentage.toFixed(1)}% مكتمل
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-blue-500 text-white text-sm py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
          <button
            onClick={fetchLoyaltyData}
            className="bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span>
              آخر الأنشطة
            </h4>
            
            {loyaltyData.points_history.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {loyaltyData.points_history.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex justify-between items-center bg-white p-2 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {activity.description}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-green-600 font-bold">
                        +{activity.points}
                      </span>
                      <p className="text-xs text-gray-500">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                لا توجد أنشطة حديثة
              </p>
            )}
            
            {/* القواعد الأساسية */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">كيفية كسب النقاط:</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• قراءة مقال: 2 نقطة</div>
                <div>• قراءة طويلة: 3 نقاط</div>
                <div>• مشاركة مقال: 5 نقاط</div>
                <div>• إعجاب: 1 نقطة</div>
                <div>• تعليق: 4 نقاط</div>
                <div>• 5 مقالات متتالية: 10 نقاط</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component منفصل لشارة النقاط البسيطة
export const LoyaltyBadge: React.FC<{ userId: number; onClick?: () => void }> = ({ 
  userId, 
  onClick 
}) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/loyalty/register?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setLoyaltyData(data);
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الشارة:', error);
      }
    };

    fetchData();
  }, [userId]);

  if (!loyaltyData) return null;

  const levelConfig = {
    Bronze: { color: '#CD7F32', icon: '🥉' },
    Silver: { color: '#C0C0C0', icon: '🥈' },
    Gold: { color: '#FFD700', icon: '🥇' },
    Platinum: { color: '#E5E4E2', icon: '💎' }
  };

  const config = levelConfig[loyaltyData.current_level];

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer shadow-sm hover:scale-105 transition-transform"
      style={{ 
        backgroundColor: config.color,
        color: loyaltyData.current_level === 'Silver' || loyaltyData.current_level === 'Platinum' ? '#000' : '#fff'
      }}
      onClick={onClick}
    >
      <span>{config.icon}</span>
      <span>{loyaltyData.total_points}</span>
    </div>
  );
};

export default LoyaltyWidget; 