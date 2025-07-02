const fs = require('fs');
const path = require('path');

const envContent = `# قاعدة البيانات - PlanetScale عبر الاتصال المحلي
# تأكد من تشغيل: pscale connect j3uar_sabq_ai main --port 3306
DATABASE_URL="mysql://root@127.0.0.1:3306/j3uar_sabq_ai"

# إعدادات أخرى
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# OpenAI API (اختياري)
OPENAI_API_KEY=""

# Email settings (اختياري)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
`;

const envPath = path.join(process.cwd(), '.env.local');

// التحقق من وجود الملف
if (fs.existsSync(envPath)) {
  console.log('⚠️  ملف .env.local موجود بالفعل!');
  console.log('📁 المسار:', envPath);
  
  // قراءة المحتوى الحالي
  const currentContent = fs.readFileSync(envPath, 'utf8');
  if (!currentContent.includes('DATABASE_URL')) {
    console.log('❌ لكن DATABASE_URL غير موجود في الملف!');
    console.log('📝 يرجى إضافة هذا السطر:');
    console.log('DATABASE_URL="mysql://root@127.0.0.1:3306/j3uar_sabq_ai"');
  } else {
    console.log('✅ DATABASE_URL موجود في الملف');
  }
} else {
  // إنشاء الملف
  fs.writeFileSync(envPath, envContent);
  console.log('✅ تم إنشاء ملف .env.local بنجاح!');
  console.log('📁 المسار:', envPath);
  console.log('\n⚠️  تذكير مهم:');
  console.log('1. تأكد من تشغيل PlanetScale proxy:');
  console.log('   pscale connect j3uar_sabq_ai main --port 3306');
  console.log('\n2. أعد تشغيل خادم Next.js:');
  console.log('   npm run dev');
} 