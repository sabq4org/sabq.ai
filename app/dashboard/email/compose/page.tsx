'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadixSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Save, 
  Clock, 
  FileText,
  Code,
  Eye,
  Users,
  Calendar,
  Palette,
  Variable
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  metadata?: any;
}

export default function EmailComposePage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [targetFilter, setTargetFilter] = useState<any>({
    status: 'active',
    categories: []
  });
  const [activeTab, setActiveTab] = useState('visual');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // جلب القوالب
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('خطأ في جلب القوالب:', error);
    }
  };

  // تحميل قالب
  const loadTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.htmlContent);
      setTextContent(template.textContent || '');
      toast({
        title: 'تم',
        description: 'تم تحميل القالب بنجاح'
      });
    }
  };

  // حفظ كقالب
  const saveAsTemplate = async () => {
    const name = prompt('أدخل اسم القالب:');
    if (!name) return;

    setSaving(true);
    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          htmlContent,
          textContent,
          metadata: {
            variables: extractVariables(htmlContent)
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: 'تم حفظ القالب بنجاح'
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
        description: 'فشل في حفظ القالب',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // استخراج المتغيرات من المحتوى
  const extractVariables = (content: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
  };

  // إرسال الرسالة
  const sendEmail = async (scheduled = false) => {
    if (!subject || !htmlContent) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال العنوان والمحتوى',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const jobData: any = {
        subject,
        htmlContent,
        textContent,
        targetFilter,
        status: scheduled ? 'queued' : 'sending'
      };

      if (scheduled && scheduleDate && scheduleTime) {
        jobData.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      }

      const response = await fetch('/api/email/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم',
          description: scheduled ? 'تم جدولة الرسالة بنجاح' : 'تم إرسال الرسالة بنجاح'
        });
        
        // إعادة تعيين النموذج
        setSubject('');
        setHtmlContent('');
        setTextContent('');
        setSelectedTemplate('');
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
        description: 'فشل في إرسال الرسالة',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
      setShowSchedule(false);
    }
  };

  // معاينة الرسالة
  const previewContent = () => {
    const previewHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>سبق - النشرة البريدية</h1>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
        <div class="footer">
          <p>© 2024 صحيفة سبق الإلكترونية. جميع الحقوق محفوظة.</p>
          <p><a href="{{unsubscribe_url}}">إلغاء الاشتراك</a></p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">محرر الرسائل البريدية</h1>
        <p className="text-gray-600">إنشاء وإرسال رسائل بريدية مخصصة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحرر الرئيسي */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>محتوى الرسالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* اختيار القالب */}
              <div>
                <Label>القالب (اختياري)</Label>
                <RadixSelect value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  if (value) loadTemplate(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قالباً محفوظاً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون قالب</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect>
              </div>

              {/* عنوان الرسالة */}
              <div>
                <Label htmlFor="subject">عنوان الرسالة</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="أدخل عنوان الرسالة..."
                />
              </div>

              {/* محرر المحتوى */}
              <div>
                <Label>محتوى الرسالة</Label>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="visual">
                      <FileText className="w-4 h-4 ml-2" />
                      محرر مرئي
                    </TabsTrigger>
                    <TabsTrigger value="html">
                      <Code className="w-4 h-4 ml-2" />
                      محرر HTML
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="visual" className="mt-4">
                    <div className="border rounded-md p-4">
                      <Textarea
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        className="min-h-[400px] font-sans"
                        placeholder="اكتب محتوى الرسالة هنا... يمكنك استخدام HTML"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        نصيحة: يمكنك استخدام وسوم HTML مثل &lt;p&gt;, &lt;h1&gt;, &lt;strong&gt;, &lt;a&gt;
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="html" className="mt-4">
                    <Textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="font-mono text-sm h-[400px]"
                      placeholder="<p>أدخل كود HTML هنا...</p>"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* نص بديل */}
              <div>
                <Label htmlFor="textContent">النص البديل (للبريد النصي)</Label>
                <Textarea
                  id="textContent"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="نص بديل للعملاء الذين لا يدعمون HTML..."
                  rows={4}
                />
              </div>

              {/* المتغيرات المتاحة */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Variable className="w-4 h-4 ml-2" />
                  المتغيرات المتاحة
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['{{name}}', '{{email}}', '{{date}}', '{{unsubscribe_url}}'].map(variable => (
                    <code key={variable} className="bg-white px-2 py-1 rounded text-sm">
                      {variable}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* استهداف المستقبلين */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 ml-2" />
                استهداف المستقبلين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>حالة المشتركين</Label>
                <RadixSelect 
                  value={targetFilter.status} 
                  onValueChange={(value) => setTargetFilter({...targetFilter, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المشتركين</SelectItem>
                    <SelectItem value="active">النشطون فقط</SelectItem>
                    <SelectItem value="inactive">غير المتفاعلين</SelectItem>
                  </SelectContent>
                </RadixSelect>
              </div>
              
              <div className="text-sm text-gray-600">
                سيتم إرسال الرسالة إلى حوالي <strong>0</strong> مشترك
              </div>
            </CardContent>
          </Card>

          {/* الإجراءات */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => sendEmail(false)}
                disabled={sending || !subject || !htmlContent}
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال الآن
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSchedule(true)}
                disabled={!subject || !htmlContent}
              >
                <Clock className="w-4 h-4 ml-2" />
                جدولة الإرسال
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={saveAsTemplate}
                disabled={saving || !subject || !htmlContent}
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ كقالب
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={previewContent}
                disabled={!htmlContent}
              >
                <Eye className="w-4 h-4 ml-2" />
                معاينة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* نافذة الجدولة */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>جدولة الإرسال</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduleDate">التاريخ</Label>
              <Input
                id="scheduleDate"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="scheduleTime">الوقت</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => sendEmail(true)}
                disabled={sending || !scheduleDate || !scheduleTime}
              >
                <Calendar className="w-4 h-4 ml-2" />
                تأكيد الجدولة
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSchedule(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 