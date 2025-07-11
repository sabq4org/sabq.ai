import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkRateLimit, logSecurityEvent } from './security';

const prisma = new PrismaClient();

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * استخراج التوكن من الطلب
 */
function extractToken(request: NextRequest): string | null {
  // من Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // من Cookie
  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    return token;
  }

  return null;
}

/**
 * التحقق من صحة التوكن
 */
async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as any;
    
    // جلب معلومات المستخدم من قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        is_verified: true,
        failed_login_attempts: true,
        locked_until: true
      }
    });

    if (!user) {
      return null;
    }

    // التحقق من حالة الحساب
    if (!user.is_active) {
      return null;
    }

    // التحقق من قفل الحساب
    if (user.locked_until && user.locked_until > new Date()) {
      return null;
    }

    // تحديث آخر نشاط
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified
    };

  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware للمصادقة
 */
export async function authMiddleware(request: NextRequest): Promise<AuthResult> {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من حد الطلبات
    if (!checkRateLimit(`auth_${clientIp}`, 100)) { // 100 طلب في الدقيقة
      logSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: clientIp,
        userAgent,
        details: { endpoint: request.url }
      });

      return {
        success: false,
        error: 'Too many requests. Please try again later.'
      };
    }

    const token = extractToken(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    const user = await verifyToken(token);
    
    if (!user) {
      logSecurityEvent({
        type: 'invalid_token',
        ip: clientIp,
        userAgent,
        details: { token: token.substring(0, 10) + '...' }
      });

      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // تسجيل نشاط المستخدم
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'api_access',
        resource: 'authentication',
        details: {
          endpoint: request.url,
          method: request.method,
          ip: clientIp,
          userAgent
        },
        ip_address: clientIp,
        user_agent: userAgent,
        success: true
      }
    });

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * التحقق من الصلاحيات
 */
export function hasPermission(user: AuthUser, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // تدرج الصلاحيات
  const roleHierarchy: Record<string, number> = {
    'reader': 1,
    'editor': 2,
    'admin': 3
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = Math.min(...roles.map(role => roleHierarchy[role] || 999));

  return userLevel >= requiredLevel;
}

/**
 * Middleware للتحقق من الصلاحيات
 */
export async function requirePermission(
  request: NextRequest,
  requiredRole: string | string[]
): Promise<AuthResult> {
  const authResult = await authMiddleware(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  if (!hasPermission(authResult.user, requiredRole)) {
    const clientIp = request.headers.get('x-forwarded-for') || 
      'unknown';

    logSecurityEvent({
      type: 'insufficient_permissions',
      userId: authResult.user.id,
      ip: clientIp,
      details: {
        userRole: authResult.user.role,
        requiredRole,
        endpoint: request.url
      }
    });

    return {
      success: false,
      error: 'Insufficient permissions'
    };
  }

  return authResult;
}

/**
 * Middleware للتحقق من ملكية المورد
 */
export async function requireOwnership(
  request: NextRequest,
  resourceType: string,
  resourceId: string,
  userIdField: string = 'author_id'
): Promise<AuthResult> {
  const authResult = await authMiddleware(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // الأدمن يمكنه الوصول لكل شيء
  if (authResult.user.role === 'admin') {
    return authResult;
  }

  try {
    let resource: any = null;

    // جلب المورد حسب نوعه
    switch (resourceType) {
      case 'article':
        resource = await prisma.article.findUnique({
          where: { id: resourceId },
          select: { [userIdField]: true }
        });
        break;
      case 'media':
        resource = await prisma.mediaFile.findUnique({
          where: { id: resourceId },
          select: { uploaded_by: true }
        });
        break;
      // يمكن إضافة أنواع أخرى من الموارد
    }

    if (!resource) {
      return {
        success: false,
        error: 'Resource not found'
      };
    }

    const ownerId = resource[userIdField] || resource.uploaded_by;
    
    if (ownerId !== authResult.user.id) {
      logSecurityEvent({
        type: 'unauthorized_access_attempt',
        userId: authResult.user.id,
        details: {
          resourceType,
          resourceId,
          ownerId
        }
      });

      return {
        success: false,
        error: 'You do not have permission to access this resource'
      };
    }

    return authResult;

  } catch (error) {
    console.error('Ownership check error:', error);
    return {
      success: false,
      error: 'Failed to verify resource ownership'
    };
  }
}

/**
 * إنشاء JWT token
 */
export function createToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 ساعة
  };

  return jwt.sign(payload, secret);
}

/**
 * إنشاء refresh token
 */
export function createRefreshToken(user: AuthUser): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  const payload = {
    userId: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 أيام
  };

  return jwt.sign(payload, secret);
}

/**
 * تحديث التوكن
 */
export async function refreshToken(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, secret) as any;
    
    if (decoded.type !== 'refresh') {
      return { success: false, error: 'Invalid refresh token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        is_verified: true
      }
    });

    if (!user || !user.is_active) {
      return { success: false, error: 'User not found or inactive' };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified
    };

    const newAccessToken = createToken(authUser);
    const newRefreshToken = createRefreshToken(authUser);

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };

  } catch (error) {
    console.error('Refresh token error:', error);
    return { success: false, error: 'Invalid refresh token' };
  }
}

/**
 * إبطال التوكن (تسجيل خروج)
 */
export async function invalidateToken(token: string): Promise<boolean> {
  try {
    // في تطبيق حقيقي، يمكن إضافة blacklist للتوكنات المبطلة
    // أو تخزين التوكنات النشطة في قاعدة البيانات
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // تسجيل نشاط تسجيل الخروج
    await prisma.auditLog.create({
      data: {
        user_id: decoded.userId,
        action: 'logout',
        resource: 'authentication',
        success: true
      }
    });

    return true;
  } catch (error) {
    console.error('Token invalidation error:', error);
    return false;
  }
} 