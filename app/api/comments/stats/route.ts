import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { corsResponse } from '@/lib/cors';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // إحصائيات التعليقات
    const [
      total,
      pending,
      approved,
      rejected,
      aiFlagged
    ] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { status: 'pending' } }),
      prisma.comment.count({ where: { status: 'approved' } }),
      prisma.comment.count({ where: { status: 'rejected' } }),
      prisma.comment.count({ where: { status: 'pending' } }) // التعليقات المعلقة كبديل للـ AI flagged
    ]);

    // بيانات وهمية لسجلات الذكاء الاصطناعي (يمكن استبدالها لاحقاً)
    const aiModerationLogs: any[] = [];

    // حساب دقة الذكاء الاصطناعي
    let aiAccuracy = 0;
    if (aiModerationLogs.length > 0) {
      const correctDecisions = aiModerationLogs.filter((log: any) => {
        // إذا لم يتم تجاوز قرار الذكاء الاصطناعي، فهو صحيح
        if (!log.overridden) return true;
        
        // إذا تم تجاوزه، تحقق من التطابق
        return log.aiDecision === log.humanDecision;
      }).length;
      
      aiAccuracy = Math.round((correctDecisions / aiModerationLogs.length) * 100);
    }

    // إحصائيات إضافية
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const [
      todayComments,
      todayApproved,
      todayRejected
    ] = await Promise.all([
      prisma.comment.count({
        where: { createdAt: { gte: last24Hours } }
      }),
      prisma.comment.count({
        where: {
          status: 'approved',
          updatedAt: { gte: last24Hours }
        }
      }),
      prisma.comment.count({
        where: {
          status: 'rejected',
          updatedAt: { gte: last24Hours }
        }
      })
    ]);

    // تحليلات التصنيف
    const classificationStats = await prisma.comment.groupBy({
      by: ['status'],
      _count: true,
      where: {
        // aiClassification: { not: null }
      }
    });

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
      aiFlagged,
      aiAccuracy,
      today: {
        total: todayComments,
        approved: todayApproved,
        rejected: todayRejected
      },
      classifications: classificationStats.reduce((acc, stat) => {
        acc[stat['status']!] = stat._count;
        return acc;
      }, {} as Record<string, number>)
    });
    
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الإحصائيات' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsResponse(request);
} 