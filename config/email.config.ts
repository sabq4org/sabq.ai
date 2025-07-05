// إعدادات البريد الإلكتروني لموقع jur3a.ai

export const emailConfig = {
  // إعدادات SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // false for port 587
    auth: {
      user: process.env.SMTP_USER || 'noreply@sabq.org',
      pass: process.env.SMTP_PASS || '' // يجب استخدام App Password
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  },
  
  // معلومات المرسل
  from: {
    name: process.env.EMAIL_FROM_NAME || 'صحيفة سبق',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@sabq.org'
  },
  
  // إعدادات عامة
  general: {
    enableVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    skipVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    verificationExpiry: 24 * 60 * 60 * 1000, // 24 ساعة
    resetPasswordExpiry: 60 * 60 * 1000, // ساعة واحدة
  },
  
  // قوالب البريد
  templates: {
    verification: {
      subject: 'تأكيد حسابك في صحيفة سبق',
      preview: 'مرحباً بك في صحيفة سبق! يرجى تأكيد بريدك الإلكتروني'
    },
    resetPassword: {
      subject: 'إعادة تعيين كلمة المرور - صحيفة سبق',
      preview: 'لقد طلبت إعادة تعيين كلمة المرور'
    },
    welcome: {
      subject: 'مرحباً بك في صحيفة سبق!',
      preview: 'شكراً لانضمامك إلى مجتمع سبق'
    }
  },
  
  // إعدادات Microsoft 365 المحددة
  microsoft365: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    requireTLS: true,
    tls: {
      ciphers: 'SSLv3'
    }
  },
  
  // إعدادات بديلة (للتطوير)
  development: {
    host: process.env.DEV_SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.DEV_SMTP_PORT || '587'),
    auth: {
      user: process.env.DEV_SMTP_USER || process.env.SMTP_USER,
      pass: process.env.DEV_SMTP_PASS || process.env.SMTP_PASS
    }
  }
};

// إعدادات خادم البريد الوارد (للمعلومات فقط)
export const incomingMailConfig = {
  imap: {
    host: 'mail.jur3a.ai',
    port: 993,
    secure: true,
    auth: {
      user: 'noreplay@jur3a.ai',
      pass: process.env.SMTP_PASS || 'oFWD[H,A8~8;iw7('
    }
  },
  pop3: {
    host: 'mail.jur3a.ai',
    port: 995,
    secure: true,
    auth: {
      user: 'noreplay@jur3a.ai',
      pass: process.env.SMTP_PASS || 'oFWD[H,A8~8;iw7('
    }
  }
};

// دالة مساعدة للحصول على إعدادات SMTP الصحيحة
export function getSmtpConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const useDevConfig = isDevelopment && process.env.USE_DEV_EMAIL === 'true';
  
  if (useDevConfig) {
    return emailConfig.development;
  }
  
  return emailConfig.smtp;
} 