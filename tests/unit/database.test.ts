/**
 * اختبارات وحدة قاعدة البيانات - Sabq AI CMS
 * 
 * تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
 * المطور: Ali Alhazmi
 * الغرض: اختبار جميع عمليات قاعدة البيانات والاستعلامات
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// إعداد قاعدة بيانات الاختبار
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/sabq_test'
    }
  }
});

// بيانات تجريبية
const testUser = {
  email: 'test@example.com',
  name: 'مستخدم تجريبي',
  password_hash: '$2b$10$hashedpassword'
};

const testSection = {
  name: 'تقنية',
  slug: 'tech',
  description: 'قسم التقنية والتكنولوجيا'
};

const testArticle = {
  title: 'مقال تجريبي',
  content: 'محتوى المقال التجريبي',
  excerpt: 'ملخص المقال',
  slug: 'test-article',
  status: 'published'
};

describe('اختبارات قاعدة البيانات', () => {
  
  beforeAll(async () => {
    console.log('🔧 إعداد قاعدة بيانات الاختبار...');
    // تنظيف قاعدة البيانات
    await prisma.$executeRaw`TRUNCATE TABLE articles CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE sections CASCADE`;
  });

  afterAll(async () => {
    console.log('🧹 تنظيف قاعدة بيانات الاختبار...');
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // تنظيف البيانات قبل كل اختبار
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
    await prisma.section.deleteMany();
  });

  describe('عمليات المستخدمين', () => {
    
    it('✅ يجب أن ينشئ مستخدم جديد', async () => {
      const user = await prisma.user.create({
        data: testUser
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.name).toBe(testUser.name);
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeDefined();
    });

    it('✅ يجب أن يجد المستخدم بالبريد الإلكتروني', async () => {
      // إنشاء المستخدم
      await prisma.user.create({ data: testUser });

      // البحث عن المستخدم
      const foundUser = await prisma.user.findUnique({
        where: { email: testUser.email }
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });

    it('✅ يجب أن يحدث بيانات المستخدم', async () => {
      // إنشاء المستخدم
      const user = await prisma.user.create({ data: testUser });

      // تحديث المستخدم
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'اسم محدث' }
      });

      expect(updatedUser.name).toBe('اسم محدث');
      expect(updatedUser.updated_at).not.toBe(user.updated_at);
    });

    it('✅ يجب أن يحذف المستخدم', async () => {
      // إنشاء المستخدم
      const user = await prisma.user.create({ data: testUser });

      // حذف المستخدم
      await prisma.user.delete({
        where: { id: user.id }
      });

      // التحقق من الحذف
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(deletedUser).toBeNull();
    });

    it('❌ يجب أن يرفض البريد المكرر', async () => {
      // إنشاء المستخدم الأول
      await prisma.user.create({ data: testUser });

      // محاولة إنشاء مستخدم بنفس البريد
      await expect(
        prisma.user.create({ data: testUser })
      ).rejects.toThrow();
    });

  });

  describe('عمليات الأقسام', () => {
    
    it('✅ يجب أن ينشئ قسم جديد', async () => {
      const section = await prisma.section.create({
        data: testSection
      });

      expect(section).toBeDefined();
      expect(section.name).toBe(testSection.name);
      expect(section.slug).toBe(testSection.slug);
    });

    it('✅ يجب أن يجد الأقسام النشطة', async () => {
      // إنشاء أقسام
      await prisma.section.create({ 
        data: { ...testSection, is_active: true } 
      });
      await prisma.section.create({ 
        data: { ...testSection, name: 'رياضة', slug: 'sports', is_active: false } 
      });

      // البحث عن الأقسام النشطة
      const activeSections = await prisma.section.findMany({
        where: { is_active: true }
      });

      expect(activeSections).toHaveLength(1);
      expect(activeSections[0].name).toBe('تقنية');
    });

    it('✅ يجب أن يرتب الأقسام حسب الترتيب', async () => {
      // إنشاء أقسام بترتيب مختلف
      await prisma.section.create({ 
        data: { ...testSection, order_index: 2 } 
      });
      await prisma.section.create({ 
        data: { ...testSection, name: 'رياضة', slug: 'sports', order_index: 1 } 
      });

      // البحث مع الترتيب
      const orderedSections = await prisma.section.findMany({
        orderBy: { order_index: 'asc' }
      });

      expect(orderedSections[0].name).toBe('رياضة');
      expect(orderedSections[1].name).toBe('تقنية');
    });

  });

  describe('عمليات المقالات', () => {
    
    it('✅ يجب أن ينشئ مقال جديد', async () => {
      // إنشاء المتطلبات
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء المقال
      const article = await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id
        }
      });

      expect(article).toBeDefined();
      expect(article.title).toBe(testArticle.title);
      expect(article.author_id).toBe(user.id);
      expect(article.section_id).toBe(section.id);
    });

    it('✅ يجب أن يجد المقالات المنشورة', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء مقالات بحالات مختلفة
      await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id,
          status: 'published'
        }
      });

      await prisma.article.create({
        data: {
          ...testArticle,
          title: 'مقال مسودة',
          slug: 'draft-article',
          author_id: user.id,
          section_id: section.id,
          status: 'draft'
        }
      });

      // البحث عن المقالات المنشورة
      const publishedArticles = await prisma.article.findMany({
        where: { status: 'published' }
      });

      expect(publishedArticles).toHaveLength(1);
      expect(publishedArticles[0].status).toBe('published');
    });

    it('✅ يجب أن يجد المقالات مع المؤلف والقسم', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id
        }
      });

      // البحث مع العلاقات
      const articlesWithRelations = await prisma.article.findMany({
        include: {
          author: true,
          section: true
        }
      });

      expect(articlesWithRelations[0].author.name).toBe(testUser.name);
      expect(articlesWithRelations[0].section.name).toBe(testSection.name);
    });

    it('✅ يجب أن يزيد عدد المشاهدات', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      const article = await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id,
          views_count: 0
        }
      });

      // زيادة المشاهدات
      const updatedArticle = await prisma.article.update({
        where: { id: article.id },
        data: { views_count: { increment: 1 } }
      });

      expect(updatedArticle.views_count).toBe(1);
    });

  });

  describe('البحث والفلترة', () => {
    
    it('🔍 يجب أن يبحث في النصوص باللغة العربية', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء مقالات للبحث
      await prisma.article.create({
        data: {
          title: 'مقال عن الذكاء الاصطناعي',
          content: 'محتوى تفصيلي عن الذكاء الاصطناعي والتعلم الآلي',
          slug: 'ai-article',
          excerpt: 'ملخص عن الذكاء الاصطناعي',
          author_id: user.id,
          section_id: section.id
        }
      });

      await prisma.article.create({
        data: {
          title: 'مقال عن البرمجة',
          content: 'محتوى عن البرمجة والتطوير',
          slug: 'programming-article',
          excerpt: 'ملخص عن البرمجة',
          author_id: user.id,
          section_id: section.id
        }
      });

      // البحث النصي
      const searchResults = await prisma.$queryRaw<any[]>`
        SELECT * FROM articles 
        WHERE to_tsvector('arabic', title || ' ' || content) @@ plainto_tsquery('arabic', 'ذكاء')
      `;

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toContain('الذكاء الاصطناعي');
    });

    it('📊 يجب أن يجمع إحصائيات المقالات', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء مقالات بإحصائيات مختلفة
      await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id,
          views_count: 100,
          status: 'published'
        }
      });

      await prisma.article.create({
        data: {
          ...testArticle,
          title: 'مقال آخر',
          slug: 'another-article',
          author_id: user.id,
          section_id: section.id,
          views_count: 200,
          status: 'published'
        }
      });

      // حساب الإحصائيات
      const stats = await prisma.article.aggregate({
        _count: { id: true },
        _sum: { views_count: true },
        _avg: { views_count: true },
        where: { status: 'published' }
      });

      expect(stats._count.id).toBe(2);
      expect(stats._sum.views_count).toBe(300);
      expect(stats._avg.views_count).toBe(150);
    });

  });

  describe('العلاقات والتكامل', () => {
    
    it('🔗 يجب أن ينشئ علاقات الوسوم', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء المقال
      const article = await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id
        }
      });

      // إنشاء الوسوم
      const tag1 = await prisma.tag.create({
        data: { name: 'تقنية', slug: 'tech' }
      });

      const tag2 = await prisma.tag.create({
        data: { name: 'ذكاء اصطناعي', slug: 'ai' }
      });

      // ربط الوسوم بالمقال
      await prisma.article_tag.createMany({
        data: [
          { article_id: article.id, tag_id: tag1.id },
          { article_id: article.id, tag_id: tag2.id }
        ]
      });

      // البحث مع الوسوم
      const articleWithTags = await prisma.article.findUnique({
        where: { id: article.id },
        include: {
          tags: {
            include: { tag: true }
          }
        }
      });

      expect(articleWithTags?.tags).toHaveLength(2);
      expect(articleWithTags?.tags[0].tag.name).toBeDefined();
    });

    it('📊 يجب أن يحفظ أحداث التحليل', async () => {
      const user = await prisma.user.create({ data: testUser });

      // حفظ حدث تحليل
      const event = await prisma.analytics_event.create({
        data: {
          user_id: user.id,
          session_id: 'session-123',
          event_type: 'page_view',
          event_data: {
            page: '/articles/123',
            referrer: 'https://google.com'
          },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }
      });

      expect(event).toBeDefined();
      expect(event.event_type).toBe('page_view');
      expect(event.event_data).toHaveProperty('page');
    });

  });

  describe('أداء قاعدة البيانات', () => {
    
    it('⚡ يجب أن تستخدم الفهارس بكفاءة', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء مقالات متعددة
      const articles = Array.from({ length: 100 }, (_, i) => ({
        title: `مقال رقم ${i + 1}`,
        content: `محتوى المقال رقم ${i + 1}`,
        slug: `article-${i + 1}`,
        excerpt: `ملخص المقال رقم ${i + 1}`,
        author_id: user.id,
        section_id: section.id,
        status: 'published'
      }));

      await prisma.article.createMany({ data: articles });

      // قياس الأداء
      const startTime = Date.now();
      
      const result = await prisma.article.findMany({
        where: { status: 'published' },
        take: 10,
        orderBy: { created_at: 'desc' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result).toHaveLength(10);
      expect(queryTime).toBeLessThan(100); // أقل من 100ms
    });

    it('🔄 يجب أن تدعم المعاملات', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // معاملة تحتوي على عدة عمليات
      const result = await prisma.$transaction(async (prisma) => {
        // إنشاء المقال
        const article = await prisma.article.create({
          data: {
            ...testArticle,
            author_id: user.id,
            section_id: section.id
          }
        });

        // زيادة عدد المقالات في القسم
        await prisma.section.update({
          where: { id: section.id },
          data: { 
            articles_count: { increment: 1 }
          }
        });

        return article;
      });

      expect(result).toBeDefined();
      expect(result.title).toBe(testArticle.title);
    });

  });

  describe('التحقق من القيود', () => {
    
    it('✅ يجب أن تطبق قيود الحقول المطلوبة', async () => {
      // محاولة إنشاء مقال بدون عنوان
      await expect(
        prisma.article.create({
          data: {
            content: 'محتوى بدون عنوان',
            slug: 'no-title-article'
          } as any
        })
      ).rejects.toThrow();
    });

    it('✅ يجب أن تطبق قيود الفرادة', async () => {
      const user = await prisma.user.create({ data: testUser });
      const section = await prisma.section.create({ data: testSection });

      // إنشاء المقال الأول
      await prisma.article.create({
        data: {
          ...testArticle,
          author_id: user.id,
          section_id: section.id
        }
      });

      // محاولة إنشاء مقال بنفس الـ slug
      await expect(
        prisma.article.create({
          data: {
            ...testArticle,
            author_id: user.id,
            section_id: section.id
          }
        })
      ).rejects.toThrow();
    });

  });

  describe('نظافة البيانات', () => {
    
    it('🧹 يجب أن تنظف البيانات المنتهية الصلاحية', async () => {
      const user = await prisma.user.create({ data: testUser });

      // إنشاء جلسة منتهية الصلاحية
      await prisma.user_session.create({
        data: {
          user_id: user.id,
          session_token: 'expired-token',
          ip_address: '192.168.1.1',
          user_agent: 'Test Browser',
          expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // منتهية منذ يوم
          last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      });

      // تنظيف الجلسات المنتهية
      const deletedCount = await prisma.user_session.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      expect(deletedCount.count).toBe(1);
    });

  });

});

/**
 * مساعدات الاختبار
 */
export const createTestData = async () => {
  const user = await prisma.user.create({ data: testUser });
  const section = await prisma.section.create({ data: testSection });
  
  const article = await prisma.article.create({
    data: {
      ...testArticle,
      author_id: user.id,
      section_id: section.id
    }
  });

  return { user, section, article };
};

export const cleanTestData = async () => {
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  await prisma.section.deleteMany();
}; 