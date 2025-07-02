import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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

// تأكد من وجود ملف المستخدمين
async function ensureUsersFile() {
  try {
    await fs.access(usersFilePath);
  } catch {
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify({ users: [] }));
  }
}

// تأكد من وجود ملف رموز التحقق
async function ensureVerificationCodesFile() {
  try {
    await fs.access(verificationCodesPath);
  } catch {
    await fs.mkdir(path.dirname(verificationCodesPath), { recursive: true });
    await fs.writeFile(verificationCodesPath, JSON.stringify([]));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني غير صحيح' },
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

    // قراءة ملف المستخدمين
    await ensureUsersFile();
    const fileContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // التحقق من عدم وجود بريد إلكتروني مكرر
    const existingUser = data.users.find((u: User) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم الجديد
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      email_verified: false, // غير مفعل حتى يتم التحقق من البريد
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // إضافة المستخدم إلى القائمة
    data.users.push(newUser);

    // حفظ الملف
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));

    // توليد رمز التحقق
    const verificationCode = generateVerificationCode();
    
    // حفظ رمز التحقق
    await ensureVerificationCodesFile();
    const codesContent = await fs.readFile(verificationCodesPath, 'utf-8');
    const codes = JSON.parse(codesContent);
    
    // إزالة أي رموز قديمة لنفس البريد
    const filteredCodes = codes.filter((c: VerificationCode) => c.email !== email);
    
    // إضافة الرمز الجديد
    filteredCodes.push({
      email,
      code: verificationCode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 دقائق
      created_at: new Date().toISOString()
    });
    
    await fs.writeFile(verificationCodesPath, JSON.stringify(filteredCodes, null, 2));

    // إرسال بريد التحقق
    const emailSent = await sendVerificationEmail(email, name, verificationCode);
    
    if (!emailSent) {
      console.warn('⚠️ تحذير: فشل إرسال بريد التحقق');
    }

    // إنشاء نقاط ولاء أولية (50 نقطة ترحيبية) - ستُفعل بعد التحقق من البريد
    const loyaltyFilePath = path.join(process.cwd(), 'data', 'loyalty_points.json');
    try {
      const loyaltyContent = await fs.readFile(loyaltyFilePath, 'utf-8');
      const loyaltyData = JSON.parse(loyaltyContent);
      
      loyaltyData.points.push({
        id: `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: newUser.id,
        points: 50,
        action: 'registration_bonus',
        description: 'نقاط ترحيبية للتسجيل (معلقة حتى التحقق)',
        pending: true, // معلقة حتى يتم التحقق من البريد
        created_at: new Date().toISOString()
      });

      await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));
    } catch {
      // إذا لم يكن ملف نقاط الولاء موجوداً، أنشئه
      const loyaltyData = {
        points: [{
          id: `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: newUser.id,
          points: 50,
          action: 'registration_bonus',
          description: 'نقاط ترحيبية للتسجيل (معلقة حتى التحقق)',
          pending: true,
          created_at: new Date().toISOString()
        }]
      };
      await fs.mkdir(path.dirname(loyaltyFilePath), { recursive: true });
      await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));
    }

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'تم إنشاء الحساب بنجاح. تم إرسال رمز التحقق إلى بريدك الإلكتروني' 
        : 'تم إنشاء الحساب بنجاح',
      user: userWithoutPassword,
      requiresVerification: true
    });
    
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في عملية التسجيل' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'إحصائيات التسجيل متوقفة - يجب ربط النظام بقاعدة البيانات الحقيقية',
    data: {
      totalUsers: 0,
      verifiedUsers: 0,
      totalLoyaltyPoints: 0
    }
  });
} 