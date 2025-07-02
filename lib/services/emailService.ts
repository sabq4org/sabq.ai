import nodemailer from 'nodemailer';
import { emailConfig } from '@/config/email.config';

// إنشاء transporter لإرسال البريد
const createTransporter = () => {
  return nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// قالب بريد التحقق
const getVerificationEmailTemplate = (name: string, verificationLink: string) => {
  return {
    subject: 'تأكيد بريدك الإلكتروني - صحيفة سبق',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">صحيفة سبق الإلكترونية</h1>
          </div>
          
          <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">مرحباً ${name}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            شكراً لتسجيلك في صحيفة سبق الإلكترونية. لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              تأكيد البريد الإلكتروني
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            أو يمكنك نسخ الرابط التالي ولصقه في المتصفح:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; margin-bottom: 20px;">
            <code style="color: #4b5563; font-size: 12px;">${verificationLink}</code>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            هذا الرابط صالح لمدة 24 ساعة. إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © 2024 صحيفة سبق الإلكترونية. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    `
  };
};

// قالب بريد الترحيب
const getWelcomeEmailTemplate = (name: string) => {
  return {
    subject: 'مرحباً بك في صحيفة سبق - احصل على 50 نقطة ترحيبية!',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">صحيفة سبق الإلكترونية</h1>
          </div>
          
          <h2 style="color: #1f2937; font-size: 22px; margin-bottom: 20px;">🎉 مرحباً بك ${name}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            تم تفعيل حسابك بنجاح! نحن سعداء بانضمامك إلى مجتمع صحيفة سبق.
          </p>
          
          <div style="background-color: #eff6ff; border-right: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 10px 0;">🎁 هدية الترحيب</h3>
            <p style="color: #3730a3; font-size: 24px; font-weight: bold; margin: 0;">50 نقطة ولاء</p>
            <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
              لقد حصلت على 50 نقطة ترحيبية! استخدمها للحصول على مزايا حصرية.
            </p>
          </div>
          
          <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 20px 0;">ماذا يمكنك فعله الآن؟</h3>
          
          <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; padding-right: 20px;">
            <li>اختر اهتماماتك للحصول على محتوى مخصص</li>
            <li>اقرأ المقالات واكسب نقاط ولاء إضافية</li>
            <li>شارك المحتوى مع أصدقائك واحصل على مكافآت</li>
            <li>تابع آخر الأخبار والتحليلات الحصرية</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/welcome/preferences" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
              اختر اهتماماتك الآن
            </a>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 10px 0;">نظام النقاط:</h4>
            <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; padding-right: 20px; margin: 0;">
              <li>قراءة مقال: 5 نقاط</li>
              <li>التعليق: 10 نقاط</li>
              <li>المشاركة: 15 نقطة</li>
              <li>دعوة صديق: 25 نقطة</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
            إذا كان لديك أي استفسار، لا تتردد في التواصل معنا على<br>
            <a href="mailto:support@sabq.ai" style="color: #2563eb; text-decoration: none;">support@sabq.ai</a>
          </p>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2024 صحيفة سبق الإلكترونية. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    `
  };
};

// إرسال بريد التحقق
export const sendVerificationEmail = async (email: string, name: string, verificationToken: string) => {
  try {
    const transporter = createTransporter();
    const verificationLink = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
    const template = getVerificationEmailTemplate(name, verificationLink);
    
    const info = await transporter.sendMail({
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to: email,
      subject: template.subject,
      html: template.html
    });
    
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// إرسال بريد الترحيب
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const transporter = createTransporter();
    const template = getWelcomeEmailTemplate(name);
    
    const info = await transporter.sendMail({
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to: email,
      subject: template.subject,
      html: template.html
    });
    
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// اختبار اتصال SMTP
export const testSMTPConnection = async () => {
  try {
    const transporter = createTransporter();
    const verified = await transporter.verify();
    
    if (verified) {
      console.log('SMTP connection verified successfully');
      return { success: true, message: 'SMTP connection is working' };
    } else {
      return { success: false, message: 'SMTP connection verification failed' };
    }
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 