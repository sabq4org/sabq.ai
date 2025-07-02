'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, AlertCircle, Info, CheckCircle, Server, Clock, X,
  TrendingDown, Shield, Zap, FileText
} from 'lucide-react';
import { SabqCard } from '@/components/ui/SabqCard';
import { SabqBadge } from '@/components/ui/SabqBadge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'content' | 'ai' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  isResolved: boolean;
  metadata?: any;
}

const getAlertIcon = (type: string, severity: string) => {
  if (severity === 'critical') return AlertTriangle;
  if (severity === 'error') return AlertCircle;
  if (severity === 'warning') return Info;
  
  switch (type) {
    case 'performance': return TrendingDown;
    case 'security': return Shield;
    case 'content': return FileText;
    case 'ai': return Zap;
    case 'system': return Server;
    default: return AlertCircle;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    case 'error': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  }
};

const getSeverityBadgeVariant = (severity: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (severity) {
    case 'critical':
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'critical': return 'حرج';
    case 'error': return 'خطأ';
    case 'warning': return 'تحذير';
    case 'info': return 'معلومة';
    default: return severity;
  }
};

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'performance',
      severity: 'warning',
      title: 'بطء في وقت الاستجابة',
      message: 'متوسط وقت تحميل الصفحة تجاوز 3 ثوانٍ في آخر 15 دقيقة',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isResolved: false,
      metadata: {
        avgLoadTime: '3.4s',
        affectedPages: 12
      }
    },
    {
      id: '2',
      type: 'content',
      severity: 'error',
      title: 'مقالات بدون نشر',
      message: 'لم يتم نشر أي مقال في قسم "الرياضة" منذ 8 ساعات',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      isResolved: false,
      metadata: {
        section: 'الرياضة',
        lastPublished: '8 ساعات'
      }
    },
    {
      id: '3',
      type: 'security',
      severity: 'critical',
      title: 'محاولات دخول مشبوهة',
      message: 'رصد 15 محاولة دخول فاشلة من عنوان IP واحد',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isResolved: false,
      metadata: {
        ip: '185.123.45.67',
        attempts: 15
      }
    },
    {
      id: '4',
      type: 'ai',
      severity: 'info',
      title: 'تحديث نموذج AI',
      message: 'تم تحديث نموذج توليد العناوين بنجاح. الأداء تحسن بنسبة 15%',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isResolved: true,
      metadata: {
        improvement: '15%',
        version: 'v2.3.1'
      }
    },
    {
      id: '5',
      type: 'system',
      severity: 'warning',
      title: 'مساحة التخزين',
      message: 'مساحة التخزين المتبقية 15% فقط. يُنصح بالتنظيف',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isResolved: false,
      metadata: {
        used: '85%',
        available: '150GB'
      }
    }
  ]);

  const handleResolve = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isResolved: true }
          : alert
      )
    );
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const unresolvedAlerts = alerts.filter(a => !a.isResolved);
  const criticalCount = unresolvedAlerts.filter(a => a.severity === 'critical').length;
  const errorCount = unresolvedAlerts.filter(a => a.severity === 'error').length;

  return (
    <SabqCard className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            تنبيهات النظام
          </h2>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <SabqBadge variant="error" size="sm">
                {criticalCount} حرج
              </SabqBadge>
            )}
            {errorCount > 0 && (
              <SabqBadge variant="warning" size="sm">
                {errorCount} خطأ
              </SabqBadge>
            )}
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>لا توجد تنبيهات نشطة</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type, alert.severity);
              const colorClass = getSeverityColor(alert.severity);
              
              return (
                <div
                  key={alert.id}
                  className={`relative border-r-4 rounded-lg p-4 ${colorClass} ${
                    alert.isResolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'error' ? 'text-orange-600' :
                      alert.severity === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {alert.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {alert.message}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Metadata */}
                      {alert.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(alert.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="text-xs bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded"
                            >
                              {key}: <strong>{value as string}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(alert.timestamp, { locale: ar, addSuffix: true })}
                          </span>
                          <SabqBadge 
                            variant={getSeverityBadgeVariant(alert.severity)} 
                            size="sm"
                          >
                            {getSeverityText(alert.severity)}
                          </SabqBadge>
                        </div>

                        {!alert.isResolved && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            تم الحل
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SabqCard>
  );
} 