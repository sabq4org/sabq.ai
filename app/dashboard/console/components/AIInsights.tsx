'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'

interface Insight {
  id: string
  type: 'recommendation' | 'trend' | 'warning' | 'opportunity'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export function AIInsights() {
  const [currentInsight, setCurrentInsight] = useState(0)
  
  const insights: Insight[] = [
    {
      id: '1',
      type: 'trend',
      title: 'ارتفاع الاهتمام بأخبار الرياضة',
      description: 'لاحظ AI زيادة 45% في قراءة الأخبار الرياضية خلال الساعتين الماضيتين',
      priority: 'high'
    },
    {
      id: '2',
      type: 'recommendation',
      title: 'فرصة لتحسين العناوين',
      description: 'يمكن زيادة نسبة النقر بـ 23% باستخدام كلمات مفتاحية أقوى',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'warning',
      title: 'انخفاض في جودة الصور',
      description: 'بعض المقالات تحتوي على صور بدقة منخفضة تؤثر على تجربة المستخدم',
      priority: 'low'
    },
    {
      id: '4',
      type: 'opportunity',
      title: 'وقت مثالي للنشر',
      description: 'الساعة القادمة هي الأفضل للوصول لأكبر عدد من القراء',
      priority: 'high'
    }
  ]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [insights.length])
  
  const getInsightIcon = (type: string) => {
    const icons = {
      recommendation: <Lightbulb className="w-5 h-5 text-yellow-500" />,
      trend: <TrendingUp className="w-5 h-5 text-green-500" />,
      warning: <AlertTriangle className="w-5 h-5 text-red-500" />,
      opportunity: <Sparkles className="w-5 h-5 text-purple-500" />
    }
    return icons[type as keyof typeof icons]
  }
  
  const getInsightColor = (type: string) => {
    const colors = {
      recommendation: 'bg-yellow-50 border-yellow-200',
      trend: 'bg-green-50 border-green-200',
      warning: 'bg-red-50 border-red-200',
      opportunity: 'bg-purple-50 border-purple-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200'
  }
  
  const insight = insights[currentInsight]
  
  return (
    <div className="content-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">🤖</span>
          رؤى الذكاء الاصطناعي
        </h3>
        <div className="flex gap-1">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentInsight(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentInsight ? 'bg-primary w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className={`p-4 rounded-xl border-2 ${getInsightColor(insight.type)} transition-all duration-500`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getInsightIcon(insight.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="btn-secondary text-sm">
          عرض التفاصيل
        </button>
        <button className="btn-primary text-sm">
          تطبيق الاقتراح
        </button>
      </div>
    </div>
  )
} 