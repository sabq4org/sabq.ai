// التحقق من متغيرات البيئة في Vercel
console.log('🔍 فحص متغيرات البيئة:');
console.log('DATABASE_URL موجود:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('VERCEL_ENV:', process.env.VERCEL_ENV);

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL يبدأ بـ:', url.substring(0, 10) + '...');
  
  if (url.startsWith('prisma://')) {
    console.error('❌ DATABASE_URL يستخدم Data Proxy - يجب استخدام رابط MySQL مباشر');
  } else if (url.startsWith('mysql://')) {
    console.log('✅ DATABASE_URL يستخدم MySQL مباشرة');
  }
}
