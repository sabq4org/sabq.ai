const fs = require('fs');
const path = require('path');

// قائمة الصور الافتراضية التي نحتاج لإنشائها
const defaultImages = [
  // تقنية
  { name: 'tech-default.jpg', category: 'تقنية', description: 'صورة عامة للتقنية' },
  { name: 'ai-technology.jpg', category: 'تقنية', description: 'الذكاء الاصطناعي' },
  { name: 'tech-health.jpg', category: 'تقنية', description: 'التقنية في الصحة' },
  { name: 'tech-innovation.jpg', category: 'تقنية', description: 'الابتكار التقني' },
  
  // رياضة
  { name: 'sports-default.jpg', category: 'رياضة', description: 'صورة عامة للرياضة' },
  { name: 'football-stadium.jpg', category: 'رياضة', description: 'ملعب كرة القدم' },
  { name: 'hilal-logo.jpg', category: 'رياضة', description: 'شعار الهلال' },
  { name: 'nassr-logo.jpg', category: 'رياضة', description: 'شعار النصر' },
  { name: 'asian-champions.jpg', category: 'رياضة', description: 'دوري أبطال آسيا' },
  
  // اقتصاد
  { name: 'economy-default.jpg', category: 'اقتصاد', description: 'صورة عامة للاقتصاد' },
  { name: 'aramco-building.jpg', category: 'اقتصاد', description: 'مبنى أرامكو' },
  { name: 'oil-industry.jpg', category: 'اقتصاد', description: 'صناعة النفط' },
  { name: 'stock-market.jpg', category: 'اقتصاد', description: 'سوق الأسهم' },
  
  // سياسة
  { name: 'politics-default.jpg', category: 'سياسة', description: 'صورة عامة للسياسة' },
  { name: 'arab-summit.jpg', category: 'سياسة', description: 'القمة العربية' },
  { name: 'international-relations.jpg', category: 'سياسة', description: 'العلاقات الدولية' },
  { name: 'gaza-palestine.jpg', category: 'سياسة', description: 'غزة وفلسطين' },
  { name: 'trump-politics.jpg', category: 'سياسة', description: 'ترامب والسياسة' },
  
  // محليات
  { name: 'local-default.jpg', category: 'محليات', description: 'صورة عامة للمحليات' },
  { name: 'riyadh-city.jpg', category: 'محليات', description: 'مدينة الرياض' },
  { name: 'entertainment-complex.jpg', category: 'محليات', description: 'مجمع ترفيهي' },
  { name: 'saudi-tourism.jpg', category: 'محليات', description: 'السياحة السعودية' },
  { name: 'security-forces.jpg', category: 'محليات', description: 'قوات الأمن' },
  
  // ثقافة ومجتمع
  { name: 'culture-default.jpg', category: 'ثقافة ومجتمع', description: 'صورة عامة للثقافة' },
  { name: 'cultural-festival.jpg', category: 'ثقافة ومجتمع', description: 'مهرجان ثقافي' },
  { name: 'saudi-heritage.jpg', category: 'ثقافة ومجتمع', description: 'التراث السعودي' },
  
  // صحة
  { name: 'health-default.jpg', category: 'صحة', description: 'صورة عامة للصحة' },
  { name: 'sleep-health.jpg', category: 'صحة', description: 'صحة النوم' },
  { name: 'medical-research.jpg', category: 'صحة', description: 'البحث الطبي' }
];

// إنشاء ملف SVG كصورة افتراضية
function createSVGImage(text, category, filename) {
  const colors = {
    'تقنية': { bg: '#3B82F6', text: '#FFFFFF' },
    'رياضة': { bg: '#10B981', text: '#FFFFFF' },
    'اقتصاد': { bg: '#F59E0B', text: '#FFFFFF' },
    'سياسة': { bg: '#EF4444', text: '#FFFFFF' },
    'محليات': { bg: '#8B5CF6', text: '#FFFFFF' },
    'ثقافة ومجتمع': { bg: '#06B6D4', text: '#FFFFFF' },
    'صحة': { bg: '#EC4899', text: '#FFFFFF' }
  };
  
  const color = colors[category] || colors['محليات'];
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color.bg}CC;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad1)"/>
  <circle cx="400" cy="200" r="80" fill="${color.text}22" />
  <circle cx="400" cy="200" r="60" fill="${color.text}33" />
  <circle cx="400" cy="200" r="40" fill="${color.text}44" />
  <text x="400" y="380" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="${color.text}">${text}</text>
  <text x="400" y="420" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="${color.text}CC">صحيفة سبق الإلكترونية</text>
  <rect x="50" y="50" width="700" height="500" fill="none" stroke="${color.text}22" stroke-width="2" rx="20"/>
</svg>`;

  return svg;
}

// إنشاء مجلد الصور إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, '../public/uploads/featured');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('🎨 بدء إنشاء الصور الافتراضية...');

let createdCount = 0;

// إنشاء كل صورة
defaultImages.forEach(image => {
  const imagePath = path.join(uploadsDir, image.name);
  
  // التحقق من وجود الصورة
  if (!fs.existsSync(imagePath)) {
    // إنشاء صورة SVG
    const svgContent = createSVGImage(image.description, image.category, image.name);
    
    // حفظ الصورة كـ SVG
    const svgPath = imagePath.replace('.jpg', '.svg');
    fs.writeFileSync(svgPath, svgContent, 'utf8');
    
    // إنشاء نسخة JPG رمزية (في الواقع ستكون SVG)
    fs.writeFileSync(imagePath, svgContent, 'utf8');
    
    createdCount++;
    console.log(`✅ تم إنشاء: ${image.name} - ${image.description}`);
  } else {
    console.log(`⏭️ موجودة مسبقاً: ${image.name}`);
  }
});

// إنشاء تقرير
const reportPath = path.join(__dirname, '../reports/default-images-report.json');
const reportDir = path.dirname(reportPath);

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  total_images_needed: defaultImages.length,
  created_images_count: createdCount,
  images_by_category: {
    'تقنية': defaultImages.filter(img => img.category === 'تقنية').length,
    'رياضة': defaultImages.filter(img => img.category === 'رياضة').length,
    'اقتصاد': defaultImages.filter(img => img.category === 'اقتصاد').length,
    'سياسة': defaultImages.filter(img => img.category === 'سياسة').length,
    'محليات': defaultImages.filter(img => img.category === 'محليات').length,
    'ثقافة ومجتمع': defaultImages.filter(img => img.category === 'ثقافة ومجتمع').length,
    'صحة': defaultImages.filter(img => img.category === 'صحة').length
  },
  created_images: defaultImages.map(img => ({
    name: img.name,
    category: img.category,
    description: img.description,
    path: `/uploads/featured/${img.name}`
  }))
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('\n✅ تم الانتهاء من إنشاء الصور الافتراضية');
console.log(`📊 إجمالي الصور المطلوبة: ${defaultImages.length}`);
console.log(`🖼️ عدد الصور التي تم إنشاؤها: ${createdCount}`);
console.log(`📁 تم حفظ التقرير في: ${reportPath}`);
console.log(`📂 مسار الصور: ${uploadsDir}`);

console.log('\n📋 ملخص الصور حسب التصنيف:');
Object.entries(report.images_by_category).forEach(([category, count]) => {
  console.log(`   ${category}: ${count} صورة`);
});

console.log('\n💡 ملاحظة: تم إنشاء الصور كملفات SVG مؤقتة. يُنصح بإضافة صور حقيقية لاحقاً لتحسين جودة العرض.'); 