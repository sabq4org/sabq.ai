const fs = require('fs');
const path = require('path');

console.log('🔍 فحص مشاكل CSS...\n');

// فحص ملفات CSS
const cssFiles = [
  'app/globals.css',
  'styles/custom-styles.css',
  'styles/fix-layout.css',
  'styles/jur3a-colors.css',
  'styles/soft-colors.css'
];

console.log('📋 فحص ملفات CSS:');
cssFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log(`❌ ${file} - غير موجود`);
  }
});

// فحص استيراد CSS في layout.tsx
console.log('\n📋 فحص استيرادات CSS في layout.tsx:');
const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const cssImports = layoutContent.match(/import\s+['"].*\.css['"]/g) || [];
  cssImports.forEach(imp => {
    console.log(`  ${imp}`);
  });
}

// فحص package.json
console.log('\n📋 فحص إعدادات PostCSS:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('  PostCSS:', packageJson.devDependencies?.postcss || 'غير مثبت');
  console.log('  Tailwind CSS:', packageJson.devDependencies?.tailwindcss || 'غير مثبت');
  console.log('  Autoprefixer:', packageJson.devDependencies?.autoprefixer || 'غير مثبت');
}

// فحص tailwind.config.js
console.log('\n📋 فحص إعدادات Tailwind:');
const tailwindPath = path.join(process.cwd(), 'tailwind.config.js');
if (fs.existsSync(tailwindPath)) {
  console.log('✅ tailwind.config.js موجود');
  const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
  if (tailwindContent.includes('darkMode')) {
    console.log('✅ إعدادات الوضع الليلي موجودة');
  }
} else {
  console.log('❌ tailwind.config.js غير موجود');
}

// فحص postcss.config.js
console.log('\n📋 فحص إعدادات PostCSS:');
const postcssPath = path.join(process.cwd(), 'postcss.config.js');
if (fs.existsSync(postcssPath)) {
  console.log('✅ postcss.config.js موجود');
} else {
  console.log('❌ postcss.config.js غير موجود');
}

console.log('\n✨ انتهى الفحص'); 