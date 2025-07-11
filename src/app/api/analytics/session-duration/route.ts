import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/session-duration
 * تحليل توزيع أعمار الجلسة
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10000');
    const days = parseInt(searchParams.get('days') || '30');

    // تحديد نطاق التاريخ
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // جلب الجلسات مع أوقات البداية والنهاية
    const sessions = await prisma.userSession.findMany({
      where: {
        start_time: { gte: startDate },
        end_time: { not: null },
        duration: { not: null }
      },
      select: {
        start_time: true,
        end_time: true,
        duration: true,
        page_views: true,
        device_type: true,
        browser: true,
        is_bounce: true
      },
      take: limit,
      orderBy: { start_time: 'desc' }
    });

    // حساب أعمار الجلسة بالثواني
    const durations = sessions.map(session => {
      if (session.duration) {
        return session.duration;
      }
      // حساب المدة من البداية والنهاية إذا لم تكن محفوظة
      if (session.end_time) {
        return Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000);
      }
      return 0;
    }).filter(d => d > 0);

    // تعريف فئات الأعمار (بالثواني)
    const buckets = [
      { max: 30, label: 'أقل من 30 ثانية', color: '#ef4444' },
      { max: 60, label: '30 ثانية - دقيقة', color: '#f97316' },
      { max: 180, label: '1 - 3 دقائق', color: '#eab308' },
      { max: 600, label: '3 - 10 دقائق', color: '#22c55e' },
      { max: 1800, label: '10 - 30 دقيقة', color: '#3b82f6' },
      { max: 3600, label: '30 - 60 دقيقة', color: '#8b5cf6' },
      { max: Infinity, label: 'أكثر من ساعة', color: '#ec4899' }
    ];

    // توزيع الجلسات على الفئات
    const distribution = buckets.map((bucket, index) => {
      const prevMax = index > 0 ? buckets[index - 1].max : 0;
      const count = durations.filter(d => d > prevMax && d <= bucket.max).length;
      const percentage = durations.length > 0 ? Math.round((count / durations.length) * 100) : 0;
      
      return {
        label: bucket.label,
        count,
        percentage,
        color: bucket.color,
        range: {
          min: prevMax,
          max: bucket.max === Infinity ? null : bucket.max
        }
      };
    });

    // إحصائيات إضافية
    const stats = {
      totalSessions: sessions.length,
      validDurations: durations.length,
      averageDuration: durations.length > 0 ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) : 0,
      medianDuration: durations.length > 0 ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      bounceRate: sessions.length > 0 ? Math.round((sessions.filter(s => s.is_bounce).length / sessions.length) * 100) : 0
    };

    // تحليل حسب نوع الجهاز
    const deviceAnalysis = sessions.reduce((acc, session) => {
      const device = session.device_type || 'غير محدد';
      if (!acc[device]) {
        acc[device] = { count: 0, totalDuration: 0, avgPageViews: 0 };
      }
      acc[device].count++;
      acc[device].totalDuration += session.duration || 0;
      acc[device].avgPageViews += session.page_views || 0;
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number; avgPageViews: number }>);

    // تحويل تحليل الأجهزة لتنسيق أفضل
    const deviceStats = Object.entries(deviceAnalysis).map(([device, data]) => ({
      device,
      count: data.count,
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      avgPageViews: data.count > 0 ? Math.round(data.avgPageViews / data.count) : 0,
      percentage: sessions.length > 0 ? Math.round((data.count / sessions.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // تحليل حسب المتصفح
    const browserAnalysis = sessions.reduce((acc, session) => {
      const browser = session.browser || 'غير محدد';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserStats = Object.entries(browserAnalysis).map(([browser, count]) => ({
      browser,
      count,
      percentage: sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        distribution,
        stats,
        deviceStats,
        browserStats,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing session duration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/session-duration
 * تحليل مخصص لأعمار الجلسة
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customBuckets, 
      filters = {}, 
      groupBy = null,
      startDate,
      endDate 
    } = body;

    // بناء شروط الاستعلام
    const whereClause: any = {};
    
    if (startDate) whereClause.start_time = { gte: new Date(startDate) };
    if (endDate) whereClause.end_time = { lte: new Date(endDate) };
    if (filters.deviceType) whereClause.device_type = filters.deviceType;
    if (filters.browser) whereClause.browser = filters.browser;
    if (filters.minDuration) whereClause.duration = { gte: filters.minDuration };
    if (filters.maxDuration) whereClause.duration = { ...whereClause.duration, lte: filters.maxDuration };

    // جلب الجلسات المفلترة
    const sessions = await prisma.userSession.findMany({
      where: whereClause,
      select: {
        duration: true,
        device_type: true,
        browser: true,
        page_views: true,
        is_bounce: true,
        start_time: true,
        country: true
      },
      take: 20000
    });

    let result: any = {
      totalSessions: sessions.length,
      filters: filters
    };

    // تحليل مخصص حسب التجميع
    if (groupBy) {
      const grouped = sessions.reduce((acc, session) => {
        let key = 'غير محدد';
        
        switch (groupBy) {
          case 'device':
            key = session.device_type || 'غير محدد';
            break;
          case 'browser':
            key = session.browser || 'غير محدد';
            break;
          case 'country':
            key = session.country || 'غير محدد';
            break;
          case 'hour':
            key = new Date(session.start_time).getHours().toString();
            break;
          case 'day':
            key = new Date(session.start_time).toISOString().split('T')[0];
            break;
        }

        if (!acc[key]) {
          acc[key] = { sessions: [], count: 0 };
        }
        acc[key].sessions.push(session);
        acc[key].count++;
        return acc;
      }, {} as Record<string, { sessions: any[]; count: number }>);

      result.groupedAnalysis = Object.entries(grouped).map(([key, data]) => ({
        group: key,
        count: data.count,
        avgDuration: data.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / data.count,
        avgPageViews: data.sessions.reduce((sum, s) => sum + (s.page_views || 0), 0) / data.count,
        bounceRate: Math.round((data.sessions.filter(s => s.is_bounce).length / data.count) * 100)
      })).sort((a, b) => b.count - a.count);
    }

    // تحليل بفئات مخصصة
    if (customBuckets && Array.isArray(customBuckets)) {
      const durations = sessions.map(s => s.duration || 0).filter(d => d > 0);
      
      result.customDistribution = customBuckets.map((bucket, index) => {
        const prevMax = index > 0 ? customBuckets[index - 1].max : 0;
        const count = durations.filter(d => d > prevMax && d <= bucket.max).length;
        
        return {
          label: bucket.label,
          count,
          percentage: durations.length > 0 ? Math.round((count / durations.length) * 100) : 0,
          range: { min: prevMax, max: bucket.max }
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in custom session duration analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * تنسيق الوقت لعرض أفضل
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`;
  return `${Math.round(seconds / 3600)} ساعة`;
} 