"use client";

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TrendData {
  date: string;
  sessions: number;
  avgDuration: number;
  pageViews: number;
  bounceRate: number;
  uniqueUsers: number;
}

interface TrendsChartProps {
  period?: number;
  metric?: 'sessions' | 'duration' | 'pageViews' | 'bounceRate' | 'users';
}

export default function TrendsChart({ period = 30, metric = 'sessions' }: TrendsChartProps) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    fetchTrendsData();
  }, [selectedPeriod]);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      
      // محاكاة البيانات - في التطبيق الحقيقي، ستأتي من API
      const mockData: TrendData[] = [];
      const now = new Date();
      
      for (let i = selectedPeriod - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          sessions: Math.floor(Math.random() * 1000) + 500,
          avgDuration: Math.floor(Math.random() * 300) + 120,
          pageViews: Math.floor(Math.random() * 5000) + 2000,
          bounceRate: Math.floor(Math.random() * 30) + 25,
          uniqueUsers: Math.floor(Math.random() * 800) + 400
        });
      }
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (item: TrendData): number => {
    switch (selectedMetric) {
      case 'sessions': return item.sessions;
      case 'duration': return item.avgDuration;
      case 'pageViews': return item.pageViews;
      case 'bounceRate': return item.bounceRate;
      case 'users': return item.uniqueUsers;
      default: return item.sessions;
    }
  };

  const getMetricLabel = (): string => {
    switch (selectedMetric) {
      case 'sessions': return 'الجلسات';
      case 'duration': return 'متوسط المدة (ثانية)';
      case 'pageViews': return 'مشاهدات الصفحات';
      case 'bounceRate': return 'معدل الارتداد (%)';
      case 'users': return 'المستخدمون الفريدون';
      default: return 'الجلسات';
    }
  };

  const formatValue = (value: number): string => {
    if (selectedMetric === 'duration') {
      return `${Math.round(value / 60)} دقيقة`;
    }
    if (selectedMetric === 'bounceRate') {
      return `${value}%`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateTrend = (): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = data.slice(-7); // آخر 7 أيام
    const previous = data.slice(-14, -7); // 7 أيام قبلها
    
    if (recent.length === 0 || previous.length === 0) return { direction: 'stable', percentage: 0 };
    
    const recentAvg = recent.reduce((sum, item) => sum + getMetricValue(item), 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + getMetricValue(item), 0) / previous.length;
    
    const percentage = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;
    
    if (percentage > 5) return { direction: 'up', percentage };
    if (percentage < -5) return { direction: 'down', percentage: Math.abs(percentage) };
    return { direction: 'stable', percentage: 0 };
  };

  const trend = calculateTrend();

  const maxValue = Math.max(...data.map(getMetricValue));
  const minValue = Math.min(...data.map(getMetricValue));
  const range = maxValue - minValue;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">الاتجاهات الزمنية</h2>
          <p className="text-sm text-gray-600">
            تحليل الاتجاهات خلال آخر {selectedPeriod} يوم
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

      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'sessions', label: 'الجلسات' },
          { key: 'duration', label: 'متوسط المدة' },
          { key: 'pageViews', label: 'مشاهدات الصفحات' },
          { key: 'bounceRate', label: 'معدل الارتداد' },
          { key: 'users', label: 'المستخدمون الفريدون' }
        ].map(metricOption => (
          <Button
            key={metricOption.key}
            variant={selectedMetric === metricOption.key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric(metricOption.key as any)}
          >
            {metricOption.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{getMetricLabel()}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend.direction === 'up' && '↗️'}
              {trend.direction === 'down' && '↘️'}
              {trend.direction === 'stable' && '➡️'}
              {trend.percentage > 0 && `${trend.percentage}%`}
            </span>
          </div>
        </div>
        
        <div className="relative h-64">
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Grid Lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="800"
                y2={i * 40}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Chart Line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 800;
                const y = 200 - ((getMetricValue(item) - minValue) / range) * 200;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Data Points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 800;
              const y = 200 - ((getMetricValue(item) - minValue) / range) * 200;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                  className="hover:r-5 cursor-pointer"
                  title={`${formatDate(item.date)}: ${formatValue(getMetricValue(item))}`}
                />
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((item, index) => (
            <span key={index}>{formatDate(item.date)}</span>
          ))}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">الحد الأقصى</div>
          <div className="text-xl font-bold text-gray-900">
            {formatValue(maxValue)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">الحد الأدنى</div>
          <div className="text-xl font-bold text-gray-900">
            {formatValue(minValue)}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">المتوسط</div>
          <div className="text-xl font-bold text-gray-900">
            {formatValue(Math.round(data.reduce((sum, item) => sum + getMetricValue(item), 0) / data.length))}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-500">الاتجاه</div>
          <div className={`text-xl font-bold ${
            trend.direction === 'up' ? 'text-green-600' : 
            trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend.direction === 'up' && 'صاعد'}
            {trend.direction === 'down' && 'هابط'}
            {trend.direction === 'stable' && 'مستقر'}
          </div>
        </Card>
      </div>

      {/* Recent Data Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">البيانات الأخيرة</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-2 text-sm font-medium text-gray-500">التاريخ</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">الجلسات</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">متوسط المدة</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">مشاهدات الصفحات</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">معدل الارتداد</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(-7).reverse().map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">{formatDate(item.date)}</td>
                  <td className="py-2 text-sm text-gray-600">{item.sessions.toLocaleString()}</td>
                  <td className="py-2 text-sm text-gray-600">{Math.round(item.avgDuration / 60)} دقيقة</td>
                  <td className="py-2 text-sm text-gray-600">{item.pageViews.toLocaleString()}</td>
                  <td className="py-2 text-sm text-gray-600">{item.bounceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 