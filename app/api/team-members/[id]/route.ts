import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { TeamMember, UpdateTeamMemberInput } from '@/types/team';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const TEAM_MEMBERS_FILE = path.join(process.cwd(), 'data', 'team-members.json');

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const data = await fs.readFile(TEAM_MEMBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading team members:', error);
    return [];
  }
}

async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  await fs.writeFile(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2));
}

// GET: جلب بيانات عضو محدد
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const members = await getTeamMembers();
    const member = members.find(m => m.id === id);
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'العضو غير موجود' },
        { status: 404 }
      );
    }
    
    // إزالة كلمة المرور
    const { password, ...memberWithoutPassword } = member;
    
    return NextResponse.json({
      success: true,
      data: memberWithoutPassword
    });
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب بيانات العضو' },
      { status: 500 }
    );
  }
}

// PATCH: تحديث بيانات عضو
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body: UpdateTeamMemberInput = await request.json();
    const members = await getTeamMembers();
    const memberIndex = members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'العضو غير موجود' },
        { status: 404 }
      );
    }
    
    const currentMember = members[memberIndex];
    
    // التحقق من البريد الإلكتروني إذا تم تغييره
    if (body.email && body.email !== currentMember.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني غير صالح' },
          { status: 400 }
        );
      }
      
      const emailExists = members.some(member => 
        member.id !== id && 
        member.email.toLowerCase() === body.email!.toLowerCase()
      );
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
          { status: 400 }
        );
      }
    }
    
    // تحديث البيانات
    const updatedMember: TeamMember = {
      ...currentMember,
      name: body.name ?? currentMember.name,
      email: body.email ?? currentMember.email,
      roleId: body.roleId ?? currentMember.roleId,
      isActive: body.isActive ?? currentMember.isActive,
      isVerified: body.isVerified ?? currentMember.isVerified,
      phone: body.phone ?? currentMember.phone,
      department: body.department ?? currentMember.department,
      bio: body.bio ?? currentMember.bio
    };
    
    // تحديث الصورة الرمزية
    if (body.avatar !== undefined) {
      if (body.avatar) {
        updatedMember.avatar = body.avatar;
      } else {
        delete updatedMember.avatar;
      }
    }
    
    // تحديث كلمة المرور إذا تم توفيرها
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
          { status: 400 }
        );
      }
      updatedMember.password = await bcrypt.hash(body.password, 10);
    }
    
    // تحديث آخر تسجيل دخول
    if (body.isActive && !currentMember.isActive) {
      updatedMember.lastLogin = new Date().toISOString();
    }
    
    members[memberIndex] = updatedMember;
    await saveTeamMembers(members);
    
    // إرجاع العضو بدون كلمة المرور
    const { password, ...memberWithoutPassword } = updatedMember;
    
    return NextResponse.json({
      success: true,
      data: memberWithoutPassword
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تحديث بيانات العضو' },
      { status: 500 }
    );
  }
}

// DELETE: حذف عضو
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const members = await getTeamMembers();
    const memberIndex = members.findIndex(m => m.id === id);
    
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'العضو غير موجود' },
        { status: 404 }
      );
    }
    
    // حذف العضو
    const deletedMember = members.splice(memberIndex, 1)[0];
    await saveTeamMembers(members);
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف العضو بنجاح',
      data: { id: deletedMember.id, name: deletedMember.name }
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في حذف العضو' },
      { status: 500 }
    );
  }
} 