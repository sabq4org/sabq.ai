'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface InteractionStats {
  total_comments: number;
  total_likes: number;
  total_shares: number;
  total_reports: number;
  pending_reports: number;
  hidden_comments: number;
  spam_blocked: number;
  daily_stats: Array<{
    date: string;
    comments: number;
    likes: number;
    shares: number;
    reports: number;
  }>;
}

interface Report {
  id: string;
  comment_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  comment: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
    article: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

export function InteractionsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // التحقق من صلاحيات الإدارة
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
        <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/interactions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/interactions/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      const response = await fetch(`/api/admin/interactions/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // تحديث قائمة التبليغات
        setReports(prev => prev.filter(report => report.id !== reportId));
        // تحديث الإحصائيات
        fetchStats();
      }
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  const getReasonInArabic = (reason: string) => {
    const reasons: Record<string, string> = {
      spam: 'رسائل مزعجة',
      inappropriate: 'محتوى غير لائق',
      offensive: 'محتوى مسيء',
      harassment: 'تحرش أو تنمر',
      misinformation: 'معلومات خاطئة',
      other: 'أسباب أخرى'
    };
    return reasons[reason] || reason;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">إدارة التفاعلات</h1>
        <Button
          onClick={() => {
            fetchStats();
            fetchReports();
          }}
          variant="secondary"
        >
          تحديث البيانات
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="reports">التبليغات</TabsTrigger>
          <TabsTrigger value="spam">الحماية من السبام</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* إحصائيات عامة */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي التعليقات</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_comments.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الإعجابات</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_likes.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي المشاركات</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_shares.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">التبليغات المعلقة</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pending_reports}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* إحصائيات إضافية */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">حالة المحتوى</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">تعليقات مخفية</span>
                    <Badge variant="secondary">{stats.hidden_comments}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">سبام محظور</span>
                    <Badge variant="destructive">{stats.spam_blocked}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">إجمالي التبليغات</span>
                    <Badge variant="outline">{stats.total_reports}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الأنشطة اليومية</h3>
                <div className="space-y-2">
                  {stats.daily_stats.slice(0, 5).map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{day.date}</span>
                      <span className="font-medium">{day.comments + day.likes + day.shares}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    تصدير التقارير
                  </Button>
                  <Button className="w-full" variant="outline">
                    إعدادات الحماية
                  </Button>
                  <Button className="w-full" variant="outline">
                    إدارة الفلاتر
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">التبليغات المعلقة</h2>
            <Badge variant="secondary">{reports.length} تبليغ</Badge>
          </div>

          {reports.length === 0 ? (
            <Card className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تبليغات معلقة</h3>
              <p className="text-gray-600">جميع التبليغات تم التعامل معها</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'pending' ? 'معلق' : report.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {getReasonInArabic(report.reason)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-1">
                          التعليق المبلغ عنه:
                        </h4>
                        <div className="bg-gray-50 p-3 rounded border-r-4 border-r-red-500">
                          <p className="text-sm text-gray-800">{report.comment.content}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            بواسطة: {report.comment.user.name} في مقال "{report.comment.article.title}"
                          </div>
                        </div>
                      </div>

                      {report.description && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">تفاصيل التبليغ:</h4>
                          <p className="text-sm text-gray-600">{report.description}</p>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        تم التبليغ بواسطة: {report.user.name} ({report.user.email})
                        <br />
                        تاريخ التبليغ: {new Date(report.created_at).toLocaleString('ar-SA')}
                      </div>
                    </div>

                    <div className="flex gap-2 mr-4">
                      <Button
                        onClick={() => handleReportAction(report.id, 'approve')}
                        variant="destructive"
                        size="sm"
                      >
                        إخفاء التعليق
                      </Button>
                      <Button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        variant="secondary"
                        size="sm"
                      >
                        رفض التبليغ
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="spam" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إعدادات الحماية</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">تفعيل فلتر السبام</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">الإخفاء التلقائي</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">حد التبليغات للإخفاء</span>
                  <input type="number" className="w-16 px-2 py-1 border rounded" defaultValue={3} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الحماية</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">تعليقات محظورة اليوم</span>
                  <Badge variant="destructive">12</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">كلمات محظورة مكتشفة</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IP محظورة</span>
                  <Badge variant="outline">3</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 