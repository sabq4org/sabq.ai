#!/usr/bin/env node

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function syncAuthorsToDB() {
  try {
    console.log('🔄 بدء مزامنة المراسلين من ملف JSON إلى قاعدة البيانات...');
    
    // قراءة ملف المراسلين
    const teamMembersPath = path.join(process.cwd(), 'data', 'team-members.json');
    const teamMembersData = await fs.readFile(teamMembersPath, 'utf-8');
    const teamMembers = JSON.parse(teamMembersData);
    
    console.log(`📊 عدد المراسلين في الملف: ${teamMembers.length}`);
    
    // إضافة كل مراسل إلى قاعدة البيانات
    for (const member of teamMembers) {
      try {
        // التحقق من وجود المستخدم
        const existingUser = await prisma.user.findUnique({
          where: { id: member.id }
        });
        
        if (existingUser) {
          console.log(`✅ ${member.name} موجود بالفعل في قاعدة البيانات`);
          continue;
        }
        
        // إنشاء مستخدم جديد
        const newUser = await prisma.user.create({
          data: {
            id: member.id,
            name: member.name,
            email: member.email,
            passwordHash: member.password || '',
            role: member.roleId || 'user',
            isAdmin: member.roleId === 'admin',
            isVerified: member.isVerified || false,
            createdAt: new Date(member.createdAt),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ تم إضافة ${member.name} إلى قاعدة البيانات`);
        
      } catch (error) {
        console.error(`❌ خطأ في إضافة ${member.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 تم الانتهاء من المزامنة!');
    
    // عرض جميع المستخدمين في قاعدة البيانات
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\n📊 إجمالي المستخدمين في قاعدة البيانات: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في المزامنة:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAuthorsToDB(); 