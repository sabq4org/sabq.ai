import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Constants
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

// Password Security
export class PasswordSecurity {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// JWT Security
export class JWTSecurity {
  /**
   * Generate a JWT token
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'sabq-ai-cms',
        audience: 'sabq-ai-users'
      });
    } catch (error) {
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * Generate a refresh token
   */
  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'sabq-ai-cms',
        audience: 'sabq-ai-users'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(): Date {
    const now = new Date();
    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 days
    return new Date(now.getTime() + expirationTime);
  }
}

// Request Security
export class RequestSecurity {
  /**
   * Extract IP address from request
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown';
  }

  /**
   * Create security context from request
   */
  static createSecurityContext(request: NextRequest): SecurityContext {
    return {
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
      timestamp: new Date()
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

// Rate Limiting
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if request should be rate limited
   */
  static isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attemptData = this.attempts.get(identifier);

    if (!attemptData || now > attemptData.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (attemptData.count >= maxAttempts) {
      return true;
    }

    attemptData.count++;
    return false;
  }

  /**
   * Reset rate limit for identifier
   */
  static resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(identifier: string, maxAttempts: number = 5): number {
    const attemptData = this.attempts.get(identifier);
    if (!attemptData) return maxAttempts;
    
    return Math.max(0, maxAttempts - attemptData.count);
  }
}

// Account Security
export class AccountSecurity {
  /**
   * Check if account should be locked due to failed attempts
   */
  static shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Calculate lockout expiration time
   */
  static calculateLockoutExpiration(): Date {
    return new Date(Date.now() + LOCKOUT_DURATION);
  }

  /**
   * Check if account is currently locked
   */
  static isAccountLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }

  /**
   * Generate password reset token with expiration
   */
  static generatePasswordResetToken(): {
    token: string;
    expires: Date;
  } {
    return {
      token: PasswordSecurity.generateSecureToken(32),
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
  }

  /**
   * Generate email verification token with expiration
   */
  static generateEmailVerificationToken(): {
    token: string;
    expires: Date;
  } {
    return {
      token: PasswordSecurity.generateSecureToken(32),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }
}

// Audit Logging
export class AuditLogger {
  /**
   * Create audit log entry data
   */
  static createLogEntry(
    action: string,
    userId?: string,
    resource?: string,
    resourceId?: string,
    details?: any,
    context?: SecurityContext,
    success: boolean = true,
    errorMessage?: string
  ) {
    return {
      user_id: userId || null,
      action,
      resource: resource || null,
      resource_id: resourceId || null,
      details: details || null,
      ip_address: context?.ipAddress || null,
      user_agent: context?.userAgent || null,
      success,
      error_message: errorMessage || null,
      created_at: new Date()
    };
  }

  /**
   * Common audit actions
   */
  static readonly ACTIONS = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    FAILED_LOGIN: 'failed_login',
    REGISTER: 'register',
    PASSWORD_CHANGE: 'password_change',
    PASSWORD_RESET_REQUEST: 'password_reset_request',
    PASSWORD_RESET_COMPLETE: 'password_reset_complete',
    EMAIL_VERIFICATION: 'email_verification',
    ACCOUNT_LOCKED: 'account_locked',
    ACCOUNT_UNLOCKED: 'account_unlocked',
    PROFILE_UPDATE: 'profile_update',
    ROLE_CHANGE: 'role_change',
    ACCOUNT_DEACTIVATED: 'account_deactivated',
    ACCOUNT_REACTIVATED: 'account_reactivated',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity'
  } as const;
}

// CSRF Protection
export class CSRFProtection {
  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // Simple implementation - in production, use more sophisticated validation
    return token === sessionToken;
  }
}

// Export all utilities
export {
  SALT_ROUNDS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION
}; 