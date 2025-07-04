const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function deleteTestDose(doseId) {
  try {
    console.log('🗑️ حذف محتويات الجرعة...')
    await prisma.doseContent.deleteMany({ where: { doseId } })
    console.log('🗑️ حذف الجرعة نفسها...')
    await prisma.dailyDose.delete({ where: { id: doseId } })
    console.log('✅ تم حذف الجرعة والمحتويات بنجاح')
  } catch (error) {
    console.error('❌ خطأ في الحذف:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

deleteTestDose('3b4e915a-926a-42d3-b9fb-4da3704fac6e') 