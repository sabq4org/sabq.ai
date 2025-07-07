import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// مخطط التحقق من بيانات التحديث
const updateSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'unsubscribed']).optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional()
  }).optional()
});

// GET: جلب مشترك واحد
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const subscriber = await prisma.subscriber.findUnique({
      where: { id }
    });
    
    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: 'المشترك غير موجود' },
        { status: 404 }
      );
    }
    
    // جلب سجلات البريد الإلكتروني بشكل منفصل
    const emailLogs = await prisma.emailLog.findMany({
      where: { subscriber_id: id },
      orderBy: { event_at: 'desc' },
      take: 10
    });
    
    // جلب بيانات الوظائف والقوالب
    const jobIds = emailLogs.map(log => log.job_id).filter((id): id is string => id !== null);
    const jobs = jobIds.length > 0 ? await prisma.emailJob.findMany({
      where: { id: { in: jobIds } }
    }) : [];
    
    const templateIds = jobs.map(job => job.template_id).filter((id): id is string => id !== null);
    const templates = templateIds.length > 0 ? await prisma.emailTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true, subject: true }
    }) : [];
    
    const jobsMap = new Map(jobs.map(job => [job.id, job]));
    const templatesMap = new Map(templates.map(template => [template.id, template]));
    
    // إضافة بيانات الوظائف والقوالب لسجلات البريد
    const emailLogsWithDetails = emailLogs.map(log => ({
      ...log,
      job: log.job_id ? jobsMap.get(log.job_id) : null,
      template: log.job_id ? (jobsMap.get(log.job_id)?.template_id ? templatesMap.get(jobsMap.get(log.job_id)!.template_id!) : null) : null
    }));
    
    const subscriberWithLogs = {
      ...subscriber,
      emailLogs: emailLogsWithDetails
    };
    
    return NextResponse.json({
      success: true,
      data: subscriberWithLogs
    });
  } catch (error) {
    console.error('خطأ في جلب المشترك:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المشترك' },
      { status: 500 }
    );
  }
}

// PATCH: تحديث مشترك
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // التحقق من البيانات
    const validatedData = updateSchema.parse(body);
    
    // تحديث المشترك
    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: validatedData
    });
    
    return NextResponse.json({
      success: true,
      data: subscriber,
      message: 'تم تحديث المشترك بنجاح'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('خطأ في تحديث المشترك:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المشترك' },
      { status: 500 }
    );
  }
}

// DELETE: حذف مشترك
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.subscriber.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف المشترك بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في حذف المشترك:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المشترك' },
      { status: 500 }
    );
  }
} 