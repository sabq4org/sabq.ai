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

async function createBackup() {
  console.log('📦 إنشاء نسخة احتياطية من البيانات الحالية...\n')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
  
  try {
    // إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجود
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // جمع البيانات من جميع الجداول
    console.log('📊 جمع البيانات...')
    
    const [
      users,
      articles,
      categories,
      interactions,
      activityLogs,
      keywords,
      loyaltyPoints,
      userPreferences,
      messages,
      roles,
      deepAnalyses,
      teamMembers,
      templates,
      smartBlocks,
      emailVerificationCodes,
      passwordResetTokens,
      homeBlocksConfig
    ] = await Promise.all([
      prisma.users.findMany(),
      prisma.articles.findMany(),
      prisma.categories.findMany(),
      prisma.interactions.findMany(),
      prisma.activity_logs.findMany(),
      prisma.keywords.findMany(),
      prisma.loyalty_points.findMany(),
      prisma.user_preferences.findMany(),
      prisma.messages.findMany(),
      prisma.roles.findMany(),
      prisma.deep_analyses.findMany(),
      prisma.team_members.findMany(),
      prisma.templates.findMany(),
      prisma.smart_blocks.findMany(),
      prisma.email_verification_codes.findMany(),
      prisma.password_reset_tokens.findMany(),
      prisma.home_blocks_config.findMany()
    ])
    
    // إنشاء ملخص البيانات
    const summary = {
      users: users.length,
      articles: articles.length,
      categories: categories.length,
      interactions: interactions.length,
      activityLogs: activityLogs.length,
      keywords: keywords.length,
      loyaltyPoints: loyaltyPoints.length,
      userPreferences: userPreferences.length,
      messages: messages.length,
      roles: roles.length,
      deepAnalyses: deepAnalyses.length,
      teamMembers: teamMembers.length,
      templates: templates.length,
      smartBlocks: smartBlocks.length,
      total: users.length + articles.length + categories.length + interactions.length + 
              activityLogs.length + keywords.length + loyaltyPoints.length + userPreferences.length +
              messages.length + roles.length + deepAnalyses.length + teamMembers.length +
              templates.length + smartBlocks.length
    }
    
    // إنشاء كائن النسخة الاحتياطية
    const backupData: BackupData = {
      timestamp,
      summary,
      data: {
        users,
        articles,
        categories,
        interactions,
        activityLogs,
        keywords,
        loyaltyPoints,
        userPreferences,
        messages,
        roles,
        deepAnalyses,
        teamMembers,
        templates,
        smartBlocks,
        emailVerificationCodes,
        passwordResetTokens,
        homeBlocksConfig
      }
    }
    
    // حفظ النسخة الاحتياطية
    console.log('💾 حفظ النسخة الاحتياطية...')
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8')
    
    // إنشاء ملف ملخص سريع
    const summaryFile = path.join(backupDir, `summary-${timestamp}.json`)
    fs.writeFileSync(summaryFile, JSON.stringify({ timestamp, summary }, null, 2), 'utf8')
    
    // عرض ملخص النسخة الاحتياطية
    console.log('\n📋 ملخص النسخة الاحتياطية:')
    console.log('========================')
    console.log(`📅 التاريخ: ${new Date(timestamp).toLocaleString('ar-SA')}`)
    console.log(`📁 الملف: ${backupFile}`)
    console.log(`📊 إجمالي السجلات: ${summary.total}`)
    console.log('\n📈 تفاصيل البيانات:')
    console.log(`👥 المستخدمون: ${summary.users}`)
    console.log(`📰 المقالات: ${summary.articles}`)
    console.log(`🏷️ التصنيفات: ${summary.categories}`)
    console.log(`💬 التفاعلات: ${summary.interactions}`)
    console.log(`📝 سجلات الأنشطة: ${summary.activityLogs}`)
    console.log(`🔑 الكلمات المفتاحية: ${summary.keywords}`)
    console.log(`⭐ نقاط الولاء: ${summary.loyaltyPoints}`)
    console.log(`⚙️ تفضيلات المستخدمين: ${summary.userPreferences}`)
    console.log(`💌 الرسائل: ${summary.messages}`)
    console.log(`👑 الأدوار: ${summary.roles}`)
    console.log(`🔍 التحليلات العميقة: ${summary.deepAnalyses}`)
    console.log(`👨‍💼 أعضاء الفريق: ${summary.teamMembers}`)
    console.log(`📋 القوالب: ${summary.templates}`)
    console.log(`🧩 الكتل الذكية: ${summary.smartBlocks}`)
    
    // عرض عينات من البيانات
    console.log('\n📝 عينات من البيانات:')
    console.log('=====================')
    
    if (users.length > 0) {
      console.log(`👤 المستخدمون: ${users.slice(0, 3).map(u => u.name).join(', ')}${users.length > 3 ? '...' : ''}`)
    }
    
    if (articles.length > 0) {
      console.log(`📰 المقالات: ${articles.slice(0, 3).map(a => a.title.substring(0, 30)).join(', ')}${articles.length > 3 ? '...' : ''}`)
    }
    
    if (categories.length > 0) {
      console.log(`🏷️ التصنيفات: ${categories.slice(0, 3).map(c => c.name).join(', ')}${categories.length > 3 ? '...' : ''}`)
    }
    
    // حساب حجم الملف
    const fileSize = fs.statSync(backupFile).size
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)
    
    console.log(`\n💾 حجم الملف: ${fileSizeMB} MB`)
    console.log(`✅ النسخة الاحتياطية جاهزة: ${backupFile}`)
    
    // إنشاء رابط سريع للاستعادة
    const restoreScript = `npx tsx scripts/restore-from-backup.ts ${backupFile}`
    console.log(`\n🔄 لاستعادة البيانات: ${restoreScript}`)
    
    return backupFile
    
  } catch (error) {
    console.error('❌ فشل في إنشاء النسخة الاحتياطية:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل النسخة الاحتياطية إذا تم تشغيل السكريبت مباشرة
if (require.main === module) {
  createBackup()
    .then(backupFile => {
      console.log(`\n🎉 تم إنشاء النسخة الاحتياطية بنجاح: ${backupFile}`)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ فشل في إنشاء النسخة الاحتياطية:', error)
      process.exit(1)
    })
}

export { createBackup } 