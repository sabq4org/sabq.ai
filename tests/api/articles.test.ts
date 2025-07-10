/**
 * اختبارات API المقالات
 * Articles API Tests
 * @version 2.1.0
 * @author Sabq AI Team
 */

import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../api/index";
import { generateTokens } from "../../api/utils/auth";

describe("Articles API", () => {
  let prisma: PrismaClient;
  let authToken: string;
  let testUserId: string;
  let testArticleId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // إنشاء مستخدم اختبار
    const testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        hashedPassword: "hashedpassword",
        status: "ACTIVE",
      },
    });
    testUserId = testUser.id;

    // إنشاء تصنيف اختبار
    const testCategory = await prisma.category.create({
      data: {
        name: "تقنية",
        slug: "technology",
        description: "تصنيف التقنية",
      },
    });
    testCategoryId = testCategory.id;

    // إنشاء دور للمستخدم
    const userRole = await prisma.role.create({
      data: {
        name: "editor",
        description: "محرر",
        permissions: ["create:article", "update:article", "delete:article"],
      },
    });

    await prisma.userRole.create({
      data: {
        userId: testUserId,
        roleId: userRole.id,
      },
    });

    // إنشاء رمز مصادقة
    const tokens = generateTokens(testUserId);
    authToken = tokens.accessToken;
  });

  afterAll(async () => {
    // تنظيف بيانات الاختبار
    await prisma.userRole.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.role.deleteMany({
      where: { name: "editor" },
    });
    await prisma.article.deleteMany({
      where: { authorId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });
    await prisma.$disconnect();
  });

  describe("GET /api/articles", () => {
    it("يجب أن يعيد قائمة المقالات", async () => {
      const response = await request(app)
        .get("/api/articles")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it("يجب أن يدعم البحث والفلترة", async () => {
      const response = await request(app)
        .get("/api/articles?search=test&category=" + testCategoryId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.articles).toBeDefined();
    });

    it("يجب أن يدعم الترقيم", async () => {
      const response = await request(app)
        .get("/api/articles?page=1&limit=5")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe("POST /api/articles", () => {
    it("يجب أن ينشئ مقالاً جديداً", async () => {
      const articleData = {
        title: "مقال اختبار",
        summary: "ملخص المقال",
        content: "محتوى المقال التفصيلي",
        categoryId: testCategoryId,
        tags: ["اختبار", "تقنية"],
        metaTitle: "مقال اختبار",
        metaDescription: "وصف المقال",
        status: "draft",
      };

      const response = await request(app)
        .post("/api/articles")
        .set("Authorization", `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.article.title).toBe(articleData.title);
      expect(response.body.article.slug).toBeDefined();
      
      testArticleId = response.body.article.id;
    });

    it("يجب أن يرفض إنشاء مقال بدون مصادقة", async () => {
      const articleData = {
        title: "مقال اختبار",
        summary: "ملخص المقال",
        content: "محتوى المقال",
        categoryId: testCategoryId,
      };

      await request(app)
        .post("/api/articles")
        .send(articleData)
        .expect(401);
    });

    it("يجب أن يرفض بيانات غير صالحة", async () => {
      const invalidData = {
        title: "", // عنوان فارغ
        summary: "ملخص المقال",
        content: "محتوى المقال",
        categoryId: "invalid-uuid", // معرف غير صالح
      };

      await request(app)
        .post("/api/articles")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe("GET /api/articles/:id", () => {
    it("يجب أن يعيد مقالاً واحداً", async () => {
      const response = await request(app)
        .get(`/api/articles/${testArticleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.article.id).toBe(testArticleId);
      expect(response.body.article.author).toBeDefined();
      expect(response.body.article.category).toBeDefined();
    });

    it("يجب أن يزيد عدد المشاهدات", async () => {
      const response1 = await request(app)
        .get(`/api/articles/${testArticleId}`)
        .expect(200);

      const initialViews = response1.body.article.viewsCount;

      await request(app)
        .get(`/api/articles/${testArticleId}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/articles/${testArticleId}`)
        .expect(200);

      expect(response2.body.article.viewsCount).toBe(initialViews + 1);
    });

    it("يجب أن يرجع 404 للمقال غير الموجود", async () => {
      await request(app)
        .get("/api/articles/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });
  });

  describe("PUT /api/articles/:id", () => {
    it("يجب أن يحدث المقال", async () => {
      const updateData = {
        title: "مقال اختبار محدث",
        summary: "ملخص محدث",
        content: "محتوى محدث",
      };

      const response = await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.article.title).toBe(updateData.title);
      expect(response.body.article.slug).toContain("محدث");
    });

    it("يجب أن يرفض تحديث مقال غير مملوك", async () => {
      // إنشاء مستخدم آخر
      const otherUser = await prisma.user.create({
        data: {
          name: "Other User",
          email: "other@example.com",
          hashedPassword: "hashedpassword",
          status: "ACTIVE",
        },
      });

      const otherTokens = generateTokens(otherUser.id);

      await request(app)
        .put(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${otherTokens.accessToken}`)
        .send({ title: "محاولة تحديث" })
        .expect(403);

      // تنظيف
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe("PATCH /api/articles/:id/publish", () => {
    it("يجب أن ينشر المقال", async () => {
      const response = await request(app)
        .patch(`/api/articles/${testArticleId}/publish`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ publish: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.article.status).toBe("published");
      expect(response.body.article.publishedAt).toBeDefined();
    });

    it("يجب أن يلغي نشر المقال", async () => {
      const response = await request(app)
        .patch(`/api/articles/${testArticleId}/publish`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ publish: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.article.status).toBe("draft");
    });
  });

  describe("POST /api/articles/:id/like", () => {
    it("يجب أن يضيف إعجاب", async () => {
      const response = await request(app)
        .post(`/api/articles/${testArticleId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.liked).toBe(true);
    });

    it("يجب أن يزيل الإعجاب عند الضغط مرة ثانية", async () => {
      const response = await request(app)
        .post(`/api/articles/${testArticleId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.liked).toBe(false);
    });
  });

  describe("DELETE /api/articles/:id", () => {
    it("يجب أن يحذف المقال", async () => {
      const response = await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("تم حذف المقال بنجاح");
    });

    it("يجب أن يرجع 404 عند محاولة حذف مقال محذوف", async () => {
      await request(app)
        .delete(`/api/articles/${testArticleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("Integration Tests", () => {
    it("يجب أن يعمل التدفق الكامل للمقال", async () => {
      // إنشاء مقال
      const createResponse = await request(app)
        .post("/api/articles")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "مقال تدفق كامل",
          summary: "ملخص المقال",
          content: "محتوى المقال",
          categoryId: testCategoryId,
          tags: ["تدفق", "اختبار"],
        })
        .expect(201);

      const articleId = createResponse.body.article.id;

      // قراءة المقال
      await request(app)
        .get(`/api/articles/${articleId}`)
        .expect(200);

      // تحديث المقال
      await request(app)
        .put(`/api/articles/${articleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "مقال تدفق كامل محدث",
          content: "محتوى محدث",
        })
        .expect(200);

      // نشر المقال
      await request(app)
        .patch(`/api/articles/${articleId}/publish`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ publish: true })
        .expect(200);

      // إضافة إعجاب
      await request(app)
        .post(`/api/articles/${articleId}/like`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // حذف المقال
      await request(app)
        .delete(`/api/articles/${articleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
    });
  });
}); 