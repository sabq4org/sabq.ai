import { prisma } from '../lib/prisma';

async function testCategories() {
  try {
    console.log('Testing categories API...');
    
    // Test database connection
    console.log('Testing database connection...');
    const count = await prisma.category.count();
    console.log(`Found ${count} categories in database`);
    
    // Try to create a category
    console.log('\nTrying to create a new category...');
    const timestamp = Date.now();
    const newCategory = await prisma.category.create({
      data: {
        name: 'رياضة ' + timestamp,
        nameEn: 'Sports ' + timestamp,
        slug: 'sports-' + timestamp,
        description: 'أخبار الرياضة المحلية والعالمية',
        color: '#FFA500',
        icon: '⚽',
        displayOrder: 1,
        isActive: true,
        metadata: {}
      }
    });
    
    console.log('Category created successfully:', newCategory);
    
    // List all categories
    console.log('\nListing all categories:');
    const categories = await prisma.category.findMany();
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories(); 