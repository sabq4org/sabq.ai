#!/usr/bin/env tsx

import { Client } from 'pg'

async function testSupabaseConnection() {
  console.log('🔌 اختبار الاتصال بـ Supabase بطرق مختلفة...\n')
  
  const connectionStrings = [
    // الطريقة الأولى: Connection String الأصلي
    {
      name: 'Connection String الأصلي',
      url: 'postgresql://postgres:pedqef-Bagpyd-5midgy@db.icltugehqnpwuylfmqzf.supabase.co:5432/postgres'
    },
    // الطريقة الثانية: بدون كلمة مرور
    {
      name: 'بدون كلمة مرور',
      url: 'postgresql://postgres@db.icltugehqnpwuylfmqzf.supabase.co:5432/postgres'
    },
    // الطريقة الثالثة: مع كلمة مرور مختلفة
    {
      name: 'كلمة مرور بديلة',
      url: 'postgresql://postgres:SabqAI2024!@#@db.icltugehqnpwuylfmqzf.supabase.co:5432/postgres'
    }
  ]
  
  for (const connection of connectionStrings) {
    console.log(`🧪 اختبار: ${connection.name}`)
    console.log(`🔗 URL: ${connection.url.replace(/:[^:@]*@/, ':****@')}`)
    
    try {
      const client = new Client({
        connectionString: connection.url,
        ssl: {
          rejectUnauthorized: false
        }
      })
      
      const startTime = Date.now()
      await client.connect()
      const endTime = Date.now()
      
      console.log(`✅ نجح الاتصال! الوقت: ${endTime - startTime}ms`)
      
      // اختبار استعلام بسيط
      const result = await client.query('SELECT version()')
      console.log(`📊 إصدار PostgreSQL: ${result.rows[0].version.split(' ')[0]}`)
      
      await client.end()
      console.log('✅ تم إغلاق الاتصال بنجاح\n')
      
      // إذا نجح هذا الاتصال، استخدمه
      console.log('🎉 تم العثور على اتصال صالح!')
      console.log(`📝 استخدم هذا الـ URL: ${connection.url}`)
      return connection.url
      
    } catch (error) {
      console.log(`❌ فشل الاتصال: ${error.message}\n`)
    }
  }
  
  console.log('❌ جميع محاولات الاتصال فشلت')
  console.log('\n🔧 الحلول المقترحة:')
  console.log('1. تحقق من كلمة المرور في Supabase Dashboard')
  console.log('2. تأكد من أن المشروع نشط')
  console.log('3. أنشئ مشروع جديد بكلمة مرور واضحة')
  
  return null
}

// تشغيل الاختبار إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  testSupabaseConnection()
    .then((workingUrl) => {
      if (workingUrl) {
        console.log('\n🚀 يمكنك الآن استخدام هذا الـ URL في ملف .env')
        console.log(`DATABASE_URL="${workingUrl}"`)
        console.log(`DIRECT_URL="${workingUrl}"`)
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في اختبار الاتصال:', error)
      process.exit(1)
    })
}

export { testSupabaseConnection } 