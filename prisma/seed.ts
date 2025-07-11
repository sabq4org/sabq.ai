/**
 * سكريبت البيانات التجريبية لنظام سبق الذكي
 * Seed script for Sabq AI CMS
 * @version 2.1.0
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إدراج البيانات التجريبية...');

  // 1. إنشاء الصلاحيات الأساسية
  const permissions = [
    // صلاحيات إدارة المستخدمين
    { code: 'manage:users', name: 'إدارة المستخدمين', name_ar: 'إدارة المستخدمين', category: 'users', resource: 'user', action: 'manage', is_dangerous: true, is_system: true },
    { code: 'create:users', name: 'إنشاء مستخدمين', name_ar: 'إنشاء مستخدمين', category: 'users', resource: 'user', action: 'create', is_system: true },
    { code: 'edit:users', name: 'تعديل المستخدمين', name_ar: 'تعديل المستخدمين', category: 'users', resource: 'user', action: 'update', is_system: true },
    { code: 'delete:users', name: 'حذف المستخدمين', name_ar: 'حذف المستخدمين', category: 'users', resource: 'user', action: 'delete', is_dangerous: true, is_system: true },
    { code: 'view:users', name: 'عرض المستخدمين', name_ar: 'عرض المستخدمين', category: 'users', resource: 'user', action: 'read', is_system: true },
    
    // صلاحيات إدارة الأدوار والصلاحيات
    { code: 'manage:roles', name: 'إدارة الأدوار', name_ar: 'إدارة الأدوار', category: 'system', resource: 'role', action: 'manage', is_dangerous: true, is_system: true },
    { code: 'manage:permissions', name: 'إدارة الصلاحيات', name_ar: 'إدارة الصلاحيات', category: 'system', resource: 'permission', action: 'manage', is_dangerous: true, is_system: true },
    { code: 'manage:teams', name: 'إدارة الفرق', name_ar: 'إدارة الفرق', category: 'teams', resource: 'team', action: 'manage', is_system: true },
    
    // صلاحيات المحتوى
    { code: 'manage:articles', name: 'إدارة المقالات', name_ar: 'إدارة المقالات', category: 'content', resource: 'article', action: 'manage', is_system: true },
    { code: 'create:articles', name: 'إنشاء مقالات', name_ar: 'إنشاء مقالات', category: 'content', resource: 'article', action: 'create', is_system: true },
    { code: 'edit:articles', name: 'تعديل المقالات', name_ar: 'تعديل المقالات', category: 'content', resource: 'article', action: 'update', is_system: true },
    { code: 'edit:own_articles', name: 'تعديل مقالاتي', name_ar: 'تعديل مقالاتي', category: 'content', resource: 'article', action: 'update', scope: 'own', is_system: true },
    { code: 'delete:articles', name: 'حذف المقالات', name_ar: 'حذف المقالات', category: 'content', resource: 'article', action: 'delete', is_dangerous: true, is_system: true },
    { code: 'publish:articles', name: 'نشر المقالات', name_ar: 'نشر المقالات', category: 'content', resource: 'article', action: 'publish', is_system: true },
    { code: 'view:articles', name: 'عرض المقالات', name_ar: 'عرض المقالات', category: 'content', resource: 'article', action: 'read', is_system: true },
    
    // صلاحيات الإشراف
    { code: 'moderate:comments', name: 'إشراف التعليقات', name_ar: 'إشراف التعليقات', category: 'moderation', resource: 'comment', action: 'moderate', is_system: true },
    { code: 'approve:comments', name: 'الموافقة على التعليقات', name_ar: 'الموافقة على التعليقات', category: 'moderation', resource: 'comment', action: 'approve', is_system: true },
    { code: 'reject:comments', name: 'رفض التعليقات', name_ar: 'رفض التعليقات', category: 'moderation', resource: 'comment', action: 'reject', is_system: true },
    { code: 'manage:reports', name: 'إدارة البلاغات', name_ar: 'إدارة البلاغات', category: 'moderation', resource: 'report', action: 'manage', is_system: true },
    
    // صلاحيات التحليلات
    { code: 'view:analytics', name: 'عرض التحليلات', name_ar: 'عرض التحليلات', category: 'analytics', resource: 'analytics', action: 'read', is_system: true },
    { code: 'view:advanced_analytics', name: 'عرض التحليلات المتقدمة', name_ar: 'عرض التحليلات المتقدمة', category: 'analytics', resource: 'analytics', action: 'read', is_system: true },
    { code: 'export:analytics', name: 'تصدير التحليلات', name_ar: 'تصدير التحليلات', category: 'analytics', resource: 'analytics', action: 'export', is_system: true },
    
    // صلاحيات النظام
    { code: 'view:audit_logs', name: 'عرض سجل الأنشطة', name_ar: 'عرض سجل الأنشطة', category: 'system', resource: 'audit_log', action: 'read', is_system: true },
    { code: 'manage:integrations', name: 'إدارة التكاملات', name_ar: 'إدارة التكاملات', category: 'system', resource: 'integration', action: 'manage', is_system: true },
    { code: 'view:system_health', name: 'عرض حالة النظام', name_ar: 'عرض حالة النظام', category: 'system', resource: 'system', action: 'read', is_system: true },
    
    // صلاحيات الوسائط
    { code: 'upload:media', name: 'رفع الوسائط', name_ar: 'رفع الوسائط', category: 'media', resource: 'media', action: 'create', is_system: true },
    { code: 'manage:media', name: 'إدارة الوسائط', name_ar: 'إدارة الوسائط', category: 'media', resource: 'media', action: 'manage', is_system: true },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission
    });
  }

  console.log('✅ تم إنشاء الصلاحيات الأساسية');

  // 2. إنشاء الأدوار الافتراضية
  const roles = [
    {
      name: 'super_admin',
      name_ar: 'مدير عام',
      description: 'صلاحيات كاملة لإدارة النظام',
      description_ar: 'صلاحيات كاملة لإدارة النظام',
      color: '#DC2626',
      icon: '👑',
      is_system: true,
      sort_order: 1
    },
    {
      name: 'admin',
      name_ar: 'مدير',
      description: 'إدارة المحتوى والمستخدمين',
      description_ar: 'إدارة المحتوى والمستخدمين',
      color: '#7C3AED',
      icon: '⚙️',
      is_system: true,
      sort_order: 2
    },
    {
      name: 'editor_chief',
      name_ar: 'رئيس تحرير',
      description: 'إشراف تحريري وإدارة المحتوى',
      description_ar: 'إشراف تحريري وإدارة المحتوى',
      color: '#059669',
      icon: '📝',
      is_system: true,
      sort_order: 3
    },
    {
      name: 'editor',
      name_ar: 'محرر',
      description: 'تحرير ونشر المقالات',
      description_ar: 'تحرير ونشر المقالات',
      color: '#0D9488',
      icon: '✏️',
      is_system: true,
      sort_order: 4
    },
    {
      name: 'author',
      name_ar: 'كاتب',
      description: 'كتابة وتعديل المقالات الخاصة',
      description_ar: 'كتابة وتعديل المقالات الخاصة',
      color: '#0891B2',
      icon: '✍️',
      is_system: true,
      sort_order: 5
    },
    {
      name: 'moderator',
      name_ar: 'مراقب',
      description: 'إشراف على التعليقات والمحتوى',
      description_ar: 'إشراف على التعليقات والمحتوى',
      color: '#EA580C',
      icon: '🛡️',
      is_system: true,
      sort_order: 6
    },
    {
      name: 'analyst',
      name_ar: 'محلل',
      description: 'عرض وتحليل الإحصائيات',
      description_ar: 'عرض وتحليل الإحصائيات',
      color: '#9333EA',
      icon: '📊',
      is_system: true,
      sort_order: 7
    },
    {
      name: 'reader',
      name_ar: 'قارئ',
      description: 'قراءة المحتوى فقط',
      description_ar: 'قراءة المحتوى فقط',
      color: '#6B7280',
      icon: '👤',
      is_system: true,
      sort_order: 8
    }
  ];

  const createdRoles = new Map();
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
    createdRoles.set(role.name, createdRole);
  }

  console.log('✅ تم إنشاء الأدوار الافتراضية');

  // 3. ربط الأدوار بالصلاحيات
  const rolePermissions = [
    // مدير عام - جميع الصلاحيات
    { role: 'super_admin', permissions: permissions.map(p => p.code) },
    
    // مدير - معظم الصلاحيات ماعدا النظامية الخطيرة
    { role: 'admin', permissions: [
      'manage:users', 'create:users', 'edit:users', 'view:users',
      'manage:articles', 'create:articles', 'edit:articles', 'delete:articles', 'publish:articles', 'view:articles',
      'moderate:comments', 'approve:comments', 'reject:comments', 'manage:reports',
      'view:analytics', 'view:advanced_analytics', 'export:analytics',
      'view:audit_logs', 'manage:integrations', 'view:system_health',
      'upload:media', 'manage:media', 'manage:teams'
    ]},
    
    // رئيس تحرير
    { role: 'editor_chief', permissions: [
      'view:users',
      'manage:articles', 'create:articles', 'edit:articles', 'delete:articles', 'publish:articles', 'view:articles',
      'moderate:comments', 'approve:comments', 'reject:comments', 'manage:reports',
      'view:analytics', 'export:analytics',
      'upload:media', 'manage:media'
    ]},
    
    // محرر
    { role: 'editor', permissions: [
      'create:articles', 'edit:articles', 'publish:articles', 'view:articles',
      'moderate:comments', 'approve:comments', 'reject:comments',
      'view:analytics',
      'upload:media'
    ]},
    
    // كاتب
    { role: 'author', permissions: [
      'create:articles', 'edit:own_articles', 'view:articles',
      'upload:media'
    ]},
    
    // مراقب
    { role: 'moderator', permissions: [
      'moderate:comments', 'approve:comments', 'reject:comments', 'manage:reports',
      'view:articles'
    ]},
    
    // محلل
    { role: 'analyst', permissions: [
      'view:analytics', 'view:advanced_analytics', 'export:analytics',
      'view:articles'
    ]},
    
    // قارئ
    { role: 'reader', permissions: [
      'view:articles'
    ]}
  ];

  for (const rolePermission of rolePermissions) {
    const role = createdRoles.get(rolePermission.role);
    if (role) {
      for (const permissionCode of rolePermission.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { code: permissionCode }
        });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: { 
              role_id_permission_id: { 
                role_id: role.id, 
                permission_id: permission.id 
              } 
            },
            update: {},
            create: {
              role_id: role.id,
              permission_id: permission.id
            }
          });
        }
      }
    }
  }

  console.log('✅ تم ربط الأدوار بالصلاحيات');

  // 4. إنشاء مستخدمين تجريبيين
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sabq.org' },
    update: {},
    create: {
      email: 'admin@sabq.org',
      name: 'المدير العام',
      password_hash: await hash('admin123', 10),
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: true,
          mobile: true
        }
      }
    }
  });

  // ربط المدير العام بدور المدير العام
  const superAdminRole = createdRoles.get('super_admin');
  if (superAdminRole) {
    try {
      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: superAdminRole.id
        }
      });
    } catch (error) {
      console.log('✅ دور المدير العام موجود بالفعل');
    }
  }

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@sabq.org' },
    update: {},
    create: {
      email: 'editor@sabq.org',
      name: 'محرر الأخبار',
      password_hash: await hash('editor123', 10),
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: false,
          mobile: true
        }
      }
    }
  });

  const writerUser = await prisma.user.upsert({
    where: { email: 'writer@sabq.org' },
    update: {},
    create: {
      email: 'writer@sabq.org',
      name: 'كاتب المقالات',
      password_hash: await hash('writer123', 10),
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        }
      }
    }
  });

  // ربط المحرر بدور المحرر
  const editorRole = createdRoles.get('editor');
  if (editorRole) {
    try {
      await prisma.userRole.create({
        data: {
          user_id: editorUser.id,
          role_id: editorRole.id
        }
      });
    } catch (error) {
      console.log('✅ دور المحرر موجود بالفعل');
    }
  }

  // ربط الكاتب بدور الكاتب
  const authorRole = createdRoles.get('author');
  if (authorRole) {
    try {
      await prisma.userRole.create({
        data: {
          user_id: writerUser.id,
          role_id: authorRole.id
        }
      });
    } catch (error) {
      console.log('✅ دور الكاتب موجود بالفعل');
    }
  }

  console.log('✅ تم إنشاء المستخدمين التجريبيين وربطهم بالأدوار');

  // إنشاء تصنيفات المقالات
  const categories = [
    { name: 'محليات', slug: 'local', description: 'أخبار المناطق والمدن السعودية' },
    { name: 'العالم', slug: 'world', description: 'أخبار العالم والتحليلات الدولية' },
    { name: 'حياتنا', slug: 'life', description: 'نمط الحياة والصحة والأسرة' },
    { name: 'محطات', slug: 'stations', description: 'تقارير خاصة وملفات متنوعة' },
    { name: 'رياضة', slug: 'sports', description: 'أخبار رياضية محلية وعالمية' },
    { name: 'سياحة', slug: 'tourism', description: 'تقارير سياحية ومواقع مميزة' },
    { name: 'أعمال', slug: 'business', description: 'أخبار الأعمال والشركات وريادة الأعمال' },
    { name: 'تقنية', slug: 'technology', description: 'أخبار وتطورات التقنية والذكاء الاصطناعي' },
    { name: 'سيارات', slug: 'cars', description: 'أخبار وتقارير السيارات' },
    { name: 'ميديا', slug: 'media', description: 'فيديوهات وصور وإعلام رقمي' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
  }

  console.log('✅ تم إنشاء التصنيفات');

  // إنشاء مقالات تجريبية
  const sampleArticles = [
    {
      title: 'المملكة تطلق رؤية 2030 الجديدة للذكاء الاصطناعي',
      slug: 'saudi-ai-vision-2030',
      summary: 'تعلن المملكة عن استراتيجية جديدة لتطوير الذكاء الاصطناعي كجزء من رؤية 2030',
      content: `
        <h2>رؤية طموحة للمستقبل</h2>
        <p>أعلنت المملكة العربية السعودية عن استراتيجية شاملة لتطوير الذكاء الاصطناعي...</p>
        <h3>المحاور الرئيسية</h3>
        <ul>
          <li>التعليم والبحث العلمي</li>
          <li>الصحة والطب</li>
          <li>النقل والمواصلات</li>
          <li>الطاقة والبيئة</li>
        </ul>
        <p>تهدف هذه الاستراتيجية إلى جعل المملكة مركزاً عالمياً للذكاء الاصطناعي...</p>
      `,
      category: 'technology',
      status: 'published',
      featured: true,
      authorId: adminUser.id
    },
    {
      title: 'نيوم تكشف عن أحدث مشاريع المدينة الذكية',
      slug: 'neom-smart-city-projects',
      summary: 'مشاريع جديدة في نيوم تعيد تعريف مفهوم المدن الذكية',
      content: `
        <h2>مشاريع ثورية في نيوم</h2>
        <p>كشفت مدينة نيوم عن مجموعة من المشاريع الثورية...</p>
        <h3>المشاريع الجديدة</h3>
        <ul>
          <li>مركز الأبحاث التقنية</li>
          <li>منطقة الذكاء الاصطناعي</li>
          <li>مختبرات الطاقة المتجددة</li>
        </ul>
      `,
      category: 'local',
      status: 'published',
      featured: true,
      authorId: editorUser.id
    },
    {
      title: 'تطورات جديدة في عالم الطب الرقمي',
      slug: 'digital-medicine-developments',
      summary: 'أحدث التطورات في مجال الطب الرقمي والتطبيقات الصحية',
      content: `
        <h2>ثورة في الرعاية الصحية</h2>
        <p>يشهد عالم الطب تطورات مذهلة في مجال التقنيات الرقمية...</p>
        <h3>التطبيقات الحديثة</h3>
        <ul>
          <li>التشخيص بالذكاء الاصطناعي</li>
          <li>الجراحة الروبوتية</li>
          <li>الطب الدقيق</li>
        </ul>
      `,
      category: 'life',
      status: 'published',
      featured: false,
      authorId: writerUser.id
    },
    {
      title: 'بطولة كأس العالم للسعودية 2034',
      slug: 'saudi-world-cup-2034',
      summary: 'المملكة تستعد لاستضافة كأس العالم 2034 بخطط طموحة',
      content: `
        <h2>حلم يصبح حقيقة</h2>
        <p>تستعد المملكة العربية السعودية لاستضافة كأس العالم 2034...</p>
        <h3>الاستعدادات</h3>
        <ul>
          <li>بناء ملاعب عالمية</li>
          <li>تطوير البنية التحتية</li>
          <li>برامج الضيافة</li>
        </ul>
      `,
      category: 'sports',
      status: 'published',
      featured: true,
      authorId: adminUser.id
    },
    {
      title: 'أسواق الأسهم السعودية تحقق أرقام قياسية',
      slug: 'saudi-stock-market-records',
      summary: 'السوق السعودي يحقق مستويات تاريخية جديدة',
      content: `
        <h2>نمو مستمر في الأسواق</h2>
        <p>حققت الأسواق السعودية أرقاماً قياسية جديدة...</p>
        <h3>أبرز القطاعات</h3>
        <ul>
          <li>قطاع التقنية</li>
          <li>قطاع الطاقة</li>
          <li>قطاع البنوك</li>
        </ul>
      `,
      category: 'business',
      status: 'published',
      featured: false,
      authorId: editorUser.id
    }
  ];

  for (const article of sampleArticles) {
    const category = await prisma.category.findUnique({
      where: { slug: article.category }
    });

    if (category) {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {},
        create: {
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          category_id: category.id,
          author_id: article.authorId,
          status: article.status,
          featured: article.featured,
          published_at: article.status === 'published' ? new Date() : null,
          seo_data: {
            title: article.title,
            description: article.summary,
            keywords: ['أخبار', 'المملكة', 'تقنية', 'رؤية2030']
          }
        }
      });
    }
  }

  console.log('✅ تم إنشاء المقالات التجريبية');

  // إنشاء بيانات تحليلية تجريبية
  const articles = await prisma.article.findMany();
  
  for (const article of articles) {
    // إنشاء أحداث تحليلية متنوعة
    const events = [
      'article_view', 'article_like', 'article_share', 
      'comment_add', 'bookmark_add', 'read_time'
    ];

    for (let i = 0; i < 20; i++) {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      await prisma.analyticsEvent.create({
        data: {
          event_type: randomEvent,
          article_id: article.id,
          user_id: Math.random() > 0.5 ? adminUser.id : null,
          event_data: {
            timestamp: randomDate.toISOString(),
            source: 'web',
            device: Math.random() > 0.5 ? 'desktop' : 'mobile',
            location: 'Saudi Arabia',
            duration: randomEvent === 'read_time' ? Math.floor(Math.random() * 300) : null
          },
          timestamp: randomDate
        }
      });
    }
  }

  console.log('✅ تم إنشاء البيانات التحليلية');

  // إنشاء بيانات تكامل تجريبية
  const integrations = [
    {
      name: 'Google Analytics',
      type: 'analytics',
      config: {
        trackingId: 'GA-XXXXXXXXX',
        enabled: true,
        events: ['page_view', 'article_view', 'user_signup']
      },
      is_active: true
    },
    {
      name: 'Facebook Pixel',
      type: 'marketing',
      config: {
        pixelId: 'XXXXXXXXX',
        enabled: true,
        events: ['page_view', 'article_view', 'conversion']
      },
      is_active: true
    },
    {
      name: 'Twitter API',
      type: 'social',
      config: {
        apiKey: 'XXXXXXXXX',
        enabled: false,
        autoShare: true
      },
      is_active: false
    }
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: {},
      create: {
        name: integration.name,
        type: integration.type,
        config: integration.config,
        is_active: integration.is_active,
      },
    });
  }

  console.log('✅ تم إنشاء التكاملات التجريبية');

  console.log('🎉 تم إكمال إدراج البيانات التجريبية بنجاح!');
  console.log('\n📊 ملخص البيانات المدرجة:');
  console.log(`👥 المستخدمون: ${await prisma.user.count()}`);
  console.log(`📂 التصنيفات: ${await prisma.category.count()}`);
  console.log(`📝 المقالات: ${await prisma.article.count()}`);
  console.log(`📈 الأحداث التحليلية: ${await prisma.analyticsEvent.count()}`);
  console.log(`🔗 التكاملات: ${await prisma.integration.count()}`);
  
  console.log('\n🔐 بيانات الدخول التجريبية:');
  console.log('المدير العام: admin@sabq.org / admin123');
  console.log('محرر الأخبار: editor@sabq.org / editor123');
  console.log('كاتب المقالات: writer@sabq.org / writer123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ في إدراج البيانات:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 