'use client'

import { useState } from 'react'
import { User, Clock, FileText, Zap, TrendingUp } from 'lucide-react'

interface Editor {
  id: string
  name: string
  avatar?: string
  role: string
  stats: {
    articles: number
    avgTime: number
    aiUsage: number
    productivity: number
  }
  trend: 'up' | 'down' | 'stable'
}

export function EditorBehavior() {
  const [timeframe, setTimeframe] = useState('today')
  
  const editors: Editor[] = [
    {
      id: '1',
      name: 'أحمد السيد',
      role: 'محرر رئيسي',
      stats: {
        articles: 12,
        avgTime: 23,
        aiUsage: 87,
        productivity: 94
      },
      trend: 'up'
    },
    {
      id: '2',
      name: 'فاطمة العلي',
      role: 'محررة أخبار',
      stats: {
        articles: 8,
        avgTime: 31,
        aiUsage: 65,
        productivity: 78
      },
      trend: 'stable'
    },
    {
      id: '3',
      name: 'محمد الشمري',
      role: 'محرر رياضة',
      stats: {
        articles: 15,
        avgTime: 18,
        aiUsage: 92,
        productivity: 88
      },
      trend: 'up'
    },
    {
      id: '4',
      name: 'نورا القحطاني',
      role: 'محررة ثقافة',
      stats: {
        articles: 6,
        avgTime: 45,
        aiUsage: 43,
        productivity: 72
      },
      trend: 'down'
    }
  ]
  
  return (
    <div className="content-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">أداء فريق التحرير</h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="modern-input w-32 py-2"
        >
          <option value="today">اليوم</option>
          <option value="week">الأسبوع</option>
          <option value="month">الشهر</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {editors.map((editor) => (
          <div key={editor.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{editor.name}</h4>
                <p className="text-xs text-gray-500">{editor.role}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">المقالات</span>
                </div>
                <span className="text-sm font-medium">{editor.stats.articles}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">متوسط الوقت</span>
                </div>
                <span className="text-sm font-medium">{editor.stats.avgTime} د</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">استخدام AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${editor.stats.aiUsage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{editor.stats.aiUsage}%</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">الإنتاجية</span>
                  <div className="flex items-center gap-1">
                    {editor.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {editor.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                    <span className={`text-sm font-bold ${
                      editor.stats.productivity >= 80 ? 'text-green-600' : 
                      editor.stats.productivity >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {editor.stats.productivity}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 