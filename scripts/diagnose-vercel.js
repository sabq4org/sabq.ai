#!/usr/bin/env node
// سكريبت تشخيص مشاكل Vercel

console.log('🔍 تشخيص مشاكل Vercel...\n');

console.log('📋 المتغيرات المطلوبة في Vercel:');
console.log('=====================================\n');

// المتغيرات الأساسية
const requiredVars = [
  {
    name: 'DATABASE_URL',
    value: 'mysql://[YOUR_DATABASE_CONNECTION_STRING]',
    sensitive: true
  },
  {
    name: 'NEXT_PUBLIC_API_URL',
    value: 'https://sabq-ai-cms.vercel.app',
    sensitive: false
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL', 
    value: 'https://sabq-ai-cms.vercel.app',
    sensitive: false
  },
  {
    name: 'JWT_SECRET',
    value: '[GENERATE_A_SECURE_SECRET]',
    sensitive: true
  },
  {
    name: 'NEXTAUTH_URL',
    value: 'https://sabq-ai-cms.vercel.app',
    sensitive: false
  },
  {
    name: 'NEXTAUTH_SECRET',
    value: '[GENERATE_A_SECURE_SECRET]',
    sensitive: true
  }
];

// المتغيرات الإضافية
const additionalVars = [
  {
    name: 'ENABLE_AI_FEATURES',
    value: 'true',
    sensitive: false
  },
  {
    name: 'ENABLE_EMAIL_VERIFICATION',
    value: 'false',
    sensitive: false
  },
  {
    name: 'ENABLE_LOYALTY_SYSTEM',
    value: 'true',
    sensitive: false
  },
  {
    name: 'ENABLE_COMMENTS',
    value: 'true',
    sensitive: false
  },
  {
    name: 'DEBUG_MODE',
    value: 'false',
    sensitive: false
  },
  {
    name: 'SKIP_EMAIL_VERIFICATION',
    value: 'true',
    sensitive: false
  },
  {
    name: 'MAX_UPLOAD_SIZE',
    value: '5242880',
    sensitive: false
  },
  {
    name: 'MAX_ARTICLES_PER_PAGE',
    value: '20',
    sensitive: false
  },
  {
    name: 'SESSION_TIMEOUT',
    value: '86400',
    sensitive: false
  }
];

console.log('🔴 المتغيرات الأساسية (مطلوبة):');
console.log('--------------------------------\n');

requiredVars.forEach((varInfo, index) => {
  console.log(`${index + 1}. ${varInfo.name}`);
  console.log(`   القيمة: ${varInfo.value}`);
  console.log(`   حساسة: ${varInfo.sensitive ? '✅ نعم' : '❌ لا'}`);
  console.log('');
});

console.log('\n🟡 المتغيرات الإضافية (موصى بها):');
console.log('-----------------------------------\n');

additionalVars.forEach((varInfo, index) => {
  console.log(`${index + 1}. ${varInfo.name} = ${varInfo.value}`);
});

console.log('\n📝 خطوات الإصلاح في Vercel:');
console.log('============================\n');

console.log('1. افتح Vercel Dashboard');
console.log('2. اذهب إلى Settings → Environment Variables');
console.log('3. احذف جميع المتغيرات الموجودة');
console.log('4. أضف المتغيرات الأساسية الـ 6 أعلاه');
console.log('5. تأكد من اختيار: Production + Preview + Development');
console.log('6. اذهب إلى Deployments');
console.log('7. اضغط Redeploy على آخر deployment');

console.log('\n⚠️ نصائح مهمة:');
console.log('==============\n');
console.log('- تأكد من عدم وجود مسافات زائدة في القيم');
console.log('- لا تضع علامات اقتباس حول القيم في Vercel');
console.log('- DATABASE_URL يجب أن يكون في سطر واحد');
console.log('- بعد إضافة المتغيرات، أعد النشر فوراً');

console.log('\n🔍 للتحقق من الأخطاء:');
console.log('=====================\n');
console.log('1. في Vercel Dashboard → Functions');
console.log('2. اختر أي API route فاشل');
console.log('3. انظر إلى Logs للحصول على تفاصيل الخطأ');

console.log('\n✅ بعد إضافة المتغيرات، يجب أن تعمل هذه الوظائف:');
console.log('================================================\n');
console.log('- تسجيل الدخول');
console.log('- إضافة الفئات');
console.log('- إضافة المقالات');
console.log('- رفع الصور');
console.log('- إضافة أعضاء الفريق');
console.log('- التفاعلات (إعجاب/مفضلة)');

console.log('\n🔐 لتوليد المفاتيح السرية:');
console.log('========================\n');
console.log('node scripts/generate-secrets.js'); 