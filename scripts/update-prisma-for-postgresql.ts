#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

async function updatePrismaForPostgreSQL() {
  console.log('🔧 تحديث Prisma Schema لـ PostgreSQL...\n')
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  
  try {
    // قراءة الملف الحالي
    let schemaContent = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 قراءة Prisma Schema...')
    
    // تحديث datasource
    schemaContent = schemaContent.replace(
      /datasource db \{[^}]*\}/s,
      `datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")
  directUrl    = env("DIRECT_URL")
}`
    )
    
    console.log('✅ تم تحديث datasource')
    
    // تحديث أنواع البيانات من MySQL إلى PostgreSQL
    const replacements = [
      // LongText -> Text
      { from: '@db.LongText', to: '@db.Text' },
      // VarChar -> VarChar (نحتفظ به)
      // Decimal -> Decimal (نحتفظ به)
      // Text -> Text (نحتفظ به)
    ]
    
    for (const replacement of replacements) {
      const regex = new RegExp(replacement.from, 'g')
      const matches = schemaContent.match(regex)
      if (matches) {
        schemaContent = schemaContent.replace(regex, replacement.to)
        console.log(`✅ تم تحديث ${matches.length} من ${replacement.from} إلى ${replacement.to}`)
      }
    }
    
    // إنشاء نسخة احتياطية
    const backupPath = path.join(process.cwd(), 'prisma', 'schema-mysql-backup.prisma')
    fs.writeFileSync(backupPath, fs.readFileSync(schemaPath, 'utf8'), 'utf8')
    console.log(`📦 تم إنشاء نسخة احتياطية: ${backupPath}`)
    
    // حفظ التحديثات
    fs.writeFileSync(schemaPath, schemaContent, 'utf8')
    console.log('💾 تم حفظ التحديثات')
    
    console.log('\n✅ تم تحديث Prisma Schema لـ PostgreSQL بنجاح!')
    console.log('\n📋 التغييرات المطبقة:')
    console.log('- provider: mysql → postgresql')
    console.log('- إضافة directUrl للاتصال المباشر')
    console.log('- تحديث أنواع البيانات المتوافقة')
    
    return true
    
  } catch (error) {
    console.error('❌ فشل في تحديث Prisma Schema:', error)
    throw error
  }
}

// تشغيل التحديث إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  updatePrismaForPostgreSQL()
    .then(() => {
      console.log('\n🎉 تم تحديث Prisma Schema بنجاح!')
      console.log('\n🚀 الخطوة التالية:')
      console.log('npx prisma generate')
      console.log('npx prisma db push')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في تحديث Prisma Schema:', error)
      process.exit(1)
    })
}

export { updatePrismaForPostgreSQL } 