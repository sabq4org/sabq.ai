'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Copy,
  Eye,
  Mail
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  _count: {
    emailJobs: number;
  };
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: ''
  });

  // جلب القوالب
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = searchTerm ? `?search=${searchTerm}` : '';
      const response = await fetch(`/api/email/templates${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في جلب القوالب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [searchTerm]);

  // فتح نافذة التعديل
  const openEditDialog = (template?: EmailTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setEditForm({
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || ''
      });
    } else {
      setSelectedTemplate(null);
      setEditForm({
        name: '',
        subject: '',
        htmlContent: '',
        textContent: ''
      });
    }
    setShowEditDialog(true);
  };

  // حفظ القالب
  const saveTemplate = async () => {
    if (!editForm.name || !editForm.subject || !editForm.htmlContent) {
      toast({
        title: 'خطأ',
        description: 'يجب ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      const url = selectedTemplate 
        ? `/api/email/templates/${selectedTemplate.id}`
        : '/api/email/templates';
      
      const method = selectedTemplate ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: data.message
        });
        setShowEditDialog(false);
        fetchTemplates();
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
        description: 'فشل في حفظ القالب',
        variant: 'destructive'
      });
    }
  };

  // حذف قالب
  const deleteTemplate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    try {
      const response = await fetch(`/api/email/templates/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: 'تم حذف القالب بنجاح'
        });
        fetchTemplates();
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
        description: 'فشل في حذف القالب',
        variant: 'destructive'
      });
    }
  };

  // نسخ قالب
  const duplicateTemplate = (template: EmailTemplate) => {
    setEditForm({
      name: `${template.name} (نسخة)`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || ''
    });
    setSelectedTemplate(null);
    setShowEditDialog(true);
  };

  // معاينة القالب
  const previewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">قوالب البريد الإلكتروني</h1>
        <p className="text-gray-600">إدارة القوالب المحفوظة للرسائل البريدية</p>
      </div>

      {/* شريط الأدوات */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في القوالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء قالب جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة القوالب */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">لا توجد قوالب محفوظة</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء أول قالب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">العنوان:</p>
                    <p className="font-medium truncate">{template.subject}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>استخدم {template._count.emailJobs} مرة</span>
                    <span>{new Date(template.updatedAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => deleteTemplate(template.id)}
                      disabled={template._count.emailJobs > 0}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة التعديل/الإنشاء */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">اسم القالب</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="مثال: النشرة الأسبوعية"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">عنوان الرسالة</Label>
              <Input
                id="subject"
                value={editForm.subject}
                onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                placeholder="مثال: أهم أخبار الأسبوع من سبق"
              />
            </div>
            
            <div>
              <Label htmlFor="htmlContent">محتوى HTML</Label>
              <Textarea
                id="htmlContent"
                value={editForm.htmlContent}
                onChange={(e) => setEditForm({...editForm, htmlContent: e.target.value})}
                placeholder="<h1>مرحباً {{name}}</h1>..."
                className="font-mono text-sm h-64"
              />
            </div>
            
            <div>
              <Label htmlFor="textContent">النص البديل (اختياري)</Label>
              <Textarea
                id="textContent"
                value={editForm.textContent}
                onChange={(e) => setEditForm({...editForm, textContent: e.target.value})}
                placeholder="مرحباً {{name}}..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={saveTemplate} className="flex-1">
                <Mail className="w-4 h-4 ml-2" />
                {selectedTemplate ? 'تحديث القالب' : 'حفظ القالب'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة المعاينة */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة القالب</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label>اسم القالب</Label>
                <p className="font-medium">{selectedTemplate.name}</p>
              </div>
              
              <div>
                <Label>العنوان</Label>
                <p className="font-medium">{selectedTemplate.subject}</p>
              </div>
              
              <div>
                <Label>المحتوى</Label>
                <div className="border rounded-md p-4 bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
                </div>
              </div>
              
              {selectedTemplate.textContent && (
                <div>
                  <Label>النص البديل</Label>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap">{selectedTemplate.textContent}</pre>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 