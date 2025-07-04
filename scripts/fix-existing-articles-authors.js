const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function getFirstAvailableAuthor() {
  try {
    // محاولة جلب المراسلين من ملف team-members.json
    const teamMembersPath = path.join(process.cwd(), 'data', 'team-members.json');
    const teamMembersData = await fs.readFile(teamMembersPath, 'utf-8');
    const teamMembers = JSON.parse(teamMembersData);
    
    // فلترة المراسلين النشطين من نوع correspondent أو editor
    const correspondents = teamMembers.filter(member => 
      member.isActive && 
      (member.roleId === 'correspondent' || member.roleId === 'editor')
    );
    
    if (correspondents.length > 0) {
      console.log(`✅ تم العثور على ${correspondents.length} مراسل في النظام`);
      return correspondents[0]; // إرجاع أول مراسل
    }
    
    // إذا لم نجد، نحاول من قاعدة البيانات
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'author' },
          { role: 'editor' },
          { role: 'writer' }
        ]
      }
    });
    
    if (dbUser) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email
      };
    }
    
    return null;
  } catch (error) {
    console.error('خطأ في جلب المراسل:', error);
    return null;
  }
}

async function fixExistingArticlesAuthors() {
  try {
    console.log('🔍 بدء إصلاح أسماء المؤلفين في المقالات الموجودة...\n');
    
    // جلب أول مراسل متاح
    const defaultAuthor = await getFirstAvailableAuthor();
    
    if (!defaultAuthor) {
      console.error('❌ لا يوجد مراسلين في النظام!');
      console.log('يرجى إضافة مراسل على الأقل من لوحة التحكم');
      return;
    }
    
    console.log(`✅ سيتم استخدام المراسل: ${defaultAuthor.name} (${defaultAuthor.email})`);
    console.log(`   معرف المراسل: ${defaultAuthor.id}\n`);
    
    // البحث عن المقالات التي تحتاج إصلاح
    console.log('🔍 البحث عن المقالات التي تحتاج إصلاح...');
    
    // 1. المقالات بـ authorId = 'default-author-id'
    const articlesWithDefaultAuthor = await prisma.article.findMany({
      where: {
        authorId: 'default-author-id'
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        metadata: true
      }
    });
    
    console.log(`📊 عدد المقالات بـ default-author-id: ${articlesWithDefaultAuthor.length}`);
    
    // 2. المقالات بدون author_name في metadata
    const allArticles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        metadata: true
      }
    });
    
    const articlesWithoutAuthorName = allArticles.filter(article => {
      if (!article.metadata || typeof article.metadata !== 'object') return true;
      const metadata = article.metadata;
      return !metadata.author_name;
    });
    
    console.log(`📊 عدد المقالات بدون author_name في metadata: ${articlesWithoutAuthorName.length}`);
    
    // دمج القوائم بدون تكرار
    const articlesToFix = new Map();
    [...articlesWithDefaultAuthor, ...articlesWithoutAuthorName].forEach(article => {
      articlesToFix.set(article.id, article);
    });
    
    console.log(`\n📊 إجمالي المقالات التي تحتاج إصلاح: ${articlesToFix.size}`);
    
    if (articlesToFix.size === 0) {
      console.log('✅ جميع المقالات لديها مؤلفين صحيحين!');
      return;
    }
    
    // تحديث المقالات
    console.log('\n🔄 بدء تحديث المقالات...');
    let updatedCount = 0;
    
    for (const [articleId, article] of articlesToFix) {
      try {
        const currentMetadata = article.metadata || {};
        
        await prisma.article.update({
          where: { id: articleId },
          data: {
            authorId: article.authorId === 'default-author-id' ? defaultAuthor.id : article.authorId,
            metadata: {
              ...currentMetadata,
              author_name: defaultAuthor.name
            }
          }
        });
        
        updatedCount++;
        console.log(`✅ تم تحديث: "${article.title.substring(0, 50)}..."`);
        
      } catch (error) {
        console.error(`❌ خطأ في تحديث المقال ${articleId}:`, error.message);
      }
    }
    
    console.log(`\n✅ تم تحديث ${updatedCount} مقال بنجاح`);
    
    // التحقق من النتيجة
    console.log('\n📊 التحقق من النتائج...');
    
    const remainingDefault = await prisma.article.count({
      where: { authorId: 'default-author-id' }
    });
    
    const finalCheck = await prisma.article.findMany({
      select: {
        id: true,
        metadata: true
      }
    });
    
    const remainingWithoutName = finalCheck.filter(article => {
      if (!article.metadata || typeof article.metadata !== 'object') return true;
      const metadata = article.metadata;
      return !metadata.author_name;
    }).length;
    
    console.log(`📊 المقالات المتبقية بـ default-author-id: ${remainingDefault}`);
    console.log(`📊 المقالات المتبقية بدون author_name: ${remainingWithoutName}`);
    
    console.log('\n🎉 تم الانتهاء من إصلاح أسماء المؤلفين!');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
fixExistingArticlesAuthors(); 