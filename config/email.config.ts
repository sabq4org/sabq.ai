// إعدادات البريد الإلكتروني لموقع jur3a.ai

export const emailConfig = {
  // إعدادات خادم SMTP
  smtp: {
    host: 'mail.jur3a.ai',
    port: 465,
    secure: true, // استخدام SSL/TLS
    auth: {
      user: 'noreplay@jur3a.ai',
      pass: process.env.SMTP_PASS || 'oFWD[H,A8~8;iw7(' // يفضل استخدام متغير بيئة
    }
  },
  
  // إعدادات المرسل الافتراضي
  defaults: {
    from: {
      name: 'صحيفة سبق الإلكترونية',
      email: 'noreplay@jur3a.ai'
    }
  },
  
  // إعدادات أخرى
  settings: {
    // مهلة الاتصال (بالملي ثانية)
    connectionTimeout: 30000,
    // عدد محاولات إعادة الإرسال
    retryAttempts: 3,
    // التأخير بين المحاولات (بالملي ثانية)
    retryDelay: 5000
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