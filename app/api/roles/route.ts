import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Role } from '@/types/roles';

const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

// بيانات الأدوار الافتراضية
const defaultRoles = [
  {
    id: '1',
    name: 'مدير النظام',
    description: 'صلاحيات كاملة على النظام',
    permissions: [
      'create_articles', 'edit_articles', 'delete_articles', 'publish_articles',
      'manage_users', 'system_settings', 'backup_system', 'review_articles',
      'manage_media', 'manage_ai', 'manage_comments', 'view_analytics', 'share_articles'
    ],
    color: '#DC2626' // أحمر
  },
  {
    id: '2',
    name: 'محرر',
    description: 'إدارة المحتوى والمقالات',
    permissions: [
      'create_articles', 'edit_articles', 'delete_articles', 'publish_articles',
      'review_articles', 'manage_media', 'manage_comments', 'view_analytics', 'share_articles'
    ],
    color: '#059669' // أخضر
  },
  {
    id: '3',
    name: 'كاتب',
    description: 'كتابة وتعديل المقالات',
    permissions: [
      'create_articles', 'edit_articles', 'manage_media', 'view_analytics', 'share_articles'
    ],
    color: '#2563EB' // أزرق
  },
  {
    id: '4',
    name: 'مشرف',
    description: 'مراجعة ونشر المحتوى',
    permissions: [
      'review_articles', 'publish_articles', 'manage_comments', 'view_analytics'
    ],
    color: '#7C3AED' // بنفسجي
  },
  {
    id: '5',
    name: 'عضو',
    description: 'صلاحيات أساسية',
    permissions: [
      'view_analytics', 'share_articles'
    ],
    color: '#6B7280' // رمادي
  }
];

// تأكد من وجود المجلد
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// تهيئة الأدوار الافتراضية
async function initializeRoles() {
  await ensureDataDir();
  
  try {
    await fs.access(ROLES_FILE);
  } catch {
    // إذا لم يكن الملف موجود، أنشئ الأدوار الافتراضية
    await fs.writeFile(ROLES_FILE, JSON.stringify(defaultRoles, null, 2));
  }
}

// GET - جلب جميع الأدوار
export async function GET(request: NextRequest) {
  try {
    await ensureDataDir();
    
    // قراءة الأدوار من الملف
    let roles: Role[] = [];
    try {
      const data = await fs.readFile(ROLES_FILE, 'utf-8');
      roles = JSON.parse(data);
    } catch (error) {
      // إذا لم يكن الملف موجود، إرجاع قائمة فارغة
      roles = [];
    }
    
    // تحديث عدد المستخدمين لكل دور
    const teamFile = path.join(process.cwd(), 'data', 'team-members.json');
    try {
      const teamData = await fs.readFile(teamFile, 'utf-8');
      const teamMembers = JSON.parse(teamData);
      
      roles = roles.map((role: Role) => ({
        ...role,
        users: teamMembers.filter((member: any) => member.roleId === role.id).length
      }));
    } catch {
      // إذا لم يكن هناك أعضاء فريق، استخدم القيمة الافتراضية
      roles = roles.map((role: Role) => ({
        ...role,
        users: role.users || 0
      }));
    }
    
    return NextResponse.json({
      success: true,
      data: roles,
      count: roles.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في جلب الأدوار'
    }, { status: 500 });
  }
}

// POST - إنشاء دور جديد
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    
    const body = await request.json();
    const { name, description, permissions = [], color = '#4B82F2' } = body;
    
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم ووصف الدور' },
        { status: 400 }
      );
    }
    
    // قراءة الأدوار الحالية
    let roles: Role[] = [];
    try {
      const data = await fs.readFile(ROLES_FILE, 'utf-8');
      roles = JSON.parse(data);
    } catch {
      roles = [];
    }
    
    // التحقق من عدم تكرار اسم الدور
    const existingRole = roles.find((r: Role) => r.name === name);
    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'يوجد دور بنفس الاسم' },
        { status: 400 }
      );
    }
    
    const newRole: Role = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      permissions,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      users: 0
    };
    
    roles.push(newRole);
    
    await fs.writeFile(ROLES_FILE, JSON.stringify(roles, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      data: newRole,
      message: 'تم إنشاء الدور بنجاح' 
    });
    
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إنشاء الدور' },
      { status: 500 }
    );
  }
}
