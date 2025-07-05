'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, RadixSelect } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  UserPlus, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical,
  Download,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  preferences?: any;
  createdAt: string;
  _count: {
    emailLogs: number;
  };
}

export default function SubscribersPage() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // جلب المشتركين
  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/email/subscribers?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubscribers(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب المشتركين',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, searchTerm, statusFilter]);

  // إضافة مشترك جديد
  const handleAddSubscriber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/email/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name') || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: data.message
        });
        setShowAddDialog(false);
        fetchSubscribers();
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
        description: 'فشل في إضافة المشترك',
        variant: 'destructive'
      });
    }
  };

  // استيراد من CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/email/subscribers', {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم الاستيراد',
          description: data.message
        });
        setShowImportDialog(false);
        fetchSubscribers();
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
        description: 'فشل في استيراد الملف',
        variant: 'destructive'
      });
    }
  };

  // تحديث حالة المشترك
  const updateSubscriberStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/email/subscribers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: 'تم تحديث حالة المشترك'
        });
        fetchSubscribers();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الحالة',
        variant: 'destructive'
      });
    }
  };

  // حذف مشترك
  const deleteSubscriber = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;

    try {
      const response = await fetch(`/api/email/subscribers/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: 'تم حذف المشترك'
        });
        fetchSubscribers();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المشترك',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" /> غير متفاعل</Badge>;
      case 'unsubscribed':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> ألغى الاشتراك</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المشتركين</h1>
        <p className="text-gray-600">إدارة قائمة المشتركين في النشرة البريدية</p>
      </div>

      {/* شريط الأدوات */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث بالبريد أو الاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <RadixSelect value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير متفاعل</SelectItem>
                <SelectItem value="unsubscribed">ألغى الاشتراك</SelectItem>
              </SelectContent>
            </RadixSelect>

            <div className="flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 ml-2" />
                    إضافة مشترك
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مشترك جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSubscriber} className="space-y-4">
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="example@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">الاسم (اختياري)</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="الاسم الكامل"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      إضافة المشترك
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 ml-2" />
                    استيراد CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>استيراد مشتركين من CSV</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      يجب أن يحتوي الملف على أعمدة: email, name
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // تحميل نموذج CSV
                        const csv = 'email,name\nexample@email.com,اسم المشترك';
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'subscribers_template.csv';
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      تحميل نموذج CSV
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول المشتركين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المشتركين ({subscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا يوجد مشتركون
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-4">البريد الإلكتروني</th>
                    <th className="text-right p-4">الاسم</th>
                    <th className="text-right p-4">الحالة</th>
                    <th className="text-right p-4">الرسائل المرسلة</th>
                    <th className="text-right p-4">تاريخ الاشتراك</th>
                    <th className="text-right p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {subscriber.email}
                        </div>
                      </td>
                      <td className="p-4">{subscriber.name || '-'}</td>
                      <td className="p-4">{getStatusBadge(subscriber.status)}</td>
                      <td className="p-4">{subscriber._count.emailLogs}</td>
                      <td className="p-4">
                        {new Date(subscriber.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RadixSelect
                            value={subscriber.status}
                            onValueChange={(value: string) => updateSubscriberStatus(subscriber.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="inactive">غير متفاعل</SelectItem>
                              <SelectItem value="unsubscribed">ألغى الاشتراك</SelectItem>
                            </SelectContent>
                          </RadixSelect>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSubscriber(subscriber.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* التنقل بين الصفحات */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                السابق
              </Button>
              <span className="flex items-center px-4">
                صفحة {page} من {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 