#!/usr/bin/env node

const nodemailer = require('nodemailer');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 اختبار البريد الإلكتروني\n');

// التحقق من وجود الإعدادات
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('❌ لم يتم العثور على إعدادات البريد الإلكتروني!');
  console.log('تأكد من وجود ملف .env.local مع الإعدادات المطلوبة');
  console.log('يمكنك تشغيل: node scripts/setup-email.js');
  process.exit(1);
}

// إنشاء transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.jur3a.ai',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// التحقق من الاتصال
console.log('🔄 التحقق من الاتصال بخادم البريد...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ فشل الاتصال بخادم البريد:', error.message);
    process.exit(1);
  } else {
    console.log('✅ تم الاتصال بخادم البريد بنجاح!\n');
    askForTestEmail();
  }
});

function askForTestEmail() {
  rl.question('أدخل البريد الإلكتروني لإرسال رسالة اختبار إليه: ', (email) => {
    if (!email || !email.includes('@')) {
      console.log('❌ البريد الإلكتروني غير صحيح!');
      askForTestEmail();
      return;
    }
    
    sendTestEmail(email);
  });
}

async function sendTestEmail(to) {
  console.log(`\n📤 إرسال رسالة اختبار إلى ${to}...`);
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'صحيفة سبق'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: to,
    subject: 'رسالة اختبار من صحيفة سبق الإلكترونية',
    html: `
      <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">صحيفة سبق الإلكترونية</h1>
            <p style="color: #6b7280; margin-top: 5px;">أول صحيفة سعودية على الإنترنت</p>
          </div>
          
          <h2 style="color: #1f2937;">رسالة اختبار 🎉</h2>
          
          <p style="color: #4b5563; line-height: 1.8;">
            هذه رسالة اختبار للتأكد من أن نظام البريد الإلكتروني يعمل بشكل صحيح.
          </p>
          
          <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">معلومات الإعدادات:</h3>
            <ul style="color: #1f2937; line-height: 1.8;">
              <li><strong>الخادم:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>المنفذ:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>الأمان:</strong> ${process.env.SMTP_SECURE === 'true' ? 'SSL/TLS' : 'غير مشفر'}</li>
              <li><strong>المرسل:</strong> ${process.env.SMTP_USER}</li>
            </ul>
          </div>
          
          <p style="color: #10b981; font-weight: bold; text-align: center; font-size: 18px;">
            ✅ البريد الإلكتروني يعمل بنجاح!
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
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال الرسالة بنجاح!');
    console.log(`📧 معرف الرسالة: ${info.messageId}`);
    console.log('\n🎉 نظام البريد الإلكتروني جاهز للاستخدام!\n');
    
    rl.question('هل تريد إرسال رسالة أخرى؟ (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        askForTestEmail();
      } else {
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ فشل إرسال الرسالة:', error.message);
    console.log('\nتفاصيل الخطأ:', error);
    rl.close();
  }
}

rl.on('close', () => {
  console.log('\n👋 شكراً لاستخدام أداة اختبار البريد الإلكتروني!');
  process.exit(0);
}); 