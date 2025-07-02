import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailConfig } from '@/config/email.config';
import { getCorrectEmailConfig } from './email-config-fix';

// إنشاء transporter للبريد الإلكتروني
let transporter: Transporter | null = null;

// تهيئة البريد الإلكتروني
export function initializeEmail() {
  // تخطي التهيئة أثناء البناء أو إذا كان مطلوباً
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true' || process.env.NODE_ENV === 'test') {
    console.log('⏭️  تخطي تهيئة البريد الإلكتروني');
    return;
  }

  try {
    // استخدام الإعدادات المصححة
    const smtpConfig = getCorrectEmailConfig();

    transporter = nodemailer.createTransport(smtpConfig as any);

    // التحقق من الاتصال
    if (transporter) {
      transporter.verify((error) => {
        if (error) {
          console.error('❌ خطأ في إعدادات البريد الإلكتروني:', error);
          console.error('📧 الإعدادات المستخدمة:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            user: smtpConfig.auth.user,
          });
        } else {
          console.log('✅ البريد الإلكتروني جاهز للإرسال');
          console.log(`📧 البريد المستخدم: ${smtpConfig.auth.user}`);
          console.log(`📬 الخادم: ${smtpConfig.host}:${smtpConfig.port}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ فشل في تهيئة البريد الإلكتروني:', error);
  }
}

// قوالب البريد الإلكتروني
const emailTemplates = {
  verification: (name: string, code: string) => ({
    subject: 'تأكيد بريدك الإلكتروني - سبق الذكية',
    html: `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6;">سبق الذكية</h1>
        </div>
        
        <h2 style="color: #1F2937;">مرحبًا ${name} 👋</h2>
        
        <p style="color: #4B5563; line-height: 1.8;">
          نشكرك على انضمامك إلى منصة سبق الذكية ✅<br>
          يرجى تأكيد عنوان بريدك الإلكتروني باستخدام الرمز التالي:
        </p>
        
        <div style="background: #F3F4F6; border: 2px solid #E5E7EB; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
          <h1 style="color: #3B82F6; font-size: 36px; letter-spacing: 5px; margin: 0;">${code}</h1>
          <p style="color: #6B7280; margin-top: 10px;">صالح لمدة 10 دقائق</p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          إذا لم تقم بإنشاء حساب، تجاهل هذه الرسالة.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          تحياتنا،<br>
          فريق سبق الذكي
        </p>
      </div>
    `
  }),

  welcome: (name: string) => ({
    subject: 'أهلاً بك في سبق الذكية 🎉',
    html: `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6;">سبق الذكية</h1>
        </div>
        
        <h2 style="color: #1F2937;">أهلاً بك يا ${name}! 🎉</h2>
        
        <p style="color: #4B5563; line-height: 1.8;">
          تم تفعيل عضويتك بنجاح.<br>
          أنت الآن ضمن منصة إعلامية ذكية تُقدّم محتوى مصمم حسب اهتماماتك وتفاعلك.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/newspaper" 
             style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            ابدأ رحلتك الآن 👈
          </a>
        </div>
        
        <div style="background: #F9FAFB; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1F2937; margin-top: 0;">ماذا يمكنك فعله؟</h3>
          <ul style="color: #4B5563; line-height: 1.8;">
            <li>📰 تابع أهم الأخبار المخصصة لك</li>
            <li>🏆 احصل على نقاط الولاء مع كل تفاعل</li>
            <li>🎯 خصص اهتماماتك للحصول على محتوى أفضل</li>
            <li>💬 شارك وتفاعل مع المجتمع</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          فريق سبق الذكي ✍️
        </p>
      </div>
    `
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: 'استرجاع كلمة المرور - سبق الذكية',
    html: `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6;">سبق الذكية</h1>
        </div>
        
        <h2 style="color: #1F2937;">استرجاع كلمة المرور</h2>
        
        <p style="color: #4B5563; line-height: 1.8;">
          مرحبًا ${name}،<br>
          تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          هذا الرابط صالح لمدة ساعة واحدة فقط.<br>
          إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          تحياتنا،<br>
          فريق سبق الذكي
        </p>
      </div>
    `
  }),

  twoFactorCode: (code: string) => ({
    subject: 'رمز التحقق الثنائي - سبق الذكية',
    html: `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6;">سبق الذكية</h1>
        </div>
        
        <h2 style="color: #1F2937;">رمز التحقق الثنائي 🔐</h2>
        
        <p style="color: #4B5563; line-height: 1.8;">
          استخدم الرمز التالي لإكمال تسجيل الدخول:
        </p>
        
        <div style="background: #FEF3C7; border: 2px solid #FDE68A; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
          <h1 style="color: #92400E; font-size: 36px; letter-spacing: 5px; margin: 0;">${code}</h1>
          <p style="color: #B45309; margin-top: 10px;">صالح لمدة 10 دقائق فقط</p>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">
          لم تطلب هذا الرمز؟ قد يحاول شخص آخر الوصول إلى حسابك.<br>
          يُرجى تغيير كلمة المرور فورًا.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
          تحياتنا،<br>
          فريق سبق الذكي
        </p>
      </div>
    `
  })
};

// إرسال بريد التحقق
export async function sendVerificationEmail(to: string, name: string, code: string) {
  // إعادة تهيئة البريد إذا لم يكن مهيأ
  if (!transporter) {
    console.log('🔄 إعادة تهيئة البريد الإلكتروني...');
    initializeEmail();
    // انتظار قليلاً للتهيئة
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!transporter) {
    console.error('❌ البريد الإلكتروني غير مهيأ');
    return false;
  }

  try {
    const template = emailTemplates.verification(name, code);
    const fromEmail = process.env.SMTP_USER || emailConfig.smtp.auth.user;
    
    console.log(`📧 محاولة إرسال بريد التحقق إلى ${to} برمز ${code}`);
    
    const info = await transporter.sendMail({
      from: `"صحيفة سبق الإلكترونية" <${fromEmail}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log(`✅ تم إرسال بريد التحقق إلى ${to}`);
    console.log(`📬 معرف الرسالة: ${info.messageId}`);
    console.log(`📨 الرد من الخادم: ${info.response}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ خطأ في إرسال البريد:', error);
    console.error('📧 تفاصيل الخطأ:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // في حالة الفشل، عرض الرمز في الكونسول للتطوير
    if (process.env.NODE_ENV === 'development' || process.env.EMAIL_DEBUG === 'true') {
      console.log(`🔑 رمز التحقق للمستخدم ${to}: ${code}`);
    }
    
    return false;
  }
}

// إرسال بريد الترحيب
export async function sendWelcomeEmail(to: string, name: string) {
  if (!transporter) {
    console.error('❌ البريد الإلكتروني غير مهيأ');
    return false;
  }

  try {
    const template = emailTemplates.welcome(name);
    await transporter.sendMail({
      from: `"سبق الذكية" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log(`✅ تم إرسال بريد الترحيب إلى ${to}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    return false;
  }
}

// إرسال بريد استرجاع كلمة المرور
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  if (!transporter) {
    console.error('❌ البريد الإلكتروني غير مهيأ');
    return false;
  }

  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(name, resetLink);
    
    await transporter.sendMail({
      from: `"سبق الذكية" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log(`✅ تم إرسال بريد استرجاع كلمة المرور إلى ${to}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    return false;
  }
}

// إرسال رمز التحقق الثنائي
export async function sendTwoFactorCode(to: string, code: string) {
  if (!transporter) {
    console.error('❌ البريد الإلكتروني غير مهيأ');
    return false;
  }

  try {
    const template = emailTemplates.twoFactorCode(code);
    await transporter.sendMail({
      from: `"سبق الذكية" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log(`✅ تم إرسال رمز التحقق الثنائي إلى ${to}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد:', error);
    return false;
  }
}

// توليد رمز تحقق عشوائي
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// تهيئة البريد عند بدء التطبيق
initializeEmail(); 