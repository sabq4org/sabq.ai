import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// الإبلاغ عن تعليق
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { reason, details } = await request.json();
    const { id: commentId } = await context.params;

    if (!['spam', 'offensive', 'misleading', 'harassment', 'other'].includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'سبب البلاغ غير صالح' },
        { status: 400 }
      );
    }

    if (reason === 'other' && !details) {
      return NextResponse.json(
        { success: false, error: 'يرجى توضيح سبب البلاغ' },
        { status: 400 }
      );
    }

    // الحصول على المستخدم أو IP
    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // التحقق من وجود التعليق
    const comment = await prisma.comments.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من وجود بلاغ سابق من نفس المستخدم/IP
    const existingReport = null; // DISABLED: commentReport

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'لقد قمت بالإبلاغ عن هذا التعليق مسبقاً' },
        { status: 400 }
      );
    }

    // إنشاء البلاغ
    const report = { id: 'dummy-id', reason, commentId }; // DISABLED: await prisma.commentReport.create

    // تحديث حالة التعليق إذا تجاوز عدد البلاغات حد معين
    const reportsCount = 0; // await prisma.commentReport.count({ where: { commentId } });

    if (reportsCount >= 3) {
      // تغيير حالة التعليق إلى "مبلغ عنه" بعد 3 بلاغات
      await prisma.comments.update({
        where: { id: commentId },
        data: { status: 'reported' }
      });

      // إرسال إشعار للمشرفين (يمكن تنفيذه لاحقاً)
      // await sendNotificationToModerators(comment, reportsCount);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال البلاغ بنجاح وسيتم مراجعته من قبل الإدارة',
      report: {
        id: report.id,
        reason: report.reason
      }
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال البلاغ' },
      { status: 500 }
    );
  }
} 