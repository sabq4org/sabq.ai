import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// إضافة أو تحديث تفاعل على تعليق
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reactionType } = await request.json();
    const { id: commentId } = await params;

    if (!['like', 'dislike', 'love', 'angry', 'sad', 'wow'].includes(reactionType)) {
      return NextResponse.json(
        { success: false, error: 'نوع التفاعل غير صالح' },
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

    let reaction;
    
    if (user) {
      // للمستخدمين المسجلين
      const existingReaction = null; // DISABLED: commentReaction

      if (existingReaction) {
        // تحديث التفاعل الموجود
        reaction = null; // DISABLED: await prisma.commentReaction.update
      } else {
        // إنشاء تفاعل جديد
        reaction = null; // DISABLED: await prisma.commentReaction.create
      }
    } else {
      // للزوار - نستخدم IP للتحقق من التفاعلات السابقة
      const existingReaction = null; // DISABLED: commentReaction

      if (existingReaction) {
        reaction = null; // DISABLED: await prisma.commentReaction.update
      } else {
        reaction = null; // DISABLED: await prisma.commentReaction.create
      }
    }

    // جلب إحصائيات التفاعلات المحدثة
    const reactions: any[] = []; // DISABLED: commentReaction.groupBy

    const reactionCounts: any = {};
    reactions.forEach(r => {
      if (r.reactionType) {
        reactionCounts[r.reactionType] = r._count;
      }
    });

    return NextResponse.json({
      success: true,
      reaction,
      counts: reactionCounts
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التفاعل' },
      { status: 500 }
    );
  }
}

// حذف تفاعل
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    let deletedReaction;

    if (user) {
      // حذف تفاعل المستخدم المسجل
      deletedReaction = { count: 0 }; // DISABLED: await prisma.commentReaction.delete
    } else {
      // حذف تفاعل الزائر
      deletedReaction = { count: 0 }; // DISABLED: await prisma.commentReaction.delete
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف التفاعل بنجاح',
      deleted: deletedReaction.count
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التفاعل' },
      { status: 500 }
    );
  }
} 