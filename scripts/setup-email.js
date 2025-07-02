#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 إعداد البريد الإلكتروني لموقع jur3a.ai\n');

// الإعدادات الافتراضية
const defaultConfig = {
  SMTP_HOST: 'mail.jur3a.ai',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'noreplay@jur3a.ai',
  SMTP_PASS: 'oFWD[H,A8~8;iw7(',
  EMAIL_FROM: 'noreplay@jur3a.ai',
  EMAIL_FROM_NAME: 'صحيفة سبق الإلكترونية',
  NEXT_PUBLIC_SITE_URL: 'https://jur3a.ai',
  NEXT_PUBLIC_API_URL: 'https://jur3a.ai/api',
  JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
  // DATABASE_URL: 'postgresql://user:password@localhost:5432/sabq_cms',
  OPENAI_API_KEY: 'your-openai-api-key-here',
  NODE_ENV: 'development'
};

// التحقق من وجود ملف .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  ملف .env.local موجود بالفعل!');
  rl.question('هل تريد استبداله؟ (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      createEnvFile();
    } else {
      console.log('❌ تم إلغاء العملية');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 إنشاء ملف .env.local...\n');
  
  // إنشاء محتوى الملف
  let envContent = `# إعدادات قاعدة البيانات
# DATABASE_URL="${defaultConfig.DATABASE_URL}"

# مفتاح JWT للمصادقة
JWT_SECRET="${defaultConfig.JWT_SECRET}"

# إعدادات البريد الإلكتروني
SMTP_HOST=${defaultConfig.SMTP_HOST}
SMTP_PORT=${defaultConfig.SMTP_PORT}
SMTP_SECURE=${defaultConfig.SMTP_SECURE}
SMTP_USER=${defaultConfig.SMTP_USER}
SMTP_PASS=${defaultConfig.SMTP_PASS}
EMAIL_FROM=${defaultConfig.EMAIL_FROM}
EMAIL_FROM_NAME="${defaultConfig.EMAIL_FROM_NAME}"

# إعدادات الموقع
NEXT_PUBLIC_SITE_URL=${defaultConfig.NEXT_PUBLIC_SITE_URL}
NEXT_PUBLIC_API_URL=${defaultConfig.NEXT_PUBLIC_API_URL}

# إعدادات OpenAI (للذكاء الاصطناعي)
OPENAI_API_KEY=${defaultConfig.OPENAI_API_KEY}

# إعدادات أخرى
NODE_ENV=${defaultConfig.NODE_ENV}
`;

  // كتابة الملف
  fs.writeFileSync(envPath, envContent);
  console.log('✅ تم إنشاء ملف .env.local بنجاح!\n');
  
  // إنشاء ملف .env.example
  const exampleContent = envContent.replace(defaultConfig.SMTP_PASS, 'your-email-password');
  fs.writeFileSync(envExamplePath, exampleContent);
  console.log('✅ تم إنشاء ملف .env.example بنجاح!\n');
  
  // عرض التعليمات
  console.log('📋 الخطوات التالية:\n');
  console.log('1. تأكد من تثبيت المكتبات المطلوبة:');
  console.log('   npm install nodemailer');
  console.log('   npm install --save-dev @types/nodemailer\n');
  
  console.log('2. يمكنك الآن استخدام خدمة البريد الإلكتروني في مشروعك\n');
  
  console.log('3. للاختبار، قم بتشغيل:');
  console.log('   npm run test-email\n');
  
  console.log('⚠️  تنبيه: تأكد من عدم رفع ملف .env.local إلى Git!');
  console.log('   يجب أن يكون مضافاً إلى .gitignore\n');
  
  // إضافة .env.local إلى .gitignore إذا لم يكن موجوداً
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env.local')) {
      fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env.local\n');
      console.log('✅ تم إضافة .env.local إلى .gitignore\n');
    }
  }
  
  rl.close();
}

rl.on('close', () => {
  console.log('\n👋 شكراً لاستخدام أداة إعداد البريد الإلكتروني!');
  process.exit(0);
}); 