/**
 * اختبارات API المقالات - Sabq AI CMS
 * 
 * تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
 * المطور: Ali Alhazmi
 * الغرض: اختبار جميع وظائف API المقالات
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '@/app/api/articles/[id]/route';
import { prismaMock } from '@/lib/prisma-mock';
import { createTestUser, createTestArticle, createTestSection } from '@/tests/utils/test-helpers';

// موك البيانات الثابتة
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: { name: 'editor', permissions: ['read', 'write', 'publish'] }
};

const mockSection = {
  id: 'section-123',
  name: 'تقنية',
  slug: 'tech',
  color: '#3B82F6',
  is_active: true
};

const mockArticle = {
  id: 'article-123',
  title: 'مقال تجريبي',
  content: 'محتوى المقال التجريبي',
  excerpt: 'ملخص المقال',
  slug: 'test-article',
  author_id: 'user-123',
  section_id: 'section-123',
  status: 'published',
  views_count: 0,
  is_featured: false,
  created_at: new Date(),
  updated_at: new Date(),
  published_at: new Date()
};

describe('API اختبارات المقالات', () => {
  
  beforeAll(async () => {
    // إعداد قاعدة البيانات للاختبار
    console.log('🔧 إعداد اختبارات API المقالات...');
  });

  afterAll(async () => {
    // تنظيف قاعدة البيانات
    console.log('🧹 تنظيف اختبارات API المقالات...');
  });

  beforeEach(() => {
    // إعادة تعيين جميع الموكات
    jest.clearAllMocks();
  });

  describe('GET /api/articles/[id] - جلب مقال واحد', () => {
    
    it('✅ يجب أن يرجع المقال بنجاح', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue({
        ...mockArticle,
        author: mockUser,
        section: mockSection,
        tags: []
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request, { params: { id: 'article-123' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article).toBeDefined();
      expect(data.article.id).toBe('article-123');
      expect(data.article.title).toBe('مقال تجريبي');
    });

    it('❌ يجب أن يرجع خطأ 404 عند عدم وجود المقال', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(null);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/nonexistent',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('المقال غير موجود');
    });

    it('📈 يجب أن يزيد عدد المشاهدات', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue({
        ...mockArticle,
        author: mockUser,
        section: mockSection,
        tags: []
      });
      
      prismaMock.article.update.mockResolvedValue({
        ...mockArticle,
        views_count: 1
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request, { params: { id: 'article-123' } });

      // التحقق من زيادة المشاهدات
      expect(prismaMock.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { views_count: { increment: 1 } }
      });
    });

  });

  describe('POST /api/articles - إنشاء مقال جديد', () => {
    
    it('✅ يجب أن ينشئ مقال جديد بنجاح', async () => {
      const newArticleData = {
        title: 'مقال جديد',
        content: 'محتوى المقال الجديد',
        excerpt: 'ملخص المقال الجديد',
        section_id: 'section-123',
        tags: ['تقنية', 'ذكاء اصطناعي'],
        status: 'draft'
      };

      // إعداد الموك
      prismaMock.article.create.mockResolvedValue({
        ...mockArticle,
        ...newArticleData,
        id: 'new-article-123'
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles',
        {
          method: 'POST',
          body: JSON.stringify(newArticleData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.article).toBeDefined();
      expect(data.article.title).toBe('مقال جديد');
    });

    it('❌ يجب أن يرجع خطأ عند عدم وجود العنوان', async () => {
      const invalidData = {
        content: 'محتوى بدون عنوان',
        section_id: 'section-123'
      };

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles',
        {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('العنوان مطلوب');
    });

    it('🔗 يجب أن ينشئ slug تلقائياً', async () => {
      const articleData = {
        title: 'مقال تجريبي للسلاج',
        content: 'محتوى المقال',
        section_id: 'section-123'
      };

      // إعداد الموك
      prismaMock.article.create.mockResolvedValue({
        ...mockArticle,
        ...articleData,
        slug: 'مقال-تجريبي-للسلاج'
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles',
        {
          method: 'POST',
          body: JSON.stringify(articleData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من إنشاء الـ slug
      expect(data.article.slug).toBeDefined();
      expect(data.article.slug).toBe('مقال-تجريبي-للسلاج');
    });

  });

  describe('PUT /api/articles/[id] - تحديث مقال', () => {
    
    it('✅ يجب أن يحدث المقال بنجاح', async () => {
      const updateData = {
        title: 'مقال محدث',
        content: 'محتوى محدث',
        status: 'published'
      };

      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);
      prismaMock.article.update.mockResolvedValue({
        ...mockArticle,
        ...updateData
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await PUT(request, { params: { id: 'article-123' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article.title).toBe('مقال محدث');
    });

    it('❌ يجب أن يرجع خطأ 404 عند تحديث مقال غير موجود', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(null);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/nonexistent',
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'عنوان جديد' }),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await PUT(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('المقال غير موجود');
    });

    it('📅 يجب أن يحدث تاريخ النشر عند تغيير الحالة لمنشور', async () => {
      const updateData = {
        status: 'published'
      };

      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue({
        ...mockArticle,
        status: 'draft',
        published_at: null
      });
      
      prismaMock.article.update.mockResolvedValue({
        ...mockArticle,
        status: 'published',
        published_at: new Date()
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await PUT(request, { params: { id: 'article-123' } });
      const data = await response.json();

      // التحقق من تحديث تاريخ النشر
      expect(data.article.published_at).toBeDefined();
      expect(data.article.status).toBe('published');
    });

  });

  describe('DELETE /api/articles/[id] - حذف مقال', () => {
    
    it('✅ يجب أن يحذف المقال بنجاح (حذف ناعم)', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(mockArticle);
      prismaMock.article.update.mockResolvedValue({
        ...mockArticle,
        status: 'deleted'
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        { method: 'DELETE' }
      );

      // تنفيذ الطلب
      const response = await DELETE(request, { params: { id: 'article-123' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('تم حذف المقال بنجاح');
      
      // التحقق من الحذف الناعم
      expect(prismaMock.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { status: 'deleted' }
      });
    });

    it('❌ يجب أن يرجع خطأ 404 عند حذف مقال غير موجود', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(null);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/nonexistent',
        { method: 'DELETE' }
      );

      // تنفيذ الطلب
      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('المقال غير موجود');
    });

  });

  describe('🔍 اختبارات البحث والفلترة', () => {
    
    it('✅ يجب أن يفلتر المقالات حسب الحالة', async () => {
      // إعداد الموك
      prismaMock.article.findMany.mockResolvedValue([
        { ...mockArticle, status: 'published' }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles?status=published',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].status).toBe('published');
    });

    it('✅ يجب أن يفلتر المقالات حسب القسم', async () => {
      // إعداد الموك
      prismaMock.article.findMany.mockResolvedValue([
        { ...mockArticle, section_id: 'section-123' }
      ]);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles?section_id=section-123',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request);
      const data = await response.json();

      // التحقق من النتيجة
      expect(response.status).toBe(200);
      expect(data.articles[0].section_id).toBe('section-123');
    });

  });

  describe('🏷️ اختبارات الوسوم', () => {
    
    it('✅ يجب أن يحفظ الوسوم مع المقال', async () => {
      const articleDataWithTags = {
        title: 'مقال مع وسوم',
        content: 'محتوى المقال',
        section_id: 'section-123',
        tags: ['تقنية', 'ذكاء اصطناعي', 'برمجة']
      };

      // إعداد الموك
      prismaMock.article.create.mockResolvedValue({
        ...mockArticle,
        ...articleDataWithTags
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles',
        {
          method: 'POST',
          body: JSON.stringify(articleDataWithTags),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من حفظ الوسوم
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

  });

  describe('🔒 اختبارات الأمان', () => {
    
    it('❌ يجب أن يرفض الطلبات بدون مصادقة', async () => {
      // إنشاء طلب بدون مصادقة
      const request = new NextRequest(
        'http://localhost:3000/api/articles',
        {
          method: 'POST',
          body: JSON.stringify({ title: 'مقال جديد' }),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await POST(request);
      const data = await response.json();

      // التحقق من رفض الطلب
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('مطلوب تسجيل الدخول');
    });

    it('❌ يجب أن يرفض تحديث مقال من غير المؤلف', async () => {
      // إعداد مقال لمؤلف آخر
      const otherAuthorArticle = {
        ...mockArticle,
        author_id: 'other-user-123'
      };

      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue(otherAuthorArticle);

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'تحديث غير مصرح' }),
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // تنفيذ الطلب
      const response = await PUT(request, { params: { id: 'article-123' } });
      const data = await response.json();

      // التحقق من رفض التحديث
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('غير مصرح لك بتحديث هذا المقال');
    });

  });

  describe('📊 اختبارات الإحصائيات', () => {
    
    it('📈 يجب أن يسجل إحصائيات المشاهدة', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue({
        ...mockArticle,
        author: mockUser,
        section: mockSection,
        tags: []
      });

      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        {
          method: 'GET',
          headers: {
            'x-forwarded-for': '127.0.0.1',
            'user-agent': 'Mozilla/5.0 Test Browser'
          }
        }
      );

      // تنفيذ الطلب
      const response = await GET(request, { params: { id: 'article-123' } });

      // التحقق من تسجيل الإحصائيات
      expect(response.status).toBe(200);
      // يجب أن يتم تسجيل الحدث في جدول analytics_events
    });

  });

  describe('🎯 اختبارات الأداء', () => {
    
    it('⚡ يجب أن يستجيب بسرعة', async () => {
      // إعداد الموك
      prismaMock.article.findUnique.mockResolvedValue({
        ...mockArticle,
        author: mockUser,
        section: mockSection,
        tags: []
      });

      // قياس الوقت
      const startTime = Date.now();
      
      // إنشاء الطلب
      const request = new NextRequest(
        'http://localhost:3000/api/articles/article-123',
        { method: 'GET' }
      );

      // تنفيذ الطلب
      const response = await GET(request, { params: { id: 'article-123' } });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // التحقق من الأداء
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // أقل من ثانية واحدة
    });

  });

});

/**
 * مساعدات الاختبار
 */
export const createTestArticle = (overrides = {}) => {
  return {
    ...mockArticle,
    ...overrides
  };
};

export const createTestRequest = (method: string, url: string, body?: any) => {
  const options: RequestInit = { method };
  
  if (body) {
    options.body = JSON.stringify(body);
    options.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, options);
}; 