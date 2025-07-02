const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function syncTeamToUsers() {
  try {
    console.log('🔄 مزامنة أعضاء الفريق مع المستخدمين...');
    
    // قراءة ملف أعضاء الفريق
    const teamData = await fs.readFile(
      path.join(__dirname, '..', 'data', 'team-members.json'),
      'utf-8'
    );
    const teamMembers = JSON.parse(teamData);
    
    let created = 0;
    let updated = 0;
    
    for (const member of teamMembers) {
      if (!member.isActive) continue;
      
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { email: member.email }
      });
      
      if (existingUser) {
        // تحديث المستخدم الموجود
        await prisma.user.update({
          where: { email: member.email },
          data: {
            name: member.name,
            avatar: member.avatar,
            role: mapRole(member.roleId),
            isVerified: true
          }
        });
        updated++;
        console.log(`✅ تم تحديث: ${member.name}`);
      } else {
        // إنشاء مستخدم جديد
        const newUser = await prisma.user.create({
          data: {
            id: member.id, // استخدام نفس معرف عضو الفريق
            email: member.email,
            name: member.name,
            avatar: member.avatar,
            role: mapRole(member.roleId),
            isVerified: true,
            isAdmin: ['admin', 'content-manager'].includes(member.roleId)
          }
        });
        created++;
        console.log(`➕ تم إنشاء: ${member.name} (${newUser.id})`);
      }
    }
    
    console.log(`\n✨ تمت المزامنة بنجاح!`);
    console.log(`   - تم إنشاء: ${created} مستخدم`);
    console.log(`   - تم تحديث: ${updated} مستخدم`);
    
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تحويل أدوار الفريق إلى أدوار المستخدمين
function mapRole(teamRole) {
  const roleMap = {
    'admin': 'admin',
    'editor': 'editor',
    'content-manager': 'editor',
    'correspondent': 'author',
    'media': 'author',
    'moderator': 'moderator'
  };
  
  return roleMap[teamRole] || 'author';
}

syncTeamToUsers(); 