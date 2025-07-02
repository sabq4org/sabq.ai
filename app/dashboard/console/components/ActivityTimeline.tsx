'use client'

import { useState } from 'react'
import { Clock, User, FileText, Edit, Eye, MessageCircle } from 'lucide-react'

interface Activity {
  id: string
  type: 'publish' | 'edit' | 'view' | 'comment' | 'ai'
  title: string
  user: string
  timestamp: string
  metadata?: any
}

export function ActivityTimeline() {
  const [filter, setFilter] = useState('all')
  
  // Mock data
  const activities: Activity[] = [
    {
      id: '1',
      type: 'publish',
      title: 'نشر مقال: تطورات جديدة في مشروع نيوم',
      user: 'أحمد السيد',
      timestamp: 'قبل دقيقتين',
      metadata: { section: 'اقتصاد' }
    },
    {
      id: '2',
      type: 'ai',
      title: 'استخدام AI لتوليد ملخص',
      user: 'فاطمة العلي',
      timestamp: 'قبل 5 دقائق',
      metadata: { feature: 'ملخص تلقائي' }
    },
    {
      id: '3',
      type: 'edit',
      title: 'تحرير مقال: نتائج مباراة الهلال',
      user: 'محمد الشمري',
      timestamp: 'قبل 8 دقائق',
      metadata: { changes: 3 }
    },
    {
      id: '4',
      type: 'comment',
      title: 'تعليق جديد على: موسم الرياض',
      user: 'زائر',
      timestamp: 'قبل 15 دقيقة',
      metadata: { commentId: 'c123' }
    }
  ]
  
  const getActivityIcon = (type: string) => {
    const icons = {
      publish: <FileText className="w-4 h-4 text-blue-600" />,
      edit: <Edit className="w-4 h-4 text-yellow-600" />,
      view: <Eye className="w-4 h-4 text-gray-600" />,
      comment: <MessageCircle className="w-4 h-4 text-green-600" />,
      ai: <span className="text-sm">🤖</span>
    }
    return icons[type as keyof typeof icons] || <Clock className="w-4 h-4" />
  }
  
  const getActivityColor = (type: string) => {
    const colors = {
      publish: 'border-blue-200 bg-blue-50',
      edit: 'border-yellow-200 bg-yellow-50',
      view: 'border-gray-200 bg-gray-50',
      comment: 'border-green-200 bg-green-50',
      ai: 'border-purple-200 bg-purple-50'
    }
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50'
  }
  
  return (
    <div className="content-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">سجل النشاطات</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              filter === 'ai' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI فقط
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto smooth-scroll">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)} hover:shadow-sm transition-all`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{activity.user}</span>
                <span className="text-xs text-gray-400">•</span>
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{activity.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 