import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const TEAM_MEMBERS_FILE = path.join(process.cwd(), 'data', 'team-members.json');
const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  avatar?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const data = await fs.readFile(TEAM_MEMBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading team members:', error);
    return [];
  }
}

async function getRoles(): Promise<Role[]> {
  try {
    const data = await fs.readFile(ROLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading roles:', error);
    return [];
  }
}

// GET: جلب المراسلين والكتاب
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role'); // مثل: correspondent,editor,author
    
    console.log('🔍 جلب المراسلين مع فلتر الأدوار:', roleFilter);
    
    // جلب أعضاء الفريق
    const teamMembers = await getTeamMembers();
    const roles = await getRoles();
    
    console.log('📊 عدد أعضاء الفريق:', teamMembers.length);
    console.log('📊 عدد الأدوار:', roles.length);
    
    // فلترة الأعضاء حسب الدور إذا تم تحديده
    let filteredMembers = teamMembers;
    if (roleFilter) {
      const allowedRoles = roleFilter.split(',').map(role => role.trim());
      console.log('🎯 الأدوار المطلوبة:', allowedRoles);
      filteredMembers = teamMembers.filter(member => allowedRoles.includes(member.roleId));
      console.log('📊 عدد الأعضاء بعد الفلترة:', filteredMembers.length);
    }
    
    // فلترة الأعضاء النشطين فقط
    filteredMembers = filteredMembers.filter(member => member.isActive);
    console.log('📊 عدد الأعضاء النشطين:', filteredMembers.length);
    
    // إضافة معلومات الدور لكل عضو
    const authorsWithRoles = filteredMembers.map(member => {
      const role = roles.find(r => r.id === member.roleId);
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar || '/default-avatar.png',
        role: role?.name || member.roleId,
        roleId: member.roleId,
        isVerified: member.isVerified,
        isActive: member.isActive,
        createdAt: member.createdAt
      };
    });
    
    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    authorsWithRoles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`✅ تم العثور على ${authorsWithRoles.length} مراسل:`, authorsWithRoles.map(a => `${a.name} (${a.role})`));
    
    return NextResponse.json({
      success: true,
      data: authorsWithRoles,
      total: authorsWithRoles.length
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب المراسلين:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب المراسلين',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// POST: إضافة مراسل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.name || !body.email || !body.roleId) {
      return NextResponse.json({
        success: false,
        error: 'الاسم والبريد الإلكتروني والدور مطلوبة'
      }, { status: 400 });
    }
    
    // التحقق من صحة الدور
    const roles = await getRoles();
    const validRole = roles.find(r => r.id === body.roleId);
    if (!validRole) {
      return NextResponse.json({
        success: false,
        error: 'الدور غير صالح'
      }, { status: 400 });
    }
    
    // التحقق من عدم تكرار البريد الإلكتروني
    const teamMembers = await getTeamMembers();
    const emailExists = teamMembers.some(member => 
      member.email.toLowerCase() === body.email.toLowerCase()
    );
    
    if (emailExists) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مستخدم بالفعل'
      }, { status: 400 });
    }
    
    // إنشاء مراسل جديد
    const newAuthor: TeamMember = {
      id: `author-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      email: body.email,
      roleId: body.roleId,
      isActive: body.isActive ?? true,
      isVerified: body.isVerified ?? false,
      createdAt: new Date().toISOString(),
      avatar: body.avatar
    };
    
    // إضافة المراسل الجديد
    teamMembers.push(newAuthor);
    await fs.writeFile(TEAM_MEMBERS_FILE, JSON.stringify(teamMembers, null, 2));
    
    // إرجاع المراسل الجديد مع معلومات الدور
    const role = roles.find(r => r.id === newAuthor.roleId);
    const authorWithRole = {
      id: newAuthor.id,
      name: newAuthor.name,
      email: newAuthor.email,
      avatar: newAuthor.avatar || '/default-avatar.png',
      role: role?.name || newAuthor.roleId,
      roleId: newAuthor.roleId,
      isVerified: newAuthor.isVerified,
      isActive: newAuthor.isActive,
      createdAt: newAuthor.createdAt
    };
    
    return NextResponse.json({
      success: true,
      data: authorWithRole,
      message: 'تم إضافة المراسل بنجاح'
    }, { status: 201 });
    
  } catch (error) {
    console.error('خطأ في إضافة المراسل:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إضافة المراسل',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
} 