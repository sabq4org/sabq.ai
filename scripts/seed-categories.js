require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

const newCategories = [
  {
    name: 'تقنية',
    nameEn: 'Technology',
    description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
    slug: 'technology',
    color: '#8B5CF6',
    icon: '💻',
    displayOrder: 1,
    isActive: true,
  },
  {
    name: 'رياضة',
    nameEn: 'Sports',
    description: 'أخبار رياضية محلية وعالمية',
    slug: 'sports',
    color: '#F59E0B',
    icon: '⚽',
    displayOrder: 2,
    isActive: true,
  },
  {
    name: 'اقتصاد',
    nameEn: 'Economy',
    description: 'تقارير السوق والمال والأعمال والطاقة',
    slug: 'economy',
    color: '#10B981',
    icon: '💰',
    displayOrder: 3,
    isActive: true,
  },
  {
    name: 'سياسة',
    nameEn: 'Politics',
    description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
    slug: 'politics',
    color: '#EF4444',
    icon: '🏛️',
    displayOrder: 4,
    isActive: true,
  },
  {
    name: 'محليات',
    nameEn: 'Local',
    description: 'أخبار المناطق والمدن السعودية',
    slug: 'local',
    color: '#3B82F6',
    icon: '🗺️',
    displayOrder: 5,
    isActive: true,
  },
  {
    name: 'ثقافة ومجتمع',
    nameEn: 'Culture',
    description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
    slug: 'culture',
    color: '#EC4899',
    icon: '🎭',
    displayOrder: 6,
    isActive: true,
  },
  {
    name: 'مقالات رأي',
    nameEn: 'Opinion',
    description: 'تحليلات ووجهات نظر كتاب الرأي',
    slug: 'opinion',
    color: '#7C3AED',
    icon: '✍️',
    displayOrder: 7,
    isActive: true,
  },
  {
    name: 'منوعات',
    nameEn: 'Misc',
    description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
    slug: 'misc',
    color: '#6B7280',
    icon: '🎉',
    displayOrder: 8,
    isActive: true,
  },
];

async function main() {
  console.log('🚀 بدء عملية تحديث التصنيفات...');

  // حذف جميع التصنيفات الحالية
  console.log('🗑️ جارٍ حذف التصنيفات القديمة...');
  await prisma.article.updateMany({ data: { categoryId: null } }); // إزالة الربط من المقالات
  await prisma.category.deleteMany({});
  console.log('✅ تم حذف التصنيفات القديمة بنجاح.');

  // إضافة التصنيفات الجديدة
  console.log('✨ جارٍ إضافة التصنيفات الجديدة...');
  for (const category of newCategories) {
    await prisma.category.create({
      data: category,
    });
    console.log(`- تمت إضافة: ${category.name}`);
  }
  console.log('✅ تمت إضافة جميع التصنيفات الجديدة بنجاح!');

  console.log('🎉 عملية تحديث التصنيفات اكتملت بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ حدث خطأ أثناء تحديث التصنيفات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 