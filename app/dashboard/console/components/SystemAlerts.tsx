'use client'

import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface Alert {
  id: string
  type: 'error' | 'warning' | 'success' | 'info'
  title: string
  message: string
  timestamp: string
}

export function SystemAlerts() {
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'success',
      title: 'نشر ناجح',
      message: 'تم نشر 3 مقالات بنجاح',
      timestamp: 'قبل 5 دقائق'
    },
    {
      id: '2',
      type: 'warning',
      title: 'مساحة التخزين',
      message: 'استخدمت 85% من المساحة المتاحة',
      timestamp: 'قبل 30 دقيقة'
    },
    {
      id: '3',
      type: 'info',
      title: 'تحديث النظام',
      message: 'سيتم تحديث النظام الليلة الساعة 2:00',
      timestamp: 'قبل ساعة'
    },
    {
      id: '4',
      type: 'error',
      title: 'فشل في الرفع',
      message: 'فشل رفع صورة في مقال الاقتصاد',
      timestamp: 'قبل ساعتين'
    }
  ]
  
  const getAlertIcon = (type: string) => {
    const icons = {
      error: <XCircle className="w-4 h-4 text-red-500" />,
      warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
      success: <CheckCircle className="w-4 h-4 text-green-500" />,
      info: <Info className="w-4 h-4 text-blue-500" />
    }
    return icons[type as keyof typeof icons]
  }
  
  const getAlertStyle = (type: string) => {
    const styles = {
      error: 'border-red-200 bg-red-50',
      warning: 'border-yellow-200 bg-yellow-50',
      success: 'border-green-200 bg-green-50',
      info: 'border-blue-200 bg-blue-50'
    }
    return styles[type as keyof typeof styles]
  }
  
  return (
    <div className="content-section">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">تنبيهات النظام</h3>
        <button className="text-sm text-primary hover:underline">
          عرض الكل
        </button>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto smooth-scroll">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border ${getAlertStyle(alert.type)} hover:shadow-sm transition-all`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">{alert.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 