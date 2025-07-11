import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  PasswordSecurity, 
  RequestSecurity, 
  RateLimiter,
  JWTSecurity
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
    const rateLimitId = `register:${securityContext.ipAddress}`;
    if (RateLimiter.isRateLimited(rateLimitId, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
          retryAfter: 3600
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { email, password, name } = await request.json();
    
    // Input validation
    const validation = validateRegistrationInput({ email, password, name });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = PasswordSecurity.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await PasswordSecurity.hashPassword(password);

    // Create user (using existing schema field names)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: RequestSecurity.sanitizeInput(name),
        hashed_password: hashedPassword, // Using existing field name
        role: 'reader',
        is_verified: false,
        created_at: new Date(),
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

    // Create session (using existing schema field names)
    await prisma.session.create({
      data: {
        id: sessionId,
        user_id: user.id,
        session_token: jwtToken, // Using existing field name
        device_info: {
          userAgent: securityContext.userAgent,
          ipAddress: securityContext.ipAddress
        },
        ip_address: securityContext.ipAddress,
        started_at: new Date()
      }
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      token: jwtToken,
      sessionId: sessionId,
      message: 'تم إنشاء الحساب بنجاح'
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
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في إنشاء الحساب' },
      { status: 500 }
    );
  }
}

// Input validation helper
function validateRegistrationInput(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !RequestSecurity.validateEmail(data.email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  // Name validation
  if (!data.name || data.name.length < 2) {
    errors.push('الاسم يجب أن يكون حرفين على الأقل');
  }

  if (data.name && data.name.length > 100) {
    errors.push('الاسم يجب أن يكون أقل من 100 حرف');
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