import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PasswordSecurity, RequestSecurity } from '@/lib/auth-security';
import { checkRateLimit } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100, 'الاسم طويل جداً'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().optional(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  role: z.enum(['reader', 'editor', 'admin']).default('reader'),
  status: z.enum(['active', 'banned', 'pending']).default('active'),
  two_factor: z.boolean().default(false),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين').max(100, 'الاسم طويل جداً').optional(),
  phone: z.string().optional(),
  role: z.enum(['reader', 'editor', 'admin']).optional(),
  status: z.enum(['active', 'banned', 'pending']).optional(),
  two_factor: z.boolean().optional(),
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
 * GET /api/admin/users
 * Get users list with search and filtering
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.is_active = status === 'active';
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          updated_at: true,
          last_login: true,
          failed_login_attempts: true,
          locked_until: true,
          _count: {
            select: {
              sessions: true,
              audit_logs: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get user statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const statusStats = await prisma.user.groupBy({
      by: ['is_active'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          status: user.is_active ? 'active' : 'inactive',
          sessionsCount: user._count.sessions,
          activityCount: user._count.audit_logs,
          isLocked: user.locked_until && user.locked_until > new Date(),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext,
          hasPrev,
        },
        stats: {
          byRole: stats.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
          }, {} as Record<string, number>),
          byStatus: statusStats.reduce((acc, item) => {
            acc[item.is_active ? 'active' : 'inactive'] = item._count;
            return acc;
          }, {} as Record<string, number>),
          total: totalCount,
        },
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create new user
 */
export async function POST(request: NextRequest) {
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
    const rateLimitResult = await checkRateLimit(request, 'register');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد الأقصى للطلبات' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    
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

    const { name, email, phone, password, role, status, two_factor } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'المستخدم موجود بالفعل' },
        { status: 409 }
      );
    }

    // Validate password strength
    const passwordValidation = PasswordSecurity.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'كلمة المرور ضعيفة',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await PasswordSecurity.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: RequestSecurity.sanitizeInput(name),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        password_hash: hashedPassword,
        role,
        is_active: status === 'active',
        is_verified: status === 'active',
        // Add other fields as needed
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        is_verified: true,
        created_at: true,
      },
    });

    // Log the creation
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user?.id,
        action: 'USER_CREATED',
        resource: 'user',
        resource_id: user.id,
        details: {
          createdUser: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
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
          ...user,
          status: user.is_active ? 'active' : 'inactive',
        },
      },
      message: 'تم إنشاء المستخدم بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Bulk delete users
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permission
    const authResult = await checkAdminPermission(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('ids')?.split(',') || [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'لم يتم تحديد مستخدمين للحذف' },
        { status: 400 }
      );
    }

    // Prevent deleting current admin
    if (userIds.includes(authResult.user?.id)) {
      return NextResponse.json(
        { error: 'لا يمكن حذف حسابك الحالي' },
        { status: 400 }
      );
    }

    // Get users to be deleted
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    // Delete users (cascade will handle related records)
    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        user_id: authResult.user?.id,
        action: 'USERS_BULK_DELETED',
        resource: 'user',
        details: {
          deletedUsers: usersToDelete,
          count: result.count,
        },
        ip_address: RequestSecurity.getClientIP(request),
        user_agent: RequestSecurity.getUserAgent(request),
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
        users: usersToDelete,
      },
      message: `تم حذف ${result.count} مستخدم بنجاح`,
    });

  } catch (error) {
    console.error('Bulk delete users error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المستخدمين' },
      { status: 500 }
    );
  }
} 