import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  JWTSecurity, 
  RequestSecurity, 
  RateLimiter, 
  AuditLogger,
  JWTPayload,
  SecurityContext
} from './auth-security';

const prisma = new PrismaClient();

// Types
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    sessionId: string;
  };
  securityContext?: SecurityContext;
}

export interface MiddlewareOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimitKey?: string;
  rateLimitAttempts?: number;
  rateLimitWindow?: number;
  skipCSRF?: boolean;
  auditAction?: string;
}

// Authentication Middleware
export class AuthMiddleware {
  /**
   * Main authentication middleware
   */
  static async authenticate(
    request: NextRequest,
    options: MiddlewareOptions = {}
  ): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    response?: NextResponse;
  }> {
    const securityContext = RequestSecurity.createSecurityContext(request);
    
    try {
      // Rate limiting check
      if (options.rateLimitKey) {
        const rateLimitId = `${options.rateLimitKey}:${securityContext.ipAddress}`;
        if (RateLimiter.isRateLimited(
          rateLimitId, 
          options.rateLimitAttempts || 10, 
          options.rateLimitWindow || 15 * 60 * 1000
        )) {
          return {
            success: false,
            error: 'تم تجاوز الحد المسموح من الطلبات',
            response: NextResponse.json(
              { 
                error: 'تم تجاوز الحد المسموح من الطلبات',
                retryAfter: Math.ceil((options.rateLimitWindow || 15 * 60 * 1000) / 1000)
              },
              { status: 429 }
            )
          };
        }
      }

      // Extract and verify JWT token
      const authHeader = request.headers.get('authorization');
      const token = JWTSecurity.extractTokenFromHeader(authHeader);

      if (!token) {
        if (options.requireAuth) {
          return {
            success: false,
            error: 'مطلوب رمز المصادقة',
            response: NextResponse.json(
              { error: 'مطلوب رمز المصادقة' },
              { status: 401 }
            )
          };
        }
        return { success: true };
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

      // Check if session exists and is active
      const session = await prisma.session.findUnique({
        where: { jwt_token: token },
        include: { user: true }
      });

      if (!session || !session.is_active || session.expires_at < new Date()) {
        return {
          success: false,
          error: 'الجلسة منتهية الصلاحية',
          response: NextResponse.json(
            { error: 'الجلسة منتهية الصلاحية' },
            { status: 401 }
          )
        };
      }

      // Check if user is active
      if (!session.user.is_active) {
        return {
          success: false,
          error: 'الحساب معطل',
          response: NextResponse.json(
            { error: 'الحساب معطل' },
            { status: 403 }
          )
        };
      }

      // Check role permissions
      if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
        return {
          success: false,
          error: 'ليس لديك صلاحية للوصول',
          response: NextResponse.json(
            { error: 'ليس لديك صلاحية للوصول' },
            { status: 403 }
          )
        };
      }

      // Update session last_used
      await prisma.session.update({
        where: { id: session.id },
        data: { last_used: new Date() }
      });

      // Update user last_login
      await prisma.user.update({
        where: { id: session.user.id },
        data: { last_login: new Date() }
      });

      // Log successful authentication if audit action is specified
      if (options.auditAction) {
        try {
          await prisma.auditLog.create({
            data: AuditLogger.createLogEntry(
              options.auditAction,
              session.user.id,
              'session',
              session.id,
              { endpoint: request.nextUrl.pathname },
              securityContext,
              true
            )
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }
      }

      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          sessionId: session.id
        }
      };

    } catch (error) {
      console.error('Authentication middleware error:', error);
      
      // Log failed authentication
      if (options.auditAction) {
        try {
          await prisma.auditLog.create({
            data: AuditLogger.createLogEntry(
              'failed_auth',
              undefined,
              'middleware',
              undefined,
              { endpoint: request.nextUrl.pathname, error: error.message },
              securityContext,
              false,
              error.message
            )
          });
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError);
        }
      }

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
   * Middleware for admin-only routes
   */
  static async requireAdmin(request: NextRequest) {
    return await this.authenticate(request, {
      requireAuth: true,
      allowedRoles: ['admin'],
      rateLimitKey: 'admin-access',
      rateLimitAttempts: 20,
      auditAction: 'admin_access'
    });
  }

  /**
   * Middleware for editor and admin routes
   */
  static async requireEditor(request: NextRequest) {
    return await this.authenticate(request, {
      requireAuth: true,
      allowedRoles: ['editor', 'admin'],
      rateLimitKey: 'editor-access',
      rateLimitAttempts: 30,
      auditAction: 'editor_access'
    });
  }

  /**
   * Middleware for authenticated users
   */
  static async requireAuth(request: NextRequest) {
    return await this.authenticate(request, {
      requireAuth: true,
      rateLimitKey: 'auth-access',
      rateLimitAttempts: 60,
      auditAction: 'auth_access'
    });
  }

  /**
   * Middleware for login attempts
   */
  static async loginAttempt(request: NextRequest) {
    const securityContext = RequestSecurity.createSecurityContext(request);
    const rateLimitId = `login:${securityContext.ipAddress}`;
    
    if (RateLimiter.isRateLimited(rateLimitId, 5, 15 * 60 * 1000)) {
      return {
        success: false,
        error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول',
        response: NextResponse.json(
          { 
            error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول',
            retryAfter: 900 // 15 minutes
          },
          { status: 429 }
        )
      };
    }

    return { success: true };
  }

  /**
   * Middleware for registration attempts
   */
  static async registrationAttempt(request: NextRequest) {
    const securityContext = RequestSecurity.createSecurityContext(request);
    const rateLimitId = `register:${securityContext.ipAddress}`;
    
    if (RateLimiter.isRateLimited(rateLimitId, 3, 60 * 60 * 1000)) {
      return {
        success: false,
        error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
        response: NextResponse.json(
          { 
            error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
            retryAfter: 3600 // 1 hour
          },
          { status: 429 }
        )
      };
    }

    return { success: true };
  }
}

// Input Validation Middleware
export class ValidationMiddleware {
  /**
   * Validate registration input
   */
  static validateRegistration(data: any): {
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

    // Password validation
    if (!data.password) {
      errors.push('كلمة المرور مطلوبة');
    }

    // Sanitize inputs
    if (data.name) {
      data.name = RequestSecurity.sanitizeInput(data.name);
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

  /**
   * Validate password change input
   */
  static validatePasswordChange(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Current password validation
    if (!data.currentPassword) {
      errors.push('كلمة المرور الحالية مطلوبة');
    }

    // New password validation
    if (!data.newPassword) {
      errors.push('كلمة المرور الجديدة مطلوبة');
    }

    // Confirm password validation
    if (data.newPassword !== data.confirmPassword) {
      errors.push('كلمة المرور الجديدة وتأكيدها غير متطابقين');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Security Headers Middleware
export class SecurityHeadersMiddleware {
  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent XSS attacks
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Enforce HTTPS
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy
    response.headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
}

// CORS Middleware
export class CORSMiddleware {
  /**
   * Handle CORS for API routes
   */
  static handleCORS(request: NextRequest): NextResponse | null {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    return null;
  }

  /**
   * Add CORS headers to response
   */
  static addCORSHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    
    return response;
  }
}

// Export all classes and interfaces
export default {
  AuthMiddleware,
  ValidationMiddleware,
  SecurityHeadersMiddleware,
  CORSMiddleware
}; 