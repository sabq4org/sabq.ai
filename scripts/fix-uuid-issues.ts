#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

async function fixUuidIssues() {
  console.log('🔧 إصلاح مشاكل uuid في Prisma Schema...\n')
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  
  try {
    // قراءة الملف الحالي
    let schemaContent = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 قراءة Prisma Schema...')
    
    // إصلاح جميع مشاكل uuid()
    console.log('🆔 إصلاح دالة uuid()...')
    
    // استبدال uuid() بـ cuid()
    const uuidMatches = schemaContent.match(/@default\(uuid\(\)\)/g)
    if (uuidMatches) {
      schemaContent = schemaContent.replace(/@default\(uuid\(\)\)/g, '@default(cuid())')
      console.log(`✅ تم إصلاح ${uuidMatches.length} من uuid() إلى cuid()`)
    }
    
    // إنشاء نسخة احتياطية
    const backupPath = path.join(process.cwd(), 'prisma', 'schema-uuid-fixed-backup.prisma')
    fs.writeFileSync(backupPath, fs.readFileSync(schemaPath, 'utf8'), 'utf8')
    console.log(`📦 تم إنشاء نسخة احتياطية: ${backupPath}`)
    
    // حفظ التحديثات
    fs.writeFileSync(schemaPath, schemaContent, 'utf8')
    console.log('💾 تم حفظ التحديثات')
    
    console.log('\n✅ تم إصلاح مشاكل uuid بنجاح!')
    console.log('\n📋 التغييرات المطبقة:')
    console.log('- استبدال uuid() بـ cuid()')
    console.log('- cuid() متوافق مع PostgreSQL')
    
    return true
    
  } catch (error) {
    console.error('❌ فشل في إصلاح مشاكل uuid:', error)
    throw error
  }
}

// تشغيل الإصلاح إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  fixUuidIssues()
    .then(() => {
      console.log('\n🎉 تم إصلاح مشاكل uuid بنجاح!')
      console.log('\n🚀 الخطوة التالية:')
      console.log('npx prisma generate')
      console.log('npx prisma db push')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في إصلاح مشاكل uuid:', error)
      process.exit(1)
    })
}

export { fixUuidIssues } 