/**
 * API Routes for User Authentication - Login
 * 
 * @description Handles user login with security measures and audit logging
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  PasswordSecurity, 
  JWTSecurity, 
  RequestSecurity, 
  AuditLogger 
} from '@/lib/auth-security';
import { checkRateLimit } from '@/lib/rate-limiter';

const prisma = new PrismaClient();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('عنوان البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

const socialLoginSchema = z.object({
  provider: z.enum(['google', 'github', 'microsoft']),
  idToken: z.string(),
  accessToken: z.string().optional(),
  rememberMe: z.boolean().default(false),
});

/**
 * Helper function to handle failed login attempts
 */
async function handleFailedLogin(
  email: string,
  ipAddress: string,
  reason: string,
  userAgent?: string
) {
  try {
    // Get user if exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLoginAt: new Date(),
        },
      });

      // Check if account should be locked
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (updatedUser && updatedUser.failedLoginAttempts >= 5) {
        // Lock account for 30 minutes
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          },
        });

        // Send security alert
        await sendSecurityAlert({
          userId: user.id,
          email: user.email,
          type: 'ACCOUNT_LOCKED',
          details: {
            reason: 'Multiple failed login attempts',
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Log failed login attempt
    await logAuditEvent({
      userId: user?.id || 'unknown',
      action: 'LOGIN_FAILED',
      resource: 'auth',
      metadata: {
        email,
        reason,
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error handling failed login:', error);
  }
}

/**
 * Helper function to handle successful login
 */
async function handleSuccessfulLogin(
  user: any,
  ipAddress: string,
  userAgent?: string,
  deviceFingerprint?: string
) {
  try {
    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        accountLockedUntil: null,
      },
    });

    // Detect device info
    const deviceInfo = detectDevice(userAgent || '');
    
    // Check if this is a new device
    const existingSession = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        deviceFingerprint: deviceFingerprint || '',
        isActive: true,
      },
    });

    if (!existingSession && deviceFingerprint) {
      // Send new device alert
      await sendSecurityAlert({
        userId: user.id,
        email: user.email,
        type: 'NEW_DEVICE_LOGIN',
        details: {
          deviceInfo,
          ipAddress,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create or update session
    const session = await prisma.userSession.upsert({
      where: {
        userId_deviceFingerprint: {
          userId: user.id,
          deviceFingerprint: deviceFingerprint || '',
        },
      },
      update: {
        lastAccessAt: new Date(),
        ipAddress,
        userAgent,
        isActive: true,
      },
      create: {
        userId: user.id,
        deviceFingerprint: deviceFingerprint || '',
        ipAddress,
        userAgent,
        deviceInfo,
        isActive: true,
        lastAccessAt: new Date(),
      },
    });

    // Log successful login
    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      metadata: {
        email: user.email,
        ipAddress,
        userAgent,
        deviceInfo,
        sessionId: session.id,
        timestamp: new Date().toISOString(),
      },
    });

    return session;

  } catch (error) {
    console.error('Error handling successful login:', error);
    throw error;
  }
}

/**
 * POST /api/auth/login
 * Handles user login with email/password
 */
export async function POST(request: NextRequest) {
  try {
    // Get client info
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, 'login');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Check if user is already logged in
    const session = await getServerSession(authOptions);
    if (session) {
      return NextResponse.json(
        { error: 'المستخدم مسجل دخول بالفعل' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        role: true,
        profile: true,
      },
    });

    if (!user) {
      await handleFailedLogin(
        validatedData.email,
        ipAddress,
        'User not found',
        userAgent
      );
      return NextResponse.json(
        { error: 'بيانات تسجيل الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        { 
          error: 'الحساب مقفل مؤقتاً',
          details: `يرجى المحاولة بعد ${remainingTime} دقيقة`,
        },
        { status: 423 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      await handleFailedLogin(
        validatedData.email,
        ipAddress,
        'Account inactive',
        userAgent
      );
      return NextResponse.json(
        { error: 'الحساب غير نشط' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      await handleFailedLogin(
        validatedData.email,
        ipAddress,
        'Invalid password',
        userAgent
      );
      return NextResponse.json(
        { error: 'بيانات تسجيل الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Check if two-factor authentication is required
    if (user.twoFactorEnabled) {
      if (!validatedData.twoFactorCode) {
        // Generate and send 2FA code
        const twoFactorCode = generateTwoFactorCode();
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorCode,
            twoFactorCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          },
        });

        await sendTwoFactorCode(user.email, twoFactorCode);

        return NextResponse.json({
          success: false,
          requiresTwoFactor: true,
          message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
        });
      }

      // Verify 2FA code
      if (
        !user.twoFactorCode ||
        user.twoFactorCode !== validatedData.twoFactorCode ||
        !user.twoFactorCodeExpiresAt ||
        user.twoFactorCodeExpiresAt < new Date()
      ) {
        await handleFailedLogin(
          validatedData.email,
          ipAddress,
          'Invalid 2FA code',
          userAgent
        );
        return NextResponse.json(
          { error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' },
          { status: 401 }
        );
      }

      // Clear 2FA code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorCodeExpiresAt: null,
        },
      });
    }

    // Handle successful login
    const userSession = await handleSuccessfulLogin(
      user,
      ipAddress,
      userAgent,
      validatedData.deviceFingerprint
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
      lastLoginAt: user.lastLoginAt,
      preferences: user.preferences,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    // Set session cookie
    const sessionExpiry = validatedData.rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          id: userSession.id,
          expiresAt: sessionExpiry.toISOString(),
        },
      },
      message: 'تم تسجيل الدخول بنجاح',
    });

    // Set HTTP-only cookie
    response.cookies.set('session-token', userSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: sessionExpiry,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error during login:', error);
    
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
      userId: 'unknown',
      action: 'LOGIN_ERROR',
      resource: 'auth',
      metadata: {
        error: error.message,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في تسجيل الدخول',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/login/social
 * Handles social login (Google, GitHub, Microsoft)
 */
export async function PUT(request: NextRequest) {
  try {
    // Get client info
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limiting
    const rateLimitResult = await rateLimiter.check(
      `social-login:${ipAddress}`,
      10, // 10 attempts
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Check if user is already logged in
    const session = await getServerSession(authOptions);
    if (session) {
      return NextResponse.json(
        { error: 'المستخدم مسجل دخول بالفعل' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = socialLoginSchema.parse(body);

    // Use NextAuth to handle social login
    const result = await signIn(validatedData.provider, {
      idToken: validatedData.idToken,
      accessToken: validatedData.accessToken,
      redirect: false,
    });

    if (result?.error) {
      await logAuditEvent({
        userId: 'unknown',
        action: 'SOCIAL_LOGIN_FAILED',
        resource: 'auth',
        metadata: {
          provider: validatedData.provider,
          error: result.error,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json(
        { error: 'فشل تسجيل الدخول عبر الوسائل الاجتماعية' },
        { status: 401 }
      );
    }

    // Get user session after successful login
    const newSession = await getServerSession(authOptions);
    
    if (newSession && newSession.user) {
      // Handle successful social login
      await handleSuccessfulLogin(
        newSession.user,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        data: {
          user: newSession.user,
          session: newSession,
        },
        message: 'تم تسجيل الدخول بنجاح',
      });
    }

    return NextResponse.json(
      { error: 'فشل في إنشاء الجلسة' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error during social login:', error);
    
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
      userId: 'unknown',
      action: 'SOCIAL_LOGIN_ERROR',
      resource: 'auth',
      metadata: {
        error: error.message,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في تسجيل الدخول عبر الوسائل الاجتماعية',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 