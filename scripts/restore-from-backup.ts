#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface BackupData {
  timestamp: string
  summary: {
    users: number
    articles: number
    categories: number
    interactions: number
    activityLogs: number
    keywords: number
    loyaltyPoints: number
    userPreferences: number
    messages: number
    roles: number
    deepAnalyses: number
    teamMembers: number
    templates: number
    smartBlocks: number
    total: number
  }
  data: {
    users: any[]
    articles: any[]
    categories: any[]
    interactions: any[]
    activityLogs: any[]
    keywords: any[]
    loyaltyPoints: any[]
    userPreferences: any[]
    messages: any[]
    roles: any[]
    deepAnalyses: any[]
    teamMembers: any[]
    templates: any[]
    smartBlocks: any[]
    emailVerificationCodes: any[]
    passwordResetTokens: any[]
    homeBlocksConfig: any[]
  }
}

async function restoreFromBackup(backupFilePath: string) {
  console.log('🔄 استعادة البيانات من النسخة الاحتياطية...\n')
  
  try {
    // التحقق من وجود الملف
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`ملف النسخة الاحتياطية غير موجود: ${backupFilePath}`)
    }
    
    // قراءة ملف النسخة الاحتياطية
    console.log('📖 قراءة ملف النسخة الاحتياطية...')
    const backupContent = fs.readFileSync(backupFilePath, 'utf8')
    const backupData: BackupData = JSON.parse(backupContent)
    
    console.log(`📅 تاريخ النسخة الاحتياطية: ${new Date(backupData.timestamp).toLocaleString('ar-SA')}`)
    console.log(`📊 إجمالي السجلات: ${backupData.summary.total}\n`)
    
    // تأكيد الاستعادة
    console.log('⚠️ تحذير: هذا سيمسح جميع البيانات الحالية ويستبدلها بالنسخة الاحتياطية!')
    
    // في البيئة غير التفاعلية أو عند تعيين المتغير، المتابعة مباشرة
    if (process.env.NON_INTERACTIVE === 'true' || !process.stdin.isTTY) {
      console.log('🔄 المتابعة في الوضع غير التفاعلي...')
      await performRestore(backupData)
    } else {
      console.log('هل تريد المتابعة؟ (اكتب "نعم" للمتابعة)')
      
      // في البيئة التفاعلية، انتظار تأكيد المستخدم
      process.stdin.setRawMode(false)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      
      return new Promise((resolve, reject) => {
        process.stdin.once('data', async (data) => {
          const input = data.toString().trim()
          if (input === 'نعم' || input === 'yes') {
            try {
              await performRestore(backupData)
              resolve(true)
            } catch (error) {
              reject(error)
            }
          } else {
            console.log('❌ تم إلغاء الاستعادة')
            resolve(false)
          }
        })
      })
    }
    
  } catch (error) {
    console.error('❌ فشل في استعادة البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function performRestore(backupData: BackupData) {
  console.log('🚀 بدء استعادة البيانات...\n')
  
  try {
    // مسح البيانات الحالية
    console.log('🗑️ مسح البيانات الحالية...')
    await prisma.$transaction([
      prisma.interactions.deleteMany(),
      prisma.activity_logs.deleteMany(),
      prisma.loyalty_points.deleteMany(),
      prisma.user_preferences.deleteMany(),
      prisma.messages.deleteMany(),
      prisma.roles.deleteMany(),
      prisma.deep_analyses.deleteMany(),
      prisma.team_members.deleteMany(),
      prisma.templates.deleteMany(),
      prisma.smart_blocks.deleteMany(),
      prisma.email_verification_codes.deleteMany(),
      prisma.password_reset_tokens.deleteMany(),
      prisma.home_blocks_config.deleteMany(),
      prisma.articles.deleteMany(),
      prisma.categories.deleteMany(),
      prisma.keywords.deleteMany(),
      prisma.users.deleteMany()
    ])
    console.log('✅ تم مسح البيانات الحالية\n')
    
    // استعادة البيانات بالترتيب الصحيح
    console.log('📥 استعادة البيانات...')
    
    // 1. المستخدمون (الأولوية الأولى)
    if (backupData.data.users.length > 0) {
      console.log(`👥 استعادة ${backupData.data.users.length} مستخدم...`)
      await prisma.users.createMany({
        data: backupData.data.users,
        skipDuplicates: true
      })
    }
    
    // 2. التصنيفات
    if (backupData.data.categories.length > 0) {
      console.log(`🏷️ استعادة ${backupData.data.categories.length} تصنيف...`)
      await prisma.categories.createMany({
        data: backupData.data.categories,
        skipDuplicates: true
      })
    }
    
    // 3. الكلمات المفتاحية
    if (backupData.data.keywords.length > 0) {
      console.log(`🔑 استعادة ${backupData.data.keywords.length} كلمة مفتاحية...`)
      await prisma.keywords.createMany({
        data: backupData.data.keywords,
        skipDuplicates: true
      })
    }
    
    // 4. المقالات
    if (backupData.data.articles.length > 0) {
      console.log(`📰 استعادة ${backupData.data.articles.length} مقال...`)
      await prisma.articles.createMany({
        data: backupData.data.articles,
        skipDuplicates: true
      })
    }
    
    // 5. التفاعلات
    if (backupData.data.interactions.length > 0) {
      console.log(`💬 استعادة ${backupData.data.interactions.length} تفاعل...`)
      await prisma.interactions.createMany({
        data: backupData.data.interactions,
        skipDuplicates: true
      })
    }
    
    // 6. سجلات الأنشطة
    if (backupData.data.activityLogs.length > 0) {
      console.log(`📝 استعادة ${backupData.data.activityLogs.length} سجل نشاط...`)
      await prisma.activity_logs.createMany({
        data: backupData.data.activityLogs,
        skipDuplicates: true
      })
    }
    
    // 7. نقاط الولاء
    if (backupData.data.loyaltyPoints.length > 0) {
      console.log(`⭐ استعادة ${backupData.data.loyaltyPoints.length} نقطة ولاء...`)
      await prisma.loyalty_points.createMany({
        data: backupData.data.loyaltyPoints,
        skipDuplicates: true
      })
    }
    
    // 8. تفضيلات المستخدمين
    if (backupData.data.userPreferences.length > 0) {
      console.log(`⚙️ استعادة ${backupData.data.userPreferences.length} تفضيل مستخدم...`)
      await prisma.user_preferences.createMany({
        data: backupData.data.userPreferences,
        skipDuplicates: true
      })
    }
    
    // 9. الرسائل
    if (backupData.data.messages.length > 0) {
      console.log(`💌 استعادة ${backupData.data.messages.length} رسالة...`)
      await prisma.messages.createMany({
        data: backupData.data.messages,
        skipDuplicates: true
      })
    }
    
    // 10. الأدوار
    if (backupData.data.roles.length > 0) {
      console.log(`👑 استعادة ${backupData.data.roles.length} دور...`)
      await prisma.roles.createMany({
        data: backupData.data.roles,
        skipDuplicates: true
      })
    }
    
    // 11. التحليلات العميقة
    if (backupData.data.deepAnalyses.length > 0) {
      console.log(`🔍 استعادة ${backupData.data.deepAnalyses.length} تحليل عميق...`)
      await prisma.deep_analyses.createMany({
        data: backupData.data.deepAnalyses,
        skipDuplicates: true
      })
    }
    
    // 12. أعضاء الفريق
    if (backupData.data.teamMembers.length > 0) {
      console.log(`👨‍💼 استعادة ${backupData.data.teamMembers.length} عضو فريق...`)
      await prisma.team_members.createMany({
        data: backupData.data.teamMembers,
        skipDuplicates: true
      })
    }
    
    // 13. القوالب
    if (backupData.data.templates.length > 0) {
      console.log(`📋 استعادة ${backupData.data.templates.length} قالب...`)
      await prisma.templates.createMany({
        data: backupData.data.templates,
        skipDuplicates: true
      })
    }
    
    // 14. الكتل الذكية
    if (backupData.data.smartBlocks.length > 0) {
      console.log(`🧩 استعادة ${backupData.data.smartBlocks.length} كتلة ذكية...`)
      await prisma.smart_blocks.createMany({
        data: backupData.data.smartBlocks,
        skipDuplicates: true
      })
    }
    
    // 15. رموز التحقق
    if (backupData.data.emailVerificationCodes.length > 0) {
      console.log(`🔐 استعادة ${backupData.data.emailVerificationCodes.length} رمز تحقق...`)
      await prisma.email_verification_codes.createMany({
        data: backupData.data.emailVerificationCodes,
        skipDuplicates: true
      })
    }
    
    // 16. رموز إعادة التعيين
    if (backupData.data.passwordResetTokens.length > 0) {
      console.log(`🔑 استعادة ${backupData.data.passwordResetTokens.length} رمز إعادة تعيين...`)
      await prisma.password_reset_tokens.createMany({
        data: backupData.data.passwordResetTokens,
        skipDuplicates: true
      })
    }
    
    // 17. إعدادات الكتل الرئيسية
    if (backupData.data.homeBlocksConfig.length > 0) {
      console.log(`🏠 استعادة ${backupData.data.homeBlocksConfig.length} إعداد كتلة رئيسية...`)
      await prisma.home_blocks_config.createMany({
        data: backupData.data.homeBlocksConfig,
        skipDuplicates: true
      })
    }
    
    console.log('\n✅ تم استعادة جميع البيانات بنجاح!')
    
    // التحقق من الاستعادة
    console.log('\n🔍 التحقق من الاستعادة...')
    const restoredCounts = await Promise.all([
      prisma.users.count(),
      prisma.articles.count(),
      prisma.categories.count(),
      prisma.interactions.count(),
      prisma.activity_logs.count(),
      prisma.keywords.count(),
      prisma.loyalty_points.count(),
      prisma.user_preferences.count(),
      prisma.messages.count(),
      prisma.roles.count(),
      prisma.deep_analyses.count(),
      prisma.team_members.count(),
      prisma.templates.count(),
      prisma.smart_blocks.count()
    ])
    
    console.log('\n📊 مقارنة البيانات:')
    console.log('==================')
    console.log(`👥 المستخدمون: ${backupData.summary.users} → ${restoredCounts[0]}`)
    console.log(`📰 المقالات: ${backupData.summary.articles} → ${restoredCounts[1]}`)
    console.log(`🏷️ التصنيفات: ${backupData.summary.categories} → ${restoredCounts[2]}`)
    console.log(`💬 التفاعلات: ${backupData.summary.interactions} → ${restoredCounts[3]}`)
    console.log(`📝 سجلات الأنشطة: ${backupData.summary.activityLogs} → ${restoredCounts[4]}`)
    console.log(`🔑 الكلمات المفتاحية: ${backupData.summary.keywords} → ${restoredCounts[5]}`)
    console.log(`⭐ نقاط الولاء: ${backupData.summary.loyaltyPoints} → ${restoredCounts[6]}`)
    console.log(`⚙️ تفضيلات المستخدمين: ${backupData.summary.userPreferences} → ${restoredCounts[7]}`)
    console.log(`💌 الرسائل: ${backupData.summary.messages} → ${restoredCounts[8]}`)
    console.log(`👑 الأدوار: ${backupData.summary.roles} → ${restoredCounts[9]}`)
    console.log(`🔍 التحليلات العميقة: ${backupData.summary.deepAnalyses} → ${restoredCounts[10]}`)
    console.log(`👨‍💼 أعضاء الفريق: ${backupData.summary.teamMembers} → ${restoredCounts[11]}`)
    console.log(`📋 القوالب: ${backupData.summary.templates} → ${restoredCounts[12]}`)
    console.log(`🧩 الكتل الذكية: ${backupData.summary.smartBlocks} → ${restoredCounts[13]}`)
    
    const totalRestored = restoredCounts.reduce((sum, count) => sum + count, 0)
    console.log(`\n🎯 إجمالي السجلات المستعادة: ${totalRestored}`)
    
    if (totalRestored === backupData.summary.total) {
      console.log('✅ جميع البيانات تم استعادتها بنجاح!')
    } else {
      console.log('⚠️ بعض البيانات لم يتم استعادتها. تحقق من الأخطاء أعلاه.')
    }
    
  } catch (error) {
    console.error('❌ فشل في استعادة البيانات:', error)
    throw error
  }
}

// تشغيل الاستعادة إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  const backupFilePath = process.argv[2]
  
  if (!backupFilePath) {
    console.error('❌ يرجى تحديد مسار ملف النسخة الاحتياطية')
    console.log('الاستخدام: npx tsx scripts/restore-from-backup.ts <backup-file-path>')
    process.exit(1)
  }
  
  restoreFromBackup(backupFilePath)
    .then(() => {
      console.log('\n🎉 تم استعادة البيانات بنجاح!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في استعادة البيانات:', error)
      process.exit(1)
    })
}

export { restoreFromBackup } 