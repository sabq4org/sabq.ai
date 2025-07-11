"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface UserJourneysData {
  topJourneys: Array<{
    path: string;
    count: number;
    percentage: number;
    avgDuration: number;
    avgSteps: number;
    topDevice: string;
  }>;
  topEntryPoints: Array<{
    entry: string;
    count: number;
    percentage: number;
  }>;
  topExitPoints: Array<{
    exit: string;
    count: number;
    percentage: number;
  }>;
  lengthDistribution: Array<{
    length: number;
    count: number;
    percentage: number;
  }>;
  stats: {
    totalJourneys: number;
    totalSessions: number;
    avgJourneyLength: number;
    avgJourneyDuration: number;
    uniquePaths: number;
    mostCommonDevice: string;
    conversionEvents: number;
  };
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function UserJourneysChart() {
  const [data, setData] = useState<UserJourneysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedView, setSelectedView] = useState<'journeys' | 'entry' | 'exit' | 'length'>('journeys');
  const [minSteps, setMinSteps] = useState(2);
  const [maxSteps, setMaxSteps] = useState(10);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, minSteps, maxSteps]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/user-journeys?days=${selectedPeriod}&minSteps=${minSteps}&maxSteps=${maxSteps}&limit=5000`
      );
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching user journeys data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} ثانية`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
    return `${Math.round(seconds / 3600)} ساعة`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          لا توجد بيانات متاحة لمسارات المستخدم
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">تحليل مسارات المستخدم</h2>
          <p className="text-sm text-gray-600">
            أكثر المسارات شيوعاً خلال آخر {selectedPeriod} يوم
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days} يوم
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">الحد الأدنى للخطوات:</label>
            <select
              value={minSteps}
              onChange={(e) => setMinSteps(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">الحد الأقصى للخطوات:</label>
            <select
              value={maxSteps}
              onChange={(e) => setMaxSteps(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[5, 10, 15, 20].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">إجمالي المسارات</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data.stats.totalJourneys)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">متوسط طول المسار</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats.avgJourneyLength} خطوة
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">متوسط مدة المسار</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(data.stats.avgJourneyDuration)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">مسارات فريدة</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data.stats.uniquePaths)}
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'journeys', label: 'أهم المسارات' },
            { id: 'entry', label: 'نقاط الدخول' },
            { id: 'exit', label: 'نقاط الخروج' },
            { id: 'length', label: 'توزيع الأطوال' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Journeys */}
        {selectedView === 'journeys' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">أكثر المسارات شيوعاً</h3>
              <div className="space-y-4">
                {data.topJourneys.slice(0, 10).map((journey, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {journey.percentage}%
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatNumber(journey.count)} جلسة
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {journey.path}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                      <div>
                        <span>المدة: </span>
                        <span className="font-medium">{formatDuration(journey.avgDuration)}</span>
                      </div>
                      <div>
                        <span>الخطوات: </span>
                        <span className="font-medium">{journey.avgSteps}</span>
                      </div>
                      <div>
                        <span>الجهاز: </span>
                        <span className="font-medium">{journey.topDevice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">إحصائيات المسارات</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">إجمالي الجلسات</span>
                  <span className="text-sm font-medium">{formatNumber(data.stats.totalSessions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">الجلسات مع مسارات</span>
                  <span className="text-sm font-medium">{formatNumber(data.stats.totalJourneys)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">معدل التحويل</span>
                  <span className="text-sm font-medium">
                    {Math.round((data.stats.conversionEvents / data.stats.totalJourneys) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">الجهاز الأكثر شيوعاً</span>
                  <span className="text-sm font-medium">{data.stats.mostCommonDevice}</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Entry Points */}
        {selectedView === 'entry' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">أهم نقاط الدخول</h3>
              <div className="space-y-3">
                {data.topEntryPoints.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {entry.entry}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{formatNumber(entry.count)}</span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">تحليل نقاط الدخول</h3>
              <div className="space-y-3">
                {data.topEntryPoints.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {entry.entry}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${entry.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {entry.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Exit Points */}
        {selectedView === 'exit' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">أهم نقاط الخروج</h3>
              <div className="space-y-3">
                {data.topExitPoints.map((exit, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {exit.exit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{formatNumber(exit.count)}</span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {exit.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">تحليل نقاط الخروج</h3>
              <div className="space-y-3">
                {data.topExitPoints.slice(0, 5).map((exit, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {exit.exit}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${exit.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {exit.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Length Distribution */}
        {selectedView === 'length' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">توزيع أطوال المسارات</h3>
              <div className="space-y-3">
                {data.lengthDistribution.filter(l => l.count > 0).map((length, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                        {length.length} خطوة
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{formatNumber(length.count)}</span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {length.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">مخطط توزيع الأطوال</h3>
              <div className="space-y-3">
                {data.lengthDistribution.filter(l => l.count > 0).map((length, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 w-16">
                      {length.length} خطوة
                    </span>
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3 mx-4">
                        <div 
                          className="bg-purple-500 h-3 rounded-full"
                          style={{ width: `${length.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {length.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
} 