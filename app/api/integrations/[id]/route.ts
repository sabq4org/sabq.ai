/**
 * API Routes لموفر خدمة محدد
 * Individual Provider API Endpoints
 * @version 1.0.0
 * @author Sabq AI Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { providersManager, ProviderStatus, ProviderUtils, ServiceProvider } from '../../../../lib/integrations/providers';
import { privacyManager, PersonalDataType, ProcessingPurpose } from '../../../../lib/privacy-controls';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/integrations/[id]
 * جلب معلومات موفر خدمة محدد
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PROVIDER_ID',
          message: 'معرف موفر الخدمة مطلوب'
        }
      }, { status: 400 });
    }

    const provider = providersManager.getProvider(id);
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `موفر الخدمة غير موجود: ${id}`
        }
      }, { status: 404 });
    }

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
      justification: `Get provider details: ${id}`
    });

    // تصفية البيانات الحساسة
    const sanitizedProvider = {
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
      },
      configuration: {
        baseUrl: provider.configuration.baseUrl,
        timeout: provider.configuration.timeout,
        retryAttempts: provider.configuration.retryAttempts,
        retryDelay: provider.configuration.retryDelay,
        rateLimiting: provider.configuration.rateLimiting,
        region: provider.configuration.region,
        environment: provider.configuration.environment
        // إخفاء customHeaders
      },
      metadata: provider.metadata
      // إخفاء authentication credentials
    };

    return NextResponse.json({
      success: true,
      data: sanitizedProvider,
      metadata: {
        timestamp: new Date(),
        requestId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('خطأ في جلب موفر الخدمة:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_PROVIDER_ERROR',
        message: 'خطأ في جلب موفر الخدمة',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * PUT /api/integrations/[id]
 * تحديث موفر خدمة محدد
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const updates = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PROVIDER_ID',
          message: 'معرف موفر الخدمة مطلوب'
        }
      }, { status: 400 });
    }

    const existingProvider = providersManager.getProvider(id);
    if (!existingProvider) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `موفر الخدمة غير موجود: ${id}`
        }
      }, { status: 404 });
    }

    // التحقق من صحة التحديثات
    if (updates.id && updates.id !== id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ID_MISMATCH',
          message: 'لا يمكن تغيير معرف موفر الخدمة'
        }
      }, { status: 400 });
    }

    // تحديث البيانات الوصفية
    const updatedProvider = {
      ...updates,
      metadata: {
        ...existingProvider.metadata,
        lastUpdated: new Date()
      }
    };

    const success = providersManager.updateProvider(id, updatedProvider);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'فشل في تحديث موفر الخدمة'
        }
      }, { status: 500 });
    }

    // تسجيل عملية التحديث
    await privacyManager.logDataProcessing({
      id: Date.now().toString(),
      userId: 'admin',
      action: 'update',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.SECURITY,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      justification: `Updated provider: ${id}`
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'تم تحديث موفر الخدمة بنجاح',
        updatedFields: Object.keys(updates)
      },
      metadata: {
        timestamp: new Date(),
        requestId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث موفر الخدمة:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_PROVIDER_ERROR',
        message: 'خطأ في تحديث موفر الخدمة',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations/[id]
 * حذف موفر خدمة محدد
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PROVIDER_ID',
          message: 'معرف موفر الخدمة مطلوب'
        }
      }, { status: 400 });
    }

    const provider = providersManager.getProvider(id);
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `موفر الخدمة غير موجود: ${id}`
        }
      }, { status: 404 });
    }

    // منع حذف الموفرين النشطين بدون force
    if (provider.status === ProviderStatus.ACTIVE && !force) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ACTIVE_PROVIDER_DELETE',
          message: 'لا يمكن حذف موفر خدمة نشط. استخدم force=true للحذف القسري',
          warning: 'هذا قد يؤثر على وظائف النظام'
        }
      }, { status: 409 });
    }

    const success = providersManager.removeProvider(id);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'فشل في حذف موفر الخدمة'
        }
      }, { status: 500 });
    }

    // تسجيل عملية الحذف
    await privacyManager.logDataProcessing({
      id: Date.now().toString(),
      userId: 'admin',
      action: 'delete',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.SECURITY,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      justification: `Deleted provider: ${id} (${provider.name})`
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: provider.name,
        message: 'تم حذف موفر الخدمة بنجاح'
      },
      metadata: {
        timestamp: new Date(),
        requestId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('خطأ في حذف موفر الخدمة:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETE_PROVIDER_ERROR',
        message: 'خطأ في حذف موفر الخدمة',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
}

/**
 * PATCH /api/integrations/[id]
 * تحديث جزئي لموفر خدمة (مثل تغيير الحالة فقط)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { action, data } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PROVIDER_ID',
          message: 'معرف موفر الخدمة مطلوب'
        }
      }, { status: 400 });
    }

    const provider = providersManager.getProvider(id);
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `موفر الخدمة غير موجود: ${id}`
        }
      }, { status: 404 });
    }

    let updateResult;
    let message = '';

    switch (action) {
      case 'change_status':
        if (!data.status) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'MISSING_STATUS',
              message: 'الحالة الجديدة مطلوبة'
            }
          }, { status: 400 });
        }

        updateResult = providersManager.updateProvider(id, { status: data.status });
        message = `تم تغيير حالة موفر الخدمة إلى: ${data.status}`;
        break;

      case 'health_check':
        const isHealthy = await providersManager.healthCheck(id);
        
        return NextResponse.json({
          success: true,
          data: {
            id,
            name: provider.name,
            healthy: isHealthy,
            lastCheck: new Date()
          },
          metadata: {
            timestamp: new Date(),
            requestId: Date.now().toString()
          }
        });

      case 'test_connection':
        // اختبار الاتصال بموفر الخدمة
        const testResult = await providersManager.makeApiCall(id, '/health', { method: 'GET' });
        
        return NextResponse.json({
          success: true,
          data: {
            id,
            name: provider.name,
            connectionTest: {
              success: testResult.success,
              statusCode: testResult.statusCode,
              duration: testResult.metadata.duration,
              timestamp: testResult.metadata.timestamp
            }
          },
          metadata: {
            timestamp: new Date(),
            requestId: Date.now().toString()
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'الإجراء المطلوب غير صحيح',
            supportedActions: ['change_status', 'health_check', 'test_connection']
          }
        }, { status: 400 });
    }

    if (updateResult === false) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'فشل في تحديث موفر الخدمة'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: provider.name,
        action,
        message
      },
      metadata: {
        timestamp: new Date(),
        requestId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث موفر الخدمة:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PATCH_PROVIDER_ERROR',
        message: 'خطأ في تحديث موفر الخدمة',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }, { status: 500 });
  }
} 