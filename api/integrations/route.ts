/**
 * API التكاملات الخارجية - Sabq AI CMS
 * يوفر إدارة شاملة للتكاملات والموفرين الخارجيين
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

// Schema للتحقق من صحة البيانات
const createIntegrationSchema = z.object({
  name: z.string().min(1, 'اسم التكامل مطلوب').max(100, 'اسم التكامل طويل جداً'),
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
  ]),
  provider: z.string().min(1, 'المزود مطلوب').max(100, 'اسم المزود طويل جداً'),
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
  isActive: z.boolean().optional().default(true),
  priority: z.number().min(1).max(10).optional().default(5),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateIntegrationSchema = createIntegrationSchema.partial();

const integrationQuerySchema = z.object({
  type: z.string().optional(),
  provider: z.string().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'type', 'provider', 'createdAt', 'priority']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

// Types للاستجابة
interface IntegrationResponse {
  success: boolean;
  message: string;
  data?: {
    integration?: {
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
      };
      usage: {
        totalRequests: number;
        successRequests: number;
        failedRequests: number;
        avgResponseTime: number;
        lastUsed: string;
      };
      createdAt: string;
      updatedAt: string;
    };
    integrations?: Array<{
      id: string;
      name: string;
      type: string;
      provider: string;
      description: string;
      isActive: boolean;
      priority: number;
      tags: string[];
      health: {
        status: string;
        lastCheck: string;
        responseTime: number;
      };
      usage: {
        totalRequests: number;
        avgResponseTime: number;
        lastUsed: string;
      };
      createdAt: string;
      updatedAt: string;
    }>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    summary?: {
      totalIntegrations: number;
      activeIntegrations: number;
      inactiveIntegrations: number;
      healthyIntegrations: number;
      unhealthyIntegrations: number;
      byType: Record<string, number>;
      byProvider: Record<string, number>;
    };
  };
  errors?: Record<string, string>;
}

/**
 * GET /api/integrations
 * جلب قائمة التكاملات مع الفلاتر والبحث
 */
export async function GET(request: NextRequest): Promise<NextResponse<IntegrationResponse>> {
  try {
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

    // قراءة معاملات الاستعلام
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());

    // تحويل المعاملات إلى النوع المناسب
    if (queryParams.tags) {
      queryParams.tags = queryParams.tags.split(',');
    }
    if (queryParams.isActive) {
      queryParams.isActive = queryParams.isActive === 'true';
    }
    if (queryParams.page) {
      queryParams.page = parseInt(queryParams.page);
    }
    if (queryParams.limit) {
      queryParams.limit = parseInt(queryParams.limit);
    }

    const validationResult = integrationQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'معاملات الاستعلام غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const query = validationResult.data;
    const offset = (query.page - 1) * query.limit;

    // بناء شروط البحث
    const whereConditions: any = {};

    if (query.type) {
      whereConditions.type = query.type;
    }

    if (query.provider) {
      whereConditions.provider = {
        contains: query.provider,
        mode: 'insensitive',
      };
    }

    if (query.isActive !== undefined) {
      whereConditions.isActive = query.isActive;
    }

    if (query.tags && query.tags.length > 0) {
      whereConditions.tags = {
        hasSome: query.tags,
      };
    }

    if (query.search) {
      whereConditions.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // جلب التكاملات
    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          description: true,
          isActive: true,
          priority: true,
          tags: true,
          healthStatus: true,
          lastHealthCheck: true,
          avgResponseTime: true,
          totalRequests: true,
          lastUsed: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: getOrderByClause(query.sortBy, query.sortOrder),
        skip: offset,
        take: query.limit,
      }),
      prisma.integration.count({ where: whereConditions }),
    ]);

    // جلب الإحصائيات العامة
    const summary = await getIntegrationsSummary();

    // تحضير البيانات للاستجابة
    const responseData = {
      integrations: integrations.map(integration => ({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        description: integration.description,
        isActive: integration.isActive,
        priority: integration.priority,
        tags: integration.tags,
        health: {
          status: integration.healthStatus || 'unknown',
          lastCheck: integration.lastHealthCheck?.toISOString() || '',
          responseTime: integration.avgResponseTime || 0,
        },
        usage: {
          totalRequests: integration.totalRequests || 0,
          avgResponseTime: integration.avgResponseTime || 0,
          lastUsed: integration.lastUsed?.toISOString() || '',
        },
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrevious: query.page > 1,
      },
      summary,
    };

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATIONS_VIEWED',
      userId: user.id,
      details: {
        query: queryParams,
        resultsCount: total,
      },
    });

    return NextResponse.json<IntegrationResponse>({
      success: true,
      message: 'تم جلب التكاملات بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في جلب التكاملات:', error);

    return NextResponse.json<IntegrationResponse>({
      success: false,
      message: 'حدث خطأ أثناء جلب التكاملات',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * POST /api/integrations
 * إنشاء تكامل جديد
 */
export async function POST(request: NextRequest): Promise<NextResponse<IntegrationResponse>> {
  try {
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
    if (!await validatePermission(user, 'INTEGRATIONS_CREATE')) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'غير مصرح لك بإنشاء التكاملات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `create_integration:${user.id}`,
      limit: 5,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'تم تجاوز حد إنشاء التكاملات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = createIntegrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'بيانات التكامل غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const integrationData = validationResult.data;

    // التحقق من عدم وجود تكامل بنفس الاسم
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        name: integrationData.name,
        provider: integrationData.provider,
      },
    });

    if (existingIntegration) {
      return NextResponse.json<IntegrationResponse>({
        success: false,
        message: 'يوجد تكامل بنفس الاسم والمزود',
        errors: { name: 'integration_already_exists' },
      }, { status: 409 });
    }

    // تشفير البيانات الحساسة
    const encryptedCredentials = integrationData.credentials
      ? await encryptSensitiveData(integrationData.credentials)
      : null;

    // إنشاء التكامل
    const integration = await prisma.integration.create({
      data: {
        name: integrationData.name,
        type: integrationData.type,
        provider: integrationData.provider,
        description: integrationData.description,
        config: integrationData.config || {},
        credentials: encryptedCredentials,
        endpoints: integrationData.endpoints || [],
        webhooks: integrationData.webhooks || [],
        rateLimits: integrationData.rateLimits || {},
        isActive: integrationData.isActive,
        priority: integrationData.priority,
        tags: integrationData.tags || [],
        metadata: integrationData.metadata || {},
        createdBy: user.id,
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

    // إجراء فحص صحة أولي
    const healthCheck = await integrationHealthCheck.performCheck(integration);

    // تحديث حالة الصحة
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        healthStatus: healthCheck.status,
        lastHealthCheck: new Date(),
        avgResponseTime: healthCheck.responseTime,
      },
    });

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_CREATED',
      userId: user.id,
      resourceId: integration.id,
      resourceType: 'integration',
      details: {
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        healthStatus: healthCheck.status,
      },
    });

    // إرسال إشعار للمشرفين
    await notificationService.sendIntegrationCreatedNotification(integration);

    // تحضير البيانات للاستجابة (بدون البيانات الحساسة)
    const responseData = {
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        description: integration.description,
        config: integration.config,
        endpoints: integration.endpoints,
        webhooks: integration.webhooks?.map(webhook => ({
          event: webhook.event,
          url: webhook.url,
          headers: webhook.headers,
        })) || [],
        rateLimits: integration.rateLimits,
        isActive: integration.isActive,
        priority: integration.priority,
        tags: integration.tags,
        metadata: integration.metadata,
        health: {
          status: healthCheck.status,
          lastCheck: new Date().toISOString(),
          responseTime: healthCheck.responseTime,
          uptime: 0,
          errors: healthCheck.errors || [],
        },
        usage: {
          totalRequests: 0,
          successRequests: 0,
          failedRequests: 0,
          avgResponseTime: 0,
          lastUsed: '',
        },
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      },
    };

    return NextResponse.json<IntegrationResponse>({
      success: true,
      message: 'تم إنشاء التكامل بنجاح',
      data: responseData,
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ في إنشاء التكامل:', error);

    return NextResponse.json<IntegrationResponse>({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التكامل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * بناء شرط الترتيب
 */
function getOrderByClause(sortBy: string, sortOrder: string): any {
  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  
  switch (sortBy) {
    case 'name':
      return { name: order };
    case 'type':
      return { type: order };
    case 'provider':
      return { provider: order };
    case 'createdAt':
      return { createdAt: order };
    case 'priority':
      return { priority: order };
    default:
      return { name: 'asc' };
  }
}

/**
 * جلب ملخص التكاملات
 */
async function getIntegrationsSummary(): Promise<{
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  healthyIntegrations: number;
  unhealthyIntegrations: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
}> {
  const [
    totalIntegrations,
    activeIntegrations,
    inactiveIntegrations,
    healthyIntegrations,
    unhealthyIntegrations,
    byType,
    byProvider,
  ] = await Promise.all([
    prisma.integration.count(),
    prisma.integration.count({ where: { isActive: true } }),
    prisma.integration.count({ where: { isActive: false } }),
    prisma.integration.count({ where: { healthStatus: 'healthy' } }),
    prisma.integration.count({ where: { healthStatus: { not: 'healthy' } } }),
    prisma.integration.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    prisma.integration.groupBy({
      by: ['provider'],
      _count: { id: true },
    }),
  ]);

  return {
    totalIntegrations,
    activeIntegrations,
    inactiveIntegrations,
    healthyIntegrations,
    unhealthyIntegrations,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    byProvider: byProvider.reduce((acc, item) => {
      acc[item.provider] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
} 