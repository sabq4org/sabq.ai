"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import RecommendationFeed from './RecommendationFeed';

interface MultiRecommendationFeedsProps {
  userId?: string;
  sessionId?: string;
  showTabs?: boolean;
  defaultTab?: string;
}

const FEED_TYPES = [
  {
    key: 'personal',
    label: 'لك خصيصاً',
    description: 'توصيات شخصية بناءً على اهتماماتك',
    icon: '👤',
    algorithm: 'personal'
  },
  {
    key: 'collaborative',
    label: 'مستخدمون مشابهون',
    description: 'ما يحبه المستخدمون المشابهون لك',
    icon: '👥',
    algorithm: 'collaborative'
  },
  {
    key: 'trending',
    label: 'الأكثر شعبية',
    description: 'المحتوى الأكثر تداولاً حالياً',
    icon: '🔥',
    algorithm: 'trending'
  },
  {
    key: 'graph',
    label: 'شبكة التفاعل',
    description: 'مقترحات عبر شبكة تفاعلات المستخدمين',
    icon: '🕸️',
    algorithm: 'graph'
  },
  {
    key: 'mixed',
    label: 'مختلط',
    description: 'مزيج من جميع الخوارزميات',
    icon: '🎯',
    algorithm: 'mixed'
  }
];

export default function MultiRecommendationFeeds({
  userId,
  sessionId,
  showTabs = true,
  defaultTab = 'personal'
}: MultiRecommendationFeedsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [feedData, setFeedData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // جلب بيانات التوصيات لكل نوع
  const fetchFeedData = async (feedType: string) => {
    try {
      setLoading(prev => ({ ...prev, [feedType]: true }));

      const params = new URLSearchParams({
        type: FEED_TYPES.find(f => f.key === feedType)?.algorithm || 'personal',
        limit: '6'
      });

      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);

      const response = await fetch(`/api/recommendations?${params}`);
      const data = await response.json();

      if (data.success) {
        setFeedData(prev => ({
          ...prev,
          [feedType]: data.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching ${feedType} recommendations:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [feedType]: false }));
    }
  };

  // جلب البيانات عند تغيير التبويب
  useEffect(() => {
    if (showTabs) {
      fetchFeedData(activeTab);
    } else {
      // جلب جميع الأنواع إذا لم تكن هناك تبويبات
      FEED_TYPES.forEach(feed => {
        fetchFeedData(feed.key);
      });
    }
  }, [activeTab, userId, sessionId, showTabs]);

  // عرض التبويبات
  const renderTabs = () => {
    if (!showTabs) return null;

    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {FEED_TYPES.map(feed => (
            <button
              key={feed.key}
              onClick={() => setActiveTab(feed.key)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === feed.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">{feed.icon}</span>
              <div className="text-right">
                <div className="font-medium">{feed.label}</div>
                <div className="text-xs opacity-75">{feed.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // عرض محتوى التبويب النشط
  const renderActiveTabContent = () => {
    if (!showTabs) return null;

    const activeFeed = FEED_TYPES.find(f => f.key === activeTab);
    if (!activeFeed) return null;

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeFeed.icon} {activeFeed.label}
          </h2>
          <p className="text-gray-600">{activeFeed.description}</p>
        </div>

        <RecommendationFeed
          userId={userId}
          sessionId={sessionId}
          limit={12}
          showAlgorithmSelector={false}
          showFilters={false}
        />
      </div>
    );
  };

  // عرض جميع التوصيات في شبكة
  const renderAllFeeds = () => {
    if (showTabs) return null;

    return (
      <div className="space-y-12">
        {FEED_TYPES.map(feed => (
          <section key={feed.key}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {feed.icon} {feed.label}
                </h2>
                <p className="text-gray-600">{feed.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFeedData(feed.key)}
                disabled={loading[feed.key]}
              >
                {loading[feed.key] ? 'جاري التحديث...' : 'تحديث'}
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-1">
              <RecommendationFeed
                userId={userId}
                sessionId={sessionId}
                limit={6}
                showAlgorithmSelector={false}
                showFilters={false}
              />
            </div>
          </section>
        ))}
      </div>
    );
  };

  // عرض إحصائيات سريعة
  const renderQuickStats = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Object.values(feedData).reduce((total, feed) => total + (feed?.recommendations?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">إجمالي التوصيات</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {FEED_TYPES.length}
          </div>
          <div className="text-sm text-gray-600">أنواع التوصيات</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {userId ? 'مسجل' : 'زائر'}
          </div>
          <div className="text-sm text-gray-600">نوع المستخدم</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(loading).filter(key => loading[key]).length}
          </div>
          <div className="text-sm text-gray-600">قيد التحديث</div>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          مركز التوصيات الذكية
        </h1>
        <p className="text-gray-600">
          اكتشف محتوى مخصص لك من خلال خوارزميات متقدمة
        </p>
      </div>

      {/* Quick Stats */}
      {renderQuickStats()}

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      {showTabs ? renderActiveTabContent() : renderAllFeeds()}

      {/* Help Section */}
      <Card className="mt-12 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          كيف تعمل التوصيات؟
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">👤 التوصيات الشخصية</h4>
            <p>تحليل اهتماماتك وسلوك القراءة لاقتراح محتوى مناسب لك</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">👥 المستخدمون المشابهون</h4>
            <p>العثور على مستخدمين بنفس اهتماماتك واقتراح ما يحبونه</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔥 الأكثر شعبية</h4>
            <p>المحتوى الأكثر مشاهدة وتفاعلاً من جميع المستخدمين</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🕸️ شبكة التفاعل</h4>
            <p>تحليل شبكة التفاعلات المعقدة لاكتشاف محتوى جديد</p>
          </div>
        </div>
      </Card>

      {/* Feedback Section */}
      <Card className="mt-6 p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          ساعدنا في تحسين التوصيات
        </h3>
        <p className="text-gray-600 mb-4">
          تفاعلك مع التوصيات (إعجاب، عدم اهتمام، نقر) يساعدنا في تحسين دقة التوصيات المستقبلية
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            👍 أعجبني - لرؤية محتوى مشابه
          </span>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            🚫 غير مهتم - لتجنب هذا النوع
          </span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            📤 مشاركة - لمحتوى قيم
          </span>
        </div>
      </Card>
    </div>
  );
} 