import { PrismaClient } from '../lib/generated/prisma'
import { filterTestContent } from '../lib/data-protection'

const prisma = new PrismaClient()

async function testAPI() {
  try {
    console.log('🔍 اختبار API...')
    
    const where = {
      status: { not: 'deleted' }
    }
    
    const orderBy = { createdAt: 'desc' as const }
    const skip = 0
    const limit = 1
    
    // جلب المقالات مع العلاقات
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          category: true,
          deepAnalysis: true,
          _count: {
            select: {
              interactions: true,
              comments: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ])
    
    console.log(`✅ تم جلب ${articles.length} مقال من أصل ${total}`)
    
    // تحويل البيانات للتوافق مع الواجهة القديمة
    const formattedArticles = articles.map(article => {
      console.log('معالجة مقال:', article.title)
      console.log('  - له مؤلف:', !!article.author)
      console.log('  - له تصنيف:', !!article.category)
      
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        summary: article.excerpt,
        author_id: article.authorId,
        author: article.author,
        category_id: article.categoryId,
        category_name: article.category?.name || 'غير مصنف',
        status: article.status,
        featured_image: article.featuredImage,
        is_breaking: article.breaking,
        is_featured: article.featured,
        views_count: article.views,
        reading_time: article.readingTime || 5,
        created_at: article.createdAt.toISOString(),
        updated_at: article.updatedAt.toISOString(),
        published_at: article.publishedAt?.toISOString(),
        tags: article.metadata && typeof article.metadata === 'object' && 'tags' in article.metadata ? (article.metadata as any).tags : [],
        interactions_count: article._count.interactions,
        comments_count: article._count.comments
      }
    })
    
    console.log('📊 النتيجة النهائية:')
    console.log(JSON.stringify(formattedArticles, null, 2))
    
  } catch (error) {
    console.error('❌ خطأ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI() 