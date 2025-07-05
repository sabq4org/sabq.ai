'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Users,
  Eye,
  MousePointer,
  UserX,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';

interface EmailStats {
  subscribers: {
    total: number;
    active: number;
    inactive: number;
    unsubscribed: number;
    growth: number; // نسبة النمو الشهرية
  };
  campaigns: {
    total: number;
    sent: number;
    scheduled: number;
    failed: number;
  };
  performance: {
    avgOpenRate: number;
    avgClickRate: number;
    avgUnsubscribeRate: number;
    totalEmails: number;
    totalOpens: number;
    totalClicks: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    subject: string;
    openRate: number;
    clickRate: number;
    sentCount: number;
    sentAt: string;
  }>;
}

export default function EmailAnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  // جلب الإحصائيات
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/analytics');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الإحصائيات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">جاري تحميل الإحصائيات...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">لا توجد بيانات</div>;
  }

  // حساب لون معدل الأداء
  const getPerformanceColor = (rate: number, type: 'open' | 'click' | 'unsubscribe') => {
    if (type === 'unsubscribe') {
      if (rate <= 0.5) return 'text-green-600';
      if (rate <= 2) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (rate >= 30) return 'text-green-600';
      if (rate >= 15) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إحصائيات البريد الإلكتروني</h1>
        <p className="text-gray-600">نظرة عامة على أداء حملات البريد الإلكتروني</p>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* إجمالي المشتركين */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المشتركين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribers.total.toLocaleString('ar-SA')}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              {stats.subscribers.growth > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                  <span className="text-green-500">+{stats.subscribers.growth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                  <span className="text-red-500">{stats.subscribers.growth}%</span>
                </>
              )}
              <span className="mr-2">هذا الشهر</span>
            </div>
          </CardContent>
        </Card>

        {/* المشتركون النشطون */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المشتركون النشطون</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribers.active.toLocaleString('ar-SA')}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {((stats.subscribers.active / stats.subscribers.total) * 100).toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        {/* إجمالي الحملات */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحملات</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.campaigns.sent} مرسلة، {stats.campaigns.scheduled} مجدولة
            </p>
          </CardContent>
        </Card>

        {/* متوسط معدل الفتح */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط معدل الفتح</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(stats.performance.avgOpenRate, 'open')}`}>
              {stats.performance.avgOpenRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.performance.totalOpens.toLocaleString('ar-SA')} فتحة إجمالية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* معدلات الأداء */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">معدل النقر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-green-500" />
                <span className={`text-2xl font-bold ${getPerformanceColor(stats.performance.avgClickRate, 'click')}`}>
                  {stats.performance.avgClickRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.performance.totalClicks.toLocaleString('ar-SA')} نقرة
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">معدل إلغاء الاشتراك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <span className={`text-2xl font-bold ${getPerformanceColor(stats.performance.avgUnsubscribeRate, 'unsubscribe')}`}>
                  {stats.performance.avgUnsubscribeRate.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.subscribers.unsubscribed} إلغاء
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">إجمالي الرسائل المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {stats.performance.totalEmails.toLocaleString('ar-SA')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                رسالة مرسلة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أفضل الحملات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            أفضل الحملات أداءً
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCampaigns.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا توجد حملات بعد</p>
          ) : (
            <div className="space-y-4">
              {stats.topCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold">#{index + 1}</span>
                      <h4 className="font-medium">{campaign.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{campaign.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      أرسلت إلى {campaign.sentCount} مشترك • {new Date(campaign.sentAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  
                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className={`font-semibold ${getPerformanceColor(campaign.openRate, 'open')}`}>
                          {campaign.openRate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">فتح</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <MousePointer className="h-4 w-4 text-green-500" />
                        <span className={`font-semibold ${getPerformanceColor(campaign.clickRate, 'click')}`}>
                          {campaign.clickRate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">نقر</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 