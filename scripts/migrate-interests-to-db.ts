import { PrismaClient } from '../lib/generated/prisma';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateInterests() {
  try {
    console.log('🚀 بدء ترحيل الاهتمامات إلى قاعدة البيانات...');
    
    // قراءة ملف user_preferences.json
    const prefsPath = path.join(process.cwd(), 'data', 'user_preferences.json');
    
    try {
      const fileContent = await fs.readFile(prefsPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (data.preferences && Array.isArray(data.preferences)) {
        // معالجة التفضيلات من التنسيق القديم
        const userInterestsMap = new Map<string, Set<string>>();
        
        for (const pref of data.preferences) {
          if (pref.user_id && pref.category_id) {
            if (!userInterestsMap.has(pref.user_id)) {
              userInterestsMap.set(pref.user_id, new Set());
            }
            userInterestsMap.get(pref.user_id)!.add(pref.category_id);
          }
        }
        
        // جلب التصنيفات للحصول على slugs
        const categories = await prisma.categories.findMany({
          select: { id: true, slug: true, name: true }
        });
        
        const categoryMap = new Map(categories.map(c => [c.id, c]));
        
        // حفظ الاهتمامات في قاعدة البيانات
        for (const [userId, categoryIds] of userInterestsMap) {
          console.log(`\n📝 معالجة المستخدم: ${userId}`);
          
          // التحقق من وجود المستخدم
          const userExists = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!userExists) {
            console.log(`⚠️  المستخدم ${userId} غير موجود، تخطي...`);
            continue;
          }
          
          // حذف الاهتمامات القديمة
          await prisma.userInterest.deleteMany({
            where: { userId }
          });
          
          // إضافة الاهتمامات الجديدة
          const interests: { userId: string; interest: string; score: number; source: string; }[] = [];
          for (const categoryId of categoryIds) {
            const category = categoryMap.get(categoryId);
            if (category) {
              interests.push({
                userId,
                interest: category.slug,
                score: 1.0,
                source: 'migration'
              });
            }
          }
          
          if (interests.length > 0) {
            await prisma.userInterest.createMany({
              data: interests
            });
            console.log(`✅ تم ترحيل ${interests.length} اهتمام`);
          }
        }
      }
      
      // معالجة التنسيق الجديد (إن وجد)
      for (const [userId, prefs] of Object.entries(data)) {
        if (typeof prefs === 'object' && prefs !== null && 'categories' in prefs) {
          console.log(`\n📝 معالجة المستخدم (تنسيق جديد): ${userId}`);
          
          // التحقق من وجود المستخدم
          const userExists = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!userExists) {
            console.log(`⚠️  المستخدم ${userId} غير موجود، تخطي...`);
            continue;
          }
          
          const userPrefs = prefs as any;
          const categoryIds = Object.keys(userPrefs.categories || {});
          
          if (categoryIds.length > 0) {
            // جلب التصنيفات
            const categories = await prisma.categories.findMany({
              where: { id: { in: categoryIds } },
              select: { id: true, slug: true }
            });
            
            if (categories.length > 0) {
              // حذف الاهتمامات القديمة
              await prisma.userInterest.deleteMany({
                where: { userId }
              });
              
              // إضافة الاهتمامات الجديدة
              await prisma.userInterest.createMany({
                data: categories.map(cat => ({
                  userId,
                  interest: cat.slug,
                  score: userPrefs.categories[cat.id] || 1.0,
                  source: 'migration'
                }))
              });
              
              console.log(`✅ تم ترحيل ${categories.length} اهتمام`);
            }
          }
        }
      }
      
      console.log('\n✅ اكتمل ترحيل الاهتمامات بنجاح!');
      
    } catch (error) {
      console.error('⚠️  ملف user_preferences.json غير موجود أو فارغ');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الترحيل:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الترحيل
migrateInterests(); 