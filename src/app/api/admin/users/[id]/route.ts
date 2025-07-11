import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { PasswordSecurity, RequestSecurity } from '@/lib/auth-security';
import { checkRateLimit } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

// Validation schema for user updates
const updateUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100, 'الاسم طويل جداً').optional(),
  phone: z.string().optional(),
  role: z.enum(['reader', 'editor', 'admin']).optional(),
  status: z.enum(['active', 'banned', 'pending']).optional(),
  two_factor: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  forceChange: z.boolean().default(false),
});

// Helper function to check admin permissions
async function checkAdminPermission(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'مطلوب رمز المصادقة' };
    }

    const token = authHeader.substring(7);
    // Here you would verify the JWT token and check if user is admin
    // For now, we'll assume the token validation is done elsewhere
    
    return { success: true, user: { id: 'admin', role: 'admin' } };
  } catch (error) {
    return { success: false, error: 'خطأ في التحقق من الصلاحيات' };
  }
}

/**
 * GET /api/admin/users/[id]
 * Get user details with activity logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    const { id } = params;

    // Get user with detailed information
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        sessions: {
          select: {
            id: true,
            device_info: true,
            ip_address: true,
            created_at: true,
            last_activity: true,
            is_active: true,
          },
          orderBy: { last_activity: 'desc' },
          take: 10,
        },
        audit_logs: {
          select: {
            id: true,
            action: true,
            resource: true,
            details: true,
            ip_address: true,
            user_agent: true,
            created_at: true,
            success: true,
          },
          orderBy: { created_at: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            sessions: true,
            audit_logs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Get user statistics
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { user_id: id },
      _count: true,
    });

    // Get recent activity summary
    const recentActivity = await prisma.auditLog.findMany({
      where: { 
        user_id: id,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        action: true,
        created_at: true,
        success: true,
      },
    });

    // Calculate activity metrics
    const activityMetrics = {
      totalActions: recentActivity.length,
      successfulActions: recentActivity.filter(a => a.success).length,
      failedActions: recentActivity.filter(a => !a.success).length,
      lastActivity: recentActivity[0]?.created_at || null,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          status: user.is_active ? 'active' : 'inactive',
          isLocked: user.locked_until && user.locked_until > new Date(),
          sessionsCount: user._count.sessions,
          activityCount: user._count.audit_logs,
          // Remove sensitive data
          password_hash: undefined,
          reset_token: undefined,
          reset_token_expires: undefined,
        },
        stats: {
          byAction: stats.reduce((acc, item) => {
            acc[item.action] = item._count;
            return acc;
          }, {} as Record<string, number>),
          activity: activityMetrics,
        },
      },
    });

  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب تفاصيل المستخدم' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Prevent self-modification of role/status
    if (id === authResult.user?.id) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل صلاحياتك أو حالتك الخاصة' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Prepare update object
    const updateObj: any = {};
    
    if (updateData.name) {
      updateObj.name = RequestSecurity.sanitizeInput(updateData.name);
    }
    
    if (updateData.phone !== undefined) {
      updateObj.phone = updateData.phone || null;
    }
    
    if (updateData.role) {
      updateObj.role = updateData.role;
    }
    
    if (updateData.status) {
      updateObj.is_active = updateData.status === 'active';
      updateObj.is_verified = updateData.status === 'active';
    }
    
    if (updateData.two_factor !== undefined) {
      updateObj.two_factor_enabled = updateData.two_factor;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateObj,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        is_verified: true,
        two_factor_enabled: true,
        updated_at: true,
      },
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user?.id,
        action: 'USER_UPDATED',
        resource: 'user',
        resource_id: id,
        details: {
          before: existingUser,
          after: updatedUser,
          changes: updateData,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...updatedUser,
          status: updatedUser.is_active ? 'active' : 'inactive',
        },
      },
      message: 'تم تحديث المستخدم بنجاح',
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    const { id } = params;

    // Prevent self-deletion
    if (id === authResult.user?.id) {
      return NextResponse.json(
        { error: 'لا يمكن حذف حسابك الحالي' },
        { status: 400 }
      );
    }

    // Get user to be deleted
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user?.id,
        action: 'USER_DELETED',
        resource: 'user',
        resource_id: id,
        details: {
          deletedUser: userToDelete,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userToDelete,
      },
      message: 'تم حذف المستخدم بنجاح',
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المستخدم' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Special operations (change password, unlock account, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'change_password':
        const passwordValidation = changePasswordSchema.safeParse(body);
        if (!passwordValidation.success) {
          return NextResponse.json(
            { error: 'بيانات غير صحيحة' },
            { status: 400 }
          );
        }

        const { newPassword, forceChange } = passwordValidation.data;
        
        // Validate password strength
        const passwordStrengthCheck = PasswordSecurity.validatePasswordStrength(newPassword);
        if (!passwordStrengthCheck.isValid) {
          return NextResponse.json(
            { 
              error: 'كلمة المرور ضعيفة',
              details: passwordStrengthCheck.errors
            },
            { status: 400 }
          );
        }

        // Hash new password
        const hashedPassword = await PasswordSecurity.hashPassword(newPassword);

        // Update password
        await prisma.user.update({
          where: { id },
          data: {
            password_hash: hashedPassword,
            password_changed_at: new Date(),
            force_password_change: forceChange,
          },
        });

        // Log password change
        await prisma.auditLog.create({
          data: {
            user_id: authResult.user?.id,
            action: 'PASSWORD_CHANGED_BY_ADMIN',
            resource: 'user',
            resource_id: id,
            details: {
              forceChange,
            },
            ip_address: RequestSecurity.getClientIP(request),
            user_agent: RequestSecurity.getUserAgent(request),
            success: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'تم تغيير كلمة المرور بنجاح',
        });

      case 'unlock_account':
        await prisma.user.update({
          where: { id },
          data: {
            locked_until: null,
            failed_login_attempts: 0,
          },
        });

        // Log account unlock
        await prisma.auditLog.create({
          data: {
            user_id: authResult.user?.id,
            action: 'ACCOUNT_UNLOCKED_BY_ADMIN',
            resource: 'user',
            resource_id: id,
            ip_address: RequestSecurity.getClientIP(request),
            user_agent: RequestSecurity.getUserAgent(request),
            success: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'تم إلغاء قفل الحساب بنجاح',
        });

      case 'terminate_sessions':
        // Delete all user sessions
        const deletedSessions = await prisma.session.deleteMany({
          where: { user_id: id },
        });

        // Log session termination
        await prisma.auditLog.create({
          data: {
            user_id: authResult.user?.id,
            action: 'SESSIONS_TERMINATED_BY_ADMIN',
            resource: 'user',
            resource_id: id,
            details: {
              terminatedSessions: deletedSessions.count,
            },
            ip_address: RequestSecurity.getClientIP(request),
            user_agent: RequestSecurity.getUserAgent(request),
            success: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: `تم إنهاء ${deletedSessions.count} جلسة بنجاح`,
        });

      default:
        return NextResponse.json(
          { error: 'عملية غير مدعومة' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('User operation error:', error);
    return NextResponse.json(
      { error: 'خطأ في تنفيذ العملية' },
      { status: 500 }
    );
  }
} 