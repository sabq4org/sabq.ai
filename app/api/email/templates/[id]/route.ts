import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
import { z } from 'zod';

// مخطط التحقق من بيانات التحديث
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  metadata: z.object({
    headerHtml: z.string().optional(),
    footerHtml: z.string().optional(),
    variables: z.array(z.string()).optional()
  }).optional()
});

// GET: جلب قالب واحد
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    
    // جلب عدد المهام المرتبطة بهذا القالب
    const jobsCount = await prisma.emailJob.count({
      where: { template_id: id }
    });
    
    const templateWithCount = {
      ...template,
      _count: { emailJobs: jobsCount }
    };
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'القالب غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: templateWithCount
    });
  } catch (error) {
    console.error('خطأ في جلب القالب:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب القالب' },
      { status: 500 }
    );
  }
}

// PATCH: تحديث قالب
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // التحقق من البيانات
    const validatedData = updateSchema.parse(body);
    
    // تحديث القالب
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: validatedData
    });
    
    return NextResponse.json({
      success: true,
      data: template,
      message: 'تم تحديث القالب بنجاح'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('خطأ في تحديث القالب:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث القالب' },
      { status: 500 }
    );
  }
}

// DELETE: حذف قالب
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // التحقق من عدم استخدام القالب في مهام نشطة
    const activeJobs = await prisma.emailJob.count({
      where: {
        template_id: id,
        status: { in: ['queued', 'sending'] }
      }
    });
    
    if (activeJobs > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف القالب لأنه مستخدم في مهام نشطة' },
        { status: 400 }
      );
    }
    
    await prisma.emailTemplate.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف القالب بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في حذف القالب:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف القالب' },
      { status: 500 }
    );
  }
} 