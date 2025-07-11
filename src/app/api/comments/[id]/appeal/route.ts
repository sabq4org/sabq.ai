import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendNotificationToAdmins } from '@/lib/real-time-notifications';

const prisma = new PrismaClient();

/**
 * POST /api/comments/[id]/appeal
 * تقديم تظلم على تعليق مرفوض
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { user_id, reason } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود التعليق وأنه مرفوض
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

    if (comment.user_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح لك بتقديم تظلم على هذا التعليق' },
        { status: 403 }
      );
    }

    if (comment.status !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تقديم تظلم على هذا التعليق' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود تظلم سابق
    const existingAppeal = await prisma.commentAppeal.findFirst({
      where: {
        comment_id: params.id,
        user_id
      }
    });

    if (existingAppeal) {
      return NextResponse.json(
        { success: false, error: 'لقد قمت بتقديم تظلم على هذا التعليق مسبقاً' },
        { status: 400 }
      );
    }

    // إنشاء التظلم
    const appeal = await prisma.commentAppeal.create({
      data: {
        comment_id: params.id,
        user_id,
        reason: reason || null,
        status: 'pending'
      }
    });

    // إشعار المشرفين
    await sendNotificationToAdmins({
      type: 'comment_appeal',
      title: 'تظلم جديد على تعليق',
      message: `تقدم ${comment.user.name} بتظلم على تعليق مرفوض`,
      link: `/admin/moderation/appeals/${appeal.id}`,
      data: {
        appeal_id: appeal.id,
        comment_id: params.id,
        user_id,
        reason: reason || null,
        original_content: comment.content,
        ai_category: comment.ai_category,
        ai_risk_score: comment.ai_risk_score
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appeal_id: appeal.id,
        message: 'تم تقديم التظلم بنجاح. سيتم مراجعته من قبل المشرفين.'
      }
    });

  } catch (error) {
    console.error('Error creating comment appeal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تقديم التظلم' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/appeal
 * جلب تظلم المستخدم على التعليق
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // جلب التظلم
    const appeal = await prisma.commentAppeal.findFirst({
      where: {
        comment_id: params.id,
        user_id
      },
      include: {
        comment: {
          select: {
            content: true,
            status: true,
            ai_category: true,
            ai_risk_score: true,
            ai_reasons: true
          }
        }
      }
    });

    if (!appeal) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على تظلم' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { appeal }
    });

  } catch (error) {
    console.error('Error fetching comment appeal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التظلم' },
      { status: 500 }
    );
  }
} 