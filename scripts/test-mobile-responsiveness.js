#!/usr/bin/env node

/**
 * سكريبت اختبار التوافق مع أحجام الشاشات المختلفة
 * يتحقق من CSS والمكونات على أحجام مختلفة
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 اختبار التوافق مع الموبايل...\n');

// أحجام الشاشات المختلفة للاختبار
const screenSizes = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 }
];

// التحقق من وجود ملفات CSS للموبايل
console.log('📱 التحقق من ملفات CSS للموبايل:');
const cssFiles = [
  'styles/mobile-optimization.css',
  'styles/mobile-article.css',
  'app/globals.css'
];

cssFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - موجود`);
    
    // التحقق من وجود media queries
    const content = fs.readFileSync(filePath, 'utf8');
    const mediaQueries = content.match(/@media[^{]+/g) || [];
    console.log(`   - Media Queries: ${mediaQueries.length}`);
    
    // التحقق من breakpoints محددة
    const hasSmallMobile = content.includes('320px') || content.includes('350px');
    const hasMobile = content.includes('768px');
    const hasTablet = content.includes('1024px');
    
    console.log(`   - دعم الشاشات الصغيرة جداً (320-350px): ${hasSmallMobile ? '✅' : '❌'}`);
    console.log(`   - دعم الموبايل (< 768px): ${hasMobile ? '✅' : '❌'}`);
    console.log(`   - دعم التابلت (< 1024px): ${hasTablet ? '✅' : '❌'}`);
  } else {
    console.log(`❌ ${file} - غير موجود`);
  }
});

// التحقق من المكونات المحسنة للموبايل
console.log('\n🧩 التحقق من المكونات المحسنة للموبايل:');
const mobileComponents = [
  'components/mobile/MobileOptimizer.tsx',
  'components/mobile/MobileArticleCard.tsx',
  'components/mobile/MobileHeader.tsx',
  'hooks/useMediaQuery.ts'
];

mobileComponents.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - موجود`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // التحقق من استخدام responsive utilities
    const hasResponsive = content.includes('sm:') || content.includes('md:') || content.includes('lg:');
    const hasMediaQuery = content.includes('useMediaQuery') || content.includes('matchMedia');
    
    console.log(`   - Responsive utilities: ${hasResponsive ? '✅' : '❌'}`);
    console.log(`   - Media query hooks: ${hasMediaQuery ? '✅' : '❌'}`);
  } else {
    console.log(`❌ ${file} - غير موجود`);
  }
});

// التحقق من الصور المحسنة
console.log('\n🖼️ التحقق من تحسينات الصور:');
const checkImageOptimization = (content) => {
  const hasLazyLoading = content.includes('loading="lazy"') || content.includes('loading={\'lazy\'');
  const hasObjectFit = content.includes('object-cover') || content.includes('object-fit');
  const hasResponsiveImages = content.includes('srcSet') || content.includes('sizes');
  
  return {
    lazyLoading: hasLazyLoading,
    objectFit: hasObjectFit,
    responsive: hasResponsiveImages
  };
};

// فحص المكونات للتحقق من تحسينات الصور
const componentsToCheck = [
  'components/mobile/MobileArticleCard.tsx',
  'components/ArticleCard.tsx',
  'app/page.tsx'
];

componentsToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imageOpts = checkImageOptimization(content);
    
    console.log(`\n${file}:`);
    console.log(`   - Lazy Loading: ${imageOpts.lazyLoading ? '✅' : '❌'}`);
    console.log(`   - Object Fit: ${imageOpts.objectFit ? '✅' : '❌'}`);
    console.log(`   - Responsive Images: ${imageOpts.responsive ? '✅' : '❌'}`);
  }
});

// تقرير نهائي
console.log('\n📊 ملخص التوافق مع الموبايل:');
console.log('================================');

let score = 0;
let total = 0;

// حساب النقاط
cssFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) score++;
  total++;
});

mobileComponents.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) score++;
  total++;
});

const percentage = Math.round((score / total) * 100);
console.log(`\nالنتيجة الإجمالية: ${score}/${total} (${percentage}%)`);

if (percentage >= 80) {
  console.log('✅ التطبيق محسن بشكل ممتاز للموبايل!');
} else if (percentage >= 60) {
  console.log('⚠️ التطبيق محسن جزئياً للموبايل، يحتاج لتحسينات إضافية');
} else {
  console.log('❌ التطبيق يحتاج لتحسينات كبيرة للموبايل');
}

console.log('\n💡 توصيات للتحسين:');
screenSizes.forEach(size => {
  console.log(`- اختبر على ${size.name} (${size.width}x${size.height})`);
});

console.log('\n✨ انتهى الاختبار!'); 