import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface PasswordResetToken {
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
}

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
const resetTokensPath = path.join(process.cwd(), 'data', 'password_reset_tokens.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // التحقق من البيانات المطلوبة
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'الرمز وكلمة المرور الجديدة مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // قراءة رموز إعادة التعيين
    const tokensContent = await fs.readFile(resetTokensPath, 'utf-8');
    const tokens = JSON.parse(tokensContent) as PasswordResetToken[];

    // البحث عن الرمز
    const resetToken = tokens.find(t => t.token === token);

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من انتهاء صلاحية الرمز
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية رابط إعادة التعيين' },
        { status: 400 }
      );
    }

    // قراءة المستخدمين
    const usersContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(usersContent);

    // البحث عن المستخدم
    const userIndex = data.users.findIndex((u: User) => u.email === resetToken.email);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(password, 10);

    // تحديث كلمة المرور
    data.users[userIndex].password = hashedPassword;
    data.users[userIndex].updated_at = new Date().toISOString();

    // حفظ التحديثات
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));

    // إزالة رمز إعادة التعيين المستخدم
    const filteredTokens = tokens.filter(t => t.token !== token);
    await fs.writeFile(resetTokensPath, JSON.stringify(filteredTokens, null, 2));

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في عملية إعادة التعيين' },
      { status: 500 }
    );
  }
} 