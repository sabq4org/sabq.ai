const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function checkDose() {
  const doses = await prisma.dailyDose.findMany({
    where: {
      period: 'afternoon',
      date: new Date('2024-12-19')
    }
  })
  console.log('جرعات afternoon 2024-12-19:', doses)
  await prisma.$disconnect()
}

checkDose() 