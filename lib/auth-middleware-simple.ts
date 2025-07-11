import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  JWTSecurity, 
  RequestSecurity, 
  AuditLogger,
  JWTPayload,
  SecurityContext
} from './auth-security';
import { checkRateLimit, rateLimitConfigs } from './rate-limiter';

const prisma = new PrismaClient();

// Types
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionId: string;
}

export interface MiddlewareResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  response?: NextResponse;
}

// Simple Authentication Middleware
export class SimpleAuthMiddleware {
  /**
   * Basic authentication check
   */
  static async authenticate(request: NextRequest): Promise<MiddlewareResult> {
    try {
      // Extract JWT token
      const authHeader = request.headers.get('authorization');
      const token = JWTSecurity.extractTokenFromHeader(authHeader);

      if (!token) {
        return {
          success: false,
          error: 'مطلوب رمز المصادقة',
          response: NextResponse.json(
            { error: 'مطلوب رمز المصادقة' },
            { status: 401 }
          )
        };
      }

      // Verify JWT token
      const payload = JWTSecurity.verifyToken(token);
      if (!payload) {
        return {
          success: false,
          error: 'رمز المصادقة غير صالح',
          response: NextResponse.json(
            { error: 'رمز المصادقة غير صالح' },
            { status: 401 }
          )
        };
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.is_active) {
        return {
          success: false,
          error: 'المستخدم غير موجود أو معطل',
          response: NextResponse.json(
            { error: 'المستخدم غير موجود أو معطل' },
            { status: 401 }
          )
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionId: payload.sessionId
        }
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'خطأ في المصادقة',
        response: NextResponse.json(
          { error: 'خطأ في المصادقة' },
          { status: 500 }
        )
      };
    }
  }

  /**
   * Rate limiting for login attempts
   */
  static async checkLoginRateLimit(request: NextRequest): Promise<MiddlewareResult> {
    const result = await checkRateLimit(request, 'login');
    
    if (!result.success) {
      return {
        success: false,
        error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول',
        response: NextResponse.json(
          { 
            error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول',
            retryAfter: result.retryAfter
          },
          { status: 429 }
        )
      };
    }

    return { success: true };
  }

  /**
   * Rate limiting for registration attempts
   */
  static async checkRegistrationRateLimit(request: NextRequest): Promise<MiddlewareResult> {
    const result = await checkRateLimit(request, 'register');
    
    if (!result.success) {
      return {
        success: false,
        error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
        response: NextResponse.json(
          { 
            error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
            retryAfter: result.retryAfter
          },
          { status: 429 }
        )
      };
    }

    return { success: true };
  }

  /**
   * Check if user has required role
   */
  static checkRole(user: AuthenticatedUser, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role);
  }

  /**
   * Admin access check
   */
  static async requireAdmin(request: NextRequest): Promise<MiddlewareResult> {
    const authResult = await this.authenticate(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult;
    }

    if (!this.checkRole(authResult.user, ['admin'])) {
      return {
        success: false,
        error: 'مطلوب صلاحية مدير',
        response: NextResponse.json(
          { error: 'مطلوب صلاحية مدير' },
          { status: 403 }
        )
      };
    }

    return authResult;
  }

  /**
   * Editor access check
   */
  static async requireEditor(request: NextRequest): Promise<MiddlewareResult> {
    const authResult = await this.authenticate(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult;
    }

    if (!this.checkRole(authResult.user, ['editor', 'admin'])) {
      return {
        success: false,
        error: 'مطلوب صلاحية محرر أو مدير',
        response: NextResponse.json(
          { error: 'مطلوب صلاحية محرر أو مدير' },
          { status: 403 }
        )
      };
    }

    return authResult;
  }
}

// Input Validation
export class SimpleValidation {
  /**
   * Validate registration input
   */
  static validateRegistration(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.email || !RequestSecurity.validateEmail(data.email)) {
      errors.push('البريد الإلكتروني غير صالح');
    }

    if (!data.name || data.name.length < 2) {
      errors.push('الاسم يجب أن يكون حرفين على الأقل');
    }

    if (!data.password) {
      errors.push('كلمة المرور مطلوبة');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate login input
   */
  static validateLogin(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.email || !RequestSecurity.validateEmail(data.email)) {
      errors.push('البريد الإلكتروني غير صالح');
    }

    if (!data.password) {
      errors.push('كلمة المرور مطلوبة');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Security Headers
export class SimpleSecurityHeaders {
  /**
   * Add basic security headers
   */
  static addHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
}

// CORS Support
export class SimpleCORS {
  /**
   * Handle CORS preflight
   */
  static handlePreflight(request: NextRequest): NextResponse | null {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    return null;
  }

  /**
   * Add CORS headers to response
   */
  static addHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}

// Classes already exported above 