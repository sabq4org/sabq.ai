import { PrismaClient } from '../lib/generated/prisma'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// مسارات ملفات JSON
const DATA_DIR = path.join(process.cwd(), 'data')
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  roles: path.join(DATA_DIR, 'roles.json'),
  teamMembers: path.join(DATA_DIR, 'team_members.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  articles: path.join(DATA_DIR, 'articles_backup_20250623_161538.json'),
  userPreferences: path.join(DATA_DIR, 'user_preferences.json'),
  interactions: path.join(DATA_DIR, 'user_article_interactions.json'),
  loyaltyPoints: path.join(DATA_DIR, 'user_loyalty_points.json'),
  activityLogs: path.join(DATA_DIR, 'admin_activity_logs.json'),
  deepAnalyses: path.join(DATA_DIR, 'deep_analyses.json'),
  smartBlocks: path.join(DATA_DIR, 'smart_blocks.json'),
  keywords: path.join(DATA_DIR, 'keywords.json'),
  messages: path.join(DATA_DIR, 'messages.json'),
  templates: path.join(DATA_DIR, 'templates.json'),
  emailVerificationCodes: path.join(DATA_DIR, 'email_verification_codes.json'),
  passwordResetTokens: path.join(DATA_DIR, 'password_reset_tokens.json'),
  homeBlocksConfig: path.join(DATA_DIR, 'home_blocks_config.json'),
}

// دالة مساعدة لقراءة ملف JSON
async function readJsonFile(filePath: string): Promise<any> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.log(`⚠️  لا يمكن قراءة ${filePath}:`, error)
    return null
  }
}

// دالة لتحويل التاريخ
function toDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

// ترحيل المستخدمين
async function migrateUsers() {
  console.log('📤 بدء ترحيل المستخدمين...')
  const data = await readJsonFile(FILES.users)
  if (!data || !data.users) return

  let count = 0
  for (const user of data.users) {
    try {
      await prisma.users.upsert({
        where: { email: user.email },
        update: {
          name: user.name || null,
          password_hash: user.password || null,
          avatar: user.avatar || null,
          role: user.role || 'user',
          is_admin: user.isAdmin || false,
          is_verified: user.isVerified || false,
          verification_token: user.verificationToken || null,
          reset_token: user.resetToken || null,
          reset_token_expiry: toDate(user.resetTokenExpiry),
          updated_at: new Date(),
        },
        create: {
          id: user.id || uuidv4(),
          email: user.email,
          name: user.name || null,
          password_hash: user.password || null,
          avatar: user.avatar || null,
          role: user.role || 'user',
          is_admin: user.isAdmin || false,
          is_verified: user.isVerified || false,
          verification_token: user.verificationToken || null,
          reset_token: user.resetToken || null,
          reset_token_expiry: toDate(user.resetTokenExpiry),
          created_at: toDate(user.createdAt) || new Date(),
          updated_at: new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل المستخدم ${user.email}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} مستخدم`)
}

// ترحيل الأدوار
async function migrateRoles() {
  console.log('📤 بدء ترحيل الأدوار...')
  const data = await readJsonFile(FILES.roles)
  if (!data || !data.roles) return

  let count = 0
  for (const role of data.roles) {
    try {
      await prisma.roles.upsert({
        where: { name: role.name },
        update: {
          slug: role.slug || null,
          display_name: role.displayName || null,
          description: role.description || null,
          permissions: role.permissions || null,
          is_system: role.isSystem || false,
          updated_at: new Date(),
        },
        create: {
          id: role.id || uuidv4(),
          name: role.name,
          slug: role.slug || null,
          display_name: role.displayName || null,
          description: role.description || null,
          permissions: role.permissions || null,
          is_system: role.isSystem || false,
          created_at: toDate(role.createdAt) || new Date(),
          updated_at: new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل الدور ${role.name}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} دور`)
}

// ترحيل التصنيفات
async function migrateCategories() {
  console.log('📤 بدء ترحيل التصنيفات...')
  const data = await readJsonFile(FILES.categories)
  if (!data || !data.categories) return

  let count = 0
  for (const category of data.categories) {
    try {
      await prisma.categories.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description || null,
          display_order: category.displayOrder || 0,
          is_active: category.isActive !== false,
          color: category.color || null,
          icon: category.icon || null,
          metadata: category.metadata || null,
          name_en: category.nameEn || null,
          parent_id: category.parentId || null,
          updated_at: new Date(),
        },
        create: {
          id: String(category.id),
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          display_order: category.displayOrder || 0,
          is_active: category.isActive !== false,
          color: category.color || null,
          icon: category.icon || null,
          metadata: category.metadata || null,
          name_en: category.nameEn || null,
          parent_id: category.parentId || null,
          created_at: toDate(category.createdAt) || new Date(),
          updated_at: new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل التصنيف ${category.name}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} تصنيف`)
}

// ترحيل المقالات
async function migrateArticles() {
  console.log('📤 بدء ترحيل المقالات...')
  const data = await readJsonFile(FILES.articles)
  if (!data) return

  const articles = Array.isArray(data) ? data : data.articles || []
  let count = 0
  
  for (const article of articles) {
    try {
      // تخطي المقالات المحذوفة
      if (article.is_deleted || article.status === 'deleted') continue

      await prisma.articles.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          content: article.content || '',
          excerpt: article.summary || null,
          author_id: article.author_id || 'system',
          category_id: article.category_id ? String(article.category_id) : null,
          status: article.status || 'draft',
          featured: article.is_featured || false,
          breaking: article.is_breaking || false,
          featured_image: article.featured_image || null,
          published_at: toDate(article.published_at),
          scheduled_for: toDate(article.publish_at),
          views: article.views_count || 0,
          reading_time: article.reading_time || null,
          seo_title: article.seo_title || null,
          seo_description: article.seo_description || null,
          seo_keywords: Array.isArray(article.seo_keywords) 
            ? article.seo_keywords.join(',') 
            : null,
          social_image: article.social_image || null,
          allow_comments: article.allow_comments !== false,
          metadata: {
            content_blocks: article.content_blocks || [],
            featured_image_caption: article.featured_image_caption || null,
            is_pinned: article.is_pinned || false,
            editor_id: article.editor_id || null,
            section_id: article.section_id || null,
          },
          updated_at: new Date(),
        },
        create: {
          id: article.id || uuidv4(),
          title: article.title,
          slug: article.slug,
          content: article.content || '',
          excerpt: article.summary || null,
          author_id: article.author_id || 'system',
          category_id: article.category_id ? String(article.category_id) : null,
          status: article.status || 'draft',
          featured: article.is_featured || false,
          breaking: article.is_breaking || false,
          featured_image: article.featured_image || null,
          published_at: toDate(article.published_at),
          scheduled_for: toDate(article.publish_at),
          views: article.views_count || 0,
          reading_time: article.reading_time || null,
          seo_title: article.seo_title || null,
          seo_description: article.seo_description || null,
          seo_keywords: Array.isArray(article.seo_keywords) 
            ? article.seo_keywords.join(',') 
            : null,
          social_image: article.social_image || null,
          allow_comments: article.allow_comments !== false,
          metadata: {
            content_blocks: article.content_blocks || [],
            featured_image_caption: article.featured_image_caption || null,
            is_pinned: article.is_pinned || false,
            editor_id: article.editor_id || null,
            section_id: article.section_id || null,
          },
          created_at: toDate(article.created_at) || new Date(),
          updated_at: new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل المقال ${article.title}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} مقال`)
}

// ترحيل تفضيلات المستخدمين
async function migrateUserPreferences() {
  console.log('📤 بدء ترحيل تفضيلات المستخدمين...')
  const data = await readJsonFile(FILES.userPreferences)
  if (!data || !data.preferences) return

  let count = 0
  for (const [userId, prefs] of Object.entries(data.preferences)) {
    try {
      const userPrefs = prefs as any
      // ترحيل التصنيفات المفضلة
      if (userPrefs.favoriteCategories && userPrefs.favoriteCategories.length > 0) {
        await prisma.user_preferences.upsert({
          where: {
            user_id_key: {
              user_id: userId,
              key: 'favorite_categories',
            },
          },
          update: {
            value: userPrefs.favoriteCategories,
            updated_at: new Date(),
          },
          create: {
            id: uuidv4(),
            user_id: userId,
            key: 'favorite_categories',
            value: userPrefs.favoriteCategories,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
        count++
      }

      // ترحيل إعدادات الإشعارات
      if (userPrefs.notifications) {
        await prisma.user_preferences.upsert({
          where: {
            user_id_key: {
              user_id: userId,
              key: 'notifications',
            },
          },
          update: {
            value: userPrefs.notifications,
            updated_at: new Date(),
          },
          create: {
            id: uuidv4(),
            user_id: userId,
            key: 'notifications',
            value: userPrefs.notifications,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
        count++
      }
    } catch (error) {
      console.error(`❌ خطأ في ترحيل تفضيلات المستخدم ${userId}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} تفضيل`)
}

// ترحيل التفاعلات
async function migrateInteractions() {
  console.log('📤 بدء ترحيل التفاعلات...')
  const data = await readJsonFile(FILES.interactions)
  if (!data || !data.interactions) return

  let count = 0
  for (const interaction of data.interactions) {
    try {
      const uniqueKey = `${interaction.userId}_${interaction.articleId}_${interaction.type}`
      await prisma.interactions.upsert({
        where: {
          user_id_article_id_type: {
            user_id: interaction.userId,
            article_id: interaction.articleId,
            type: interaction.type,
          },
        },
        update: {
          created_at: toDate(interaction.timestamp) || new Date(),
        },
        create: {
          id: interaction.id || uuidv4(),
          user_id: interaction.userId,
          article_id: interaction.articleId,
          type: interaction.type,
          created_at: toDate(interaction.timestamp) || new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل التفاعل:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} تفاعل`)
}

// ترحيل نقاط الولاء
async function migrateLoyaltyPoints() {
  console.log('📤 بدء ترحيل نقاط الولاء...')
  const data = await readJsonFile(FILES.loyaltyPoints)
  if (!data || !data.points) return

  let count = 0
  for (const [userId, userPoints] of Object.entries(data.points)) {
    const points = userPoints as any
    if (!points.history) continue
    
    for (const entry of points.history) {
      try {
        await prisma.loyalty_points.create({
          data: {
            id: uuidv4(),
            user_id: userId,
            points: entry.points,
            action: entry.action,
            reference_id: entry.referenceId || null,
            reference_type: entry.referenceType || null,
            metadata: entry.metadata || null,
            created_at: toDate(entry.timestamp) || new Date(),
          },
        })
        count++
      } catch (error) {
        console.error(`❌ خطأ في ترحيل نقاط الولاء للمستخدم ${userId}:`, error)
      }
    }
  }
  console.log(`✅ تم ترحيل ${count} سجل نقاط ولاء`)
}

// ترحيل سجلات الأنشطة
async function migrateActivityLogs() {
  console.log('📤 بدء ترحيل سجلات الأنشطة...')
  const data = await readJsonFile(FILES.activityLogs)
  if (!data || !data.logs) return

  let count = 0
  for (const log of data.logs) {
    try {
      await prisma.activity_logs.create({
        data: {
          id: log.id || uuidv4(),
          user_id: log.userId || null,
          action: log.action || 'unknown',
          entity_type: log.entityType || null,
          entity_id: log.entityId || null,
          old_value: log.oldValue || null,
          new_value: log.newValue || null,
          metadata: log.metadata || null,
          ip_address: log.ipAddress || null,
          user_agent: log.userAgent || null,
          created_at: toDate(log.timestamp) || new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل سجل النشاط:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} سجل نشاط`)
}

// ترحيل التحليلات العميقة
async function migrateDeepAnalyses() {
  console.log('📤 بدء ترحيل التحليلات العميقة...')
  const data = await readJsonFile(FILES.deepAnalyses)
  if (!data || !data.analyses) return

  let count = 0
  for (const analysis of data.analyses) {
    try {
      await prisma.deep_analyses.upsert({
        where: { article_id: analysis.articleId },
        update: {
          ai_summary: analysis.aiSummary || null,
          key_topics: analysis.keyTopics || null,
          tags: analysis.tags || null,
          sentiment: analysis.sentiment || null,
          readability_score: analysis.readabilityScore || null,
          engagement_score: analysis.engagementScore || null,
          suggested_headlines: analysis.suggestedHeadlines || null,
          related_articles: analysis.relatedArticles || null,
          metadata: analysis.metadata || null,
          updated_at: new Date(),
        },
        create: {
          id: analysis.id || uuidv4(),
          article_id: analysis.articleId,
          ai_summary: analysis.aiSummary || null,
          key_topics: analysis.keyTopics || null,
          tags: analysis.tags || null,
          sentiment: analysis.sentiment || null,
          readability_score: analysis.readabilityScore || null,
          engagement_score: analysis.engagementScore || null,
          suggested_headlines: analysis.suggestedHeadlines || null,
          related_articles: analysis.relatedArticles || null,
          metadata: analysis.metadata || null,
          analyzed_at: toDate(analysis.analyzedAt) || new Date(),
          updated_at: new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل التحليل العميق:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} تحليل عميق`)
}

// ترحيل الكلمات المفتاحية
async function migrateKeywords() {
  console.log('📤 بدء ترحيل الكلمات المفتاحية...')
  const data = await readJsonFile(FILES.keywords)
  if (!data || !data.keywords) return

  let count = 0
  for (const keyword of data.keywords) {
    try {
      // إنشاء slug إذا لم يكن موجوداً
      const slug = keyword.slug || keyword.name.toLowerCase().replace(/\s+/g, '-')
      
      await prisma.keywords.upsert({
        where: { slug: slug },
        update: {
          name: keyword.name,
          count: keyword.count || 0,
        },
        create: {
          id: keyword.id || uuidv4(),
          name: keyword.name,
          slug: slug,
          count: keyword.count || 0,
          created_at: toDate(keyword.createdAt) || new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل الكلمة المفتاحية ${keyword.name}:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} كلمة مفتاحية`)
}

// ترحيل الرسائل
async function migrateMessages() {
  console.log('📤 بدء ترحيل الرسائل...')
  const data = await readJsonFile(FILES.messages)
  if (!data || !data.messages) return

  let count = 0
  for (const message of data.messages) {
    try {
      await prisma.messages.create({
        data: {
          id: message.id || uuidv4(),
          from_user_id: message.fromUserId || null,
          to_user_id: message.toUserId || null,
          email: message.email,
          subject: message.subject || null,
          message: message.message,
          status: message.status || 'unread',
          replied_at: toDate(message.repliedAt),
          reply_content: message.replyContent || null,
          metadata: message.metadata || null,
          created_at: toDate(message.createdAt) || new Date(),
        },
      })
      count++
    } catch (error) {
      console.error(`❌ خطأ في ترحيل الرسالة:`, error)
    }
  }
  console.log(`✅ تم ترحيل ${count} رسالة`)
}

// الدالة الرئيسية
async function main() {
  console.log('🚀 بدء عملية الترحيل من JSON إلى قاعدة البيانات...\n')
  
  try {
    // ترحيل البيانات بالترتيب الصحيح
    await migrateUsers()
    await migrateRoles()
    await migrateCategories()
    await migrateArticles()
    await migrateUserPreferences()
    await migrateInteractions()
    await migrateLoyaltyPoints()
    await migrateActivityLogs()
    await migrateDeepAnalyses()
    await migrateKeywords()
    await migrateMessages()
    
    console.log('\n✨ اكتملت عملية الترحيل بنجاح!')
  } catch (error) {
    console.error('❌ خطأ عام في عملية الترحيل:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل الترحيل
main().catch(console.error) 