import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/security';
import { sendWelcomeEmail } from '@/lib/email';
import { generateVerificationToken } from '@/lib/auth-tokens';
import { logAuthEvent } from '@/lib/audit-log';

const prisma = new PrismaClient();

// مخطط التحقق من بيانات التسجيل
const registerSchema = z.object({
  name: z.string()
    .min(2, 'الاسم يجب أن يكون أكثر من حرفين')
    .max(100, 'الاسم طويل جداً')
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020a-zA-Z\s]+$/, 'الاسم يحتوي على أحرف غير مسموحة'),
  email: z.string()
    .email('البريد الإلكتروني غير صحيح')
    .toLowerCase()
    .transform(email => sanitizeInput(email)),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة ورقم ورمز خاص'),
  confirmPassword: z.string(),
  phone: z.string()
    .optional()
    .refine(phone => !phone || /^(\+966|0)?[5-9]\d{8}$/.test(phone), 
            'رقم الهاتف غير صحيح'),
  terms: z.boolean()
    .refine(val => val === true, 'يجب الموافقة على الشروط والأحكام'),
  newsletter: z.boolean().optional().default(false),
  referralCode: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword']
});

export async function POST(request: NextRequest) {
  try {
    // التحقق من معدل الطلبات
    const ip = request.ip ?? '127.0.0.1';
    const { success, reset } = await rateLimit.limit(ip, {
      max: 5, // 5 محاولات
      window: '15m' // كل 15 دقيقة
    });

    if (!success) {
      await logAuthEvent({
        type: 'registration_rate_limit',
        ip,
        success: false,
        reason: 'تجاوز الحد المسموح من محاولات التسجيل'
      });

      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد المسموح من محاولات التسجيل',
          retryAfter: reset
        },
        { status: 429 }
      );
    }

    // تحليل البيانات المرسلة
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      await logAuthEvent({
        type: 'registration_validation_failed',
        ip,
        success: false,
        reason: 'بيانات غير صحيحة',
        details: validationResult.error.errors
      });

      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone, newsletter, referralCode } = validationResult.data;

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      await logAuthEvent({
        type: 'registration_user_exists',
        ip,
        email,
        success: false,
        reason: 'المستخدم موجود مسبقاً'
      });

      const field = existingUser.email === email ? 'البريد الإلكتروني' : 'رقم الهاتف';
      return NextResponse.json(
        { error: `${field} مستخدم مسبقاً` },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // إنشاء رمز التحقق
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    // التحقق من رمز الإحالة (إن وجد)
    let referredBy = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // إنشاء المستخدم الجديد
    const newUser = await prisma.$transaction(async (tx) => {
      // إنشاء المستخدم
      const user = await tx.user.create({
        data: {
          name: sanitizeInput(name),
          email,
          password: hashedPassword,
          phone: phone || null,
          emailVerified: false,
          phoneVerified: false,
          newsletterSubscribed: newsletter,
          referredBy,
          verificationToken,
          verificationTokenExpiry: verificationExpiry,
          registrationIp: ip,
          registrationUserAgent: request.headers.get('user-agent') || '',
          role: {
            connect: { name: 'subscriber' } // الدور الافتراضي
          }
        },
        include: {
          role: {
            select: {
              name: true,
              permissions: true
            }
          }
        }
      });

      // إنشاء ملف شخصي أساسي
      await tx.userProfile.create({
        data: {
          userId: user.id,
          bio: '',
          avatar: '',
          website: '',
          socialMedia: {},
          preferences: {
            language: 'ar',
            theme: 'light',
            notifications: {
              email: newsletter,
              push: false,
              sms: false
            }
          }
        }
      });

      // إضافة نقاط الولاء الأولية
      await tx.loyaltyPoints.create({
        data: {
          userId: user.id,
          points: 100, // نقاط ترحيبية
          reason: 'نقاط ترحيبية للانضمام',
          type: 'earned'
        }
      });

      // إضافة إحصائيات المستخدم
      await tx.userAnalytics.create({
        data: {
          userId: user.id,
          totalReadingTime: 0,
          articlesRead: 0,
          commentsCount: 0,
          sharesCount: 0,
          likesCount: 0
        }
      });

      // معالجة الإحالة إذا كانت موجودة
      if (referredBy) {
        // إضافة نقاط للمُحيل
        await tx.loyaltyPoints.create({
          data: {
            userId: referredBy,
            points: 50,
            reason: 'إحالة مستخدم جديد',
            type: 'earned'
          }
        });

        // تحديث إحصائيات الإحالة
        await tx.user.update({
          where: { id: referredBy },
          data: {
            totalReferrals: {
              increment: 1
            }
          }
        });
      }

      return user;
    });

    // إرسال بريد ترحيبي وتحقق
    try {
      await sendWelcomeEmail({
        to: email,
        name,
        verificationToken,
        verificationUrl: `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
      });
    } catch (emailError) {
      console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
      // لا نفشل التسجيل بسبب خطأ البريد الإلكتروني
    }

    // تسجيل نجاح العملية
    await logAuthEvent({
      type: 'registration_success',
      ip,
      userId: newUser.id,
      email,
      success: true,
      reason: 'تم التسجيل بنجاح'
    });

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    const { password: _, verificationToken: __, ...userResponse } = newUser;

    return NextResponse.json(
      {
        message: 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني',
        user: {
          id: userResponse.id,
          name: userResponse.name,
          email: userResponse.email,
          emailVerified: userResponse.emailVerified,
          role: userResponse.role.name
        },
        requiresVerification: true
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('خطأ في التسجيل:', error);

    // تسجيل الخطأ
    await logAuthEvent({
      type: 'registration_error',
      ip: request.ip ?? '127.0.0.1',
      success: false,
      reason: 'خطأ داخلي في الخادم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });

    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// التحقق من إمكانية التسجيل (للتحقق من البريد الإلكتروني/الهاتف)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو رقم الهاتف مطلوب' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      },
      select: { email: true, phone: true }
    });

    return NextResponse.json({
      available: !existingUser,
      message: existingUser 
        ? 'البريد الإلكتروني أو رقم الهاتف مستخدم مسبقاً'
        : 'متاح للاستخدام'
    });

  } catch (error) {
    console.error('خطأ في التحقق من الإتاحة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 