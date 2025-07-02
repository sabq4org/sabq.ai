const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

const categories = [
  // شخصيات
  {
    name: 'شخصيات',
    slug: 'people',
    type: 'person',
    icon: '👤',
    children: [
      { name: 'ملوك وأمراء', slug: 'royalty', type: 'person', icon: '👑' },
      { name: 'وزراء', slug: 'ministers', type: 'person', icon: '🏛️' },
      { name: 'مسؤولون', slug: 'officials', type: 'person', icon: '💼' },
      { name: 'رياضيون', slug: 'athletes', type: 'person', icon: '⚽' },
      { name: 'فنانون', slug: 'artists', type: 'person', icon: '🎭' }
    ]
  },
  // جهات ومؤسسات
  {
    name: 'جهات ومؤسسات',
    slug: 'organizations',
    type: 'organization',
    icon: '🏢',
    children: [
      { name: 'وزارات', slug: 'ministries', type: 'organization', icon: '🏛️' },
      { name: 'هيئات', slug: 'authorities', type: 'organization', icon: '🏦' },
      { name: 'مؤسسات', slug: 'institutions', type: 'organization', icon: '🏢' },
      { name: 'جامعات', slug: 'universities', type: 'organization', icon: '🎓' },
      { name: 'شركات', slug: 'companies', type: 'organization', icon: '🏭' }
    ]
  },
  // أماكن
  {
    name: 'أماكن',
    slug: 'places',
    type: 'place',
    icon: '📍',
    children: [
      { name: 'مباني حكومية', slug: 'government-buildings', type: 'place', icon: '🏛️' },
      { name: 'معالم سياحية', slug: 'landmarks', type: 'place', icon: '🗿' },
      { name: 'قاعات ومراكز', slug: 'venues', type: 'place', icon: '🏟️' },
      { name: 'مساجد', slug: 'mosques', type: 'place', icon: '🕌' },
      { name: 'مدن ومناطق', slug: 'cities', type: 'place', icon: '🏙️' }
    ]
  },
  // مناسبات وأحداث
  {
    name: 'مناسبات وأحداث',
    slug: 'events',
    type: 'event',
    icon: '📅',
    children: [
      { name: 'مؤتمرات', slug: 'conferences', type: 'event', icon: '🎤' },
      { name: 'احتفالات وطنية', slug: 'national-celebrations', type: 'event', icon: '🎉' },
      { name: 'رمضان والحج', slug: 'religious-events', type: 'event', icon: '🕋' },
      { name: 'بطولات رياضية', slug: 'sports-events', type: 'event', icon: '🏆' },
      { name: 'معارض', slug: 'exhibitions', type: 'event', icon: '🎪' }
    ]
  }
];

async function seedCategories() {
  console.log('🌱 بدء إضافة تصنيفات الوسائط...');
  
  try {
    for (const parentCategory of categories) {
      const { children, ...parentData } = parentCategory;
      
      // إنشاء التصنيف الرئيسي
      const parent = await prisma.mediaCategory.upsert({
        where: { slug: parentData.slug },
        update: {},
        create: parentData
      });
      
      console.log(`✅ تم إضافة تصنيف رئيسي: ${parent.name}`);
      
      // إنشاء التصنيفات الفرعية
      if (children) {
        for (const childData of children) {
          await prisma.mediaCategory.upsert({
            where: { slug: childData.slug },
            update: {},
            create: {
              ...childData,
              parentId: parent.id
            }
          });
          console.log(`  ✅ تم إضافة تصنيف فرعي: ${childData.name}`);
        }
      }
    }
    
    console.log('\n✨ تمت إضافة جميع التصنيفات بنجاح!');
    
    // عرض إحصائيات
    const totalCategories = await prisma.mediaCategory.count();
    console.log(`\n📊 إجمالي التصنيفات: ${totalCategories}`);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة التصنيفات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories(); 