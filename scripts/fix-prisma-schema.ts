#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

async function fixPrismaSchema() {
  console.log('🔧 إصلاح Prisma Schema لـ PostgreSQL...\n')
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  
  try {
    // قراءة الملف الحالي
    let schemaContent = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 قراءة Prisma Schema...')
    
    // 1. إصلاح أنواع DateTime
    console.log('🕐 إصلاح أنواع DateTime...')
    schemaContent = schemaContent.replace(/@db\.DateTime\(\d+\)/g, '')
    
    // 2. إصلاح أسماء الفهارس المكررة
    console.log('📊 إصلاح أسماء الفهارس...')
    
    // إنشاء أسماء فريدة للفهارس
    const indexMap = new Map()
    let indexCounter = 1
    
    schemaContent = schemaContent.replace(
      /@@index\(\[([^\]]+)\], map: "([^"]+)"\)/g,
      (match, columns, mapName) => {
        if (indexMap.has(mapName)) {
          const newName = `${mapName}_${indexCounter++}`
          indexMap.set(mapName, newName)
          return `@@index([${columns}], map: "${newName}")`
        } else {
          indexMap.set(mapName, mapName)
          return match
        }
      }
    )
    
    // 3. إزالة map من الفهارس التي لا تحتاجها
    schemaContent = schemaContent.replace(/@@index\(\[([^\]]+)\], map: "([^"]+)"\)/g, '@@index([$1])')
    
    // 4. إصلاح unique constraints
    schemaContent = schemaContent.replace(/@@unique\(\[([^\]]+)\], map: "([^"]+)"\)/g, '@@unique([$1])')
    
    // 5. إنشاء نسخة احتياطية
    const backupPath = path.join(process.cwd(), 'prisma', 'schema-fixed-backup.prisma')
    fs.writeFileSync(backupPath, fs.readFileSync(schemaPath, 'utf8'), 'utf8')
    console.log(`📦 تم إنشاء نسخة احتياطية: ${backupPath}`)
    
    // 6. حفظ التحديثات
    fs.writeFileSync(schemaPath, schemaContent, 'utf8')
    console.log('💾 تم حفظ التحديثات')
    
    console.log('\n✅ تم إصلاح Prisma Schema بنجاح!')
    console.log('\n📋 التغييرات المطبقة:')
    console.log('- إزالة @db.DateTime(0) غير المدعوم')
    console.log('- إصلاح أسماء الفهارس المكررة')
    console.log('- إزالة map من الفهارس والـ unique constraints')
    
    return true
    
  } catch (error) {
    console.error('❌ فشل في إصلاح Prisma Schema:', error)
    throw error
  }
}

// تشغيل الإصلاح إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  fixPrismaSchema()
    .then(() => {
      console.log('\n🎉 تم إصلاح Prisma Schema بنجاح!')
      console.log('\n🚀 الخطوة التالية:')
      console.log('npx prisma generate')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في إصلاح Prisma Schema:', error)
      process.exit(1)
    })
}

export { fixPrismaSchema } 