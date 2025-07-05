const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testMicrosoftEmail() {
  console.log('🔍 اختبار البريد الإلكتروني مع Microsoft 365');
  console.log('==========================================');
  
  // التحقق من وجود الإعدادات
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ خطأ: يجب تعيين SMTP_USER و SMTP_PASS في .env.local');
    console.log('\nتأكد من:');
    console.log('1. وجود ملف .env.local');
    console.log('2. تعيين SMTP_USER (مثل: noreply@sabq.org)');
    console.log('3. تعيين SMTP_PASS (كلمة مرور التطبيق من Microsoft)');
    return;
  }
  
  // إعدادات الاتصال
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // false للمنفذ 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
  
  try {
    // اختبار الاتصال
    console.log('\n📡 اختبار الاتصال بخادم البريد...');
    await transporter.verify();
    console.log('✅ الاتصال بخادم البريد ناجح!');
    
    // طلب البريد الإلكتروني للاختبار
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n📧 أدخل بريدك الإلكتروني لإرسال رسالة اختبار: ', async (testEmail) => {
      if (!testEmail || !testEmail.includes('@')) {
        console.error('❌ بريد إلكتروني غير صالح');
        readline.close();
        return;
      }
      
      try {
        // إرسال بريد تجريبي
        console.log('\n📤 إرسال بريد تجريبي...');
        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'صحيفة سبق'}" <${process.env.SMTP_USER}>`,
          to: testEmail,
          subject: 'اختبار البريد الإلكتروني - صحيفة سبق',
          text: 'مرحباً!\n\nهذا اختبار للبريد الإلكتروني من صحيفة سبق.\n\nإذا وصلتك هذه الرسالة، فإن إعدادات البريد تعمل بشكل صحيح.\n\nمع تحيات،\nفريق صحيفة سبق',
          html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">مرحباً! 👋</h2>
              <p style="color: #666; line-height: 1.6;">
                هذا اختبار للبريد الإلكتروني من <strong>صحيفة سبق</strong>.
              </p>
              <p style="color: #666; line-height: 1.6;">
                إذا وصلتك هذه الرسالة، فإن إعدادات البريد تعمل بشكل صحيح ✅
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 14px;">
                مع تحيات،<br>
                فريق صحيفة سبق
              </p>
            </div>
          `
        });
        
        console.log('✅ تم إرسال البريد بنجاح!');
        console.log('📬 معرف الرسالة:', info.messageId);
        console.log('\n✨ إعدادات البريد تعمل بشكل صحيح!');
        
      } catch (error) {
        console.error('\n❌ خطأ في إرسال البريد:', error.message);
        
        if (error.message.includes('Invalid login')) {
          console.log('\n💡 تلميح: تأكد من:');
          console.log('1. استخدام كلمة مرور التطبيق (App Password) وليس كلمة مرور الحساب');
          console.log('2. تفعيل المصادقة الثنائية في حساب Microsoft');
          console.log('3. إنشاء كلمة مرور تطبيق جديدة من: https://account.microsoft.com/security');
        }
      }
      
      readline.close();
    });
    
  } catch (error) {
    console.error('\n❌ خطأ في الاتصال:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 تلميح: تأكد من:');
      console.log('1. الاتصال بالإنترنت');
      console.log('2. عدم حجب المنفذ 587 من جدار الحماية');
      console.log('3. صحة اسم الخادم: smtp.office365.com');
    }
  }
}

// تشغيل الاختبار
testMicrosoftEmail(); 