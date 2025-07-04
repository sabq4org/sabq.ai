const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function addForumTestUsers() {
  console.log('🚀 إضافة المستخدمين التجريبيين للمنتدى...\n');
  
  try {
    // المستخدمون التجريبيون
    const testUsers = [
      { 
        id: 'user1', 
        name: 'أحمد الغامدي', 
        email: 'ahmad@test.com',
        role: 'writer'
      },
      { 
        id: 'user2', 
        name: 'سارة المالكي', 
        email: 'sara@test.com',
        role: 'writer'
      },
      { 
        id: 'user3', 
        name: 'محمد العتيبي', 
        email: 'mohammed@test.com',
        role: 'writer'
      }
    ];

    for (const user of testUsers) {
      try {
        // إنشاء أو تحديث المستخدم
        await prisma.$executeRawUnsafe(`
          INSERT INTO users (id, name, email, role, is_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, true, NOW(), NOW())
          ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            email = VALUES(email),
            role = VALUES(role),
            updated_at = NOW()
        `, user.id, user.name, user.email, user.role);
        
        console.log(`✅ تم إضافة/تحديث المستخدم: ${user.name}`);
      } catch (error) {
        console.error(`❌ خطأ في إضافة المستخدم ${user.name}:`, error.message);
      }
    }

    console.log('\n🎉 تم إضافة جميع المستخدمين التجريبيين!');
    
    // عرض المستخدمين المضافين
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role FROM users WHERE id IN ('user1', 'user2', 'user3')
    `;
    
    console.log('\n📊 المستخدمون في قاعدة البيانات:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n✅ المستخدمون جاهزون الآن للاستخدام في المنتدى!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
addForumTestUsers()
  .catch((error) => {
    console.error('خطأ في التنفيذ:', error);
    process.exit(1);
  }); 