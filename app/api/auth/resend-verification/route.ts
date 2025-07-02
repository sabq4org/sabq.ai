import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

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

interface VerificationCode {
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
}

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
const verificationCodesPath = path.join(process.cwd(), 'data', 'email_verification_codes.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // التحقق من البيانات المطلوبة
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // قراءة المستخدمين
    const usersContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(usersContent);

    // البحث عن المستخدم
    const user = data.users.find((u: User) => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير مسجل' },
        { status: 404 }
      );
    }

    // التحقق من أن البريد غير مفعل
    if (user.email_verified) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مفعل بالفعل' },
        { status: 400 }
      );
    }

    // قراءة رموز التحقق
    const codesContent = await fs.readFile(verificationCodesPath, 'utf-8');
    const codes = JSON.parse(codesContent) as VerificationCode[];

    // التحقق من وجود رمز حديث
    const existingCode = codes.find(c => c.email === email);
    if (existingCode) {
      const codeAge = Date.now() - new Date(existingCode.created_at).getTime();
      if (codeAge < 60000) { // أقل من دقيقة
        return NextResponse.json(
          { success: false, error: 'يرجى الانتظار دقيقة قبل طلب رمز جديد' },
          { status: 429 }
        );
      }
    }

    // توليد رمز جديد
    const newCode = generateVerificationCode();

    // إزالة أي رموز قديمة لنفس البريد
    const filteredCodes = codes.filter((c: VerificationCode) => c.email !== email);
    
    // إضافة الرمز الجديد
    filteredCodes.push({
      email,
      code: newCode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 دقائق
      created_at: new Date().toISOString()
    });
    
    await fs.writeFile(verificationCodesPath, JSON.stringify(filteredCodes, null, 2));

    // إرسال بريد التحقق
    const emailSent = await sendVerificationEmail(email, user.name, newCode);
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'فشل إرسال البريد الإلكتروني' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني'
    });

  } catch (error) {
    console.error('خطأ في إعادة إرسال رمز التحقق:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في عملية إعادة الإرسال' },
      { status: 500 }
    );
  }
} 