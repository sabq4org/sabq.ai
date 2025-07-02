const fs = require('fs');
const path = require('path');

// SVG placeholder بسيط
const createPlaceholderSVG = (text) => `
<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#e5e7eb"/>
  <text x="400" y="225" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>
`;

// إنشاء الصور
const articlesDir = path.join(__dirname, '../public/images/articles');
const imagesDir = path.join(__dirname, '../public/images');

// التأكد من وجود المجلدات
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}

// إنشاء صور المقالات
for (let i = 1; i <= 10; i++) {
  const svg = createPlaceholderSVG(`صورة المقال ${i}`);
  const filename = path.join(articlesDir, `article-${i}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ تم إنشاء: ${filename}`);
}

// إنشاء صورة placeholder عامة
const placeholderSVG = createPlaceholderSVG('صورة مؤقتة');
fs.writeFileSync(path.join(imagesDir, 'placeholder.svg'), placeholderSVG);
console.log(`✅ تم إنشاء: ${path.join(imagesDir, 'placeholder.svg')}`);

console.log('\n✨ تم إنشاء جميع الصور المؤقتة بنجاح!'); 