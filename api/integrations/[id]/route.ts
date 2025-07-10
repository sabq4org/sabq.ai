/**
 * API التكاملات الفردية - Sabq AI CMS
 * يوفر إدارة التكاملات الفردية مع عمليات CRUD متقدمة
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
import { encryptSensitiveData, decryptSensitiveData } from '@/lib/crypto';
import { integrationHealthCheck } from '@/lib/integration-health';
import { notificationService } from '@/lib/notifications';
import { integrationBackup } from '@/lib/integration-backup';

// Schema للتحديث
const updateIntegrationSchema = z.object({
  name: z.string().min(1, 'اسم التكامل مطلوب').max(100, 'اسم التكامل طويل جداً').optional(),
  type: z.enum([
    'CDN',
    'STORAGE',
    'EMAIL',
    'SMS',
    'PAYMENT',
    'ANALYTICS',
    'SOCIAL_MEDIA',
    'SEARCH',
    'AI_SERVICE',
    'WEBHOOK',
    'API',
    'DATABASE',
    'MONITORING',
    'SECURITY',
    'BACKUP',
    'NOTIFICATION',
    'CUSTOM'
  ]).optional(),
  provider: z.string().min(1, 'المزود مطلوب').max(100, 'اسم المزود طويل جداً').optional(),
  description: z.string().max(500, 'الوصف طويل جداً').optional(),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.string()).optional(),
  endpoints: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    headers: z.record(z.string()).optional(),
    timeout: z.number().optional(),
  })).optional(),
  webhooks: z.array(z.object({
    event: z.string(),
    url: z.string().url(),
    secret: z.string().optional(),
    headers: z.record(z.string()).optional(),
  })).optional(),
  rateLimits: z.object({
    requestsPerMinute: z.number().optional(),
    requestsPerHour: z.number().optional(),
    requestsPerDay: z.number().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Types للاستجابة
interface IntegrationResponse {
  success: boolean;
  message: string;
  data?: {
    integration: {
      id: string;
      name: string;
      type: string;
      provider: string;
      description: string;
      config: Record<string, any>;
      endpoints: Array<{
        name: string;
        url: string;
        method: string;
        headers?: Record<string, string>;
        timeout?: number;
      }>;
      webhooks: Array<{
        event: string;
        url: string;
        headers?: Record<string, string>;
      }>;
      rateLimits: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
        requestsPerDay?: number;
      };
      isActive: boolean;
      priority: number;
      tags: string[];
      metadata: Record<string, any>;
      health: {
        status: string;
        lastCheck: string;
        responseTime: number;
        uptime: number;
        errors: string[];
        history: Array<{
          timestamp: string;
          status: string;
          responseTime: number;
          error?: string;
        }>;
      };
      usage: {
        totalRequests: number;
        successRequests: number;
        failedRequests: number;
        avgResponseTime: number;
        lastUsed: string;
        dailyStats: Array<{
          date: string;
          requests: number;
          successRate: number;
          avgResponseTime: number;
        }>;
      };
      credentials?: Record<string, string>;
      createdAt: string;
      updatedAt: string;
      createdBy: {
        id: string;
        fullName: string;
        username: string;
      };
    };
  };
  errors?: Record<string, string>;
}

/**
 * GET /api/integrations/[id]
 * جلب تكامل واحد بالتفصيل
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<IntegrationResponse>> {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeCredentials = searchParams.get('include_credentials') === 'true';
    const includeHealth = searchParams.get('include_health') === 'true';
    const includeUsage = searchParams.get('include_usage') === 'true';

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'INTEGRATIONS_READ')) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'غير مصرح لك بعرض التكاملات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // جلب التكامل
    const integration = await prisma.integration.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // التحقق من الأذونات للبيانات الحساسة
    let decryptedCredentials = null;
    if (includeCredentials && await validatePermission(user, 'INTEGRATIONS_READ_CREDENTIALS')) {
      if (integration.credentials) {
        decryptedCredentials = await decryptSensitiveData(integration.credentials);
      }
    }

    // جلب بيانات الصحة
    let healthData = {
      status: integration.healthStatus || 'unknown',
      lastCheck: integration.lastHealthCheck?.toISOString() || '',
      responseTime: integration.avgResponseTime || 0,
      uptime: 0,
      errors: [],
      history: [],
    };

    if (includeHealth) {
      const healthHistory = await prisma.integrationHealthLog.findMany({
        where: { integrationId: id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      healthData.history = healthHistory.map(log => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        responseTime: log.responseTime,
        error: log.error,
      }));

      // حساب وقت التشغيل
      const totalChecks = healthHistory.length;
      const healthyChecks = healthHistory.filter(log => log.status === 'healthy').length;
      healthData.uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;
    }

    // جلب بيانات الاستخدام
    let usageData = {
      totalRequests: integration.totalRequests || 0,
      successRequests: integration.successRequests || 0,
      failedRequests: integration.failedRequests || 0,
      avgResponseTime: integration.avgResponseTime || 0,
      lastUsed: integration.lastUsed?.toISOString() || '',
      dailyStats: [],
    };

    if (includeUsage) {
      const usageStats = await prisma.integrationUsageLog.findMany({
        where: { 
          integrationId: id,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // آخر 30 يوم
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      // تجميع الإحصائيات اليومية
      const dailyStats = usageStats.reduce((acc, log) => {
        const date = log.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { requests: 0, successCount: 0, totalResponseTime: 0 };
        }
        acc[date].requests++;
        if (log.success) acc[date].successCount++;
        acc[date].totalResponseTime += log.responseTime;
        return acc;
      }, {} as Record<string, any>);

      usageData.dailyStats = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        requests: stats.requests,
        successRate: (stats.successCount / stats.requests) * 100,
        avgResponseTime: stats.totalResponseTime / stats.requests,
      }));
    }

    // تحضير البيانات للاستجابة
    const responseData = {
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        description: integration.description,
        config: integration.config,
        endpoints: integration.endpoints || [],
        webhooks: integration.webhooks?.map(webhook => ({
          event: webhook.event,
          url: webhook.url,
          headers: webhook.headers,
        })) || [],
        rateLimits: integration.rateLimits || {},
        isActive: integration.isActive,
        priority: integration.priority,
        tags: integration.tags,
        metadata: integration.metadata,
        health: healthData,
        usage: usageData,
        ...(decryptedCredentials && { credentials: decryptedCredentials }),
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
        createdBy: integration.creator,
      },
    };

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_VIEWED',
      userId: user.id,
      resourceId: integration.id,
      resourceType: 'integration',
      details: {
        name: integration.name,
        includeCredentials,
        includeHealth,
        includeUsage,
      },
    });

    return NextResponse.json<IntegrationResponse>({
      success: true,
      message: 'تم جلب التكامل بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في جلب التكامل:', error);

    return NextResponse.json<IntegrationResponse>({
      success: false,
      message: 'حدث خطأ أثناء جلب التكامل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * PUT /api/integrations/[id]
 * تحديث تكامل موجود
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<IntegrationResponse>> {
  try {
    const { id } = params;

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `update_integration:${user.id}`,
      limit: 10,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'تم تجاوز حد تحديث التكاملات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // التحقق من وجود التكامل
    const existingIntegration = await prisma.integration.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!existingIntegration) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // التحقق من الأذونات
    const canEdit = existingIntegration.createdBy === user.id || 
                   await validatePermission(user, 'INTEGRATIONS_EDIT_ALL');

    if (!canEdit) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'غير مصرح لك بتعديل هذا التكامل',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = updateIntegrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'بيانات التحديث غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const updateData = validationResult.data;

    // إنشاء نسخة احتياطية قبل التحديث
    await integrationBackup.createBackup(existingIntegration);

    // تشفير البيانات الحساسة الجديدة
    let encryptedCredentials = existingIntegration.credentials;
    if (updateData.credentials) {
      encryptedCredentials = await encryptSensitiveData(updateData.credentials);
    }

    // تحديث التكامل
    const updatedIntegration = await prisma.integration.update({
      where: { id },
      data: {
        ...updateData,
        ...(encryptedCredentials && { credentials: encryptedCredentials }),
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    // إجراء فحص صحة جديد إذا تم تحديث الإعدادات
    let healthCheck = null;
    if (updateData.config || updateData.endpoints || updateData.credentials) {
      healthCheck = await integrationHealthCheck.performCheck(updatedIntegration);
      
      await prisma.integration.update({
        where: { id },
        data: {
          healthStatus: healthCheck.status,
          lastHealthCheck: new Date(),
          avgResponseTime: healthCheck.responseTime,
        },
      });
    }

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_UPDATED',
      userId: user.id,
      resourceId: updatedIntegration.id,
      resourceType: 'integration',
      details: {
        name: updatedIntegration.name,
        changes: updateData,
        previousData: {
          name: existingIntegration.name,
          isActive: existingIntegration.isActive,
          priority: existingIntegration.priority,
        },
        healthCheck: healthCheck ? {
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
        } : null,
      },
    });

    // إرسال إشعار بالتحديث
    await notificationService.sendIntegrationUpdatedNotification(
      updatedIntegration,
      user,
      updateData
    );

    // تحضير البيانات للاستجابة
    const responseData = {
      integration: {
        id: updatedIntegration.id,
        name: updatedIntegration.name,
        type: updatedIntegration.type,
        provider: updatedIntegration.provider,
        description: updatedIntegration.description,
        config: updatedIntegration.config,
        endpoints: updatedIntegration.endpoints || [],
        webhooks: updatedIntegration.webhooks?.map(webhook => ({
          event: webhook.event,
          url: webhook.url,
          headers: webhook.headers,
        })) || [],
        rateLimits: updatedIntegration.rateLimits || {},
        isActive: updatedIntegration.isActive,
        priority: updatedIntegration.priority,
        tags: updatedIntegration.tags,
        metadata: updatedIntegration.metadata,
        health: {
          status: healthCheck?.status || updatedIntegration.healthStatus || 'unknown',
          lastCheck: new Date().toISOString(),
          responseTime: healthCheck?.responseTime || updatedIntegration.avgResponseTime || 0,
          uptime: 0,
          errors: healthCheck?.errors || [],
          history: [],
        },
        usage: {
          totalRequests: updatedIntegration.totalRequests || 0,
          successRequests: updatedIntegration.successRequests || 0,
          failedRequests: updatedIntegration.failedRequests || 0,
          avgResponseTime: updatedIntegration.avgResponseTime || 0,
          lastUsed: updatedIntegration.lastUsed?.toISOString() || '',
          dailyStats: [],
        },
        createdAt: updatedIntegration.createdAt.toISOString(),
        updatedAt: updatedIntegration.updatedAt.toISOString(),
        createdBy: updatedIntegration.creator,
      },
    };

    return NextResponse.json<IntegrationResponse>({
      success: true,
      message: 'تم تحديث التكامل بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في تحديث التكامل:', error);

    return NextResponse.json<IntegrationResponse>({
      success: false,
      message: 'حدث خطأ أثناء تحديث التكامل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations/[id]
 * حذف تكامل
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<IntegrationResponse>> {
  try {
    const { id } = params;

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من وجود التكامل
    const existingIntegration = await prisma.integration.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!existingIntegration) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // التحقق من الأذونات
    const canDelete = existingIntegration.createdBy === user.id || 
                     await validatePermission(user, 'INTEGRATIONS_DELETE_ALL');

    if (!canDelete) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'غير مصرح لك بحذف هذا التكامل',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من التبعيات
    const dependentIntegrations = await prisma.integration.findMany({
      where: {
        metadata: {
          path: ['dependencies'],
          array_contains: id,
        },
      },
    });

    if (dependentIntegrations.length > 0) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'لا يمكن حذف التكامل لأنه مرتبط بتكاملات أخرى',
        errors: { 
          dependencies: 'integration_has_dependencies',
          dependentIntegrations: dependentIntegrations.map(dep => dep.name),
        },
      }, { status: 409 });
    }

    // إنشاء نسخة احتياطية نهائية
    await integrationBackup.createBackup(existingIntegration, 'before_deletion');

    // حذف السجلات المرتبطة
    await Promise.all([
      prisma.integrationHealthLog.deleteMany({
        where: { integrationId: id },
      }),
      prisma.integrationUsageLog.deleteMany({
        where: { integrationId: id },
      }),
    ]);

    // حذف التكامل (soft delete)
    await prisma.integration.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
        isActive: false,
      },
    });

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_DELETED',
      userId: user.id,
      resourceId: existingIntegration.id,
      resourceType: 'integration',
      details: {
        name: existingIntegration.name,
        type: existingIntegration.type,
        provider: existingIntegration.provider,
        wasActive: existingIntegration.isActive,
      },
    });

    // إرسال إشعار بالحذف
    await notificationService.sendIntegrationDeletedNotification(
      existingIntegration,
      user
    );

    return NextResponse.json<IntegrationResponse>({
      success: true,
      message: 'تم حذف التكامل بنجاح',
    });

  } catch (error) {
    console.error('خطأ في حذف التكامل:', error);

    return NextResponse.json<IntegrationResponse>({
      success: false,
      message: 'حدث خطأ أثناء حذف التكامل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
} 