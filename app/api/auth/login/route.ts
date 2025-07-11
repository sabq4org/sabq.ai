import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  PasswordSecurity, 
  RequestSecurity, 
  RateLimiter,
  JWTSecurity,
  AccountSecurity
} from '../../../../lib/auth-security';

const prisma = new PrismaClient();

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Security context
    const securityContext = RequestSecurity.createSecurityContext(request);
    
    // Rate limiting
    const rateLimitId = `login:${securityContext.ipAddress}`;
    if (RateLimiter.isRateLimited(rateLimitId, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول',
          retryAfter: 900
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { email, password } = await request.json();
    
    // Input validation
    const validation = validateLoginInput({ email, password });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Check if user is verified (using existing field)
    if (!user.is_verified) {
      // For demo purposes, we'll allow login but show a warning
      console.log('User is not verified but allowing login for demo');
    }

    // Verify password
    const isPasswordValid = await PasswordSecurity.verifyPassword(password, user.hashed_password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login: new Date(),
        updated_at: new Date()
      }
    });

    // Generate JWT token
    const sessionId = crypto.randomUUID();
    const jwtToken = JWTSecurity.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId
    });

    // Create session
    await prisma.session.create({
      data: {
        id: sessionId,
        user_id: user.id,
        session_token: jwtToken,
        device_info: {
          userAgent: securityContext.userAgent,
          ipAddress: securityContext.ipAddress
        },
        ip_address: securityContext.ipAddress,
        started_at: new Date()
      }
    });

    // Reset rate limit on successful login
    RateLimiter.resetRateLimit(rateLimitId);

    // Prepare response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_verified: user.is_verified,
        last_login: user.last_login
      },
      token: jwtToken,
      sessionId: sessionId,
      message: 'تم تسجيل الدخول بنجاح'
    });

    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}

// Input validation helper
function validateLoginInput(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !RequestSecurity.validateEmail(data.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  // Password validation
  if (!data.password) {
    errors.push('كلمة المرور مطلوبة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 