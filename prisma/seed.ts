import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('بدء إضافة البيانات التجريبية...');

  // إنشاء مستخدم تجريبي
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'مستخدم تجريبي',
      password: hashedPassword,
      role: 'regular',
      status: 'active',
      isVerified: true,
      loyaltyPoints: 100,
      profile: {
        create: {
          avatar: '/default-avatar.png',
          bio: 'مستخدم تجريبي للنظام',
          preferences: {
            theme: 'light',
            language: 'ar',
            notifications: true
          }
        }
      }
    },
  });

  console.log('تم إنشاء المستخدم التجريبي:', user.email);

  // إنشاء مستخدم مدير
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'مدير النظام',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      isVerified: true,
      loyaltyPoints: 500,
      profile: {
        create: {
          avatar: '/default-avatar.png',
          bio: 'مدير النظام',
          preferences: {
            theme: 'dark',
            language: 'ar',
            notifications: true
          }
        }
      }
    },
  });

  console.log('تم إنشاء مدير النظام:', adminUser.email);

  console.log('تم إضافة البيانات التجريبية بنجاح!');
}

main()
  .catch((e) => {
    console.error('خطأ في إضافة البيانات التجريبية:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 