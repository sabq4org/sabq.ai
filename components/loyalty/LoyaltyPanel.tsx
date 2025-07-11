'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface LoyaltyStats {
  total_points_earned: number;
  current_points: number;
  lifetime_points: number;
  current_level: string;
  badges_count: number;
  achievements_count: number;
  current_streak: number;
  longest_streak: number;
}

interface LoyaltyLevel {
  name: string;
  name_ar: string;
  min_points: number;
  max_points: number | null;
  color: string;
  icon: string;
}

interface UserBadge {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  icon: string;
  color: string;
  tier: string;
  category: string;
  awarded_at: string;
  is_featured: boolean;
}

interface RecentPoint {
  id: string;
  points: number;
  action_type: string;
  action_display: string;
  created_at: string;
  description?: string;
}

interface LoyaltyPanelProps {
  userId: string;
  className?: string;
}

export default function LoyaltyPanel({ userId, className = '' }: LoyaltyPanelProps) {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [currentLevel, setCurrentLevel] = useState<LoyaltyLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<LoyaltyLevel | null>(null);
  const [levelProgress, setLevelProgress] = useState<any>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [recentPoints, setRecentPoints] = useState<RecentPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'points'>('overview');

  useEffect(() => {
    fetchLoyaltyData();
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/loyalty`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات النقاط');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.stats);
        setCurrentLevel(data.data.currentLevel);
        setNextLevel(data.data.nextLevel);
        setLevelProgress(data.data.levelProgress);
        setBadges(data.data.badges);
        setRecentPoints(data.data.recentPoints);
      } else {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBadgesByCategory = () => {
    return badges.reduce((acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    }, {} as Record<string, UserBadge[]>);
  };

  const getCategoryName = (category: string) => {
    const categoryNames: Record<string, string> = {
      engagement: 'التفاعل',
      content: 'المحتوى',
      social: 'الاجتماعي',
      achievement: 'الإنجازات',
      special: 'خاص'
    };
    return categoryNames[category] || category;
  };

  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
      diamond: 'bg-blue-100 text-blue-800'
    };
    return tierColors[tier] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center p-8`}>
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={fetchLoyaltyData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* التبويبات */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'badges'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          الشارات ({badges.length})
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'points'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          النقاط الأخيرة
        </button>
      </div>

      {/* نظرة عامة */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.current_points?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">النقاط الحالية</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.lifetime_points?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">إجمالي النقاط</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.badges_count || 0}
                </div>
                <div className="text-sm text-gray-600">الشارات</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.current_streak || 0}
                </div>
                <div className="text-sm text-gray-600">السلسلة الحالية</div>
              </CardContent>
            </Card>
          </div>

          {/* المستوى الحالي */}
          {currentLevel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{currentLevel.icon}</span>
                  <span>المستوى: {currentLevel.name_ar}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextLevel && levelProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم نحو {nextLevel.name_ar}</span>
                      <span>{levelProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${levelProgress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {levelProgress.current.toLocaleString()} / {levelProgress.required.toLocaleString()} نقطة
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* الشارات المميزة */}
          {badges.filter(b => b.is_featured).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الشارات المميزة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.is_featured).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                      title={badge.description_ar}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="text-sm font-medium">{badge.name_ar}</span>
                      <Badge className={getTierColor(badge.tier)}>
                        {badge.tier}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* الشارات */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {Object.entries(getBadgesByCategory()).map(([category, categoryBadges]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{getCategoryName(category)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{badge.icon}</span>
                        <div>
                          <h3 className="font-medium">{badge.name_ar}</h3>
                          <Badge className={getTierColor(badge.tier)}>
                            {badge.tier}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {badge.description_ar}
                      </p>
                      <div className="text-xs text-gray-500">
                        حصلت عليها في {formatDate(badge.awarded_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {badges.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-medium mb-2">لا توجد شارات بعد</h3>
              <p className="text-gray-600">
                تفاعل مع المحتوى واكتب التعليقات لتحصل على شاراتك الأولى!
              </p>
            </div>
          )}
        </div>
      )}

      {/* النقاط الأخيرة */}
      {activeTab === 'points' && (
        <Card>
          <CardHeader>
            <CardTitle>النقاط الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPoints.map((point) => (
                <div
                  key={point.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      point.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {point.points > 0 ? '+' : ''}{point.points}
                    </div>
                    <div>
                      <div className="font-medium">{point.action_display}</div>
                      {point.description && (
                        <div className="text-sm text-gray-600">{point.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(point.created_at)}
                  </div>
                </div>
              ))}

              {recentPoints.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium mb-2">لا توجد نقاط بعد</h3>
                  <p className="text-gray-600">
                    ابدأ بالتفاعل مع المحتوى لتحصل على نقاطك الأولى!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 