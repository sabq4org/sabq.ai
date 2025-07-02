const nodemailer = require('nodemailer');

// إعدادات البريد الصحيحة
const emailConfig = {
  host: 'mail.jur3a.ai',
  port: 465,
  secure: true,
  auth: {
    user: 'noreplay@jur3a.ai',
    pass: 'oFWD[H,A8~8;iw7('
  }
};

async function testEmail() {
  console.log('🔧 اختبار إعدادات البريد الإلكتروني...\n');
  
  try {
    // إنشاء transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // التحقق من الاتصال
    console.log('📡 التحقق من الاتصال بخادم البريد...');
    await transporter.verify();
    console.log('✅ الاتصال بخادم البريد ناجح!\n');
    
    // إرسال بريد تجريبي
    console.log('📧 إرسال بريد تجريبي...');
    const testEmail = {
      from: '"صحيفة سبق الإلكترونية" <noreplay@jur3a.ai>',
      to: 'test@example.com', // غيّر هذا إلى بريدك الفعلي
      subject: 'اختبار نظام البريد - سبق الإلكترونية',
      html: `
        <div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1e40af;">اختبار نظام البريد الإلكتروني</h1>
          <p>هذا بريد تجريبي للتأكد من عمل النظام بشكل صحيح.</p>
          <p>التاريخ والوقت: ${new Date().toLocaleString('ar-SA')}</p>
          <hr>
          <p style="color: #666;">صحيفة سبق الإلكترونية - jur3a.ai</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ تم إرسال البريد بنجاح!');
    console.log('📬 معرف الرسالة:', info.messageId);
    console.log('📨 الرد من الخادم:', info.response);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 تلميح: تأكد من أن المنفذ 465 مفتوح وأن الخادم يقبل الاتصالات SSL/TLS');
    } else if (error.code === 'EAUTH') {
      console.log('\n💡 تلميح: تحقق من اسم المستخدم وكلمة المرور');
    }
  }
}

// تشغيل الاختبار
testEmail(); 