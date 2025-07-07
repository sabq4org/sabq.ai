import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // إحصائيات المشتركين
    const subscriberStats = await prisma.subscriber.groupBy({
      by: ['status'],
      _count: true
    });

    const totalSubscribers = subscriberStats.reduce((sum: number, stat: any) => sum + stat._count, 0);
    const activeSubscribers = subscriberStats.find((s: any) => s.status === 'active')?._count || 0;
    const inactiveSubscribers = subscriberStats.find((s: any) => s.status === 'inactive')?._count || 0;
    const unsubscribedSubscribers = subscriberStats.find((s: any) => s.status === 'unsubscribed')?._count || 0;

    // حساب نمو المشتركين الشهري
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newSubscribers = await prisma.subscriber.count({
      where: {
        created_at: { gte: thirtyDaysAgo }
      }
    });
    
    const oldTotal = totalSubscribers - newSubscribers;
    const growthRate = oldTotal > 0 ? ((newSubscribers / oldTotal) * 100) : 0;

    // إحصائيات الحملات
    const campaignStats = await prisma.emailJob.groupBy({
      by: ['status'],
      _count: true
    });

    const totalCampaigns = campaignStats.reduce((sum: number, stat: any) => sum + stat._count, 0);
    const sentCampaigns = campaignStats.find((s: any) => s.status === 'completed')?._count || 0;
    const scheduledCampaigns = campaignStats.find((s: any) => s.status === 'queued')?._count || 0;
    const failedCampaigns = campaignStats.find((s: any) => s.status === 'failed')?._count || 0;

    // إحصائيات الأداء العام
    const emailLogs = await prisma.emailLog.findMany({
      select: {
        status: true,
        opened_at: true,
        clicked_at: true,
        unsubscribed_at: true
      }
    });

    const totalEmails = emailLogs.length;
    const sentEmails = emailLogs.filter((log: any) => log.status === 'sent' || log.status === 'delivered').length;
    const openedEmails = emailLogs.filter((log: any) => log.opened_at !== null).length;
    const clickedEmails = emailLogs.filter((log: any) => log.clicked_at !== null).length;
    const unsubscribedEmails = emailLogs.filter((log: any) => log.unsubscribed_at !== null).length;

    const avgOpenRate = sentEmails > 0 ? (openedEmails / sentEmails) * 100 : 0;
    const avgClickRate = sentEmails > 0 ? (clickedEmails / sentEmails) * 100 : 0;
    const avgUnsubscribeRate = sentEmails > 0 ? (unsubscribedEmails / sentEmails) * 100 : 0;

    // أفضل الحملات أداءً
    const topCampaigns = await prisma.emailJob.findMany({
      where: {
        status: 'completed',
        completed_at: { not: null }
      },
      orderBy: {
        completed_at: 'desc'
      },
      take: 5
    });

    // حساب معدلات الأداء لكل حملة
    const topCampaignsWithStats = await Promise.all(
      topCampaigns.map(async (campaign: any) => {
        // جلب بيانات القالب المرتبط بالحملة
        let template = null;
        if (campaign.template_id) {
          template = await prisma.emailTemplate.findUnique({
            where: { id: campaign.template_id },
            select: { name: true, subject: true }
          });
        }
        const logs = await prisma.emailLog.findMany({
          where: { job_id: campaign.id },
          select: {
            status: true,
            opened_at: true,
            clicked_at: true
          }
        });

        const sent = logs.filter((l: any) => l.status === 'sent' || l.status === 'delivered').length;
        const opened = logs.filter((l: any) => l.opened_at !== null).length;
        const clicked = logs.filter((l: any) => l.clicked_at !== null).length;

        const openRate = sent > 0 ? (opened / sent) * 100 : 0;
        const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;

        return {
          id: campaign.id,
          name: template?.name || 'غير محدد',
          subject: template?.subject || 'غير محدد',
          openRate,
          clickRate,
          sentCount: sent,
          sentAt: campaign.completed_at!.toISOString()
        };
      })
    );

    // ترتيب الحملات حسب معدل الفتح
    topCampaignsWithStats.sort((a, b) => b.openRate - a.openRate);

    const stats = {
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        unsubscribed: unsubscribedSubscribers,
        growth: Number(growthRate.toFixed(1))
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
        scheduled: scheduledCampaigns,
        failed: failedCampaigns
      },
      performance: {
        avgOpenRate,
        avgClickRate,
        avgUnsubscribeRate,
        totalEmails,
        totalOpens: openedEmails,
        totalClicks: clickedEmails
      },
      topCampaigns: topCampaignsWithStats.slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإحصائيات' },
      { status: 500 }
    );
  }
} 