import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

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

// تأكد من وجود ملف رموز إعادة التعيين
async function ensureResetTokensFile() {
  try {
    await fs.access(resetTokensPath);
  } catch {
    await fs.mkdir(path.dirname(resetTokensPath), { recursive: true });
    await fs.writeFile(resetTokensPath, JSON.stringify([]));
  }
}

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
      // لأسباب أمنية، لا نخبر المستخدم أن البريد غير موجود
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور'
      });
    }

    // التحقق من أن البريد مفعل
    if (!user.email_verified) {
      return NextResponse.json(
        { success: false, error: 'يجب تأكيد البريد الإلكتروني أولاً' },
        { status: 400 }
      );
    }

    // قراءة رموز إعادة التعيين
    await ensureResetTokensFile();
    const tokensContent = await fs.readFile(resetTokensPath, 'utf-8');
    const tokens = JSON.parse(tokensContent) as PasswordResetToken[];

    // التحقق من وجود طلب حديث
    const existingToken = tokens.find(t => t.email === email);
    if (existingToken) {
      const tokenAge = Date.now() - new Date(existingToken.created_at).getTime();
      if (tokenAge < 300000) { // أقل من 5 دقائق
        return NextResponse.json(
          { success: false, error: 'يرجى الانتظار 5 دقائق قبل طلب رابط جديد' },
          { status: 429 }
        );
      }
    }

    // توليد رمز عشوائي آمن
    const resetToken = crypto.randomBytes(32).toString('hex');

    // إزالة أي رموز قديمة لنفس البريد
    const filteredTokens = tokens.filter((t: PasswordResetToken) => t.email !== email);
    
    // إضافة الرمز الجديد
    filteredTokens.push({
      email,
      token: resetToken,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // ساعة واحدة
      created_at: new Date().toISOString()
    });
    
    await fs.writeFile(resetTokensPath, JSON.stringify(filteredTokens, null, 2));

    // إرسال بريد إعادة التعيين
    const emailSent = await sendPasswordResetEmail(email, user.name, resetToken);
    
    if (!emailSent) {
      console.error('فشل إرسال بريد إعادة التعيين');
    }

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور'
    });

  } catch (error) {
    console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
} 