"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalEvents: { current: number; previous: number; growth: number };
    uniqueUsers: { current: number; previous: number; growth: number };
    totalSessions: { current: number; previous: number; growth: number };
    pageViews: { current: number; previous: number; growth: number };
    avgReadingTime: { current: number; previous: number; growth: number };
  };
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    events: number;
    totalViews: number;
  }>;
  eventsByType: Array<{
    type: string;
    current: number;
    previous: number;
    growth: number;
  }>;
  sessions: {
    total: number;
    bounceRate: number;
    avgDuration: number;
    avgPagesPerSession: number;
    topDevices: Array<{ device: string; count: number }>;
    topBrowsers: Array<{ browser: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
  };
  content: {
    totalContent: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    avgTimeOnPage: number;
    topPerforming: Array<{
      contentId: string;
      contentType: string;
      title: string;
      views: number;
      likes: number;
      shares: number;
      performanceScore: number;
    }>;
  };
  realtime: {
    activeUsers: number;
    recentEvents: Array<{ name: string; value: number }>;
    timestamp: string;
  };
}

interface RealtimeData {
  timestamp: string;
  timeRange: string;
  data: {
    activeUsers?: number;
    pageViews?: number;
    events?: Array<{ event_type: string; _count: { event_type: number } }>;
    topPages?: Array<{ url: string; views: number }>;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // جلب البيانات الأساسية
  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  // جلب البيانات المباشرة كل 30 ثانية
  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?period=${period}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: ['activeUsers', 'pageViews', 'events', 'topPages'],
          timeRange: '15min'
        })
      });
      const result = await response.json();
      setRealtimeData(result);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}س ${minutes}د`;
    if (minutes > 0) return `${minutes}د ${secs}ث`;
    return `${secs}ث`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">لا توجد بيانات متاحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحليلات</h1>
        <div className="flex space-x-2">
          {['1d', '7d', '30d', '90d'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '1d' && 'يوم'}
              {p === '7d' && 'أسبوع'}
              {p === '30d' && 'شهر'}
              {p === '90d' && '3 شهور'}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'content', label: 'المحتوى' },
            { id: 'users', label: 'المستخدمون' },
            { id: 'realtime', label: 'مباشر' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي الأحداث</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.totalEvents.current)}
              </div>
              <div className={`text-sm ${getGrowthColor(data.overview.totalEvents.growth)}`}>
                {getGrowthIcon(data.overview.totalEvents.growth)} {data.overview.totalEvents.growth}%
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-500">المستخدمون الفريدون</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.uniqueUsers.current)}
              </div>
              <div className={`text-sm ${getGrowthColor(data.overview.uniqueUsers.growth)}`}>
                {getGrowthIcon(data.overview.uniqueUsers.growth)} {data.overview.uniqueUsers.growth}%
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي الجلسات</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.totalSessions.current)}
              </div>
              <div className={`text-sm ${getGrowthColor(data.overview.totalSessions.growth)}`}>
                {getGrowthIcon(data.overview.totalSessions.growth)} {data.overview.totalSessions.growth}%
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-500">مشاهدات الصفحات</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.overview.pageViews.current)}
              </div>
              <div className={`text-sm ${getGrowthColor(data.overview.pageViews.growth)}`}>
                {getGrowthIcon(data.overview.pageViews.growth)} {data.overview.pageViews.growth}%
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-500">متوسط وقت القراءة</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(data.overview.avgReadingTime.current)}
              </div>
              <div className={`text-sm ${getGrowthColor(data.overview.avgReadingTime.growth)}`}>
                {getGrowthIcon(data.overview.avgReadingTime.growth)} {data.overview.avgReadingTime.growth}%
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events by Type */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">الأحداث حسب النوع</h3>
              <div className="space-y-3">
                {data.eventsByType.slice(0, 8).map((event) => (
                  <div key={event.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        {event.type === 'page_view' && 'مشاهدة صفحة'}
                        {event.type === 'scroll' && 'تمرير'}
                        {event.type === 'click' && 'نقرة'}
                        {event.type === 'reading_time' && 'وقت قراءة'}
                        {event.type === 'like' && 'إعجاب'}
                        {event.type === 'share' && 'مشاركة'}
                        {event.type === 'comment' && 'تعليق'}
                        {!['page_view', 'scroll', 'click', 'reading_time', 'like', 'share', 'comment'].includes(event.type) && event.type}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(event.current)}
                      </div>
                      <div className={`text-xs ${getGrowthColor(event.growth)}`}>
                        {getGrowthIcon(event.growth)} {event.growth}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Session Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">إحصائيات الجلسات</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">معدل الارتداد</span>
                  <span className="text-sm font-medium">{data.sessions.bounceRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">متوسط مدة الجلسة</span>
                  <span className="text-sm font-medium">{formatTime(data.sessions.avgDuration)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">الصفحات لكل جلسة</span>
                  <span className="text-sm font-medium">{data.sessions.avgPagesPerSession}</span>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">أهم الأجهزة</h4>
                  <div className="space-y-2">
                    {data.sessions.topDevices.map((device, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{device.device}</span>
                        <span className="text-sm font-medium">{device.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {selectedTab === 'content' && (
        <div className="space-y-6">
          {/* Content Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي المحتوى</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.content.totalContent)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي المشاهدات</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.content.totalViews)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي الإعجابات</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.content.totalLikes)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500">إجمالي المشاركات</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.content.totalShares)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500">متوسط الوقت في الصفحة</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(data.content.avgTimeOnPage)}
              </div>
            </Card>
          </div>

          {/* Top Articles */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">أهم المقالات</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-2 text-sm font-medium text-gray-500">العنوان</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">الأحداث</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">إجمالي المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topArticles.map((article, index) => (
                    <tr key={article.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {article.title}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {formatNumber(article.events)}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {formatNumber(article.totalViews)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Realtime Tab */}
      {selectedTab === 'realtime' && (
        <div className="space-y-6">
          {/* Realtime Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500">المستخدمون النشطون</div>
              <div className="text-2xl font-bold text-gray-900">
                {realtimeData?.data.activeUsers || data.realtime.activeUsers}
              </div>
              <div className="text-xs text-gray-400">آخر 15 دقيقة</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-500">مشاهدات الصفحات</div>
              <div className="text-2xl font-bold text-gray-900">
                {realtimeData?.data.pageViews || 0}
              </div>
              <div className="text-xs text-gray-400">آخر 15 دقيقة</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-500">الأحداث الأخيرة</div>
              <div className="text-2xl font-bold text-gray-900">
                {data.realtime.recentEvents.reduce((sum, event) => sum + event.value, 0)}
              </div>
              <div className="text-xs text-gray-400">آخر 15 دقيقة</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-500">آخر تحديث</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(realtimeData?.timestamp || data.realtime.timestamp).toLocaleTimeString('ar-SA')}
              </div>
              <div className="text-xs text-gray-400">الوقت المحلي</div>
            </Card>
          </div>

          {/* Recent Events */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">الأحداث الأخيرة</h3>
            <div className="space-y-3">
              {data.realtime.recentEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    {event.name.replace('_count', '').replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatNumber(event.value)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Pages */}
          {realtimeData?.data.topPages && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">أهم الصفحات (مباشر)</h3>
              <div className="space-y-3">
                {realtimeData.data.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {page.url}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(page.views)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 