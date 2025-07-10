/**
 * API إحصائيات التكاملات - Sabq AI CMS
 * يوفر تحليل شامل لأداء واستخدام التكاملات الخارجية
 * 
 * @author Sabq AI Team
 * @date 2024-01-20
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { validatePermission } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';
import { performanceAnalyzer } from '@/lib/performance-analyzer';
import { costCalculator } from '@/lib/cost-calculator';
import { trendAnalyzer } from '@/lib/trend-analyzer';

// Schema للاستعلام عن الإحصائيات
const statsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d', '90d', '1y']).optional().default('7d'),
  granularity: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().default('day'),
  metrics: z.array(z.enum([
    'requests',
    'response_time',
    'errors',
    'availability',
    'throughput',
    'cost',
    'reliability',
    'security',
    'all'
  ])).optional().default(['all']),
  includeComparison: z.boolean().optional().default(false),
  includePrediction: z.boolean().optional().default(false),
  format: z.enum(['json', 'csv', 'excel']).optional().default('json'),
});

// Types للاستجابة
interface StatsResponse {
  success: boolean;
  message: string;
  data?: {
    integrationId: string;
    integrationName: string;
    timeRange: string;
    granularity: string;
    generatedAt: string;
    summary: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRate: number;
      averageResponseTime: number;
      availability: number;
      totalCost: number;
      reliabilityScore: number;
      securityScore: number;
      uptime: number;
      downtime: number;
      errorRate: number;
      throughput: number;
    };
    timeSeries: {
      requests: Array<{
        timestamp: string;
        value: number;
        successful: number;
        failed: number;
      }>;
      responseTime: Array<{
        timestamp: string;
        average: number;
        min: number;
        max: number;
        p95: number;
        p99: number;
      }>;
      errors: Array<{
        timestamp: string;
        count: number;
        rate: number;
        types: Record<string, number>;
      }>;
      availability: Array<{
        timestamp: string;
        uptime: number;
        downtime: number;
        percentage: number;
      }>;
      throughput: Array<{
        timestamp: string;
        requestsPerSecond: number;
        dataTransferred: number;
        bandwidth: number;
      }>;
      cost: Array<{
        timestamp: string;
        amount: number;
        currency: string;
        breakdown: Record<string, number>;
      }>;
    };
    breakdown: {
      byEndpoint: Array<{
        endpoint: string;
        requests: number;
        successRate: number;
        avgResponseTime: number;
        errorRate: number;
      }>;
      byMethod: Record<string, {
        requests: number;
        successRate: number;
        avgResponseTime: number;
      }>;
      byStatus: Record<string, number>;
      byErrorType: Record<string, number>;
      byRegion: Record<string, {
        requests: number;
        responseTime: number;
      }>;
    };
    comparison?: {
      previousPeriod: {
        requests: number;
        successRate: number;
        responseTime: number;
        availability: number;
        cost: number;
      };
      changes: {
        requests: { value: number; percentage: number; };
        successRate: { value: number; percentage: number; };
        responseTime: { value: number; percentage: number; };
        availability: { value: number; percentage: number; };
        cost: { value: number; percentage: number; };
      };
    };
    prediction?: {
      nextPeriod: {
        requests: number;
        responseTime: number;
        cost: number;
        availability: number;
      };
      confidence: number;
      factors: string[];
    };
    alerts: Array<{
      type: string;
      severity: string;
      message: string;
      threshold: number;
      currentValue: number;
      timestamp: string;
    }>;
    recommendations: Array<{
      type: string;
      priority: string;
      description: string;
      impact: string;
      effort: string;
    }>;
  };
  errors?: Record<string, string>;
}

/**
 * GET /api/integrations/[id]/stats
 * جلب إحصائيات التكامل
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<StatsResponse>> {
  try {
    const { id } = params;

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'INTEGRATIONS_READ_STATS')) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'غير مصرح لك بعرض إحصائيات التكاملات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `integration_stats:${user.id}`,
      limit: 20,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'تم تجاوز حد طلبات الإحصائيات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // قراءة معاملات الاستعلام
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // تحويل المعاملات إلى النوع المناسب
    if (queryParams.metrics) {
      queryParams.metrics = queryParams.metrics.split(',');
    }
    if (queryParams.includeComparison) {
      queryParams.includeComparison = queryParams.includeComparison === 'true';
    }
    if (queryParams.includePrediction) {
      queryParams.includePrediction = queryParams.includePrediction === 'true';
    }

    const validationResult = statsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'معاملات الاستعلام غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const query = validationResult.data;

    // التحقق من وجود التكامل
    const integration = await prisma.integration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!integration) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // تحديد الفترة الزمنية
    const timeRange = calculateTimeRange(query.timeRange);

    // جمع البيانات الإحصائية
    const [
      summaryStats,
      timeSeriesData,
      breakdownData,
      comparisonData,
      predictionData,
      alertsData,
      recommendationsData,
    ] = await Promise.all([
      getSummaryStats(id, timeRange),
      getTimeSeriesData(id, timeRange, query.granularity, query.metrics),
      getBreakdownData(id, timeRange),
      query.includeComparison ? getComparisonData(id, timeRange) : null,
      query.includePrediction ? getPredictionData(id, timeRange) : null,
      getAlertsData(id, timeRange),
      getRecommendationsData(id, timeRange),
    ]);

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_STATS_VIEWED',
      userId: user.id,
      resourceId: integration.id,
      resourceType: 'integration',
      details: {
        timeRange: query.timeRange,
        granularity: query.granularity,
        metrics: query.metrics,
        includeComparison: query.includeComparison,
        includePrediction: query.includePrediction,
      },
    });

    // تحضير البيانات للاستجابة
    const responseData = {
      integrationId: integration.id,
      integrationName: integration.name,
      timeRange: query.timeRange,
      granularity: query.granularity,
      generatedAt: new Date().toISOString(),
      summary: summaryStats,
      timeSeries: timeSeriesData,
      breakdown: breakdownData,
      ...(comparisonData && { comparison: comparisonData }),
      ...(predictionData && { prediction: predictionData }),
      alerts: alertsData,
      recommendations: recommendationsData,
    };

    return NextResponse.json<StatsResponse>({
      success: true,
      message: 'تم جلب إحصائيات التكامل بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في جلب إحصائيات التكامل:', error);

    return NextResponse.json<StatsResponse>({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * POST /api/integrations/[id]/stats
 * إنشاء تقرير إحصائيات مخصص
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<StatsResponse>> {
  try {
    const { id } = params;

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'INTEGRATIONS_CREATE_REPORTS')) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'غير مصرح لك بإنشاء تقارير التكاملات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = statsQuerySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'معاملات التقرير غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const query = validationResult.data;

    // التحقق من وجود التكامل
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json<StatsResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // إنشاء تقرير مخصص
    const reportId = crypto.randomUUID();
    const timeRange = calculateTimeRange(query.timeRange);

    // إنشاء سجل التقرير
    const report = await prisma.integrationReport.create({
      data: {
        id: reportId,
        integrationId: id,
        type: 'custom',
        parameters: query,
        status: 'generating',
        createdBy: user.id,
        createdAt: new Date(),
      },
    });

    // إنشاء التقرير في الخلفية
    generateCustomReport(reportId, integration, query, timeRange, user.id);

    return NextResponse.json<StatsResponse>({
      success: true,
      message: 'تم بدء إنشاء التقرير المخصص',
      data: {
        integrationId: integration.id,
        integrationName: integration.name,
        timeRange: query.timeRange,
        granularity: query.granularity,
        generatedAt: new Date().toISOString(),
        summary: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 0,
          averageResponseTime: 0,
          availability: 0,
          totalCost: 0,
          reliabilityScore: 0,
          securityScore: 0,
          uptime: 0,
          downtime: 0,
          errorRate: 0,
          throughput: 0,
        },
        timeSeries: {
          requests: [],
          responseTime: [],
          errors: [],
          availability: [],
          throughput: [],
          cost: [],
        },
        breakdown: {
          byEndpoint: [],
          byMethod: {},
          byStatus: {},
          byErrorType: {},
          byRegion: {},
        },
        alerts: [],
        recommendations: [],
      },
    });

  } catch (error) {
    console.error('خطأ في إنشاء التقرير المخصص:', error);

    return NextResponse.json<StatsResponse>({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التقرير',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * حساب الفترة الزمنية
 */
function calculateTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '1h':
      startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

/**
 * جلب الإحصائيات الملخصة
 */
async function getSummaryStats(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any> {
  const [
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime,
    availability,
    totalCost,
  ] = await Promise.all([
    prisma.integrationUsageLog.count({
      where: {
        integrationId,
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
    }),
    prisma.integrationUsageLog.count({
      where: {
        integrationId,
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
        success: true,
      },
    }),
    prisma.integrationUsageLog.count({
      where: {
        integrationId,
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
        success: false,
      },
    }),
    prisma.integrationUsageLog.aggregate({
      where: {
        integrationId,
        timestamp: {
          gte: timeRange.startDate,
          lte: timeRange.endDate,
        },
      },
      _avg: {
        responseTime: true,
      },
    }),
    calculateAvailability(integrationId, timeRange),
    calculateTotalCost(integrationId, timeRange),
  ]);

  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: Math.round(successRate * 100) / 100,
    averageResponseTime: Math.round((avgResponseTime._avg.responseTime || 0) * 100) / 100,
    availability: Math.round(availability * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    reliabilityScore: Math.round(((successRate + availability) / 2) * 100) / 100,
    securityScore: 85, // يمكن حسابها من فحوصات الأمان
    uptime: Math.round((availability / 100) * (timeRange.endDate.getTime() - timeRange.startDate.getTime())),
    downtime: Math.round(((100 - availability) / 100) * (timeRange.endDate.getTime() - timeRange.startDate.getTime())),
    errorRate: Math.round(errorRate * 100) / 100,
    throughput: Math.round(totalRequests / ((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / 1000)),
  };
}

/**
 * جلب البيانات الزمنية
 */
async function getTimeSeriesData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date },
  granularity: string,
  metrics: string[]
): Promise<any> {
  // هذا مثال مبسط - يمكن تحسينه بناءً على نوع قاعدة البيانات
  const timeSeries = {
    requests: [],
    responseTime: [],
    errors: [],
    availability: [],
    throughput: [],
    cost: [],
  };

  // يمكن إضافة تنفيذ مفصل لكل نوع من البيانات الزمنية
  return timeSeries;
}

/**
 * جلب بيانات التفصيل
 */
async function getBreakdownData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any> {
  const breakdown = {
    byEndpoint: [],
    byMethod: {},
    byStatus: {},
    byErrorType: {},
    byRegion: {},
  };

  // يمكن إضافة تنفيذ مفصل لكل نوع من التفصيل
  return breakdown;
}

/**
 * جلب بيانات المقارنة
 */
async function getComparisonData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any> {
  // حساب الفترة السابقة
  const timeDiff = timeRange.endDate.getTime() - timeRange.startDate.getTime();
  const previousTimeRange = {
    startDate: new Date(timeRange.startDate.getTime() - timeDiff),
    endDate: timeRange.startDate,
  };

  const [currentStats, previousStats] = await Promise.all([
    getSummaryStats(integrationId, timeRange),
    getSummaryStats(integrationId, previousTimeRange),
  ]);

  const calculateChange = (current: number, previous: number) => {
    const value = current - previous;
    const percentage = previous > 0 ? (value / previous) * 100 : 0;
    return { value, percentage };
  };

  return {
    previousPeriod: previousStats,
    changes: {
      requests: calculateChange(currentStats.totalRequests, previousStats.totalRequests),
      successRate: calculateChange(currentStats.successRate, previousStats.successRate),
      responseTime: calculateChange(currentStats.averageResponseTime, previousStats.averageResponseTime),
      availability: calculateChange(currentStats.availability, previousStats.availability),
      cost: calculateChange(currentStats.totalCost, previousStats.totalCost),
    },
  };
}

/**
 * جلب بيانات التنبؤ
 */
async function getPredictionData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any> {
  // استخدام نموذج التنبؤ
  const prediction = await trendAnalyzer.predictTrends(integrationId, timeRange);
  
  return {
    nextPeriod: prediction.nextPeriod,
    confidence: prediction.confidence,
    factors: prediction.factors,
  };
}

/**
 * جلب بيانات التنبيهات
 */
async function getAlertsData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any[]> {
  const alerts = await prisma.integrationAlert.findMany({
    where: {
      integrationId,
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  return alerts.map(alert => ({
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    threshold: alert.threshold,
    currentValue: alert.currentValue,
    timestamp: alert.timestamp.toISOString(),
  }));
}

/**
 * جلب بيانات التوصيات
 */
async function getRecommendationsData(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<any[]> {
  // تحليل البيانات وإنشاء التوصيات
  const recommendations = await performanceAnalyzer.generateRecommendations(integrationId, timeRange);
  
  return recommendations.map(rec => ({
    type: rec.type,
    priority: rec.priority,
    description: rec.description,
    impact: rec.impact,
    effort: rec.effort,
  }));
}

/**
 * حساب معدل التوفر
 */
async function calculateAvailability(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<number> {
  const healthLogs = await prisma.integrationHealthLog.findMany({
    where: {
      integrationId,
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    },
  });

  if (healthLogs.length === 0) return 0;

  const healthyCount = healthLogs.filter(log => log.status === 'healthy').length;
  return (healthyCount / healthLogs.length) * 100;
}

/**
 * حساب إجمالي التكلفة
 */
async function calculateTotalCost(
  integrationId: string,
  timeRange: { startDate: Date; endDate: Date }
): Promise<number> {
  const usage = await prisma.integrationUsageLog.findMany({
    where: {
      integrationId,
      timestamp: {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      },
    },
  });

  return costCalculator.calculateCost(integrationId, usage);
}

/**
 * إنشاء تقرير مخصص في الخلفية
 */
async function generateCustomReport(
  reportId: string,
  integration: any,
  query: any,
  timeRange: { startDate: Date; endDate: Date },
  userId: string
): Promise<void> {
  try {
    // يمكن إضافة تنفيذ مفصل لإنشاء التقرير
    await prisma.integrationReport.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('خطأ في إنشاء التقرير:', error);
    
    await prisma.integrationReport.update({
      where: { id: reportId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
} 