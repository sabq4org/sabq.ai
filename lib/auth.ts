/**
 * مكتبة المصادقة الشاملة
 * Complete Authentication Library
 * @version 1.0.0
 * @author Sabq AI Team
 */

import { privacyManager, PersonalDataType, ProcessingPurpose } from './privacy-controls';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './security';

// أنواع المستخدمين والأدوار
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  SUBSCRIBER = 'subscriber',
  MODERATOR = 'moderator'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  BANNED = 'banned'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

// واجهات المستخدم والمصادقة
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  loginCount: number;
  preferences: UserPreferences;
  metadata: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  newsletter: boolean;
  security: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  activityTracking: boolean;
  dataCollection: boolean;
  analytics: boolean;
}

export interface UserMetadata {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  device?: string;
  signupSource?: string;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  active: boolean;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: AuthError;
  requiresTwoFactor?: boolean;
  requiresEmailVerification?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// فئة إدارة المصادقة الرئيسية
export class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, AuthSession> = new Map();
  private emailVerificationCodes: Map<string, { code: string; expiresAt: Date }> = new Map();
  private passwordResetTokens: Map<string, { token: string; expiresAt: Date; userId: string }> = new Map();

  constructor() {
    this.initializeDefaultUsers();
  }

  /**
   * تسجيل الدخول
   */
  async login(credentials: LoginCredentials, metadata?: Partial<UserMetadata>): Promise<AuthResult> {
    try {
      const user = this.findUserByEmail(credentials.email);
      
      if (!user) {
        await this.logAuthAttempt(credentials.email, 'login_failed', 'user_not_found');
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'بيانات الاعتماد غير صحيحة'
          }
        };
      }

      // فحص حالة المستخدم
      if (user.status === UserStatus.SUSPENDED) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'تم تعليق الحساب. اتصل بالدعم للمزيد من المعلومات'
          }
        };
      }

      if (user.status === UserStatus.BANNED) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_BANNED',
            message: 'تم حظر الحساب نهائياً'
          }
        };
      }

      // فحص Lockout
      if (user.metadata.lockoutUntil && user.metadata.lockoutUntil > new Date()) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `الحساب مقفل حتى ${user.metadata.lockoutUntil.toLocaleString('ar')}`
          }
        };
      }

      // التحقق من كلمة المرور
      const passwordValid = await verifyPassword(credentials.password, user.metadata.lastPasswordChange?.toString() || 'defaultsalt');
      
      if (!passwordValid) {
        await this.handleFailedLogin(user.id);
        await this.logAuthAttempt(credentials.email, 'login_failed', 'invalid_password');
        
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'بيانات الاعتماد غير صحيحة'
          }
        };
      }

      // فحص التحقق بخطوتين
      if (user.twoFactorEnabled && !credentials.twoFactorCode) {
        return {
          success: false,
          requiresTwoFactor: true,
          error: {
            code: 'TWO_FACTOR_REQUIRED',
            message: 'مطلوب رمز التحقق بخطوتين'
          }
        };
      }

      if (user.twoFactorEnabled && credentials.twoFactorCode) {
        const validTwoFactor = await this.verifyTwoFactorCode(user.id, credentials.twoFactorCode);
        if (!validTwoFactor) {
          return {
            success: false,
            error: {
              code: 'INVALID_TWO_FACTOR',
              message: 'رمز التحقق بخطوتين غير صحيح'
            }
          };
        }
      }

      // فحص تأكيد البريد الإلكتروني
      if (!user.emailVerified) {
        return {
          success: false,
          requiresEmailVerification: true,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'يجب تأكيد البريد الإلكتروني أولاً'
          }
        };
      }

      // إنشاء جلسة جديدة
      const session = await this.createSession(user.id, metadata);
      
      // تحديث بيانات المستخدم
      user.lastLogin = new Date();
      user.loginCount += 1;
      user.metadata.failedLoginAttempts = 0;
      user.metadata.lockoutUntil = undefined;
      
      if (metadata) {
        Object.assign(user.metadata, metadata);
      }

      await this.logAuthAttempt(credentials.email, 'login_success');

      return {
        success: true,
        user,
        session
      };

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: 'خطأ في تسجيل الدخول',
          details: error
        }
      };
    }
  }

  /**
   * تسجيل حساب جديد
   */
  async register(data: RegisterData, metadata?: Partial<UserMetadata>): Promise<AuthResult> {
    try {
      // التحقق من صحة البيانات
      const validation = this.validateRegistrationData(data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error!
        };
      }

      // فحص وجود المستخدم
      if (this.findUserByEmail(data.email)) {
        return {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'البريد الإلكتروني مسجل مسبقاً',
            field: 'email'
          }
        };
      }

      if (this.findUserByUsername(data.username)) {
        return {
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: 'اسم المستخدم مستخدم مسبقاً',
            field: 'username'
          }
        };
      }

      // إنشاء المستخدم الجديد
      const hashedPassword = await hashPassword(data.password);
      const userId = this.generateUserId();

      const newUser: User = {
        id: userId,
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        role: UserRole.SUBSCRIBER,
        status: UserStatus.PENDING,
        provider: AuthProvider.LOCAL,
        emailVerified: false,
        twoFactorEnabled: false,
        loginCount: 0,
        preferences: {
          language: 'ar',
          timezone: 'Asia/Riyadh',
          theme: 'auto',
          notifications: {
            email: true,
            push: true,
            sms: false,
            newsletter: data.newsletter || false,
            security: true
          },
          privacy: {
            profileVisibility: 'public',
            activityTracking: true,
            dataCollection: true,
            analytics: true
          }
        },
        metadata: {
          failedLoginAttempts: 0,
          lastPasswordChange: new Date(),
          ...metadata
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.set(userId, newUser);

      // إرسال رمز تأكيد البريد الإلكتروني
      await this.sendEmailVerification(newUser.email);

      // تسجيل الحدث
      await this.logAuthAttempt(data.email, 'register_success');

      // تسجيل العملية في نظام الخصوصية
      await privacyManager.logDataProcessing({
        id: Date.now().toString(),
        userId: newUser.id,
        action: 'create',
        dataType: PersonalDataType.BASIC,
        purpose: ProcessingPurpose.USER_MANAGEMENT,
        timestamp: new Date(),
        justification: 'User registration'
      });

      return {
        success: true,
        user: newUser,
        requiresEmailVerification: true
      };

    } catch (error) {
      console.error('خطأ في التسجيل:', error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'خطأ في التسجيل',
          details: error
        }
      };
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.active = false;
        await this.logAuthAttempt(session.userId, 'logout_success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }

  /**
   * التحقق من الجلسة
   */
  async verifySession(sessionId: string): Promise<{ valid: boolean; user?: User; session?: AuthSession }> {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session || !session.active || session.expiresAt < new Date()) {
        return { valid: false };
      }

      const user = this.users.get(session.userId);
      if (!user || user.status !== UserStatus.ACTIVE) {
        return { valid: false };
      }

      return { valid: true, user, session };
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      return { valid: false };
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const user = this.findUserByEmail(email);
      if (!user) {
        // لا نكشف عدم وجود المستخدم لأسباب أمنية
        return { success: true };
      }

      const resetToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // ساعة واحدة

      this.passwordResetTokens.set(resetToken, {
        token: resetToken,
        expiresAt,
        userId: user.id
      });

      // في تطبيق حقيقي، سيُرسل بريد إلكتروني
      console.log(`رمز إعادة تعيين كلمة المرور: ${resetToken}`);

      await this.logAuthAttempt(email, 'password_reset_requested');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message: 'خطأ في إعادة تعيين كلمة المرور'
        }
      };
    }
  }

  /**
   * تأكيد إعادة تعيين كلمة المرور
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const resetData = this.passwordResetTokens.get(token);
      
      if (!resetData || resetData.expiresAt < new Date()) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية'
          }
        };
      }

      const user = this.users.get(resetData.userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'المستخدم غير موجود'
          }
        };
      }

      // تحديث كلمة المرور
      const hashedPassword = await hashPassword(newPassword);
      user.metadata.lastPasswordChange = new Date();
      user.metadata.failedLoginAttempts = 0;
      user.metadata.lockoutUntil = undefined;

      // حذف الرمز
      this.passwordResetTokens.delete(token);

      await this.logAuthAttempt(user.email, 'password_reset_success');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIRM_RESET_ERROR',
          message: 'خطأ في تأكيد إعادة تعيين كلمة المرور'
        }
      };
    }
  }

  // وظائف مساعدة
  private findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  private findUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  private validateRegistrationData(data: RegisterData): { valid: boolean; error?: AuthError } {
    if (!data.email || !data.email.includes('@')) {
      return {
        valid: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'البريد الإلكتروني غير صحيح',
          field: 'email'
        }
      };
    }

    if (!data.password || data.password.length < 8) {
      return {
        valid: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
          field: 'password'
        }
      };
    }

    if (!data.acceptTerms) {
      return {
        valid: false,
        error: {
          code: 'TERMS_NOT_ACCEPTED',
          message: 'يجب الموافقة على الشروط والأحكام',
          field: 'acceptTerms'
        }
      };
    }

    return { valid: true };
  }

  private async createSession(userId: string, metadata?: Partial<UserMetadata>): Promise<AuthSession> {
    const sessionId = generateToken();
    const refreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // أسبوع

    const session: AuthSession = {
      id: sessionId,
      userId,
      token: sessionId,
      refreshToken,
      expiresAt,
      ipAddress: metadata?.ipAddress || 'unknown',
      userAgent: metadata?.userAgent || 'unknown',
      active: true,
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.metadata.failedLoginAttempts += 1;

    // قفل الحساب بعد 5 محاولات فاشلة
    if (user.metadata.failedLoginAttempts >= 5) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + 30); // نصف ساعة
      user.metadata.lockoutUntil = lockoutUntil;
    }
  }

  private async sendEmailVerification(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 دقيقة

    this.emailVerificationCodes.set(email, { code, expiresAt });
    
    // في تطبيق حقيقي، سيُرسل بريد إلكتروني
    console.log(`رمز تأكيد البريد الإلكتروني لـ ${email}: ${code}`);
  }

  private async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    // في تطبيق حقيقي، سيتم التحقق من رمز TOTP
    // هنا سنقبل أي رمز مكون من 6 أرقام
    return /^\d{6}$/.test(code);
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async logAuthAttempt(identifier: string, action: string, details?: string): Promise<void> {
    console.log(`Auth Log - ${new Date().toISOString()}: ${action} for ${identifier}${details ? ` (${details})` : ''}`);
  }

  private initializeDefaultUsers(): void {
    // إنشاء مستخدم إداري افتراضي
    const adminUser: User = {
      id: 'admin_default',
      email: 'admin@sabq.ai',
      username: 'admin',
      fullName: 'مدير النظام',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      emailVerified: true,
      twoFactorEnabled: false,
      loginCount: 0,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          sms: true,
          newsletter: false,
          security: true
        },
        privacy: {
          profileVisibility: 'private',
          activityTracking: false,
          dataCollection: false,
          analytics: true
        }
      },
      metadata: {
        failedLoginAttempts: 0,
        lastPasswordChange: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(adminUser.id, adminUser);
  }
}

// إنشاء مثيل مدير المصادقة
export const authManager = new AuthManager();

// وظائف مساعدة للتصدير
export const AuthUtils = {
  /**
   * فحص الصلاحيات
   */
  hasPermission(user: User, permission: string): boolean {
    const rolePermissions = {
      [UserRole.ADMIN]: ['*'],
      [UserRole.EDITOR]: ['read', 'write', 'edit', 'publish'],
      [UserRole.AUTHOR]: ['read', 'write', 'edit'],
      [UserRole.MODERATOR]: ['read', 'moderate'],
      [UserRole.SUBSCRIBER]: ['read']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  },

  /**
   * فحص الدور
   */
  hasRole(user: User, role: UserRole): boolean {
    return user.role === role;
  },

  /**
   * فحص الدور الأدنى
   */
  hasMinimumRole(user: User, minimumRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUBSCRIBER]: 1,
      [UserRole.AUTHOR]: 2,
      [UserRole.MODERATOR]: 3,
      [UserRole.EDITOR]: 4,
      [UserRole.ADMIN]: 5
    };

    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  },

  /**
   * توليد رمز دعوة
   */
  generateInviteCode(role: UserRole): string {
    const rolePrefix = {
      [UserRole.ADMIN]: 'ADM',
      [UserRole.EDITOR]: 'EDT',
      [UserRole.AUTHOR]: 'AUT',
      [UserRole.MODERATOR]: 'MOD',
      [UserRole.SUBSCRIBER]: 'SUB'
    };

    return `${rolePrefix[role]}_${Date.now()}_${generateToken().substr(0, 8).toUpperCase()}`;
  }
}; 