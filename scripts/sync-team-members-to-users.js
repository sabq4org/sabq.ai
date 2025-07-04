const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function syncTeamMembersToUsers() {
  try {
    console.log('🔄 بدء مزامنة أعضاء الفريق إلى جدول users...\n');
    
    // قراءة ملف أعضاء الفريق
    const teamMembersPath = path.join(process.cwd(), 'data', 'team-members.json');
    const teamMembersData = await fs.readFile(teamMembersPath, 'utf-8');
    const teamMembers = JSON.parse(teamMembersData);
    
    console.log(`📊 عدد أعضاء الفريق: ${teamMembers.length}`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    
    for (const member of teamMembers) {
      try {
        // التحقق من وجود المستخدم
        const existingUser = await prisma.user.findUnique({
          where: { id: member.id }
        });
        
        if (existingUser) {
          console.log(`⏭️  ${member.name} موجود بالفعل`);
          skippedCount++;
          continue;
        }
        
        // تحويل الدور من team roles إلى user roles
        const userRole = mapTeamRoleToUserRole(member.roleId);
        
        // إنشاء مستخدم جديد
        await prisma.user.create({
          data: {
            id: member.id,
            name: member.name,
            email: member.email,
            passwordHash: '', // بدون كلمة مرور للمراسلين
            role: userRole,
            isAdmin: member.roleId === 'admin',
            isVerified: member.isVerified || false,
            avatar: member.avatar,
            createdAt: new Date(member.createdAt),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ تم إضافة ${member.name} (${userRole})`);
        syncedCount++;
        
      } catch (error) {
        console.error(`❌ خطأ في إضافة ${member.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 ملخص المزامنة:`);
    console.log(`   - تم إضافة: ${syncedCount} مستخدم`);
    console.log(`   - تم تخطي: ${skippedCount} مستخدم (موجود مسبقاً)`);
    
    // عرض جميع المستخدمين
    console.log('\n👥 جميع المستخدمين في قاعدة البيانات:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    allUsers.forEach((user, index) => {
      const verified = user.isVerified ? '✓' : '✗';
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} ${verified}`);
    });
    
    console.log(`\n✅ تمت المزامنة بنجاح!`);
    
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function mapTeamRoleToUserRole(teamRole) {
  const roleMap = {
    'admin': 'admin',
    'editor': 'editor',
    'content-manager': 'editor',
    'correspondent': 'writer',
    'media': 'writer',
    'moderator': 'moderator'
  };
  
  return roleMap[teamRole] || 'user';
}

// تشغيل السكريبت
syncTeamMembersToUsers(); 