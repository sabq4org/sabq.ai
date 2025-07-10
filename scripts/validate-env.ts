#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// تحميل متغيرات البيئة
config({ path: resolve(process.cwd(), '.env.local') });

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    required: number;
    optional: number;
    missing: number;
    invalid: number;
  };
}

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validation?: (value: string) => boolean;
  example?: string;
  category: string;
}

// قائمة متغيرات البيئة المطلوبة
const ENV_VARIABLES: EnvVariable[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'رابط الاتصال بقاعدة البيانات PostgreSQL',
    validation: (value) => value.startsWith('postgresql://'),
    example: 'postgresql://user:pass@localhost:5432/dbname',
    category: 'Database'
  },
  {
    name: 'DATABASE_TEST_URL',
    required: false,
    description: 'رابط الاتصال بقاعدة البيانات للاختبار',
    validation: (value) => value.startsWith('postgresql://'),
    example: 'postgresql://user:pass@localhost:5432/test_db',
    category: 'Database'
  },

  // Authentication
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'مفتاح سري للمصادقة',
    validation: (value) => value.length >= 32,
    example: 'your-super-secret-key-here-change-this-in-production',
    category: 'Authentication'
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'URL الأساسي للتطبيق',
    validation: (value) => value.startsWith('http'),
    example: 'http://localhost:3000',
    category: 'Authentication'
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'مفتاح JWT للتوقيع',
    validation: (value) => value.length >= 32,
    example: 'your-jwt-secret-key-here-change-this-in-production',
    category: 'Authentication'
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    description: 'مفتاح التشفير للبيانات الحساسة',
    validation: (value) => value.length === 32,
    example: 'your-32-character-encryption-key-here',
    category: 'Authentication'
  },

  // Supabase
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'رابط مشروع Supabase',
    validation: (value) => value.includes('supabase.co'),
    example: 'https://your-project-id.supabase.co',
    category: 'Supabase'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    required: true,
    description: 'مفتاح Supabase العام',
    validation: (value) => value.length > 100,
    example: 'your-supabase-anon-key',
    category: 'Supabase'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'مفتاح Supabase للخدمة',
    validation: (value) => value.length > 100,
    example: 'your-supabase-service-role-key',
    category: 'Supabase'
  },

  // Cloudinary
  {
    name: 'CLOUDINARY_CLOUD_NAME',
    required: true,
    description: 'اسم Cloud في Cloudinary',
    validation: (value) => value.length > 0,
    example: 'sabq-ai',
    category: 'Cloudinary'
  },
  {
    name: 'CLOUDINARY_API_KEY',
    required: true,
    description: 'مفتاح API لـ Cloudinary',
    validation: (value) => /^\d+$/.test(value),
    example: 'your-cloudinary-api-key',
    category: 'Cloudinary'
  },
  {
    name: 'CLOUDINARY_API_SECRET',
    required: true,
    description: 'السر الخاص بـ Cloudinary',
    validation: (value) => value.length > 20,
    example: 'your-cloudinary-api-secret',
    category: 'Cloudinary'
  },

  // AI Services
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'مفتاح API لـ OpenAI',
    validation: (value) => value.startsWith('sk-'),
    example: 'sk-your-openai-api-key',
    category: 'AI Services'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'مفتاح API لـ Anthropic',
    validation: (value) => value.startsWith('sk-ant-'),
    example: 'sk-ant-your-anthropic-api-key',
    category: 'AI Services'
  },

  // Email
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'خادم SMTP للبريد الإلكتروني',
    validation: (value) => value.length > 0,
    example: 'smtp.gmail.com',
    category: 'Email'
  },
  {
    name: 'SMTP_PORT',
    required: false,
    description: 'منفذ SMTP',
    validation: (value) => /^\d+$/.test(value),
    example: '587',
    category: 'Email'
  },
  {
    name: 'SMTP_USER',
    required: false,
    description: 'اسم المستخدم للبريد الإلكتروني',
    validation: (value) => value.includes('@'),
    example: 'your-email@gmail.com',
    category: 'Email'
  },
  {
    name: 'SMTP_PASSWORD',
    required: false,
    description: 'كلمة مرور البريد الإلكتروني',
    validation: (value) => value.length > 0,
    example: 'your-email-password',
    category: 'Email'
  },

  // Redis
  {
    name: 'REDIS_URL',
    required: false,
    description: 'رابط الاتصال بـ Redis',
    validation: (value) => value.startsWith('redis://'),
    example: 'redis://localhost:6379',
    category: 'Redis'
  },

  // Environment
  {
    name: 'NODE_ENV',
    required: true,
    description: 'بيئة التشغيل',
    validation: (value) => ['development', 'production', 'test'].includes(value),
    example: 'development',
    category: 'Environment'
  },
  {
    name: 'PORT',
    required: false,
    description: 'منفذ التشغيل',
    validation: (value) => /^\d+$/.test(value),
    example: '3000',
    category: 'Environment'
  }
];

/**
 * دالة للتحقق من صحة متغيرات البيئة
 */
function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🔍 بدء التحقق من متغيرات البيئة...\n');

  // التحقق من وجود ملف .env.local
  const envFile = resolve(process.cwd(), '.env.local');
  if (!existsSync(envFile)) {
    errors.push('❌ ملف .env.local غير موجود');
    console.log('⚠️  ملف .env.local غير موجود. سيتم التحقق من متغيرات البيئة النظام.');
  }

  // تجميع المتغيرات حسب الفئة
  const categorizedVars = ENV_VARIABLES.reduce((acc, envVar) => {
    if (!acc[envVar.category]) {
      acc[envVar.category] = [];
    }
    acc[envVar.category].push(envVar);
    return acc;
  }, {} as Record<string, EnvVariable[]>);

  // التحقق من كل فئة
  for (const [category, vars] of Object.entries(categorizedVars)) {
    console.log(`📋 ${category}:`);
    
    for (const envVar of vars) {
      const value = process.env[envVar.name];
      
      if (!value) {
        if (envVar.required) {
          errors.push(`❌ ${envVar.name} مطلوب وغير موجود`);
          console.log(`  ❌ ${envVar.name}: غير موجود (مطلوب)`);
        } else {
          warnings.push(`⚠️  ${envVar.name} غير موجود (اختياري)`);
          console.log(`  ⚠️  ${envVar.name}: غير موجود (اختياري)`);
        }
      } else {
        // التحقق من صحة القيمة
        if (envVar.validation && !envVar.validation(value)) {
          errors.push(`❌ ${envVar.name} له قيمة غير صحيحة`);
          console.log(`  ❌ ${envVar.name}: قيمة غير صحيحة`);
        } else {
          console.log(`  ✅ ${envVar.name}: موجود وصحيح`);
        }
      }
    }
    console.log('');
  }

  // حساب الإحصائيات
  const requiredVars = ENV_VARIABLES.filter(v => v.required);
  const optionalVars = ENV_VARIABLES.filter(v => !v.required);
  const missingRequired = requiredVars.filter(v => !process.env[v.name]);
  const invalidVars = ENV_VARIABLES.filter(v => {
    const value = process.env[v.name];
    return value && v.validation && !v.validation(value);
  });

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      total: ENV_VARIABLES.length,
      required: requiredVars.length,
      optional: optionalVars.length,
      missing: missingRequired.length,
      invalid: invalidVars.length
    }
  };

  return result;
}

/**
 * دالة لطباعة التقرير النهائي
 */
function printReport(result: ValidationResult): void {
  console.log('📊 ملخص التحقق من متغيرات البيئة:');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log(`📈 إجمالي المتغيرات: ${result.summary.total}`);
  console.log(`✅ المتغيرات المطلوبة: ${result.summary.required}`);
  console.log(`🔧 المتغيرات الاختيارية: ${result.summary.optional}`);
  console.log(`❌ المتغيرات المفقودة: ${result.summary.missing}`);
  console.log(`⚠️  المتغيرات غير الصحيحة: ${result.summary.invalid}`);
  console.log('');

  if (result.errors.length > 0) {
    console.log('🚨 الأخطاء:');
    result.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  التحذيرات:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }

  if (result.isValid) {
    console.log('🎉 جميع المتغيرات المطلوبة موجودة وصحيحة!');
    console.log('✅ يمكن تشغيل التطبيق بأمان.');
  } else {
    console.log('❌ يوجد أخطاء في متغيرات البيئة.');
    console.log('🔧 يرجى إصلاح الأخطاء قبل تشغيل التطبيق.');
  }
}

/**
 * دالة لإنشاء ملف .env.local تلقائياً
 */
function generateEnvFile(): void {
  console.log('\n🔧 إنشاء ملف .env.local تلقائياً...');
  
  const envTemplate = ENV_VARIABLES.map(envVar => {
    const comment = `# ${envVar.description}`;
    const example = envVar.example ? `${envVar.name}="${envVar.example}"` : `${envVar.name}=""`;
    return `${comment}\n${example}`;
  }).join('\n\n');

  const fs = require('fs');
  const envFilePath = resolve(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envFilePath, envTemplate);
    console.log('✅ تم إنشاء ملف .env.local بنجاح!');
    console.log('📝 يرجى تحديث القيم في الملف قبل تشغيل التطبيق.');
  } catch (error) {
    console.error('❌ خطأ في إنشاء ملف .env.local:', error);
  }
}

/**
 * دالة لإنشاء تقرير مفصل
 */
function generateDetailedReport(result: ValidationResult): void {
  console.log('\n📋 تقرير مفصل:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const categorizedVars = ENV_VARIABLES.reduce((acc, envVar) => {
    if (!acc[envVar.category]) {
      acc[envVar.category] = [];
    }
    acc[envVar.category].push(envVar);
    return acc;
  }, {} as Record<string, EnvVariable[]>);

  for (const [category, vars] of Object.entries(categorizedVars)) {
    console.log(`\n📂 ${category}:`);
    console.log('───────────────────────────────────────────────────────');
    
    for (const envVar of vars) {
      const value = process.env[envVar.name];
      const status = value ? '✅ موجود' : (envVar.required ? '❌ مفقود' : '⚠️  غير موجود');
      
      console.log(`  ${envVar.name}: ${status}`);
      console.log(`    📝 ${envVar.description}`);
      if (envVar.example) {
        console.log(`    💡 مثال: ${envVar.example}`);
      }
      console.log('');
    }
  }
}

// تشغيل التحقق
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--generate')) {
      generateEnvFile();
      return;
    }
    
    const result = validateEnvironmentVariables();
    
    if (args.includes('--detailed')) {
      generateDetailedReport(result);
    }
    
    printReport(result);
    
    // إنهاء العملية بالرمز المناسب
    process.exit(result.isValid ? 0 : 1);
    
  } catch (error) {
    console.error('❌ خطأ في تشغيل التحقق من البيئة:', error);
    process.exit(1);
  }
}

// تشغيل الملف مباشرة
if (require.main === module) {
  main();
}

export { validateEnvironmentVariables, ENV_VARIABLES };
export type { ValidationResult, EnvVariable }; 