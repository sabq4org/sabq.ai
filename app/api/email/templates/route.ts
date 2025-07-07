import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
import { z } from 'zod';
import crypto from 'crypto';

// مخطط التحقق من بيانات القالب
const templateSchema = z.object({
  name: z.string().min(1, 'اسم القالب مطلوب'),
  subject: z.string().min(1, 'عنوان الرسالة مطلوب'),
  htmlContent: z.string().min(1, 'محتوى HTML مطلوب'),
  textContent: z.string().optional(),
  metadata: z.object({
    headerHtml: z.string().optional(),
    footerHtml: z.string().optional(),
    variables: z.array(z.string()).optional()
  }).optional()
});

// GET: جلب القوالب
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { subject: { contains: search } }
      ]
    } : {};
    
    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    
    // جلب عدد المهام لكل قالب
    const templateIds = templates.map((t: { id: string }) => t.id);
    const jobsCounts = templateIds.length > 0 ? await prisma.emailJob.groupBy({
      by: ['template_id'],
      where: { template_id: { in: templateIds } },
      _count: { template_id: true }
    }) : [];
    
    const jobsCountMap = new Map(
      jobsCounts
        .filter((jc) => jc.template_id !== null)
        .map((jc) => [jc.template_id as string, jc._count.template_id])
    );
    const templatesWithCounts = templates.map((t: { id: string }) => ({
      ...t,
      jobsCount: jobsCountMap.get(t.id) || 0
    }));
    
    return NextResponse.json({
      success: true,
      data: templatesWithCounts
    });
  } catch (error) {
    console.error('خطأ في جلب القوالب:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب القوالب' },
      { status: 500 }
    );
  }
}

// POST: إنشاء قالب جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات
    const validatedData = templateSchema.parse(body);
    
    // إنشاء القالب
    const template = await prisma.emailTemplate.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        subject: validatedData.subject,
        html_content: validatedData.htmlContent,
        text_content: validatedData.textContent,
        metadata: validatedData.metadata,
        updated_at: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: template,
      message: 'تم إنشاء القالب بنجاح'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('خطأ في إنشاء القالب:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء القالب' },
      { status: 500 }
    );
  }
} 