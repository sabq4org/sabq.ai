import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailScheduler } from '@/lib/services/emailScheduler';
import { z } from 'zod';

// مخطط التحقق من بيانات المهمة الجديدة
const createJobSchema = z.object({
  templateId: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  targetFilter: z.object({
    status: z.enum(['active', 'inactive', 'unsubscribed']).optional(),
    preferences: z.record(z.any()).optional()
  }).optional()
});

// GET: جلب المهام
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { template: { name: { contains: search } } },
        { template: { subject: { contains: search } } }
      ];
    }
    
    const jobs = await prisma.emailJob.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        },
        _count: {
          select: {
            emailLogs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('خطأ في جلب المهام:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المهام' },
      { status: 500 }
    );
  }
}

// POST: إنشاء مهمة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات
    const validatedData = createJobSchema.parse(body);
    
    // جدولة المهمة
    const jobId = await emailScheduler.scheduleJob(
      validatedData.templateId,
      validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : new Date(),
      validatedData.targetFilter
    );
    
    return NextResponse.json({
      success: true,
      data: { id: jobId },
      message: 'تم جدولة المهمة بنجاح'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('خطأ في إنشاء المهمة:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المهمة' },
      { status: 500 }
    );
  }
} 