#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface MigrationConfig {
  source: {
    type: 'planetscale' | 'json'
    url?: string
  }
  target: {
    type: 'supabase'
    url: string
  }
  backup: boolean
  validate: boolean
}

class SupabaseMigration {
  private config: MigrationConfig

  constructor(config: MigrationConfig) {
    this.config = config
  }

  async execute() {
    console.log('🚀 بدء الترحيل إلى Supabase...')
    
    try {
      // 1. إنشاء نسخة احتياطية
      if (this.config.backup) {
        await this.createBackup()
      }

      // 2. تحديث Prisma Schema
      await this.updatePrismaSchema()

      // 3. ترحيل البيانات
      await this.migrateData()

      // 4. التحقق من النتائج
      if (this.config.validate) {
        await this.validateMigration()
      }

      console.log('✅ الترحيل مكتمل بنجاح!')
      
    } catch (error) {
      console.error('❌ فشل في الترحيل:', error)
      await this.rollback()
      throw error
    }
  }

  private async createBackup() {
    console.log('📦 إنشاء نسخة احتياطية...')
    
    const backupData = {
      timestamp: new Date().toISOString(),
      users: await prisma.users.findMany(),
      articles: await prisma.articles.findMany(),
      categories: await prisma.categories.findMany(),
      activityLogs: await prisma.activity_logs.findMany(),
      keywords: await prisma.keywords.findMany(),
      userPreferences: await prisma.user_preferences.findMany(),
    }

    const backupPath = path.join(process.cwd(), 'backups', `migration-backup-${Date.now()}.json`)
    await fs.mkdir(path.dirname(backupPath), { recursive: true })
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
    
    console.log(`✅ النسخة الاحتياطية محفوظة في: ${backupPath}`)
  }

  private async updatePrismaSchema() {
    console.log('🔧 تحديث Prisma Schema...')
    
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    let schema = await fs.readFile(schemaPath, 'utf-8')
    
    // تحديث provider إلى postgresql
    schema = schema.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")
  directUrl    = env("DIRECT_URL")
}`
    )
    
    // تحديث أنواع البيانات لـ PostgreSQL
    schema = schema.replace(/@db\.LongText/g, '@db.Text')
    
    // إنشاء نسخة احتياطية
    const backupPath = path.join(process.cwd(), 'prisma', 'schema-mysql-backup.prisma')
    await fs.writeFile(backupPath, await fs.readFile(schemaPath, 'utf-8'))
    console.log(`📦 تم إنشاء نسخة احتياطية: ${backupPath}`)
    
    await fs.writeFile(schemaPath, schema)
    console.log('✅ تم تحديث Prisma Schema')
  }

  private async migrateData() {
    console.log('📊 ترحيل البيانات...')
    
    const { execSync } = require('child_process')
    
    try {
      // 1. إعادة توليد Prisma Client
      console.log('🔄 إعادة توليد Prisma Client...')
      execSync('npx prisma generate', { stdio: 'inherit' })
      
      // 2. تطبيق Schema على Supabase
      console.log('📋 تطبيق Schema على Supabase...')
      execSync('npx prisma db push', { stdio: 'inherit' })
      
      // 3. تشغيل سكريبت الترحيل
      console.log('📦 ترحيل البيانات من النسخة الاحتياطية...')
      const { restoreFromBackup } = await import('./restore-from-backup')
      
      // البحث عن أحدث نسخة احتياطية
      const backupDir = path.join(process.cwd(), 'backups')
      const backupFiles = await fs.readdir(backupDir)
      const latestBackup = backupFiles
        .filter(file => file.endsWith('.json'))
        .sort()
        .pop()
      
      if (latestBackup) {
        const backupPath = path.join(backupDir, latestBackup)
        console.log(`📁 استخدام النسخة الاحتياطية: ${latestBackup}`)
        
        // في البيئة غير التفاعلية، نمرر true للاستمرار
        process.env.NON_INTERACTIVE = 'true'
        await restoreFromBackup(backupPath)
      } else {
        console.log('⚠️ لم يتم العثور على نسخة احتياطية، سيتم إنشاء جداول فارغة')
      }
      
      console.log('✅ تم ترحيل البيانات بنجاح')
      
    } catch (error) {
      console.error('❌ فشل في ترحيل البيانات:', error)
      throw error
    }
  }

  private async validateMigration() {
    console.log('🔍 التحقق من الترحيل...')
    
    const counts = {
      users: await prisma.users.count(),
      articles: await prisma.articles.count(),
      categories: await prisma.categories.count(),
      activityLogs: await prisma.activity_logs.count(),
    }
    
    console.log('📊 إحصائيات قاعدة البيانات الجديدة:')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} سجل`)
    })
    
    // اختبار الاتصال
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح')
    } catch (error) {
      throw new Error('فشل في الاتصال بقاعدة البيانات الجديدة')
    }
  }

  private async rollback() {
    console.log('🔄 التراجع عن التغييرات...')
    
    // يمكن إضافة منطق التراجع هنا
    console.log('⚠️ يرجى التراجع يدوياً إذا لزم الأمر')
  }
}

// تشغيل الترحيل
async function main() {
  const config: MigrationConfig = {
    source: {
      type: 'planetscale'
    },
    target: {
      type: 'supabase',
      url: process.env.DATABASE_URL || ''
    },
    backup: true,
    validate: true
  }

  if (!config.target.url) {
    console.error('❌ يرجى تعيين DATABASE_URL لـ Supabase')
    process.exit(1)
  }

  const migration = new SupabaseMigration(config)
  await migration.execute()
}

main().catch(console.error) 