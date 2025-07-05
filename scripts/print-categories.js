const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  const cats = await prisma.category.findMany({});
  console.log(cats.map(c => ({ order: c.displayOrder, slug: c.slug, id: c.id })));
  await prisma.$disconnect();
})(); 