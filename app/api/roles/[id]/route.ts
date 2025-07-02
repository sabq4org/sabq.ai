import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Role } from '@/types/roles';

export const runtime = 'nodejs';

const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/roles/[id] - الحصول على تفاصيل دور محدد
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // قراءة الأدوار الحالية
    const data = await fs.readFile(ROLES_FILE, 'utf-8');
    const roles: Role[] = JSON.parse(data);
    
    // البحث عن الدور
    const role = roles.find((r: Role) => r.id === id);
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }
    
    // تحديث عدد المستخدمين
    const teamFile = path.join(process.cwd(), 'data', 'team-members.json');
    try {
      const teamData = await fs.readFile(teamFile, 'utf-8');
      const teamMembers = JSON.parse(teamData);
      role.users = teamMembers.filter((member: any) => member.roleId === id).length;
    } catch {
      role.users = 0;
    }
    
    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب الدور' },
      { status: 500 }
    );
  }
}



// PATCH - تحديث دور
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, permissions, color } = body;
    
    // قراءة الأدوار الحالية
    const data = await fs.readFile(ROLES_FILE, 'utf-8');
    const roles: Role[] = JSON.parse(data);
    
    // البحث عن الدور
    const roleIndex = roles.findIndex((r: Role) => r.id === id);
    if (roleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }
    
    // التحقق من عدم تكرار اسم الدور
    if (name && name !== roles[roleIndex].name) {
      const existingRole = roles.find((r: Role) => r.name === name && r.id !== id);
      if (existingRole) {
        return NextResponse.json(
          { success: false, error: 'يوجد دور آخر بنفس الاسم' },
          { status: 400 }
        );
      }
    }
    
    // تحديث الدور
    roles[roleIndex] = {
      ...roles[roleIndex],
      ...(name && { name }),
      ...(description && { description }),
      ...(permissions && { permissions }),
      ...(color && { color }),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(ROLES_FILE, JSON.stringify(roles, null, 2));
    
    return NextResponse.json({
      success: true,
      data: roles[roleIndex],
      message: 'تم تحديث الدور بنجاح'
    });
    
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحديث الدور' },
      { status: 500 }
    );
  }
}

// DELETE - حذف دور
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // قراءة الأدوار الحالية
    const data = await fs.readFile(ROLES_FILE, 'utf-8');
    const roles: Role[] = JSON.parse(data);
    
    // البحث عن الدور
    const roleIndex = roles.findIndex((r: Role) => r.id === id);
    if (roleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'الدور غير موجود' },
        { status: 404 }
      );
    }
    
    // منع حذف أدوار النظام
    if (roles[roleIndex].isSystem) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف أدوار النظام الأساسية' },
        { status: 400 }
      );
    }
    
    // التحقق من عدم وجود مستخدمين مرتبطين بالدور
    const teamFile = path.join(process.cwd(), 'data', 'team-members.json');
    try {
      const teamData = await fs.readFile(teamFile, 'utf-8');
      const teamMembers = JSON.parse(teamData);
      const usersWithRole = teamMembers.filter((member: any) => member.roleId === id);
      
      if (usersWithRole.length > 0) {
        return NextResponse.json(
          { success: false, error: `لا يمكن حذف الدور لأن هناك ${usersWithRole.length} مستخدم مرتبط به` },
          { status: 400 }
        );
      }
    } catch {
      // إذا لم يكن هناك ملف أعضاء، تابع الحذف
    }
    
    // حذف الدور
    roles.splice(roleIndex, 1);
    await fs.writeFile(ROLES_FILE, JSON.stringify(roles, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف الدور بنجاح'
    });
    
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في حذف الدور' },
      { status: 500 }
    );
  }
} 