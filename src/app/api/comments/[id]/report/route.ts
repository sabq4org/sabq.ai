import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotificationToAdmins } from '@/lib/real-time-notifications';

const prisma = new PrismaClient();

/**
 * POST /api/comments/[id]/report
 * تبليغ عن تعليق
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { user_id, reason, description } = body;

    if (!user_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // التحقق من وجود التعليق
    const comment = await prisma.articleComment.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود تبليغ سابق من نفس المستخدم
    const existingReport = await prisma.commentReport.findUnique({
      where: {
        comment_id_user_id: {
          comment_id: params.id,
          user_id
        }
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'لقد قمت بالتبليغ عن هذا التعليق مسبقاً' },
        { status: 400 }
      );
    }

    // إنشاء التبليغ
    const report = await prisma.commentReport.create({
      data: {
        comment_id: params.id,
        user_id,
        reason,
        description: description || null,
        status: 'pending'
      }
    });

    // تحديث عدد التبليغات في التعليق
    const updatedComment = await prisma.articleComment.update({
      where: { id: params.id },
      data: {
        report_count: { increment: 1 },
        user_flagged: true
      }
    });

    // إذا وصل عدد التبليغات لحد معين، إخفاء التعليق تلقائياً
    const REPORT_THRESHOLD = 5;
    if (updatedComment.report_count >= REPORT_THRESHOLD) {
      await prisma.articleComment.update({
        where: { id: params.id },
        data: {
          status: 'hidden'
        }
      });
    }

    // إشعار المشرفين
    await sendNotificationToAdmins({
      type: 'comment_reported',
      title: 'تبليغ عن تعليق',
      message: `تم التبليغ عن تعليق من ${comment.user.name} بسبب: ${reason}`,
      link: `/admin/moderation/reports/${report.id}`,
      data: {
        comment_id: params.id,
        report_id: report.id,
        reporter_id: user_id,
        reason,
        report_count: updatedComment.report_count
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        report_id: report.id,
        message: 'تم تسجيل التبليغ بنجاح'
      }
    });

  } catch (error) {
    console.error('Error reporting comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تسجيل التبليغ' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/report
 * جلب تبليغات التعليق (للمشرفين)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    // التحقق من صلاحيات المشرف
    const user = await prisma.user.findUnique({
      where: { id: user_id! },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بالوصول' },
        { status: 403 }
      );
    }

    // جلب التبليغات
    const reports = await prisma.commentReport.findMany({
      where: { comment_id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: { reports }
    });

  } catch (error) {
    console.error('Error fetching comment reports:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التبليغات' },
      { status: 500 }
    );
  }
} 