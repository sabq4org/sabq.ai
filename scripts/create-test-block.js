const fs = require('fs');
const path = require('path');

console.log('🔧 إنشاء بلوك تجريبي للموقع الجديد...');

const BLOCKS_FILE = path.join(__dirname, '..', 'data', 'smart_blocks.json');

// قراءة البلوكات الحالية
let blocks = [];
try {
  const data = fs.readFileSync(BLOCKS_FILE, 'utf-8');
  blocks = JSON.parse(data);
} catch (error) {
  console.log('إنشاء ملف جديد للبلوكات...');
  blocks = [];
}

// إضافة بلوك تجريبي للموقع الجديد
const newBlock = {
  id: `test-block-${Date.now()}`,
  name: "بلوك تجريبي - أسفل الهيدر",
  position: "below_header",
  type: "smart",
  status: "active",
  displayType: "hero-slider",
  keywords: ["تجريبي", "اختبار", "جديد"],
  category: "",
  articlesCount: 3,
  theme: {
    primaryColor: "#00a3d7",
    backgroundColor: "#e5effa",
    textColor: "#1a1a1a"
  },
  customHtml: "",
  schedule: {
    startDate: "",
    endDate: "",
    isAlwaysActive: true
  },
  order: blocks.length + 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// إضافة البلوك الجديد
blocks.push(newBlock);

// حفظ الملف
fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blocks, null, 2), 'utf8');

console.log('✅ تم إنشاء البلوك التجريبي بنجاح');
console.log(`📍 الموقع: ${newBlock.position}`);
console.log(`🆔 ID: ${newBlock.id}`);
console.log(`📝 الاسم: ${newBlock.name}`); 