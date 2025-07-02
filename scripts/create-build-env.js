const fs = require('fs');
const path = require('path');

// محتوى ملف .env.build
const buildEnvContent = `# إعدادات البناء - تعطيل البريد الإلكتروني
SKIP_EMAIL_VERIFICATION=true
EMAIL_DEBUG=false

# إعدادات وهمية للبريد (لن تُستخدم)
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=noreply@localhost
SMTP_PASS=dummy

# إعدادات أخرى للبناء
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://jur3a.ai
`;

// إنشاء الملف
const envBuildPath = path.join(process.cwd(), '.env.build');

try {
  fs.writeFileSync(envBuildPath, buildEnvContent);
  console.log('✅ تم إنشاء ملف .env.build بنجاح');
  console.log('\n📝 لاستخدامه في البناء:');
  console.log('1. cp .env.build .env');
  console.log('2. npm run build');
  console.log('3. rm .env');
  console.log('\n⚠️  تذكر: استخدم ملف .env الحقيقي في بيئة الإنتاج!');
} catch (error) {
  console.error('❌ خطأ في إنشاء الملف:', error.message);
} 