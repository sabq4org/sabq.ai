/**
 * API اختبار التكاملات - Sabq AI CMS
 * يوفر اختبار شامل للتكاملات الخارجية مع فحص الصحة والأداء
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
import { decryptSensitiveData } from '@/lib/crypto';
import { integrationTester } from '@/lib/integration-tester';
import { performanceMonitor } from '@/lib/performance-monitor';
import { notificationService } from '@/lib/notifications';

// Schema لاختبار التكامل
const testIntegrationSchema = z.object({
  testType: z.enum([
    'CONNECTION',
    'AUTHENTICATION',
    'ENDPOINTS',
    'WEBHOOKS',
    'PERFORMANCE',
    'FULL_SUITE',
  ]).optional().default('CONNECTION'),
  endpoints: z.array(z.string()).optional(),
  timeout: z.number().min(1000).max(300000).optional().default(30000), // 30 ثانية
  retryCount: z.number().min(0).max(3).optional().default(1),
  performanceMetrics: z.boolean().optional().default(true),
  validateResponse: z.boolean().optional().default(true),
  testData: z.record(z.any()).optional(),
  mockMode: z.boolean().optional().default(false),
});

// Types للاستجابة
interface TestResponse {
  success: boolean;
  message: string;
  data?: {
    testId: string;
    integrationId: string;
    testType: string;
    results: {
      overall: {
        status: 'passed' | 'failed' | 'warning';
        score: number;
        totalTests: number;
        passedTests: number;
        failedTests: number;
        warningTests: number;
        duration: number;
      };
      connection: {
        status: 'passed' | 'failed' | 'skipped';
        responseTime: number;
        details: string;
        error?: string;
      };
      authentication: {
        status: 'passed' | 'failed' | 'skipped';
        responseTime: number;
        details: string;
        error?: string;
      };
      endpoints: Array<{
        name: string;
        url: string;
        method: string;
        status: 'passed' | 'failed' | 'skipped';
        responseTime: number;
        statusCode: number;
        responseSize: number;
        details: string;
        error?: string;
      }>;
      webhooks: Array<{
        event: string;
        url: string;
        status: 'passed' | 'failed' | 'skipped';
        responseTime: number;
        details: string;
        error?: string;
      }>;
      performance: {
        averageResponseTime: number;
        minResponseTime: number;
        maxResponseTime: number;
        throughput: number;
        availability: number;
        reliability: number;
        metrics: Record<string, number>;
      };
      security: {
        sslCertificate: boolean;
        httpsOnly: boolean;
        authentication: boolean;
        headers: Record<string, boolean>;
        score: number;
      };
    };
    recommendations: string[];
    nextTestSchedule?: string;
  };
  errors?: Record<string, string>;
}

/**
 * POST /api/integrations/[id]/test
 * اختبار تكامل محدد
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<TestResponse>> {
  const startTime = Date.now();
  
  try {
    const { id } = params;

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'INTEGRATIONS_TEST')) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'غير مصرح لك باختبار التكاملات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `test_integration:${user.id}`,
      limit: 10,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'تم تجاوز حد اختبار التكاملات المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // التحقق من وجود التكامل
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
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // التحقق من أن التكامل نشط
    if (!integration.isActive) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'لا يمكن اختبار تكامل غير نشط',
        errors: { integration: 'inactive' },
      }, { status: 400 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = testIntegrationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'معاملات الاختبار غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const testParams = validationResult.data;

    // إنشاء معرف فريد للاختبار
    const testId = crypto.randomUUID();

    // فك تشفير البيانات الحساسة
    let decryptedCredentials = null;
    if (integration.credentials) {
      decryptedCredentials = await decryptSensitiveData(integration.credentials);
    }

    // إنشاء سجل اختبار
    const testRecord = await prisma.integrationTest.create({
      data: {
        id: testId,
        integrationId: integration.id,
        testType: testParams.testType,
        parameters: testParams,
        status: 'running',
        startedAt: new Date(),
        startedBy: user.id,
      },
    });

    // تشغيل الاختبار
    const testResults = await runIntegrationTest(
      integration,
      decryptedCredentials,
      testParams,
      testId
    );

    // تحديث سجل الاختبار
    await prisma.integrationTest.update({
      where: { id: testId },
      data: {
        status: testResults.overall.status === 'passed' ? 'completed' : 'failed',
        results: testResults,
        completedAt: new Date(),
        duration: Date.now() - startTime,
      },
    });

    // تحديث إحصائيات التكامل
    await updateIntegrationStats(integration.id, testResults);

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'INTEGRATION_TESTED',
      userId: user.id,
      resourceId: integration.id,
      resourceType: 'integration',
      details: {
        testId,
        testType: testParams.testType,
        status: testResults.overall.status,
        score: testResults.overall.score,
        duration: Date.now() - startTime,
      },
    });

    // إرسال إشعار إذا فشل الاختبار
    if (testResults.overall.status === 'failed') {
      await notificationService.sendIntegrationTestFailedNotification(
        integration,
        testResults,
        user
      );
    }

    // إنشاء التوصيات
    const recommendations = generateRecommendations(testResults);

    // تحديد موعد الاختبار التالي
    const nextTestSchedule = calculateNextTestSchedule(
      testResults.overall.status,
      integration.priority
    );

    return NextResponse.json<TestResponse>({
      success: true,
      message: 'تم اختبار التكامل بنجاح',
      data: {
        testId,
        integrationId: integration.id,
        testType: testParams.testType,
        results: testResults,
        recommendations,
        nextTestSchedule,
      },
    });

  } catch (error) {
    console.error('خطأ في اختبار التكامل:', error);

    return NextResponse.json<TestResponse>({
      success: false,
      message: 'حدث خطأ أثناء اختبار التكامل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * GET /api/integrations/[id]/test
 * جلب نتائج اختبارات التكامل
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<TestResponse>> {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('test_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'INTEGRATIONS_READ')) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'غير مصرح لك بعرض نتائج الاختبارات',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من وجود التكامل
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'التكامل غير موجود',
        errors: { integration: 'not_found' },
      }, { status: 404 });
    }

    // جلب نتائج الاختبارات
    const whereConditions: any = { integrationId: id };
    if (testId) {
      whereConditions.id = testId;
    }

    const testResults = await prisma.integrationTest.findMany({
      where: whereConditions,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        startedByUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (testResults.length === 0) {
      return NextResponse.json<TestResponse>({
        success: false,
        message: 'لا توجد نتائج اختبارات',
        errors: { tests: 'no_results_found' },
      }, { status: 404 });
    }

    // تحضير البيانات للاستجابة
    const latestTest = testResults[0];
    const responseData = {
      testId: latestTest.id,
      integrationId: latestTest.integrationId,
      testType: latestTest.testType,
      results: latestTest.results,
      recommendations: generateRecommendations(latestTest.results),
      nextTestSchedule: calculateNextTestSchedule(
        latestTest.results.overall.status,
        integration.priority
      ),
    };

    return NextResponse.json<TestResponse>({
      success: true,
      message: 'تم جلب نتائج الاختبارات بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في جلب نتائج الاختبارات:', error);

    return NextResponse.json<TestResponse>({
      success: false,
      message: 'حدث خطأ أثناء جلب نتائج الاختبارات',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * تشغيل اختبار التكامل
 */
async function runIntegrationTest(
  integration: any,
  credentials: any,
  testParams: any,
  testId: string
): Promise<any> {
  const startTime = Date.now();
  const testResults = {
    overall: {
      status: 'passed' as const,
      score: 100,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
      duration: 0,
    },
    connection: {
      status: 'skipped' as const,
      responseTime: 0,
      details: '',
      error: undefined,
    },
    authentication: {
      status: 'skipped' as const,
      responseTime: 0,
      details: '',
      error: undefined,
    },
    endpoints: [],
    webhooks: [],
    performance: {
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      throughput: 0,
      availability: 0,
      reliability: 0,
      metrics: {},
    },
    security: {
      sslCertificate: false,
      httpsOnly: false,
      authentication: false,
      headers: {},
      score: 0,
    },
  };

  try {
    // اختبار الاتصال
    if (testParams.testType === 'CONNECTION' || testParams.testType === 'FULL_SUITE') {
      testResults.connection = await integrationTester.testConnection(
        integration,
        credentials,
        testParams.timeout
      );
      testResults.overall.totalTests++;
      if (testResults.connection.status === 'passed') {
        testResults.overall.passedTests++;
      } else if (testResults.connection.status === 'failed') {
        testResults.overall.failedTests++;
      }
    }

    // اختبار المصادقة
    if (testParams.testType === 'AUTHENTICATION' || testParams.testType === 'FULL_SUITE') {
      testResults.authentication = await integrationTester.testAuthentication(
        integration,
        credentials,
        testParams.timeout
      );
      testResults.overall.totalTests++;
      if (testResults.authentication.status === 'passed') {
        testResults.overall.passedTests++;
      } else if (testResults.authentication.status === 'failed') {
        testResults.overall.failedTests++;
      }
    }

    // اختبار النقاط النهائية
    if (testParams.testType === 'ENDPOINTS' || testParams.testType === 'FULL_SUITE') {
      const endpoints = testParams.endpoints || integration.endpoints || [];
      for (const endpoint of endpoints) {
        const endpointResult = await integrationTester.testEndpoint(
          endpoint,
          credentials,
          testParams.timeout,
          testParams.validateResponse
        );
        testResults.endpoints.push(endpointResult);
        testResults.overall.totalTests++;
        if (endpointResult.status === 'passed') {
          testResults.overall.passedTests++;
        } else if (endpointResult.status === 'failed') {
          testResults.overall.failedTests++;
        }
      }
    }

    // اختبار Webhooks
    if (testParams.testType === 'WEBHOOKS' || testParams.testType === 'FULL_SUITE') {
      const webhooks = integration.webhooks || [];
      for (const webhook of webhooks) {
        const webhookResult = await integrationTester.testWebhook(
          webhook,
          credentials,
          testParams.timeout
        );
        testResults.webhooks.push(webhookResult);
        testResults.overall.totalTests++;
        if (webhookResult.status === 'passed') {
          testResults.overall.passedTests++;
        } else if (webhookResult.status === 'failed') {
          testResults.overall.failedTests++;
        }
      }
    }

    // اختبار الأداء
    if (testParams.testType === 'PERFORMANCE' || testParams.testType === 'FULL_SUITE') {
      testResults.performance = await performanceMonitor.testPerformance(
        integration,
        credentials,
        testParams.timeout
      );
    }

    // اختبار الأمان
    if (testParams.testType === 'FULL_SUITE') {
      testResults.security = await integrationTester.testSecurity(
        integration,
        credentials
      );
    }

    // حساب النتيجة الإجمالية
    const successRate = testResults.overall.totalTests > 0 
      ? (testResults.overall.passedTests / testResults.overall.totalTests) * 100 
      : 0;

    testResults.overall.score = Math.round(successRate);
    testResults.overall.status = successRate >= 80 ? 'passed' : 
                                successRate >= 60 ? 'warning' : 'failed';
    testResults.overall.duration = Date.now() - startTime;

    return testResults;

  } catch (error) {
    console.error('خطأ في تشغيل الاختبار:', error);
    
    testResults.overall.status = 'failed';
    testResults.overall.score = 0;
    testResults.overall.duration = Date.now() - startTime;

    return testResults;
  }
}

/**
 * تحديث إحصائيات التكامل
 */
async function updateIntegrationStats(integrationId: string, testResults: any): Promise<void> {
  try {
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        healthStatus: testResults.overall.status === 'passed' ? 'healthy' : 'unhealthy',
        lastHealthCheck: new Date(),
        avgResponseTime: testResults.performance.averageResponseTime || 0,
        lastTestScore: testResults.overall.score,
        lastTestAt: new Date(),
      },
    });
  } catch (error) {
    console.error('خطأ في تحديث إحصائيات التكامل:', error);
  }
}

/**
 * إنشاء التوصيات
 */
function generateRecommendations(testResults: any): string[] {
  const recommendations: string[] = [];

  if (testResults.overall.score < 80) {
    recommendations.push('يحتاج التكامل إلى تحسين لتحقيق موثوقية أفضل');
  }

  if (testResults.performance.averageResponseTime > 5000) {
    recommendations.push('وقت الاستجابة مرتفع، يُنصح بتحسين الأداء');
  }

  if (testResults.connection.status === 'failed') {
    recommendations.push('مشكلة في الاتصال، تحقق من إعدادات الشبكة');
  }

  if (testResults.authentication.status === 'failed') {
    recommendations.push('مشكلة في المصادقة، تحقق من بيانات الاعتماد');
  }

  if (testResults.security.score < 70) {
    recommendations.push('يحتاج التكامل إلى تحسين الأمان');
  }

  if (testResults.endpoints.some((ep: any) => ep.status === 'failed')) {
    recommendations.push('بعض النقاط النهائية لا تعمل بشكل صحيح');
  }

  if (recommendations.length === 0) {
    recommendations.push('التكامل يعمل بشكل مثالي');
  }

  return recommendations;
}

/**
 * حساب موعد الاختبار التالي
 */
function calculateNextTestSchedule(status: string, priority: number): string {
  const baseInterval = 24 * 60 * 60 * 1000; // 24 ساعة
  let multiplier = 1;

  // تقليل الفترة للتكاملات عالية الأولوية
  if (priority >= 8) {
    multiplier = 0.5; // كل 12 ساعة
  } else if (priority >= 6) {
    multiplier = 1; // كل 24 ساعة
  } else {
    multiplier = 2; // كل 48 ساعة
  }

  // زيادة التكرار إذا فشل الاختبار
  if (status === 'failed') {
    multiplier = multiplier / 2;
  }

  const nextTest = new Date(Date.now() + (baseInterval * multiplier));
  return nextTest.toISOString();
} 