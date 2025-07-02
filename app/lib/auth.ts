import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role_id: number;
  status: string;
  avatar_url?: string;
  permissions?: string[];
  sections?: number[];
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
}

// توليد JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role_id: user.role_id 
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

// التحقق من JWT token
export async function verifyToken(token: string): Promise<any> {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    return null;
  }
}

// تشفير كلمة المرور
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// التحقق من كلمة المرور
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// الحصول على المستخدم الحالي من الجلسة
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) return null;
  
  const payload = await verifyToken(token.value);
  if (!payload) return null;
  
  // هنا يجب استعلام قاعدة البيانات للحصول على بيانات المستخدم الكاملة
  // مؤقتاً نرجع بيانات تجريبية
  return {
    id: payload.id,
    email: payload.email,
    name: 'User Name',
    role_id: payload.role_id,
    status: 'active'
  };
}

// التحقق من صلاحية معينة
export async function hasPermission(user: User, permission: string): Promise<boolean> {
  if (!user.permissions) return false;
  return user.permissions.includes(permission);
}

// التحقق من صلاحيات متعددة
export async function hasAnyPermission(user: User, permissions: string[]): Promise<boolean> {
  if (!user.permissions) return false;
  return permissions.some(p => user.permissions!.includes(p));
}

// التحقق من جميع الصلاحيات
export async function hasAllPermissions(user: User, permissions: string[]): Promise<boolean> {
  if (!user.permissions) return false;
  return permissions.every(p => user.permissions!.includes(p));
}

// Middleware للتحقق من المصادقة
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

// Middleware للتحقق من صلاحية معينة
export async function requirePermission(permission: string): Promise<User> {
  const user = await requireAuth();
  if (!await hasPermission(user, permission)) {
    throw new Error('Forbidden');
  }
  return user;
}

// توليد رمز دعوة
export function generateInviteToken(): string {
  return Buffer.from(Math.random().toString(36).substring(2) + Date.now()).toString('base64');
}

// تسجيل نشاط المستخدم
export async function logActivity(
  userId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  targetTitle?: string,
  metadata?: any
) {
  // يتم تنفيذ هذا في قاعدة البيانات
  console.log('Activity logged:', { userId, action, targetType, targetId, targetTitle, metadata });
} 