/**
 * API Routes for Integrations Management
 * 
 * @description Handles CRUD operations for third-party integrations
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { validateRequest } from '@/lib/validation';
import { encrypt, decrypt } from '@/lib/encryption';

// Schema للتحقق من صحة البيانات
const IntegrationCreateSchema = z.object({
  name: z.string().min(1, 'اسم التكامل مطلوب'),
  type: z.enum(['STORAGE', 'CDN', 'AI', 'EMAIL', 'SMS', 'ANALYTICS', 'PAYMENT', 'SOCIAL', 'NOTIFICATION']),
  config: z.record(z.any()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR']).default('ACTIVE'),
  description: z.string().optional()
});

const IntegrationUpdateSchema = IntegrationCreateSchema.partial();

/**
 * GET /api/integrations
 * جلب جميع التكاملات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          // إخفاء المعلومات الحساسة
          config: false
        }
      }),
      prisma.integration.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        integrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب التكاملات:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التكاملات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * إنشاء تكامل جديد
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(IntegrationCreateSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      const { name, type, config, status, description } = validation.data;

      // التحقق من عدم وجود تكامل بنفس الاسم
      const existingIntegration = await prisma.integration.findUnique({
        where: { name }
      });

      if (existingIntegration) {
        return NextResponse.json(
          { success: false, error: 'تكامل بهذا الاسم موجود بالفعل' },
          { status: 409 }
        );
      }

      // تشفير البيانات الحساسة
      const encryptedConfig = encryptSensitiveData(config);

      // إنشاء التكامل
      const integration = await prisma.integration.create({
        data: {
          name,
          type,
          config: encryptedConfig,
          status,
          description
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // تسجيل التغيير
      await prisma.integrationChangeLog.create({
        data: {
          integrationId: integration.id,
          changedBy: user.id,
          changeType: 'CREATE',
          newValue: {
            name: integration.name,
            type: integration.type,
            status: integration.status
          },
          summary: `تم إنشاء التكامل ${integration.name}`
        }
      });

      return NextResponse.json({
        success: true,
        data: integration
      });

    } catch (error) {
      console.error('خطأ في إنشاء التكامل:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء التكامل' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PUT /api/integrations/[id]
 * تحديث تكامل موجود
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف التكامل مطلوب' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validation = validateRequest(IntegrationUpdateSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      // التحقق من وجود التكامل
      const existingIntegration = await prisma.integration.findUnique({
        where: { id }
      });

      if (!existingIntegration) {
        return NextResponse.json(
          { success: false, error: 'التكامل غير موجود' },
          { status: 404 }
        );
      }

      const updateData: any = {};
      const { name, type, config, status, description } = validation.data;

      if (name) updateData.name = name;
      if (type) updateData.type = type;
      if (config) updateData.config = encryptSensitiveData(config);
      if (status) updateData.status = status;
      if (description !== undefined) updateData.description = description;

      // تحديث التكامل
      const updatedIntegration = await prisma.integration.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // تسجيل التغيير
      await prisma.integrationChangeLog.create({
        data: {
          integrationId: id,
          changedBy: user.id,
          changeType: 'UPDATE',
          oldValue: {
            name: existingIntegration.name,
            type: existingIntegration.type,
            status: existingIntegration.status
          },
          newValue: {
            name: updatedIntegration.name,
            type: updatedIntegration.type,
            status: updatedIntegration.status
          },
          summary: `تم تحديث التكامل ${updatedIntegration.name}`
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedIntegration
      });

    } catch (error) {
      console.error('خطأ في تحديث التكامل:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث التكامل' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/integrations/[id]
 * حذف تكامل
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف التكامل مطلوب' },
          { status: 400 }
        );
      }

      // التحقق من وجود التكامل
      const existingIntegration = await prisma.integration.findUnique({
        where: { id }
      });

      if (!existingIntegration) {
        return NextResponse.json(
          { success: false, error: 'التكامل غير موجود' },
          { status: 404 }
        );
      }

      // حذف التكامل
      await prisma.integration.delete({
        where: { id }
      });

      // تسجيل التغيير
      await prisma.integrationChangeLog.create({
        data: {
          integrationId: id,
          changedBy: user.id,
          changeType: 'DELETE',
          oldValue: {
            name: existingIntegration.name,
            type: existingIntegration.type,
            status: existingIntegration.status
          },
          summary: `تم حذف التكامل ${existingIntegration.name}`
        }
      });

      return NextResponse.json({
        success: true,
        message: 'تم حذف التكامل بنجاح'
      });

    } catch (error) {
      console.error('خطأ في حذف التكامل:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في حذف التكامل' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * تشفير البيانات الحساسة في التكوين
 */
function encryptSensitiveData(config: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['apiKey', 'apiSecret', 'secretKey', 'password', 'token', 'secret'];
  const encryptedConfig = { ...config };

  for (const key of sensitiveKeys) {
    if (encryptedConfig[key]) {
      encryptedConfig[key] = encrypt(encryptedConfig[key]);
    }
  }

  return encryptedConfig;
}

/**
 * فك تشفير البيانات الحساسة
 */
function decryptSensitiveData(config: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['apiKey', 'apiSecret', 'secretKey', 'password', 'token', 'secret'];
  const decryptedConfig = { ...config };

  for (const key of sensitiveKeys) {
    if (decryptedConfig[key]) {
      try {
        decryptedConfig[key] = decrypt(decryptedConfig[key]);
      } catch (error) {
        console.warn(`فشل في فك تشفير ${key}:`, error);
      }
    }
  }

  return decryptedConfig;
} 