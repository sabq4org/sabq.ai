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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
      include: {
        emailLogs: {
          orderBy: { eventAt: 'desc' },
          take: 10,
          include: {
            job: {
              include: {
                template: {
                  select: {
                    name: true,
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!subscriber) {
      return NextResponse.json(
        { success: false, error: 'المشترك غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: subscriber
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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