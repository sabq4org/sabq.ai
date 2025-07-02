import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailConfig } from '@/config/email.config';

class EmailService {
  private transporter: Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
          user: emailConfig.smtp.auth.user,
          pass: emailConfig.smtp.auth.pass,
        },
        connectionTimeout: emailConfig.settings.connectionTimeout,
        greetingTimeout: emailConfig.settings.connectionTimeout,
        socketTimeout: emailConfig.settings.connectionTimeout,
      });

      // التحقق من الاتصال
      await this.transporter.verify();
      this.isInitialized = true;
      console.log('✅ خدمة البريد الإلكتروني جاهزة');
      console.log(`📧 البريد المستخدم: ${emailConfig.smtp.auth.user}`);
    } catch (error) {
      console.error('❌ فشل في تهيئة خدمة البريد:', error);
      this.isInitialized = false;
    }
  }

  private async sendMailWithRetry(mailOptions: any, retryCount = 0): Promise<boolean> {
    if (!this.transporter || !this.isInitialized) {
      console.error('❌ خدمة البريد غير مهيأة');
      return false;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`❌ خطأ في إرسال البريد (محاولة ${retryCount + 1}):`, error);
      
      if (retryCount < emailConfig.settings.retryAttempts - 1) {
        console.log(`🔄 إعادة المحاولة بعد ${emailConfig.settings.retryDelay / 1000} ثانية...`);
        await new Promise(resolve => setTimeout(resolve, emailConfig.settings.retryDelay));
        return this.sendMailWithRetry(mailOptions, retryCount + 1);
      }
      
      return false;
    }
  }

  // إرسال بريد التحقق
  async sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
    const mailOptions = {
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to,
      subject: 'تأكيد بريدك الإلكتروني - صحيفة سبق',
      html: this.getVerificationEmailTemplate(name, code),
    };

    const success = await this.sendMailWithRetry(mailOptions);
    if (success) {
      console.log(`✅ تم إرسال بريد التحقق إلى ${to}`);
    }
    return success;
  }

  // إرسال بريد الترحيب
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const mailOptions = {
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to,
      subject: 'أهلاً بك في صحيفة سبق 🎉',
      html: this.getWelcomeEmailTemplate(name),
    };

    const success = await this.sendMailWithRetry(mailOptions);
    if (success) {
      console.log(`✅ تم إرسال بريد الترحيب إلى ${to}`);
    }
    return success;
  }

  // إرسال بريد استرجاع كلمة المرور
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jur3a.ai'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to,
      subject: 'استرجاع كلمة المرور - صحيفة سبق',
      html: this.getPasswordResetTemplate(name, resetLink),
    };

    const success = await this.sendMailWithRetry(mailOptions);
    if (success) {
      console.log(`✅ تم إرسال بريد استرجاع كلمة المرور إلى ${to}`);
    }
    return success;
  }

  // إرسال رد على رسالة من الزوار
  async sendContactReply(to: string, name: string, subject: string, message: string): Promise<boolean> {
    const mailOptions = {
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to,
      subject: `رد: ${subject}`,
      html: this.getContactReplyTemplate(name, message),
    };

    const success = await this.sendMailWithRetry(mailOptions);
    if (success) {
      console.log(`✅ تم إرسال الرد إلى ${to}`);
    }
    return success;
  }

  // إرسال إشعار للإدارة عند استلام رسالة جديدة
  async sendNewContactNotification(adminEmail: string, contactDetails: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const mailOptions = {
      from: `"${emailConfig.defaults.from.name}" <${emailConfig.defaults.from.email}>`,
      to: adminEmail,
      subject: `رسالة جديدة من ${contactDetails.name}`,
      html: this.getNewContactNotificationTemplate(contactDetails),
    };

    const success = await this.sendMailWithRetry(mailOptions);
    if (success) {
      console.log(`✅ تم إرسال إشعار الرسالة الجديدة إلى ${adminEmail}`);
    }
    return success;
  }

  // قوالب البريد الإلكتروني
  private getVerificationEmailTemplate(name: string, code: string): string {
    return `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">صحيفة سبق الإلكترونية</h1>
            <p style="color: #6b7280; margin-top: 5px;">أول صحيفة سعودية على الإنترنت</p>
          </div>
          
          <h2 style="color: #1f2937;">مرحبًا ${name} 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.8;">
            نشكرك على انضمامك إلى صحيفة سبق الإلكترونية.<br>
            يرجى تأكيد عنوان بريدك الإلكتروني باستخدام الرمز التالي:
          </p>
          
          <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <h1 style="color: #1e40af; font-size: 36px; letter-spacing: 5px; margin: 0;">${code}</h1>
            <p style="color: #6b7280; margin-top: 10px;">صالح لمدة 10 دقائق</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            إذا لم تقم بإنشاء حساب، يرجى تجاهل هذه الرسالة.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 صحيفة سبق الإلكترونية - جميع الحقوق محفوظة
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              <a href="https://jur3a.ai" style="color: #3b82f6; text-decoration: none;">jur3a.ai</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">صحيفة سبق الإلكترونية</h1>
            <p style="color: #6b7280; margin-top: 5px;">أول صحيفة سعودية على الإنترنت</p>
          </div>
          
          <h2 style="color: #1f2937;">أهلاً بك يا ${name}! 🎉</h2>
          
          <p style="color: #4b5563; line-height: 1.8;">
            تم تفعيل عضويتك بنجاح.<br>
            أنت الآن جزء من أكبر صحيفة إلكترونية سعودية.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jur3a.ai" 
               style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              ابدأ القراءة الآن
            </a>
          </div>
          
          <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">مميزات عضويتك:</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>📰 الوصول إلى جميع الأخبار والمقالات</li>
              <li>🔔 إشعارات فورية بالأخبار العاجلة</li>
              <li>💾 حفظ المقالات للقراءة لاحقاً</li>
              <li>💬 التعليق والمشاركة في النقاشات</li>
              <li>🎯 محتوى مخصص حسب اهتماماتك</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 صحيفة سبق الإلكترونية - جميع الحقوق محفوظة
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              <a href="https://jur3a.ai" style="color: #3b82f6; text-decoration: none;">jur3a.ai</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getPasswordResetTemplate(name: string, resetLink: string): string {
    return `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">صحيفة سبق الإلكترونية</h1>
            <p style="color: #6b7280; margin-top: 5px;">أول صحيفة سعودية على الإنترنت</p>
          </div>
          
          <h2 style="color: #1f2937;">استرجاع كلمة المرور</h2>
          
          <p style="color: #4b5563; line-height: 1.8;">
            مرحبًا ${name}،<br>
            تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            هذا الرابط صالح لمدة ساعة واحدة فقط.<br>
            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 صحيفة سبق الإلكترونية - جميع الحقوق محفوظة
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              <a href="https://jur3a.ai" style="color: #3b82f6; text-decoration: none;">jur3a.ai</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getContactReplyTemplate(name: string, message: string): string {
    return `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">صحيفة سبق الإلكترونية</h1>
            <p style="color: #6b7280; margin-top: 5px;">أول صحيفة سعودية على الإنترنت</p>
          </div>
          
          <h2 style="color: #1f2937;">مرحبًا ${name}</h2>
          
          <p style="color: #4b5563; line-height: 1.8;">
            نشكرك على تواصلك معنا. لقد تلقينا رسالتك وهذا ردنا:
          </p>
          
          <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; border-right: 4px solid #3b82f6;">
            <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            إذا كان لديك أي استفسارات إضافية، لا تتردد في التواصل معنا.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 صحيفة سبق الإلكترونية - جميع الحقوق محفوظة
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              <a href="https://jur3a.ai" style="color: #3b82f6; text-decoration: none;">jur3a.ai</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private getNewContactNotificationTemplate(contactDetails: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    return `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">رسالة جديدة</h1>
            <p style="color: #6b7280; margin-top: 5px;">من نموذج اتصل بنا</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">معلومات المرسل:</h3>
            <p style="color: #4b5563; margin: 5px 0;"><strong>الاسم:</strong> ${contactDetails.name}</p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>البريد الإلكتروني:</strong> ${contactDetails.email}</p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>الموضوع:</strong> ${contactDetails.subject}</p>
          </div>
          
          <div style="background: #eff6ff; border-radius: 10px; padding: 20px; border-right: 4px solid #3b82f6;">
            <h3 style="color: #1f2937; margin-top: 0;">الرسالة:</h3>
            <p style="color: #1f2937; margin: 0; white-space: pre-wrap;">${contactDetails.message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${contactDetails.email}" 
               style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">
              الرد على الرسالة
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              هذه رسالة تلقائية من نظام إدارة المحتوى
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

// إنشاء مثيل واحد من الخدمة
export const emailService = new EmailService();

// دالة مساعدة لتوليد رمز التحقق
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
} 