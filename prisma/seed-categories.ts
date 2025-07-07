import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const categories = [
    {
      name: 'تقنية',
      description: 'أخبار وتطورات التقنية والذكاء الاصطناعي',
      slug: 'technology',
      color: '#8B5CF6',
      icon: '💻',
      display_order: 1,
      is_active: true,
    },
    {
      name: 'رياضة',
      description: 'أخبار رياضية محلية وعالمية',
      slug: 'sports',
      color: '#F59E0B',
      icon: '⚽',
      display_order: 2,
      is_active: true,
    },
    {
      name: 'اقتصاد',
      description: 'تقارير السوق والمال والأعمال والطاقة',
      slug: 'economy',
      color: '#10B981',
      icon: '💰',
      display_order: 3,
      is_active: true,
    },
    {
      name: 'سياسة',
      description: 'مستجدات السياسة المحلية والدولية وتحليلاتها',
      slug: 'politics',
      color: '#EF4444',
      icon: '🏛️',
      display_order: 4,
      is_active: true,
    },
    {
      name: 'محليات',
      description: 'أخبار المناطق والمدن السعودية',
      slug: 'local',
      color: '#3B82F6',
      icon: '🗺️',
      display_order: 5,
      is_active: true,
    },
    {
      name: 'ثقافة ومجتمع',
      description: 'فعاليات ثقافية، مناسبات، قضايا اجتماعية',
      slug: 'culture',
      color: '#EC4899',
      icon: '🎭',
      display_order: 6,
      is_active: true,
    },
    {
      name: 'مقالات رأي',
      description: 'تحليلات ووجهات نظر كتاب الرأي',
      slug: 'opinion',
      color: '#7C3AED',
      icon: '✍️',
      display_order: 7,
      is_active: true,
    },
    {
      name: 'منوعات',
      description: 'أخبار خفيفة، لقطات، طرائف وأحداث غير تقليدية',
      slug: 'misc',
      color: '#6B7280',
      icon: '🎉',
      display_order: 8,
      is_active: true,
    },
  ];

  for (const cat of categories) {
    await prisma.categories.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        display_order: cat.display_order,
        is_active: cat.is_active,
        updated_at: new Date()
      },
      create: {
        id: uuidv4(),
        ...cat,
        created_at: new Date(),
        updated_at: new Date()
      },
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