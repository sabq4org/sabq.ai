/**
 * RBAC Middleware المتقدم
 * نظام التحقق من الصلاحيات القائم على الأدوار والفرق
 * @version 1.0.0
 * @author Sabq AI Team
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// أنواع البيانات
export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  roles: UserRole[];
  teams: TeamUser[];
}

export interface UserRole {
  id: string;
  role: {
    id: string;
    name: string;
    permissions: RolePermission[];
  };
  is_active: boolean;
  expires_at?: Date;
}

export interface TeamUser {
  id: string;
  team: {
    id: string;
    name: string;
    roles: TeamRole[];
  };
  is_active: boolean;
}

export interface RolePermission {
  permission: {
    id: string;
    code: string;
    category: string;
    resource?: string;
    action: string;
    scope: string;
  };
}

export interface TeamRole {
  role: {
    id: string;
    name: string;
    permissions: RolePermission[];
  };
}

export interface AuthContext {
  user: User;
  permissions: string[];
  roles: string[];
  teams: string[];
}

/**
 * فئة RBAC للتحقق من الصلاحيات
 */
export class RBACManager {
  
  /**
   * التحقق من صحة الرمز المميز واستخراج المستخدم
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      // بيانات تجريبية للمستخدم (يمكن استبدالها بقاعدة البيانات لاحقاً)
      const mockUser: User = {
        id: decoded.userId || 'admin',
        email: 'admin@sabq.org',
        name: 'المدير العام',
        is_active: true,
        roles: [
          {
            id: '1',
            role: {
              id: '1',
              name: 'super_admin',
              permissions: [
                {
                  permission: {
                    id: '1',
                    code: 'manage:users',
                    category: 'users',
                    resource: 'user',
                    action: 'manage',
                    scope: 'global'
                  }
                },
                {
                  permission: {
                    id: '2',
                    code: 'manage:articles',
                    category: 'content',
                    resource: 'article',
                    action: 'manage',
                    scope: 'global'
                  }
                }
              ]
            },
            is_active: true
          }
        ],
        teams: []
      };

      return mockUser;
    } catch (error) {
      return null;
    }
  }

  /**
   * جمع جميع صلاحيات المستخدم من الأدوار والفرق
   */
  static getUserPermissions(user: User): string[] {
    const permissions = new Set<string>();

    // صلاحيات من الأدوار المباشرة
    user.roles.forEach(userRole => {
      if (userRole.is_active && (!userRole.expires_at || userRole.expires_at > new Date())) {
        userRole.role.permissions.forEach(rolePermission => {
          permissions.add(rolePermission.permission.code);
        });
      }
    });

    // صلاحيات من الفرق
    user.teams.forEach(teamUser => {
      if (teamUser.is_active) {
        teamUser.team.roles.forEach(teamRole => {
          teamRole.role.permissions.forEach(rolePermission => {
            permissions.add(rolePermission.permission.code);
          });
        });
      }
    });

    return Array.from(permissions);
  }

  /**
   * جمع جميع أدوار المستخدم
   */
  static getUserRoles(user: User): string[] {
    const roles = new Set<string>();

    // الأدوار المباشرة
    user.roles.forEach(userRole => {
      if (userRole.is_active && (!userRole.expires_at || userRole.expires_at > new Date())) {
        roles.add(userRole.role.name);
      }
    });

    // الأدوار من الفرق
    user.teams.forEach(teamUser => {
      if (teamUser.is_active) {
        teamUser.team.roles.forEach(teamRole => {
          roles.add(teamRole.role.name);
        });
      }
    });

    return Array.from(roles);
  }

  /**
   * جمع جميع فرق المستخدم
   */
  static getUserTeams(user: User): string[] {
    return user.teams
      .filter(teamUser => teamUser.is_active)
      .map(teamUser => teamUser.team.name);
  }

  /**
   * التحقق من صلاحية معينة
   */
  static hasPermission(user: User, permission: string): boolean {
    const userPermissions = this.getUserPermissions(user);
    
    // فحص الصلاحية المباشرة
    if (userPermissions.includes(permission)) {
      return true;
    }

    // فحص الصلاحيات البديلة (wildcard)
    const [resource, action] = permission.split(':');
    const wildcardPermissions = [
      `manage:${resource}`,
      `${resource}:*`,
      'manage:*',
      '*'
    ];

    return wildcardPermissions.some(wildcard => userPermissions.includes(wildcard));
  }

  /**
   * التحقق من دور معين
   */
  static hasRole(user: User, role: string): boolean {
    const userRoles = this.getUserRoles(user);
    return userRoles.includes(role);
  }

  /**
   * التحقق من عضوية فريق معين
   */
  static isTeamMember(user: User, teamName: string): boolean {
    const userTeams = this.getUserTeams(user);
    return userTeams.includes(teamName);
  }

  /**
   * التحقق من صلاحيات متعددة (كلها مطلوبة)
   */
  static hasAllPermissions(user: User, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * التحقق من صلاحيات متعددة (واحدة على الأقل مطلوبة)
   */
  static hasAnyPermission(user: User, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * إنشاء سياق التوثيق للمستخدم
   */
  static createAuthContext(user: User): AuthContext {
    return {
      user,
      permissions: this.getUserPermissions(user),
      roles: this.getUserRoles(user),
      teams: this.getUserTeams(user)
    };
  }
}

/**
 * Middleware للتحقق من التوثيق والصلاحيات
 */
export async function checkAuth(request: NextRequest): Promise<{
  success: boolean;
  context?: AuthContext;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'مطلوب رمز المصادقة' };
    }

    const token = authHeader.substring(7);
    const user = await RBACManager.verifyToken(token);

    if (!user) {
      return { success: false, error: 'رمز المصادقة غير صحيح' };
    }

    if (!user.is_active) {
      return { success: false, error: 'الحساب غير مفعل' };
    }

    const context = RBACManager.createAuthContext(user);
    return { success: true, context };

  } catch (error) {
    return { success: false, error: 'خطأ في التحقق من المصادقة' };
  }
}

/**
 * Middleware للتحقق من صلاحية معينة
 */
export function requirePermission(permission: string) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    context?: AuthContext;
    error?: string;
  }> => {
    const authResult = await checkAuth(request);
    
    if (!authResult.success || !authResult.context) {
      return authResult;
    }

    const hasPermission = RBACManager.hasPermission(authResult.context.user, permission);
    
    if (!hasPermission) {
      return { 
        success: false, 
        error: `تحتاج إلى صلاحية: ${permission}` 
      };
    }

    return authResult;
  };
}

/**
 * Middleware للتحقق من دور معين
 */
export function requireRole(role: string) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    context?: AuthContext;
    error?: string;
  }> => {
    const authResult = await checkAuth(request);
    
    if (!authResult.success || !authResult.context) {
      return authResult;
    }

    const hasRole = RBACManager.hasRole(authResult.context.user, role);
    
    if (!hasRole) {
      return { 
        success: false, 
        error: `تحتاج إلى دور: ${role}` 
      };
    }

    return authResult;
  };
}

/**
 * Middleware للتحقق من عضوية فريق
 */
export function requireTeamMembership(teamName: string) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    context?: AuthContext;
    error?: string;
  }> => {
    const authResult = await checkAuth(request);
    
    if (!authResult.success || !authResult.context) {
      return authResult;
    }

    const isTeamMember = RBACManager.isTeamMember(authResult.context.user, teamName);
    
    if (!isTeamMember) {
      return { 
        success: false, 
        error: `تحتاج إلى عضوية فريق: ${teamName}` 
      };
    }

    return authResult;
  };
}

/**
 * Middleware مرن للتحقق من شروط متعددة
 */
export function requireAccess(options: {
  permissions?: string[];
  roles?: string[];
  teams?: string[];
  requireAll?: boolean; // true = كل الشروط مطلوبة، false = واحد على الأقل
}) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    context?: AuthContext;
    error?: string;
  }> => {
    const authResult = await checkAuth(request);
    
    if (!authResult.success || !authResult.context) {
      return authResult;
    }

    const { user } = authResult.context;
    const { permissions = [], roles = [], teams = [], requireAll = false } = options;

    const checks = [];

    // فحص الصلاحيات
    if (permissions.length > 0) {
      const hasPermissions = requireAll 
        ? RBACManager.hasAllPermissions(user, permissions)
        : RBACManager.hasAnyPermission(user, permissions);
      checks.push(hasPermissions);
    }

    // فحص الأدوار
    if (roles.length > 0) {
      const hasRoles = requireAll
        ? roles.every(role => RBACManager.hasRole(user, role))
        : roles.some(role => RBACManager.hasRole(user, role));
      checks.push(hasRoles);
    }

    // فحص الفرق
    if (teams.length > 0) {
      const hasTeams = requireAll
        ? teams.every(team => RBACManager.isTeamMember(user, team))
        : teams.some(team => RBACManager.isTeamMember(user, team));
      checks.push(hasTeams);
    }

    const hasAccess = requireAll 
      ? checks.every(check => check)
      : checks.some(check => check);

    if (!hasAccess) {
      return {
        success: false,
        error: 'ليس لديك الصلاحيات المطلوبة للوصول لهذا المورد'
      };
    }

    return authResult;
  };
}

/**
 * دوال مساعدة للاستخدام في الواجهة الأمامية
 */
export const RBACHelpers = {
  /**
   * فحص ما إذا كان المستخدم يملك صلاحية معينة
   */
  can: (context: AuthContext, permission: string): boolean => {
    return RBACManager.hasPermission(context.user, permission);
  },

  /**
   * فحص ما إذا كان المستخدم يملك دور معين
   */
  is: (context: AuthContext, role: string): boolean => {
    return RBACManager.hasRole(context.user, role);
  },

  /**
   * فحص ما إذا كان المستخدم عضو في فريق معين
   */
  inTeam: (context: AuthContext, team: string): boolean => {
    return RBACManager.isTeamMember(context.user, team);
  },

  /**
   * الحصول على كل صلاحيات المستخدم
   */
  getPermissions: (context: AuthContext): string[] => {
    return context.permissions;
  },

  /**
   * الحصول على كل أدوار المستخدم
   */
  getRoles: (context: AuthContext): string[] => {
    return context.roles;
  },

  /**
   * الحصول على كل فرق المستخدم
   */
  getTeams: (context: AuthContext): string[] => {
    return context.teams;
  }
}; 