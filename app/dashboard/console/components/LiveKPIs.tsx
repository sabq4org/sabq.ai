'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface LiveKPIsProps {
  kpis: any[]
}

function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return value.toString();
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('ar-SA')
}

function mapApiKpiToComponentKpi(apiKpi: any) {
  // تحويل بيانات API إلى الشكل المتوقع في المكون
  const valueStr = apiKpi.value.toString();
  const numericValue = parseFloat(valueStr.replace(/[^\d.-]/g, '')) || 0;
  
  // استخراج نسبة التغيير من النص
  const changeMatch = apiKpi.change.match(/([+-]?\d+)%/);
  const changeValue = changeMatch ? parseInt(changeMatch[1]) : 0;
  
  // تحديد اتجاه التغيير
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (apiKpi.changeType === 'positive' || changeValue > 0) direction = 'up';
  else if (apiKpi.changeType === 'negative' || changeValue < 0) direction = 'down';
  
  return {
    label: apiKpi.title,
    value: numericValue || apiKpi.value,
    trend: { 
      value: Math.abs(changeValue), 
      direction 
    },
    icon: apiKpi.icon
  };
}

export function LiveKPIs({ kpis }: LiveKPIsProps) {
  const { data, refetch } = useQuery({
    queryKey: ['live-kpis'],
    queryFn: async () => {
      const response = await fetch('/api/console/live-kpis')
      if (!response.ok) throw new Error('Failed to fetch KPIs')
      const result = await response.json()
      // تحويل بيانات API إلى الشكل المتوقع
      return (result.kpis || []).map(mapApiKpiToComponentKpi)
    },
    refetchInterval: 30000,
    initialData: kpis
  })

  // شرط الحماية للتأكد من أن البيانات مصفوفة
  if (!Array.isArray(data)) {
    console.error('Expected data to be an array, but got:', data)
    return (
      <div className="dashboard-grid animate-fade-in">
        <div className="stat-card">
          <p className="text-sm text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid animate-fade-in">
      {data.map((kpi: any, index: number) => (
        <div key={index} className="stat-card group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatNumber(kpi.value)}
              </p>
              <div className="flex items-center gap-2">
                <TrendIndicator trend={kpi.trend} />
                <span className="text-xs text-gray-500">
                  مقارنة بالأمس
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-primary text-xl">
                {getKPIIcon(kpi.label)}
              </span>
            </div>
          </div>
          
          {kpi.subMetrics && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="space-y-2">
                {kpi.subMetrics.map((metric: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{metric.label}</span>
                    <span className="text-xs font-medium text-gray-700">
                      {formatNumber(metric.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TrendIndicator({ trend }: { trend: { value: number; direction: 'up' | 'down' | 'neutral' } }) {
  const { value, direction } = trend
  
  const colors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  }
  
  const icons = {
    up: <ArrowUp className="w-3 h-3" />,
    down: <ArrowDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />
  }
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[direction]}`}>
      {icons[direction]}
      <span>{value}%</span>
    </div>
  )
}

function getKPIIcon(label: string) {
  const icons: Record<string, string> = {
    'المقالات المنشورة': '📝',
    'مرات المشاهدة': '👁️',
    'التفاعلات': '💬',
    'المستخدمون النشطون': '👥',
    'معدل الارتداد': '📊',
    'متوسط وقت القراءة': '⏱️',
    'استعلامات AI': '🤖',
    'وقت الاستجابة': '⚡'
  }
  
  return icons[label] || '📊'
} 