#!/usr/bin/env node

/**
 * نص برمجي بسيط للتحقق من متغيرات البيئة
 * لا يحتاج إلى تبعيات خارجية
 */

interface EnvCheck {
  name: string;
  required: boolean;
  description: string;
}

// قائمة المتغيرات المطلوبة
const REQUIRED_ENV_VARS: EnvCheck[] = [
  { name: 'DATABASE_URL', required: true, description: 'رابط قاعدة البيانات' },
  { name: 'NEXTAUTH_SECRET', required: true, description: 'مفتاح المصادقة' },
  { name: 'NEXTAUTH_URL', required: true, description: 'رابط التطبيق' },
  { name: 'SUPABASE_URL', required: true, description: 'رابط Supabase' },
  { name: 'SUPABASE_ANON_KEY', required: true, description: 'مفتاح Supabase العام' },
  { name: 'CLOUDINARY_CLOUD_NAME', required: true, description: 'اسم Cloudinary' },
  { name: 'CLOUDINARY_API_KEY', required: true, description: 'مفتاح Cloudinary' },
  { name: 'CLOUDINARY_API_SECRET', required: true, description: 'سر Cloudinary' },
  { name: 'OPENAI_API_KEY', required: true, description: 'مفتاح OpenAI' },
  { name: 'NODE_ENV', required: true, description: 'بيئة التشغيل' },
  
  // متغيرات اختيارية
  { name: 'ANTHROPIC_API_KEY', required: false, description: 'مفتاح Anthropic' },
  { name: 'SMTP_HOST', required: false, description: 'خادم البريد الإلكتروني' },
  { name: 'REDIS_URL', required: false, description: 'رابط Redis' },
];

/**
 * دالة للتحقق من متغيرات البيئة
 */
function validateEnvironment(): boolean {
  console.log('🔍 التحقق من متغيرات البيئة...\n');
  
  let hasErrors = false;
  let warnings = 0;
  
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (!value) {
      if (envVar.required) {
        console.log(`❌ ${envVar.name}: مفقود (مطلوب) - ${envVar.description}`);
        hasErrors = true;
      } else {
        console.log(`⚠️  ${envVar.name}: مفقود (اختياري) - ${envVar.description}`);
        warnings++;
      }
    } else {
      console.log(`✅ ${envVar.name}: موجود`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 الملخص:`);
  console.log(`✅ متغيرات موجودة: ${REQUIRED_ENV_VARS.filter(v => process.env[v.name]).length}`);
  console.log(`❌ متغيرات مفقودة: ${REQUIRED_ENV_VARS.filter(v => !process.env[v.name] && v.required).length}`);
  console.log(`⚠️  تحذيرات: ${warnings}`);
  
  if (hasErrors) {
    console.log('\n❌ يوجد متغيرات مطلوبة مفقودة!');
    console.log('💡 قم بإنشاء ملف .env.local وأضف المتغيرات المطلوبة.');
  } else {
    console.log('\n🎉 جميع المتغيرات المطلوبة موجودة!');
  }
  
  return !hasErrors;
}

/**
 * دالة لإنشاء ملف .env.local أساسي
 */
function generateBasicEnvFile(): void {
  console.log('📝 إنشاء ملف .env.local أساسي...');
  
  const envContent = REQUIRED_ENV_VARS.map(envVar => {
    const comment = `# ${envVar.description}`;
    const varLine = `${envVar.name}=""`;
    return `${comment}\n${varLine}`;
  }).join('\n\n');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ تم إنشاء ملف .env.local!');
    console.log('📝 يرجى تحديث القيم في الملف.');
  } catch (error) {
    console.error('❌ خطأ في إنشاء الملف:', error);
  }
}

// تشغيل النص البرمجي
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate') || args.includes('-g')) {
    generateBasicEnvFile();
    return;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🔧 نص برمجي للتحقق من متغيرات البيئة');
    console.log('');
    console.log('الاستخدام:');
    console.log('  node validate-env-simple.js          # التحقق من المتغيرات');
    console.log('  node validate-env-simple.js -g       # إنشاء ملف .env.local');
    console.log('  node validate-env-simple.js --help   # عرض هذه المساعدة');
    return;
  }
  
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

// تشغيل الملف مباشرة
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, REQUIRED_ENV_VARS }; 