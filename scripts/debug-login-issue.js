const fs = require('fs');
const path = require('path');

console.log('🔍 تشخيص مشكلة تسجيل الدخول...\n');

// 1. فحص ملف middleware.ts
console.log('📋 فحص middleware.ts:');
const middlewarePath = path.join(process.cwd(), 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const content = fs.readFileSync(middlewarePath, 'utf8');
  const hasUserCookieParsing = content.includes('JSON.parse') && content.includes('userCookie');
  const hasURIDecoding = content.includes('decodeURIComponent');
  
  console.log(`  ✅ الملف موجود`);
  console.log(`  ${hasUserCookieParsing ? '✅' : '❌'} يحتوي على parsing للكوكيز`);
  console.log(`  ${hasURIDecoding ? '✅' : '❌'} يدعم فك ترميز URI`);
} else {
  console.log('  ❌ الملف غير موجود!');
}

// 2. فحص مكون Header
console.log('\n📋 فحص مكون Header:');
const headerPath = path.join(process.cwd(), 'components/Header.tsx');
if (fs.existsSync(headerPath)) {
  const content = fs.readFileSync(headerPath, 'utf8');
  const hasLoginLink = content.includes('href="/login"');
  const hasUserState = content.includes('useState<UserData');
  const hasLoadUserData = content.includes('loadUserData');
  
  console.log(`  ✅ الملف موجود`);
  console.log(`  ${hasLoginLink ? '✅' : '❌'} يحتوي على رابط تسجيل الدخول`);
  console.log(`  ${hasUserState ? '✅' : '❌'} يحتوي على state للمستخدم`);
  console.log(`  ${hasLoadUserData ? '✅' : '❌'} يحتوي على دالة تحميل بيانات المستخدم`);
} else {
  console.log('  ❌ الملف غير موجود!');
}

// 3. فحص صفحة login
console.log('\n📋 فحص صفحة login:');
const loginPath = path.join(process.cwd(), 'app/login/page.tsx');
if (fs.existsSync(loginPath)) {
  const content = fs.readFileSync(loginPath, 'utf8');
  const hasWindowLocation = content.includes('window.location.href');
  const hasLocalStorage = content.includes('localStorage.setItem');
  const hasCookieSet = content.includes('document.cookie');
  
  console.log(`  ✅ الملف موجود`);
  console.log(`  ${hasWindowLocation ? '✅' : '❌'} يستخدم window.location للتوجيه`);
  console.log(`  ${hasLocalStorage ? '✅' : '❌'} يحفظ في localStorage`);
  console.log(`  ${hasCookieSet ? '✅' : '❌'} يعيّن الكوكيز يدوياً`);
} else {
  console.log('  ❌ الملف غير موجود!');
}

// 4. فحص API login
console.log('\n📋 فحص API login:');
const loginAPIPath = path.join(process.cwd(), 'app/api/auth/login/route.ts');
if (fs.existsSync(loginAPIPath)) {
  const content = fs.readFileSync(loginAPIPath, 'utf8');
  const hasSecureFlag = content.includes('secureFlag');
  const hasForwardedProto = content.includes('x-forwarded-proto');
  const hasCookieSet = content.includes('response.cookies.set');
  
  console.log(`  ✅ الملف موجود`);
  console.log(`  ${hasSecureFlag ? '✅' : '❌'} يستخدم secureFlag متغير`);
  console.log(`  ${hasForwardedProto ? '✅' : '❌'} يتحقق من x-forwarded-proto`);
  console.log(`  ${hasCookieSet ? '✅' : '❌'} يعيّن الكوكيز`);
} else {
  console.log('  ❌ الملف غير موجود!');
}

// 5. فحص استخدام Header في الصفحات
console.log('\n📋 فحص استخدام Header في الصفحات:');
const pagesWithHeader = [
  'app/page.tsx',
  'app/news/page.tsx',
  'app/categories/page.tsx'
];

pagesWithHeader.forEach(pagePath => {
  const fullPath = path.join(process.cwd(), pagePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasHeaderImport = content.includes("import Header from") || content.includes("import { Header }");
    const hasHeaderUsage = content.includes("<Header");
    
    console.log(`  ${pagePath}:`);
    console.log(`    ${hasHeaderImport ? '✅' : '❌'} import للـ Header`);
    console.log(`    ${hasHeaderUsage ? '✅' : '❌'} استخدام <Header />`);
  }
});

console.log('\n✨ انتهى التشخيص');
console.log('\n💡 توصيات:');
console.log('  1. تأكد من أن جميع الصفحات تستورد وتستخدم مكون Header');
console.log('  2. تأكد من أن middleware.ts يدعم فك ترميز الكوكيز');
console.log('  3. تأكد من أن API login يعيّن secure=false على HTTP');
console.log('  4. جرب مسح الكوكيز والـ localStorage في المتصفح'); 