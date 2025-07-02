'use client'

import { useState } from 'react'
import { Eye, MessageCircle, Clock, TrendingUp } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  author: string
  category: string
  publishedAt: string
  views: number
  comments: number
  readTime: number
  aiScore: number
  trend: 'up' | 'down' | 'neutral'
}

export function ContentMonitor() {
  const [filter, setFilter] = useState('all')
  
  // Mock data
  const content: ContentItem[] = [
    {
      id: '1',
      title: 'تطورات جديدة في مشروع نيوم',
      author: 'أحمد السيد',
      category: 'اقتصاد',
      publishedAt: 'قبل 10 دقائق',
      views: 1234,
      comments: 45,
      readTime: 3,
      aiScore: 92,
      trend: 'up'
    },
    {
      id: '2',
      title: 'نتائج مباراة الهلال والنصر',
      author: 'محمد الشمري',
      category: 'رياضة',
      publishedAt: 'قبل 25 دقيقة',
      views: 5678,
      comments: 123,
      readTime: 2,
      aiScore: 88,
      trend: 'up'
    },
    {
      id: '3',
      title: 'انطلاق موسم الرياض 2024',
      author: 'فاطمة العلي',
      category: 'ثقافة',
      publishedAt: 'قبل ساعة',
      views: 890,
      comments: 12,
      readTime: 4,
      aiScore: 75,
      trend: 'neutral'
    }
  ]
  
  return (
    <div className="content-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">مراقبة المحتوى</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('trending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'trending' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الأكثر تداولاً
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-xl">
        <table className="modern-table">
          <thead>
            <tr>
              <th>المقال</th>
              <th>الكاتب</th>
              <th>القسم</th>
              <th>المشاهدات</th>
              <th>التفاعل</th>
              <th>تقييم AI</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {content.map((item) => (
              <tr key={item.id} className="group">
                <td>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.publishedAt}</p>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-gray-700">{item.author}</span>
                </td>
                <td>
                  <span className="badge badge-info">
                    {item.category}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{item.views.toLocaleString('ar-SA')}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item.readTime} د</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          item.aiScore >= 80 ? 'bg-green-500' : 
                          item.aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.aiScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.aiScore}%</span>
                  </div>
                </td>
                <td>
                  {item.trend === 'up' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">صاعد</span>
                    </div>
                  )}
                  {item.trend === 'neutral' && (
                    <span className="text-sm text-gray-500">مستقر</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 