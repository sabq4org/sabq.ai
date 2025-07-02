import { prisma } from '../lib/prisma';

async function main() {
  const categories = [
    {
      name: 'تقنية',
      description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
      slug: 'technology',
      color: '#8B5CF6',
      icon: '💻',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'رياضة',
      description: 'أخبار رياضية محلية وعالمية',
      slug: 'sports',
      color: '#F59E0B',
      icon: '⚽',
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'اقتصاد',
      description: 'تقارير السوق والمال والأعمال والطاقة',
      slug: 'economy',
      color: '#10B981',
      icon: '💰',
      displayOrder: 3,
      isActive: true,
    },
    {
      name: 'سياسة',
      description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
      slug: 'politics',
      color: '#EF4444',
      icon: '🏛️',
      displayOrder: 4,
      isActive: true,
    },
    {
      name: 'محليات',
      description: 'أخبار المناطق والمدن السعودية',
      slug: 'local',
      color: '#3B82F6',
      icon: '🗺️',
      displayOrder: 5,
      isActive: true,
    },
    {
      name: 'ثقافة ومجتمع',
      description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
      slug: 'culture',
      color: '#EC4899',
      icon: '🎭',
      displayOrder: 6,
      isActive: true,
    },
    {
      name: 'مقالات رأي',
      description: 'تحليلات ووجهات نظر كتاب الرأي',
      slug: 'opinion',
      color: '#7C3AED',
      icon: '✍️',
      displayOrder: 7,
      isActive: true,
    },
    {
      name: 'منوعات',
      description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
      slug: 'misc',
      color: '#6B7280',
      icon: '🎉',
      displayOrder: 8,
      isActive: true,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  console.log('✅ تم إدراج التصنيفات بنجاح في قاعدة البيانات البعيدة');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 