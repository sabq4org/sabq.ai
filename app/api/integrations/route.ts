/**
 * API Routes للتكاملات والخدمات الخارجية
 * Integrations API Endpoints
 * @version 1.0.0
 * @author Sabq AI Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { providersManager, ProviderType, ProviderStatus, ProviderUtils, ServiceProvider } from '../../../lib/integrations/providers';
import { privacyManager, PersonalDataType, ProcessingPurpose } from '../../../lib/privacy-controls';

/**
 * GET /api/integrations
 * جلب جميع موفري الخدمات أو التصفية حسب النوع
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ProviderType;
    const status = searchParams.get('status') as ProviderStatus;
    const includeStats = searchParams.get('include_stats') === 'true';

    // تسجيل عملية الوصول للبيانات
    await privacyManager.logDataProcessing({
      id: Date.now().toString(),
      userId: 'api-user',
      action: 'read',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.SECURITY,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      justification: 'Get integrations list'
    });

    let providers;

    if (type) {
      providers = providersManager.getProvidersByType(type);
    } else if (status === ProviderStatus.ACTIVE) {
      providers = providersManager.getActiveProviders();
    } else {
      providers = providersManager.getAllProviders();
    }

    // تصفية البيانات الحساسة قبل الإرسال
    const sanitizedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      status: provider.status,
      version: provider.version,
      description: provider.description,
      website: provider.website,
      documentation: provider.documentation,
      pricing: provider.pricing,
      features: provider.features,
      limitations: provider.limitations,
      endpoints: {
        health: provider.endpoints.health,
        documentation: provider.endpoints.documentation,
        support: provider.endpoints.support
        // إخفاء endpoints الحساسة
      },
      metadata: {
        createdAt: provider.metadata.createdAt,
        lastUpdated: provider.metadata.lastUpdated,
        lastHealthCheck: provider.metadata.lastHealthCheck,
        healthStatus: provider.metadata.healthStatus
      }
      // إخفاء configuration و authentication
    }));

    const response: any = {
      success: true,
      data: sanitizedProviders,
      count: sanitizedProviders.length,
      metadata: {
        timestamp: new Date(),
        filters: { type, status },
        requestId: Date.now().toString()
      }
    };

    if (includeStats) {
      response.stats = providersManager.getProvidersStats();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('خطأ في جلب موفري الخدمات:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_PROVIDERS_ERROR',
        message: 'خطأ في جلب موفري الخدمات',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/integrations
 * إضافة موفر خدمة جديد
 */
export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json();

    // التحقق من صحة البيانات
    const validation = ProviderUtils.validateProvider(providerData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'بيانات موفر الخدمة غير صحيحة',
          details: validation.errors
        }
      }, { status: 400 });
    }

    // التحقق من عدم وجود موفر بنفس المعرف
    const existingProvider = providersManager.getProvider(providerData.id);
    if (existingProvider) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_EXISTS',
          message: 'موفر الخدمة موجود بالفعل',
          details: { providerId: providerData.id }
        }
      }, { status: 409 });
    }

    // إضافة بيانات وصفية
    const newProvider = {
      ...providerData,
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    };

    // تسجيل الموفر
    providersManager.registerProvider(newProvider);

    // تسجيل عملية الإنشاء
    await privacyManager.logDataProcessing({
      id: Date.now().toString(),
      userId: 'admin',
      action: 'create',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.SECURITY,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      justification: `Created new provider: ${newProvider.name}`
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newProvider.id,
        name: newProvider.name,
        status: newProvider.status,
        message: 'تم إضافة موفر الخدمة بنجاح'
      },
      metadata: {
        timestamp: new Date(),
        requestId: Date.now().toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ في إضافة موفر الخدمة:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'CREATE_PROVIDER_ERROR',
        message: 'خطأ في إضافة موفر الخدمة',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * PUT /api/integrations
 * تحديث إعدادات عامة للتكاملات
 */
export async function PUT(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'health_check_all':
        const healthResults = await providersManager.healthCheckAll();
        
        return NextResponse.json({
          success: true,
          data: healthResults,
          metadata: {
            timestamp: new Date(),
            totalProviders: Object.keys(healthResults).length,
            healthyProviders: Object.values(healthResults).filter(Boolean).length
          }
        });

      case 'update_status_bulk':
        if (!data.providerIds || !data.status) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'MISSING_PARAMETERS',
              message: 'معرفات الموفرين والحالة الجديدة مطلوبة'
            }
          }, { status: 400 });
        }

        const updateResults = data.providerIds.map((id: string) => {
          const success = providersManager.updateProvider(id, { status: data.status });
          return { id, success };
        });

        return NextResponse.json({
          success: true,
          data: updateResults,
          metadata: {
            timestamp: new Date(),
            updatedCount: updateResults.filter((r: {id: string, success: boolean}) => r.success).length
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'الإجراء المطلوب غير صحيح',
            supportedActions: ['health_check_all', 'update_status_bulk']
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('خطأ في تحديث التكاملات:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_INTEGRATIONS_ERROR',
        message: 'خطأ في تحديث التكاملات',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations
 * حذف جميع موفري الخدمات غير النشطين
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const status = searchParams.get('status') as ProviderStatus;

    if (!force && !status) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'يجب تأكيد الحذف باستخدام force=true أو تحديد الحالة',
          warning: 'هذا الإجراء لا يمكن التراجع عنه'
        }
      }, { status: 400 });
    }

    const allProviders = providersManager.getAllProviders();
    let providersToDelete;

    if (status) {
      providersToDelete = allProviders.filter(p => p.status === status);
    } else {
      providersToDelete = allProviders.filter(p => p.status !== ProviderStatus.ACTIVE);
    }

    const deleteResults = providersToDelete.map(provider => {
      const success = providersManager.removeProvider(provider.id);
      return {
        id: provider.id,
        name: provider.name,
        success
      };
    });

    // تسجيل عملية الحذف الجماعي
    await privacyManager.logDataProcessing({
      id: Date.now().toString(),
      userId: 'admin',
      action: 'delete',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.SECURITY,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      justification: `Bulk delete providers with status: ${status || 'inactive'}`
    });

    return NextResponse.json({
      success: true,
      data: deleteResults,
      metadata: {
        timestamp: new Date(),
        deletedCount: deleteResults.filter(r => r.success).length,
        totalProviders: deleteResults.length
      }
    });

  } catch (error) {
    console.error('خطأ في حذف موفري الخدمات:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETE_PROVIDERS_ERROR',
        message: 'خطأ في حذف موفري الخدمات',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
} 