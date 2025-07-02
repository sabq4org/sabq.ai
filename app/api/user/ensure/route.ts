import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log(`🆕 إنشاء مستخدم جديد: ${userId}`);
      
      // إنشاء مستخدم جديد
      user = await prisma.user.create({
        data: {
          id: userId,
          name: name || 'مستخدم جديد',
          email: email || `guest_${Date.now()}@local.com`,
          password: await bcrypt.hash(`guest_${Date.now()}`, 10),
          role: 'reader',
          status: 'active',
          isVerified: true
        }
      });

      console.log(`✅ تم إنشاء المستخدم: ${user.name}`);
    } else {
      console.log(`✅ المستخدم موجود: ${user.name}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ خطأ في التحقق من المستخدم:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في التحقق من المستخدم' },
      { status: 500 }
    );
  }
} 