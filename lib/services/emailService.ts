import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

// أنواع مزودي البريد
type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses';

interface EmailConfig {
  provider: EmailProvider;
  from: {
    name: string;
    email: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export class EmailService {
  private config: EmailConfig;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // تحميل الإعدادات من متغيرات البيئة
    this.config = this.loadConfig();
    this.initializeTransporter();
  }

  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_PROVIDER || 'smtp') as EmailProvider;
    
    const config: EmailConfig = {
      provider,
      from: {
        name: process.env.EMAIL_FROM_NAME || 'سبق',
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@sabq.org'
      }
    };

    switch (provider) {
      case 'smtp':
        config.smtp = {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        };
        break;
      
      case 'sendgrid':
        config.sendgrid = {
          apiKey: process.env.SENDGRID_API_KEY || ''
        };
        break;
      
      case 'mailgun':
        config.mailgun = {
          apiKey: process.env.MAILGUN_API_KEY || '',
          domain: process.env.MAILGUN_DOMAIN || ''
        };
        break;
      
      case 'ses':
        config.ses = {
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        };
        break;
    }

    return config;
  }

  private async initializeTransporter() {
    try {
      switch (this.config.provider) {
        case 'smtp':
          this.transporter = nodemailer.createTransport({
            host: this.config.smtp!.host,
            port: this.config.smtp!.port,
            secure: this.config.smtp!.secure,
            auth: this.config.smtp!.auth
          });
          break;
        
        case 'sendgrid':
          // يمكن استخدام nodemailer-sendgrid
          this.transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
              user: 'apikey',
              pass: this.config.sendgrid!.apiKey
            }
          });
          break;
        
        case 'mailgun':
          this.transporter = await this.createMailgunTransporter(this.config.mailgun!);
          break;
        
        case 'ses':
          // يمكن استخدام @aws-sdk/client-ses
          const aws = require('@aws-sdk/client-ses');
          const ses = new aws.SES({
            region: this.config.ses!.region,
            credentials: {
              accessKeyId: this.config.ses!.accessKeyId,
              secretAccessKey: this.config.ses!.secretAccessKey
            }
          });
          
          this.transporter = nodemailer.createTransport({
            SES: { ses, aws }
          });
          break;
      }

      // اختبار الاتصال
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  private async createMailgunTransporter(config: NonNullable<EmailConfig['mailgun']>): Promise<nodemailer.Transporter> {
    // استخدام SMTP مباشرة بدلاً من mailgun-transport
    return nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${config.domain}`,
        pass: config.apiKey!
      }
    });
  }

  // إرسال بريد إلكتروني واحد
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers: options.headers,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error: any) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // إرسال بريد إلكتروني مع قالب
  async sendTemplatedEmail(
    templateId: string,
    to: string | string[],
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // جلب القالب
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // استبدال المتغيرات
      let html = template.htmlContent;
      let text = template.textContent || '';
      let subject = template.subject;

      // إضافة متغيرات افتراضية
      const defaultVars = {
        date: new Date().toLocaleDateString('ar-SA'),
        year: new Date().getFullYear(),
        ...variables
      };

      // استبدال المتغيرات في النص
      Object.entries(defaultVars).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, String(value));
        text = text.replace(regex, String(value));
        subject = subject.replace(regex, String(value));
      });

      // إرسال البريد
      return await this.sendEmail({
        to,
        subject,
        html,
        text
      });
    } catch (error: any) {
      console.error('Templated email error:', error);
  return {
        success: false,
        error: error.message
      };
    }
  }

  // إرسال بريد إلكتروني جماعي
  async sendBulkEmail(
    subscribers: Array<{ email: string; name?: string }>,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // إرسال دفعات صغيرة لتجنب حدود المعدل
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (subscriber) => {
          // استبدال متغيرات المستلم
          const personalizedHtml = html
            .replace(/{{name}}/g, subscriber.name || 'عزيزي القارئ')
            .replace(/{{email}}/g, subscriber.email);
          
          const personalizedText = text
            ?.replace(/{{name}}/g, subscriber.name || 'عزيزي القارئ')
            .replace(/{{email}}/g, subscriber.email);

          const result = await this.sendEmail({
            to: subscriber.email,
            subject,
            html: personalizedHtml,
            text: personalizedText
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${subscriber.email}: ${result.error}`);
          }
        })
      );

      // تأخير بين الدفعات
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // إضافة رابط إلغاء الاشتراك
  addUnsubscribeLink(html: string, subscriberId: string): string {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/unsubscribe?id=${subscriberId}`;
    const unsubscribeHtml = `
      <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #e0e0e0;">
        <p style="color: #666; font-size: 14px;">
          إذا كنت لا ترغب في تلقي هذه الرسائل، يمكنك 
          <a href="${unsubscribeUrl}" style="color: #1a73e8;">إلغاء الاشتراك</a>
        </p>
      </div>
    `;
    
    // إضافة الرابط قبل إغلاق body
    return html.replace('</body>', `${unsubscribeHtml}</body>`);
  }

  // إضافة بكسل التتبع
  addTrackingPixel(html: string, emailLogId: string): string {
    const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/track/open?id=${emailLogId}`;
    const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`;
    
    // إضافة البكسل قبل إغلاق body
    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  // تتبع النقرات
  trackLinks(html: string, emailLogId: string): string {
    const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/track/click`;
    
    // استبدال جميع الروابط لتمر عبر نظام التتبع
    return html.replace(
      /<a\s+([^>]*href=["'])([^"']+)(["'][^>]*)>/gi,
      (match, before, url, after) => {
        // تجاهل روابط إلغاء الاشتراك
        if (url.includes('unsubscribe')) {
          return match;
        }
        
        const trackedUrl = `${trackUrl}?id=${emailLogId}&url=${encodeURIComponent(url)}`;
        return `<a ${before}${trackedUrl}${after}>`;
      }
    );
  }
}

// إنشاء مثيل واحد للاستخدام
export const emailService = new EmailService(); 