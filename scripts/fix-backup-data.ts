#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

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

async function fixBackupData(backupFilePath: string) {
  console.log('🔧 إصلاح بيانات النسخة الاحتياطية...\n')
  
  try {
    // قراءة ملف النسخة الاحتياطية
    console.log('📖 قراءة ملف النسخة الاحتياطية...')
    const backupContent = fs.readFileSync(backupFilePath, 'utf8')
    const backupData: BackupData = JSON.parse(backupContent)
    
    console.log(`📅 تاريخ النسخة الاحتياطية: ${backupData.timestamp}`)
    console.log(`📊 إجمالي السجلات: ${backupData.summary.total}`)
    
    // إنشاء خريطة للتصنيفات
    const categoryMap = new Map<string, string>()
    backupData.data.categories.forEach(category => {
      categoryMap.set(category.id, category.id)
    })
    
    console.log(`🏷️ عدد التصنيفات: ${backupData.data.categories.length}`)
    
    // إصلاح المقالات
    console.log('\n📰 إصلاح المقالات...')
    let fixedArticles = 0
    let removedArticles = 0
    
    backupData.data.articles = backupData.data.articles.filter(article => {
      // إذا كان المقال لا يحتوي على category_id، احتفظ به
      if (!article.category_id) {
        return true
      }
      
      // إذا كان category_id موجود في التصنيفات، احتفظ به
      if (categoryMap.has(article.category_id)) {
        return true
      }
      
      // إذا لم يكن موجود، احذف المقال
      console.log(`❌ حذف مقال "${article.title}" - تصنيف غير موجود: ${article.category_id}`)
      removedArticles++
      return false
    })
    
    fixedArticles = backupData.data.articles.length
    console.log(`✅ تم إصلاح المقالات: ${fixedArticles} مقال محفوظ، ${removedArticles} مقال محذوف`)
    
    // إصلاح التفاعلات
    console.log('\n💬 إصلاح التفاعلات...')
    const userMap = new Map<string, string>()
    backupData.data.users.forEach(user => {
      userMap.set(user.id, user.id)
    })
    
    const articleMap = new Map<string, string>()
    backupData.data.articles.forEach(article => {
      articleMap.set(article.id, article.id)
    })
    
    let fixedInteractions = 0
    let removedInteractions = 0
    
    backupData.data.interactions = backupData.data.interactions.filter(interaction => {
      // التحقق من وجود المستخدم
      if (interaction.user_id && !userMap.has(interaction.user_id)) {
        console.log(`❌ حذف تفاعل - مستخدم غير موجود: ${interaction.user_id}`)
        removedInteractions++
        return false
      }
      
      // التحقق من وجود المقال
      if (interaction.article_id && !articleMap.has(interaction.article_id)) {
        console.log(`❌ حذف تفاعل - مقال غير موجود: ${interaction.article_id}`)
        removedInteractions++
        return false
      }
      
      fixedInteractions++
      return true
    })
    
    console.log(`✅ تم إصلاح التفاعلات: ${fixedInteractions} تفاعل محفوظ، ${removedInteractions} تفاعل محذوف`)
    
    // إصلاح سجلات الأنشطة
    console.log('\n📝 إصلاح سجلات الأنشطة...')
    let fixedActivityLogs = 0
    let removedActivityLogs = 0
    
    backupData.data.activityLogs = backupData.data.activityLogs.filter(log => {
      // التحقق من وجود المستخدم
      if (log.user_id && !userMap.has(log.user_id)) {
        console.log(`❌ حذف سجل نشاط - مستخدم غير موجود: ${log.user_id}`)
        removedActivityLogs++
        return false
      }
      
      fixedActivityLogs++
      return true
    })
    
    console.log(`✅ تم إصلاح سجلات الأنشطة: ${fixedActivityLogs} سجل محفوظ، ${removedActivityLogs} سجل محذوف`)
    
    // إصلاح نقاط الولاء
    console.log('\n⭐ إصلاح نقاط الولاء...')
    let fixedLoyaltyPoints = 0
    let removedLoyaltyPoints = 0
    
    backupData.data.loyaltyPoints = backupData.data.loyaltyPoints.filter(point => {
      // التحقق من وجود المستخدم
      if (point.user_id && !userMap.has(point.user_id)) {
        console.log(`❌ حذف نقطة ولاء - مستخدم غير موجود: ${point.user_id}`)
        removedLoyaltyPoints++
        return false
      }
      
      fixedLoyaltyPoints++
      return true
    })
    
    console.log(`✅ تم إصلاح نقاط الولاء: ${fixedLoyaltyPoints} نقطة محفوظة، ${removedLoyaltyPoints} نقطة محذوفة`)
    
    // إصلاح تفضيلات المستخدمين
    console.log('\n⚙️ إصلاح تفضيلات المستخدمين...')
    let fixedUserPreferences = 0
    let removedUserPreferences = 0
    
    backupData.data.userPreferences = backupData.data.userPreferences.filter(pref => {
      // التحقق من وجود المستخدم
      if (pref.user_id && !userMap.has(pref.user_id)) {
        console.log(`❌ حذف تفضيل مستخدم - مستخدم غير موجود: ${pref.user_id}`)
        removedUserPreferences++
        return false
      }
      
      fixedUserPreferences++
      return true
    })
    
    console.log(`✅ تم إصلاح تفضيلات المستخدمين: ${fixedUserPreferences} تفضيل محفوظ، ${removedUserPreferences} تفضيل محذوف`)
    
    // تحديث الإحصائيات
    backupData.summary.articles = backupData.data.articles.length
    backupData.summary.interactions = backupData.data.interactions.length
    backupData.summary.activityLogs = backupData.data.activityLogs.length
    backupData.summary.loyaltyPoints = backupData.data.loyaltyPoints.length
    backupData.summary.userPreferences = backupData.data.userPreferences.length
    
    backupData.summary.total = Object.values(backupData.summary).reduce((sum, count) => {
      return typeof count === 'number' ? sum + count : sum
    }, 0) - backupData.summary.total // طرح القيمة القديمة وإضافة الجديدة
    
    // إنشاء ملف النسخة الاحتياطية المصلح
    const backupDir = path.dirname(backupFilePath)
    const backupName = path.basename(backupFilePath, '.json')
    const fixedBackupPath = path.join(backupDir, `${backupName}-fixed.json`)
    
    fs.writeFileSync(fixedBackupPath, JSON.stringify(backupData, null, 2), 'utf8')
    
    console.log('\n📊 ملخص الإصلاحات:')
    console.log('==================')
    console.log(`📰 المقالات: ${backupData.summary.articles} (${removedArticles} محذوفة)`)
    console.log(`💬 التفاعلات: ${backupData.summary.interactions} (${removedInteractions} محذوفة)`)
    console.log(`📝 سجلات الأنشطة: ${backupData.summary.activityLogs} (${removedActivityLogs} محذوفة)`)
    console.log(`⭐ نقاط الولاء: ${backupData.summary.loyaltyPoints} (${removedLoyaltyPoints} محذوفة)`)
    console.log(`⚙️ تفضيلات المستخدمين: ${backupData.summary.userPreferences} (${removedUserPreferences} محذوفة)`)
    console.log(`🎯 إجمالي السجلات: ${backupData.summary.total}`)
    
    console.log(`\n💾 تم حفظ النسخة الاحتياطية المصلحة: ${fixedBackupPath}`)
    
    return fixedBackupPath
    
  } catch (error) {
    console.error('❌ فشل في إصلاح بيانات النسخة الاحتياطية:', error)
    throw error
  }
}

// تشغيل الإصلاح إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  const backupFilePath = process.argv[2]
  
  if (!backupFilePath) {
    console.error('❌ يرجى تحديد مسار ملف النسخة الاحتياطية')
    console.log('الاستخدام: npx tsx scripts/fix-backup-data.ts <backup-file-path>')
    process.exit(1)
  }
  
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ ملف النسخة الاحتياطية غير موجود: ${backupFilePath}`)
    process.exit(1)
  }
  
  fixBackupData(backupFilePath)
    .then((fixedBackupPath) => {
      console.log('\n🎉 تم إصلاح بيانات النسخة الاحتياطية بنجاح!')
      console.log(`\n🚀 الخطوة التالية: npx tsx scripts/restore-from-backup.ts ${fixedBackupPath}`)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في إصلاح بيانات النسخة الاحتياطية:', error)
      process.exit(1)
    })
}

export { fixBackupData } 