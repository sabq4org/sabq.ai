'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Search, 
  Eye,
  MousePointer,
  UserX,
  Calendar,
  BarChart3,
  RefreshCw,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmailJob {
  id: string;
  templateId?: string;
  template: {
    id: string;
    name: string;
    subject: string;
  };
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  status: string;
  metadata?: any;
  _count: {
    emailLogs: number;
  };
  stats?: {
    total: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
  };
}

export default function EmailArchivePage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // جلب المهام المرسلة
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: 'completed',
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/email/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الأرشيف',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchTerm]);

  // جلب إحصائيات المهمة
  const fetchJobStats = async (jobId: string) => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/email/jobs/${jobId}/stats`);
      const data = await response.json();

      if (data.success) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, stats: data.data } : job
        ));
        return data.data;
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الإحصائيات',
        variant: 'destructive'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // عرض تفاصيل المهمة
  const showJobDetails = async (job: EmailJob) => {
    setSelectedJob(job);
    setShowDetailsDialog(true);
    
    if (!job.stats) {
      const stats = await fetchJobStats(job.id);
      if (stats) {
        setSelectedJob({ ...job, stats });
      }
    }
  };

  // إعادة إرسال المهمة
  const resendJob = async (job: EmailJob) => {
    if (!confirm('هل أنت متأكد من إعادة إرسال هذه الرسالة؟')) return;

    try {
      const response = await fetch('/api/email/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: job.template.id,
          scheduledAt: new Date().toISOString(),
          targetFilter: job.metadata?.targetFilter
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: 'تم جدولة إعادة الإرسال بنجاح'
        });
        fetchJobs();
      } else {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إعادة الإرسال',
        variant: 'destructive'
      });
    }
  };

  // نسخ المهمة كقالب جديد
  const duplicateAsTemplate = (job: EmailJob) => {
    // الانتقال إلى صفحة إنشاء الرسائل مع البيانات
    window.location.href = `/dashboard/email/compose?duplicate=${job.id}`;
  };

  // حساب لون معدل الفتح
  const getOpenRateColor = (rate: number) => {
    if (rate >= 30) return 'text-green-600';
    if (rate >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">أرشيف الرسائل المرسلة</h1>
        <p className="text-gray-600">عرض الرسائل المرسلة سابقاً مع الإحصائيات</p>
      </div>

      {/* شريط البحث */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث في الأرشيف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الرسائل */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">لا توجد رسائل مرسلة في الأرشيف</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* معلومات الرسالة */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {job.template.name}
                    </h3>
                    <p className="text-gray-600 mb-3">{job.template.subject}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(job.completedAt || job.startedAt || job.scheduledAt), 'PPP', { locale: ar })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{job._count.emailLogs} مستلم</span>
                      </div>
                    </div>
                  </div>

                  {/* الإحصائيات السريعة */}
                  {job.stats && (
                    <div className="flex gap-6 items-center">
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className={`font-semibold ${getOpenRateColor(job.stats.openRate)}`}>
                            {job.stats.openRate.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">معدل الفتح</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <MousePointer className="w-4 h-4 text-green-500" />
                          <span className="font-semibold">
                            {job.stats.clickRate.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">معدل النقر</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <UserX className="w-4 h-4 text-red-500" />
                          <span className="font-semibold">
                            {job.stats.unsubscribed}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">إلغاء اشتراك</p>
                      </div>
                    </div>
                  )}

                  {/* الأزرار */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showJobDetails(job)}
                    >
                      <BarChart3 className="w-4 h-4 ml-2" />
                      التفاصيل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resendJob(job)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      إعادة إرسال
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateAsTemplate(job)}
                    >
                      <Copy className="w-4 h-4 ml-2" />
                      نسخ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة التفاصيل */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              {/* معلومات عامة */}
              <div>
                <h4 className="font-semibold mb-2">معلومات الرسالة</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">القالب:</span> {selectedJob.template.name}</p>
                  <p><span className="text-gray-500">العنوان:</span> {selectedJob.template.subject}</p>
                  <p><span className="text-gray-500">تاريخ الإرسال:</span> {format(new Date(selectedJob.completedAt || selectedJob.scheduledAt), 'PPPp', { locale: ar })}</p>
                  {selectedJob.metadata?.sentCount !== undefined && (
                    <p><span className="text-gray-500">وقت المعالجة:</span> {selectedJob.metadata.processingTime || 'غير محدد'}</p>
                  )}
                </div>
              </div>

              {/* الإحصائيات التفصيلية */}
              {loadingStats ? (
                <div className="text-center py-4">جاري تحميل الإحصائيات...</div>
              ) : selectedJob.stats ? (
                <div>
                  <h4 className="font-semibold mb-3">الإحصائيات التفصيلية</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Mail className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                        <p className="text-2xl font-bold">{selectedJob.stats.total}</p>
                        <p className="text-sm text-gray-500">إجمالي المستلمين</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="w-6 h-6 mx-auto mb-2 bg-green-500 rounded-full" />
                        <p className="text-2xl font-bold text-green-600">{selectedJob.stats.sent}</p>
                        <p className="text-sm text-gray-500">تم الإرسال</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="w-6 h-6 mx-auto mb-2 bg-red-500 rounded-full" />
                        <p className="text-2xl font-bold text-red-600">{selectedJob.stats.failed}</p>
                        <p className="text-sm text-gray-500">فشل الإرسال</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{selectedJob.stats.opened}</p>
                        <p className="text-sm text-gray-500">تم الفتح ({selectedJob.stats.openRate.toFixed(1)}%)</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MousePointer className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{selectedJob.stats.clicked}</p>
                        <p className="text-sm text-gray-500">نقرات ({selectedJob.stats.clickRate.toFixed(1)}%)</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <UserX className="w-6 h-6 mx-auto mb-2 text-red-500" />
                        <p className="text-2xl font-bold">{selectedJob.stats.unsubscribed}</p>
                        <p className="text-sm text-gray-500">إلغاء اشتراك</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 