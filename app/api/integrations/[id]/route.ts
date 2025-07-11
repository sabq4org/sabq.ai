/**
 * API Routes for Individual Integration Management
 * 
 * @description Handles CRUD operations for specific integration by ID
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
import { encrypt, decrypt } from '@/lib/encryption';

// Validation schemas
const integrationUpdateSchema = z.object({
  name: z.string().min(1, 'اسم التكامل مطلوب').optional(),
  type: z.enum(['CDN', 'ANALYTICS', 'PAYMENT', 'EMAIL', 'SOCIAL', 'STORAGE']).optional(),
  provider: z.string().min(1, 'مقدم الخدمة مطلوب').optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  apiVersion: z.string().optional(),
  rateLimitPerHour: z.number().positive().optional(),
  timeoutSeconds: z.number().positive().optional(),
  retryAttempts: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

const paramsSchema = z.object({
  id: z.string().uuid('معرف التكامل غير صحيح'),
});

/**
 * Helper function to check if integration exists
 */
async function getIntegrationById(id: string) {
  const integration = await prisma.integration.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      auditLogs: {
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    return null;
  }

  // Decrypt sensitive configuration data
  const decryptedConfig = { ...integration.configuration };
  
  if (decryptedConfig.apiKey) {
    decryptedConfig.apiKey = await decrypt(decryptedConfig.apiKey);
  }
  if (decryptedConfig.secretKey) {
    decryptedConfig.secretKey = await decrypt(decryptedConfig.secretKey);
  }
  if (decryptedConfig.accessToken) {
    decryptedConfig.accessToken = await decrypt(decryptedConfig.accessToken);
  }

  return {
    ...integration,
    configuration: decryptedConfig,
  };
}

/**
 * GET /api/integrations/[id]
 * Retrieves a specific integration by ID
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
        { error: 'لا تملك صلاحية لعرض التكاملات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Get integration
    const integration = await getIntegrationById(validatedParams.id);
    
    if (!integration) {
      return NextResponse.json(
        { error: 'التكامل غير موجود' },
        { status: 404 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'VIEW_INTEGRATION',
      resource: 'integrations',
      resourceId: integration.id,
      metadata: {
        integrationName: integration.name,
        provider: integration.provider,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: integration,
      message: 'تم جلب التكامل بنجاح',
    });

  } catch (error) {
    console.error('Error fetching integration:', error);
    
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
      action: 'VIEW_INTEGRATION_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في جلب التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/[id]
 * Updates a specific integration
 */
export async function PUT(
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
      'update'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لتحديث التكاملات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check if integration exists
    const existingIntegration = await prisma.integration.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!existingIntegration) {
      return NextResponse.json(
        { error: 'التكامل غير موجود' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = integrationUpdateSchema.parse(body);

    // Encrypt sensitive configuration data if provided
    let encryptedConfig = validatedData.configuration;
    if (encryptedConfig) {
      encryptedConfig = { ...encryptedConfig };
      
      if (encryptedConfig.apiKey) {
        encryptedConfig.apiKey = await encrypt(encryptedConfig.apiKey);
      }
      if (encryptedConfig.secretKey) {
        encryptedConfig.secretKey = await encrypt(encryptedConfig.secretKey);
      }
      if (encryptedConfig.accessToken) {
        encryptedConfig.accessToken = await encrypt(encryptedConfig.accessToken);
      }
    }

    // Check for duplicate integration name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingIntegration.name) {
      const duplicateIntegration = await prisma.integration.findFirst({
        where: {
          name: validatedData.name,
          provider: validatedData.provider || existingIntegration.provider,
          id: { not: validatedParams.id },
        },
      });

      if (duplicateIntegration) {
        return NextResponse.json(
          { error: 'يوجد تكامل آخر بنفس الاسم ومقدم الخدمة' },
          { status: 400 }
        );
      }
    }

    // Update integration
    const updatedIntegration = await prisma.integration.update({
      where: { id: validatedParams.id },
      data: {
        ...validatedData,
        configuration: encryptedConfig,
        updatedById: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'UPDATE_INTEGRATION',
      resource: 'integrations',
      resourceId: updatedIntegration.id,
      metadata: {
        integrationName: updatedIntegration.name,
        provider: updatedIntegration.provider,
        changes: validatedData,
        timestamp: new Date().toISOString(),
      },
    });

    // Decrypt configuration for response
    const decryptedConfig = { ...updatedIntegration.configuration };
    if (decryptedConfig.apiKey) {
      decryptedConfig.apiKey = await decrypt(decryptedConfig.apiKey);
    }
    if (decryptedConfig.secretKey) {
      decryptedConfig.secretKey = await decrypt(decryptedConfig.secretKey);
    }
    if (decryptedConfig.accessToken) {
      decryptedConfig.accessToken = await decrypt(decryptedConfig.accessToken);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedIntegration,
        configuration: decryptedConfig,
      },
      message: 'تم تحديث التكامل بنجاح',
    });

  } catch (error) {
    console.error('Error updating integration:', error);
    
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
      action: 'UPDATE_INTEGRATION_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في تحديث التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id]
 * Deletes a specific integration (soft delete)
 */
export async function DELETE(
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
      'delete'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لحذف التكاملات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Check if integration exists
    const existingIntegration = await prisma.integration.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!existingIntegration) {
      return NextResponse.json(
        { error: 'التكامل غير موجود' },
        { status: 404 }
      );
    }

    // Check if integration is actively used
    const isActivelyUsed = await prisma.article.findFirst({
      where: {
        integrations: {
          some: {
            id: validatedParams.id,
          },
        },
      },
    });

    if (isActivelyUsed) {
      return NextResponse.json(
        { error: 'لا يمكن حذف التكامل لأنه مستخدم في مقالات' },
        { status: 400 }
      );
    }

    // Soft delete integration
    const deletedIntegration = await prisma.integration.update({
      where: { id: validatedParams.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        updatedById: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'DELETE_INTEGRATION',
      resource: 'integrations',
      resourceId: deletedIntegration.id,
      metadata: {
        integrationName: deletedIntegration.name,
        provider: deletedIntegration.provider,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deletedIntegration,
      message: 'تم حذف التكامل بنجاح',
    });

  } catch (error) {
    console.error('Error deleting integration:', error);
    
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
      action: 'DELETE_INTEGRATION_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في حذف التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 