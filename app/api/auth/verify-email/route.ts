import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { sendWelcomeEmail } from '@/lib/email';

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
const loyaltyFilePath = path.join(process.cwd(), 'data', 'loyalty_points.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // التحقق من البيانات المطلوبة
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      );
    }

    // كود التحقق المؤقت للتطوير فقط
    if (process.env.NODE_ENV !== 'production' && code === '000000') {
      console.log('🔓 استخدام كود التحقق المؤقت للتطوير');
      
      // قراءة المستخدمين مباشرة
      const usersContent = await fs.readFile(usersFilePath, 'utf-8');
      const data = JSON.parse(usersContent);
      
      // البحث عن المستخدم
      const userIndex = data.users.findIndex((u: User) => u.email === email);
      
      if (userIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'المستخدم غير موجود' },
          { status: 404 }
        );
      }
      
      // تفعيل المستخدم مباشرة
      data.users[userIndex].email_verified = true;
      data.users[userIndex].updated_at = new Date().toISOString();
      
      // حفظ التحديثات
      await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));
      
      // تفعيل نقاط الولاء المعلقة (نفس منطق التفعيل العادي)
      try {
        const loyaltyContent = await fs.readFile(loyaltyFilePath, 'utf-8');
        const loyaltyData = JSON.parse(loyaltyContent);
        
        loyaltyData.points = loyaltyData.points.map((point: any) => {
          if (point.user_id === data.users[userIndex].id && point.pending) {
            return { ...point, pending: false };
          }
          return point;
        });

        await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));
      } catch (error) {
        console.error('خطأ في تفعيل نقاط الولاء:', error);
      }
      
      // إرجاع بيانات المستخدم
      const { password: _, ...userWithoutPassword } = data.users[userIndex];
      
      return NextResponse.json({
        success: true,
        message: 'تم تأكيد البريد الإلكتروني بنجاح (كود مؤقت للتطوير)',
        user: userWithoutPassword
      });
    }

    // قراءة رموز التحقق
    const codesContent = await fs.readFile(verificationCodesPath, 'utf-8');
    const codes = JSON.parse(codesContent) as VerificationCode[];

    // البحث عن الرمز
    const verificationCode = codes.find(c => c.email === email && c.code === code);

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    // التحقق من انتهاء صلاحية الرمز
    if (new Date(verificationCode.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية رمز التحقق' },
        { status: 400 }
      );
    }

    // قراءة المستخدمين
    const usersContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(usersContent);

    // البحث عن المستخدم
    const userIndex = data.users.findIndex((u: User) => u.email === email);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحديث حالة التحقق
    data.users[userIndex].email_verified = true;
    data.users[userIndex].updated_at = new Date().toISOString();

    // حفظ التحديثات
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));

    // إزالة رمز التحقق المستخدم
    const filteredCodes = codes.filter(c => c.email !== email);
    await fs.writeFile(verificationCodesPath, JSON.stringify(filteredCodes, null, 2));

    // تفعيل نقاط الولاء المعلقة
    try {
      const loyaltyContent = await fs.readFile(loyaltyFilePath, 'utf-8');
      const loyaltyData = JSON.parse(loyaltyContent);
      
      // البحث عن النقاط المعلقة للمستخدم
      loyaltyData.points = loyaltyData.points.map((point: any) => {
        if (point.user_id === data.users[userIndex].id && point.pending) {
          return { ...point, pending: false };
        }
        return point;
      });

      await fs.writeFile(loyaltyFilePath, JSON.stringify(loyaltyData, null, 2));
    } catch (error) {
      console.error('خطأ في تفعيل نقاط الولاء:', error);
    }

    // إرسال بريد الترحيب
    await sendWelcomeEmail(email, data.users[userIndex].name);

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    const { password: _, ...userWithoutPassword } = data.users[userIndex];

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('خطأ في التحقق من البريد:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في عملية التحقق' },
      { status: 500 }
    );
  }
} 