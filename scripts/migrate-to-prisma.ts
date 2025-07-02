#!/usr/bin/env ts-node

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '../lib/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 بدء نقل البيانات إلى قاعدة البيانات...')

  try {
    // 1. نقل الفئات
    await migrateCategories()
    
    // 2. نقل المستخدمين
    await migrateUsers()
    
    // 3. نقل المقالات
    await migrateArticles()
    
    // 4. نقل التفاعلات
    await migrateInteractions()
    
    // 5. نقل البلوكات الذكية
    await migrateSmartBlocks()
    
    // 6. نقل الرسائل
    await migrateMessages()
    
    // 7. نقل التحليلات العميقة
    await migrateDeepAnalyses()

    console.log('✅ تم نقل جميع البيانات بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// نقل الفئات
async function migrateCategories() {
  console.log('📁 نقل الفئات...')
  
  const filePath = join(process.cwd(), 'data', 'categories.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف الفئات غير موجود')
    return
  }

  const categories = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const category of categories) {
    try {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          color: category.color || '#000000',
          icon: category.icon,
          isActive: category.is_active !== false
        },
        create: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color || '#000000',
          icon: category.icon,
          isActive: category.is_active !== false
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل الفئة ${category.name}:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${categories.length} فئة`)
}

// نقل المستخدمين
async function migrateUsers() {
  console.log('👥 نقل المستخدمين...')
  
  const filePath = join(process.cwd(), 'data', 'users.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف المستخدمين غير موجود')
    return
  }

  const users = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const user of users) {
    try {
      // تشفير كلمة المرور إذا لم تكن مشفرة
      let passwordHash = user.password
      if (user.password && !user.password.startsWith('$2')) {
        passwordHash = await bcrypt.hash(user.password, 10)
      }

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          avatar: user.avatar,
          role: user.role || 'user',
          isAdmin: user.is_admin || false,
          isVerified: user.is_verified !== false
        },
        create: {
          id: user.id,
          email: user.email,
          passwordHash,
          name: user.name,
          avatar: user.avatar,
          role: user.role || 'user',
          isAdmin: user.is_admin || false,
          isVerified: user.is_verified !== false,
          createdAt: user.created_at ? new Date(user.created_at) : new Date()
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل المستخدم ${user.email}:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${users.length} مستخدم`)
}

// نقل المقالات
async function migrateArticles() {
  console.log('📝 نقل المقالات...')
  
  const filePath = join(process.cwd(), 'data', 'articles.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف المقالات غير موجود')
    return
  }

  const articles = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const article of articles) {
    try {
      // البحث عن الكاتب والفئة
      let authorId = article.author_id
      let categoryId = article.category_id

      // محاولة إيجاد الكاتب بالبريد الإلكتروني
      if (article.author_email && !authorId) {
        const author = await prisma.user.findUnique({
          where: { email: article.author_email }
        })
        authorId = author?.id
      }

      // محاولة إيجاد الفئة بال slug
      if (article.category_slug && !categoryId) {
        const category = await prisma.category.findUnique({
          where: { slug: article.category_slug }
        })
        categoryId = category?.id
      }

      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          status: article.status || 'published',
          views: article.views || 0,
          featured: article.featured || false,
          breaking: article.breaking || false,
          featuredImage: article.featured_image,
          metadata: article.metadata || {},
          tags: article.tags || [],
          publishedAt: article.published_at ? new Date(article.published_at) : null,
          scheduledAt: article.scheduled_at ? new Date(article.scheduled_at) : null,
          authorId,
          categoryId
        },
        create: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          status: article.status || 'published',
          views: article.views || 0,
          featured: article.featured || false,
          breaking: article.breaking || false,
          featuredImage: article.featured_image,
          metadata: article.metadata || {},
          tags: article.tags || [],
          publishedAt: article.published_at ? new Date(article.published_at) : null,
          scheduledAt: article.scheduled_at ? new Date(article.scheduled_at) : null,
          createdAt: article.created_at ? new Date(article.created_at) : new Date(),
          authorId,
          categoryId
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل المقال ${article.title}:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${articles.length} مقال`)
}

// نقل التفاعلات
async function migrateInteractions() {
  console.log('💖 نقل التفاعلات...')
  
  const filePath = join(process.cwd(), 'data', 'interactions.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف التفاعلات غير موجود')
    return
  }

  const interactions = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const interaction of interactions) {
    try {
      // التحقق من وجود المقال
      const article = await prisma.article.findUnique({
        where: { id: interaction.article_id }
      })
      
      if (!article) continue

      await prisma.interaction.upsert({
        where: {
          userId_articleId_type: {
            userId: interaction.user_id,
            articleId: interaction.article_id,
            type: interaction.type
          }
        },
        update: {
          metadata: interaction.metadata || {}
        },
        create: {
          userId: interaction.user_id,
          articleId: interaction.article_id,
          type: interaction.type,
          metadata: interaction.metadata || {},
          createdAt: interaction.created_at ? new Date(interaction.created_at) : new Date()
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل التفاعل:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${interactions.length} تفاعل`)
}

// نقل البلوكات الذكية
async function migrateSmartBlocks() {
  console.log('🧩 نقل البلوكات الذكية...')
  
  const filePath = join(process.cwd(), 'data', 'smart_blocks.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف البلوكات الذكية غير موجود')
    return
  }

  const blocks = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const block of blocks) {
    try {
      await prisma.smartBlock.upsert({
        where: { id: block.id },
        update: {
          name: block.name,
          type: block.type,
          position: block.position,
          content: block.content,
          settings: block.settings || {},
          status: block.status || 'active',
          orderIndex: block.order || 0,
          startDate: block.start_date ? new Date(block.start_date) : null,
          endDate: block.end_date ? new Date(block.end_date) : null
        },
        create: {
          id: block.id,
          name: block.name,
          type: block.type,
          position: block.position,
          content: block.content,
          settings: block.settings || {},
          status: block.status || 'active',
          orderIndex: block.order || 0,
          startDate: block.start_date ? new Date(block.start_date) : null,
          endDate: block.end_date ? new Date(block.end_date) : null,
          createdAt: block.created_at ? new Date(block.created_at) : new Date()
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل البلوك ${block.name}:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${blocks.length} بلوك ذكي`)
}

// نقل الرسائل
async function migrateMessages() {
  console.log('✉️  نقل الرسائل...')
  
  const filePath = join(process.cwd(), 'data', 'messages.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف الرسائل غير موجود')
    return
  }

  const messages = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const message of messages) {
    try {
      await prisma.message.create({
        data: {
          id: message.id,
          name: message.name,
          email: message.email,
          subject: message.subject,
          message: message.message,
          status: message.status || 'unread',
          repliedAt: message.replied_at ? new Date(message.replied_at) : null,
          replyContent: message.reply_content,
          createdAt: message.created_at ? new Date(message.created_at) : new Date()
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل الرسالة من ${message.email}:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${messages.length} رسالة`)
}

// نقل التحليلات العميقة
async function migrateDeepAnalyses() {
  console.log('🧠 نقل التحليلات العميقة...')
  
  const filePath = join(process.cwd(), 'data', 'deep_analyses.json')
  if (!existsSync(filePath)) {
    console.log('⚠️  ملف التحليلات العميقة غير موجود')
    return
  }

  const analyses = JSON.parse(readFileSync(filePath, 'utf-8'))
  
  for (const analysis of analyses) {
    try {
      // التحقق من وجود المقال
      const article = await prisma.article.findUnique({
        where: { id: analysis.article_id }
      })
      
      if (!article) continue

      await prisma.deepAnalysis.upsert({
        where: { articleId: analysis.article_id },
        update: {
          aiSummary: analysis.ai_summary,
          keyPoints: analysis.key_points || [],
          tags: analysis.tags || [],
          sentiment: analysis.sentiment,
          readabilityScore: analysis.readability_score,
          estimatedReadTime: analysis.estimated_read_time
        },
        create: {
          articleId: analysis.article_id,
          aiSummary: analysis.ai_summary,
          keyPoints: analysis.key_points || [],
          tags: analysis.tags || [],
          sentiment: analysis.sentiment,
          readabilityScore: analysis.readability_score,
          estimatedReadTime: analysis.estimated_read_time,
          createdAt: analysis.created_at ? new Date(analysis.created_at) : new Date()
        }
      })
    } catch (error) {
      console.error(`خطأ في نقل التحليل العميق:`, error)
    }
  }
  
  console.log(`✓ تم نقل ${analyses.length} تحليل عميق`)
}

// تشغيل السكريبت
main().catch((error) => {
  console.error(error)
  process.exit(1)
}) 