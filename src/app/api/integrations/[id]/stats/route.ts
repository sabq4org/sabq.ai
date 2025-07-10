/**
 * API Routes for Integration Statistics
 * 
 * @description Provides detailed statistics and metrics for specific integration
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';
import { validateUserPermissions } from '@/lib/permissions';

// Validation schemas
const paramsSchema = z.object({
  id: z.string().uuid('معرف التكامل غير صحيح'),
});

const statsQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).default('day'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  metrics: z.array(z.enum(['usage', 'errors', 'performance', 'costs'])).optional(),
});

/**
 * Helper function to get integration statistics
 */
async function getIntegrationStats(integrationId: string, period: string, from?: string, to?: string) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
  
  const startDate = from ? new Date(from) : defaultFrom;
  const endDate = to ? new Date(to) : now;

  // Get basic integration info
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          auditLogs: true,
        },
      },
    },
  });

  if (!integration) {
    throw new Error('التكامل غير موجود');
  }

  // Get usage statistics
  const usageStats = await prisma.auditLog.groupBy({
    by: ['action', 'createdAt'],
    where: {
      resource: 'integrations',
      resourceId: integrationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      action: true,
    },
  });

  // Get error statistics
  const errorStats = await prisma.auditLog.groupBy({
    by: ['action', 'createdAt'],
    where: {
      resource: 'integrations',
      resourceId: integrationId,
      action: {
        contains: 'ERROR',
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      action: true,
    },
  });

  // Get performance data from test results
  const performanceData = await prisma.integration.findUnique({
    where: { id: integrationId },
    select: {
      testResults: true,
      lastTestedAt: true,
      isHealthy: true,
    },
  });

  // Calculate metrics based on period
  const getDateKey = (date: Date) => {
    switch (period) {
      case 'hour':
        return date.toISOString().slice(0, 13) + ':00:00.000Z';
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'month':
        return date.toISOString().slice(0, 7);
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toISOString().slice(0, 10);
    }
  };

  // Group usage by period
  const usageByPeriod = usageStats.reduce((acc, stat) => {
    const key = getDateKey(stat.createdAt);
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += stat._count.action;
    return acc;
  }, {} as Record<string, number>);

  // Group errors by period
  const errorsByPeriod = errorStats.reduce((acc, stat) => {
    const key = getDateKey(stat.createdAt);
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += stat._count.action;
    return acc;
  }, {} as Record<string, number>);

  // Calculate uptime percentage
  const totalTests = await prisma.auditLog.count({
    where: {
      resource: 'integrations',
      resourceId: integrationId,
      action: 'TEST_INTEGRATION',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const successfulTests = await prisma.auditLog.count({
    where: {
      resource: 'integrations',
      resourceId: integrationId,
      action: 'TEST_INTEGRATION',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      metadata: {
        path: ['success'],
        equals: true,
      },
    },
  });

  const uptime = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

  // Get recent audit logs
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      resource: 'integrations',
      resourceId: integrationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Calculate costs (if available in configuration)
  const costCalculation = {
    totalCost: 0,
    costByPeriod: {} as Record<string, number>,
    currency: 'USD',
  };

  if (integration.configuration?.costPerRequest) {
    const totalRequests = Object.values(usageByPeriod).reduce((sum, count) => sum + count, 0);
    costCalculation.totalCost = totalRequests * integration.configuration.costPerRequest;
    
    Object.entries(usageByPeriod).forEach(([period, requests]) => {
      costCalculation.costByPeriod[period] = requests * integration.configuration.costPerRequest;
    });
  }

  return {
    integration: {
      id: integration.id,
      name: integration.name,
      provider: integration.provider,
      type: integration.type,
      isActive: integration.isActive,
      isHealthy: integration.isHealthy,
      createdAt: integration.createdAt,
      lastTestedAt: integration.lastTestedAt,
      createdBy: integration.createdBy,
    },
    summary: {
      totalUsage: Object.values(usageByPeriod).reduce((sum, count) => sum + count, 0),
      totalErrors: Object.values(errorsByPeriod).reduce((sum, count) => sum + count, 0),
      uptime,
      totalTests,
      successfulTests,
      lastTestResult: performanceData?.testResults,
      totalCost: costCalculation.totalCost,
    },
    metrics: {
      usage: usageByPeriod,
      errors: errorsByPeriod,
      costs: costCalculation.costByPeriod,
    },
    performance: {
      isHealthy: integration.isHealthy,
      lastTestedAt: integration.lastTestedAt,
      testResults: performanceData?.testResults,
      uptime,
    },
    recentActivity,
    period: {
      type: period,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
}

/**
 * GET /api/integrations/[id]/stats
 * Gets detailed statistics for a specific integration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Permission check
    const hasPermission = await validateUserPermissions(
      session.user.id,
      'integrations',
      'read'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لعرض إحصائيات التكاملات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = statsQuerySchema.parse(queryParams);

    // Get integration statistics
    const stats = await getIntegrationStats(
      validatedParams.id,
      validatedQuery.period,
      validatedQuery.from,
      validatedQuery.to
    );

    // Filter metrics if specific metrics are requested
    if (validatedQuery.metrics) {
      const filteredMetrics = {} as any;
      validatedQuery.metrics.forEach(metric => {
        if (stats.metrics[metric]) {
          filteredMetrics[metric] = stats.metrics[metric];
        }
      });
      stats.metrics = filteredMetrics;
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'VIEW_INTEGRATION_STATS',
      resource: 'integrations',
      resourceId: validatedParams.id,
      metadata: {
        integrationName: stats.integration.name,
        provider: stats.integration.provider,
        period: validatedQuery.period,
        metrics: validatedQuery.metrics,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'تم جلب إحصائيات التكامل بنجاح',
    });

  } catch (error) {
    console.error('Error fetching integration stats:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'VIEW_INTEGRATION_STATS_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في جلب إحصائيات التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/[id]/stats
 * Manually triggers statistics recalculation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Permission check (requires admin level)
    const hasPermission = await validateUserPermissions(
      session.user.id,
      'integrations',
      'admin'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لإعادة حساب الإحصائيات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check if integration exists
    const integration = await prisma.integration.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!integration) {
      return NextResponse.json(
        { error: 'التكامل غير موجود' },
        { status: 404 }
      );
    }

    // Trigger stats recalculation
    const stats = await getIntegrationStats(
      validatedParams.id,
      'day',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    // Update integration with calculated stats
    await prisma.integration.update({
      where: { id: validatedParams.id },
      data: {
        statsLastCalculatedAt: new Date(),
        cachedStats: stats,
        updatedAt: new Date(),
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'RECALCULATE_INTEGRATION_STATS',
      resource: 'integrations',
      resourceId: validatedParams.id,
      metadata: {
        integrationName: integration.name,
        provider: integration.provider,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        integrationId: validatedParams.id,
        statsRecalculatedAt: new Date().toISOString(),
        summary: stats.summary,
      },
      message: 'تم إعادة حساب إحصائيات التكامل بنجاح',
    });

  } catch (error) {
    console.error('Error recalculating integration stats:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معرف التكامل غير صحيح',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'RECALCULATE_INTEGRATION_STATS_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في إعادة حساب إحصائيات التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 