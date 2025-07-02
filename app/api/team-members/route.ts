import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { TeamMember, CreateTeamMemberInput } from '@/types/team';

export const runtime = 'nodejs';

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

// GET: جلب قائمة أعضاء الفريق
export async function GET() {
  try {
    const members = await getTeamMembers();
    
    // إزالة كلمات المرور من البيانات المرجعة
    const sanitizedMembers = members.map(({ password, ...member }) => member);
    
    return NextResponse.json({
      success: true,
      data: sanitizedMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب أعضاء الفريق' },
      { status: 500 }
    );
  }
}

// POST: إضافة عضو جديد
export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamMemberInput = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.name || !body.email || !body.password || !body.roleId) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }
    
    // التحقق من طول كلمة المرور
    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }
    
    const members = await getTeamMembers();
    
    // التحقق من عدم تكرار البريد الإلكتروني
    const emailExists = members.some(member => 
      member.email.toLowerCase() === body.email.toLowerCase()
    );
    
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // إنشاء عضو جديد
    const newMember: TeamMember = {
      id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      roleId: body.roleId,
      isActive: body.isActive ?? true,
      isVerified: body.isVerified ?? false,
      createdAt: new Date().toISOString()
    };
    
    // إضافة الحقول الاختيارية
    if (body.avatar) {
      newMember.avatar = body.avatar;
    }
    
    // إضافة العضو الجديد
    members.push(newMember);
    await saveTeamMembers(members);
    
    // إرجاع العضو بدون كلمة المرور
    const { password, ...memberWithoutPassword } = newMember;
    
    return NextResponse.json({
      success: true,
      data: memberWithoutPassword
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إضافة عضو الفريق' },
      { status: 500 }
    );
  }
} 