"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface SessionDurationData {
  distribution: Array<{
    label: string;
    count: number;
    percentage: number;
    color: string;
    range: { min: number; max: number | null };
  }>;
  stats: {
    totalSessions: number;
    validDurations: number;
    averageDuration: number;
    medianDuration: number;
    minDuration: number;
    maxDuration: number;
    bounceRate: number;
  };
  deviceStats: Array<{
    device: string;
    count: number;
    avgDuration: number;
    avgPageViews: number;
    percentage: number;
  }>;
  browserStats: Array<{
    browser: string;
    count: number;
    percentage: number;
  }>;
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function SessionDurationChart() {
  const [data, setData] = useState<SessionDurationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedView, setSelectedView] = useState<'distribution' | 'devices' | 'browsers'>('distribution');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/session-duration?days=${selectedPeriod}&limit=10000`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching session duration data:', error);
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
          لا توجد بيانات متاحة لأعمار الجلسة
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">تحليل أعمار الجلسة</h2>
          <p className="text-sm text-gray-600">
            توزيع فترات الجلسات خلال آخر {selectedPeriod} يوم
          </p>
        </div>
        
        <div className="flex gap-2">
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

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">إجمالي الجلسات</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(data.stats.totalSessions)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">متوسط المدة</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(data.stats.averageDuration)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">الوسيط</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(data.stats.medianDuration)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">معدل الارتداد</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.stats.bounceRate}%
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'distribution', label: 'توزيع الأعمار' },
            { id: 'devices', label: 'حسب الجهاز' },
            { id: 'browsers', label: 'حسب المتصفح' }
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
        {/* Distribution Chart */}
        {selectedView === 'distribution' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">توزيع أعمار الجلسة</h3>
              <div className="space-y-4">
                {data.distribution.map((bucket, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: bucket.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">
                        {bucket.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {formatNumber(bucket.count)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {bucket.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Visual Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">المخطط الدائري</h3>
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      let cumulativePercentage = 0;
                      return data.distribution.map((bucket, index) => {
                        const percentage = bucket.percentage;
                        const startAngle = cumulativePercentage * 3.6;
                        const endAngle = (cumulativePercentage + percentage) * 3.6;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        const largeArc = percentage > 50 ? 1 : 0;
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        
                        cumulativePercentage += percentage;
                        
                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={bucket.color}
                            stroke="white"
                            strokeWidth="0.5"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Device Analysis */}
        {selectedView === 'devices' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">تحليل حسب الجهاز</h3>
              <div className="space-y-4">
                {data.deviceStats.slice(0, 8).map((device, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{device.device}</span>
                      <span className="text-sm text-gray-500">{device.percentage}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">الجلسات: </span>
                        <span className="font-medium">{formatNumber(device.count)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">متوسط المدة: </span>
                        <span className="font-medium">{formatDuration(device.avgDuration)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الصفحات: </span>
                        <span className="font-medium">{device.avgPageViews}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">مقارنة الأجهزة</h3>
              <div className="space-y-3">
                {data.deviceStats.slice(0, 5).map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{device.device}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {device.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Browser Analysis */}
        {selectedView === 'browsers' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">تحليل حسب المتصفح</h3>
              <div className="space-y-3">
                {data.browserStats.slice(0, 10).map((browser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{browser.browser}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{formatNumber(browser.count)}</span>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {browser.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">أهم المتصفحات</h3>
              <div className="space-y-3">
                {data.browserStats.slice(0, 5).map((browser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{browser.browser}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${browser.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {browser.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ملخص الإحصائيات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">أقل جلسة</div>
            <div className="text-lg font-bold text-gray-900">
              {formatDuration(data.stats.minDuration)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">أطول جلسة</div>
            <div className="text-lg font-bold text-gray-900">
              {formatDuration(data.stats.maxDuration)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">الجلسات الصحيحة</div>
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(data.stats.validDurations)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">فترة التحليل</div>
            <div className="text-lg font-bold text-gray-900">
              {data.period.days} يوم
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 