import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// تشفير كلمة المرور
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// البيانات الأولية
async function main() {
  console.log('بدء إدخال البيانات الأولية...');

  try {
    // إنشاء الأدوار
    const adminRole = await prisma.role.create({
      data: {
        name: 'admin',
        permissions: {
          canManageUsers: true,
          canManageArticles: true,
          canManageSettings: true,
          canViewAnalytics: true,
          canManageIntegrations: true,
          canManageBackups: true,
          canModerateComments: true,
          canManageTags: true,
          canManageSections: true,
          canViewAuditLogs: true
        }
      }
    });

    const editorRole = await prisma.role.create({
      data: {
        name: 'editor',
        permissions: {
          canManageUsers: false,
          canManageArticles: true,
          canManageSettings: false,
          canViewAnalytics: true,
          canManageIntegrations: false,
          canManageBackups: false,
          canModerateComments: true,
          canManageTags: true,
          canManageSections: true,
          canViewAuditLogs: false
        }
      }
    });

    const authorRole = await prisma.role.create({
      data: {
        name: 'author',
        permissions: {
          canManageUsers: false,
          canManageArticles: true,
          canManageSettings: false,
          canViewAnalytics: false,
          canManageIntegrations: false,
          canManageBackups: false,
          canModerateComments: false,
          canManageTags: false,
          canManageSections: false,
          canViewAuditLogs: false
        }
      }
    });

    const subscriberRole = await prisma.role.create({
      data: {
        name: 'subscriber',
        permissions: {
          canManageUsers: false,
          canManageArticles: false,
          canManageSettings: false,
          canViewAnalytics: false,
          canManageIntegrations: false,
          canManageBackups: false,
          canModerateComments: false,
          canManageTags: false,
          canManageSections: false,
          canViewAuditLogs: false
        }
      }
    });

    console.log('✅ تم إنشاء الأدوار بنجاح');

    // إنشاء المستخدمين
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sabq.ai',
        hashedPassword: await hashPassword('admin123'),
        name: 'مدير النظام',
        phone: '+966500000001',
        status: 'ACTIVE'
      }
    });

    const editorUser = await prisma.user.create({
      data: {
        email: 'editor@sabq.ai',
        hashedPassword: await hashPassword('editor123'),
        name: 'محرر المحتوى',
        phone: '+966500000002',
        status: 'ACTIVE'
      }
    });

    const authorUser = await prisma.user.create({
      data: {
        email: 'author@sabq.ai',
        hashedPassword: await hashPassword('author123'),
        name: 'كاتب المقالات',
        phone: '+966500000003',
        status: 'ACTIVE'
      }
    });

    const subscriberUser = await prisma.user.create({
      data: {
        email: 'subscriber@sabq.ai',
        hashedPassword: await hashPassword('subscriber123'),
        name: 'مشترك عام',
        phone: '+966500000004',
        status: 'ACTIVE'
      }
    });

    console.log('✅ تم إنشاء المستخدمين بنجاح');

    // ربط المستخدمين بالأدوار
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: editorUser.id, roleId: editorRole.id },
        { userId: authorUser.id, roleId: authorRole.id },
        { userId: subscriberUser.id, roleId: subscriberRole.id }
      ]
    });

    console.log('✅ تم ربط المستخدمين بالأدوار بنجاح');

    // إنشاء الأقسام
    const sections = await prisma.section.createMany({
      data: [
        { name: 'سياسة', description: 'الأخبار السياسية المحلية والدولية' },
        { name: 'اقتصاد', description: 'الأخبار الاقتصادية والمالية' },
        { name: 'تقنية', description: 'التقنية والابتكار' },
        { name: 'رياضة', description: 'الأخبار الرياضية' },
        { name: 'صحة', description: 'الصحة والطب' },
        { name: 'تعليم', description: 'التعليم والتدريب' },
        { name: 'ثقافة', description: 'الثقافة والفنون' },
        { name: 'مجتمع', description: 'الأخبار المجتمعية' },
        { name: 'بيئة', description: 'البيئة والاستدامة' },
        { name: 'منوعات', description: 'أخبار متنوعة' }
      ]
    });

    console.log('✅ تم إنشاء الأقسام بنجاح');

    // الحصول على الأقسام المنشأة
    const allSections = await prisma.section.findMany();
    
    // إنشاء الوسوم
    const tags = await prisma.tag.createMany({
      data: [
        { name: 'عاجل' },
        { name: 'حصري' },
        { name: 'تحليل' },
        { name: 'مقابلة' },
        { name: 'تقرير' },
        { name: 'رأي' },
        { name: 'محلي' },
        { name: 'دولي' },
        { name: 'عربي' },
        { name: 'خليجي' },
        { name: 'سعودي' },
        { name: 'متابعة' },
        { name: 'تطوير' },
        { name: 'استثمار' },
        { name: 'تجارة' }
      ]
    });

    console.log('✅ تم إنشاء الوسوم بنجاح');

    // الحصول على الوسوم المنشأة
    const allTags = await prisma.tag.findMany();

    // إنشاء مقالات تجريبية
    const articles = [];
    for (let i = 1; i <= 20; i++) {
      const randomSection = allSections[Math.floor(Math.random() * allSections.length)];
      const randomAuthor = [authorUser, editorUser][Math.floor(Math.random() * 2)];
      
      const article = await prisma.article.create({
        data: {
          title: `مقال تجريبي رقم ${i} - ${randomSection.name}`,
          slug: `test-article-${i}`,
          summary: `هذا ملخص المقال التجريبي رقم ${i} في قسم ${randomSection.name}`,
          content: `
          <p>هذا محتوى المقال التجريبي رقم ${i} في قسم ${randomSection.name}.</p>
          <p>يحتوي هذا المقال على معلومات مفيدة ومهمة للقراء.</p>
          <p>تم إنشاء هذا المقال لأغراض الاختبار والتطوير.</p>
          <h2>العنوان الفرعي الأول</h2>
          <p>محتوى الفقرة الأولى تحت العنوان الفرعي.</p>
          <h2>العنوان الفرعي الثاني</h2>
          <p>محتوى الفقرة الثانية تحت العنوان الفرعي.</p>
          <p>خاتمة المقال التجريبي رقم ${i}.</p>
          `,
          authorId: randomAuthor.id,
          sectionId: randomSection.id,
          status: i <= 15 ? 'PUBLISHED' : 'DRAFT',
          publishedAt: i <= 15 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
        }
      });

      articles.push(article);
    }

    console.log('✅ تم إنشاء المقالات التجريبية بنجاح');

    // ربط المقالات بالوسوم
    for (const article of articles) {
      const randomTagsCount = Math.floor(Math.random() * 3) + 1;
      const randomTags = allTags.sort(() => 0.5 - Math.random()).slice(0, randomTagsCount);
      
      await prisma.articleTag.createMany({
        data: randomTags.map(tag => ({
          articleId: article.id,
          tagId: tag.id
        }))
      });
    }

    console.log('✅ تم ربط المقالات بالوسوم بنجاح');

    // إنشاء وسائط للمقالات
    const mediaUrls = [
      'https://res.cloudinary.com/sabq-ai/image/upload/v1/articles/image1.jpg',
      'https://res.cloudinary.com/sabq-ai/image/upload/v1/articles/image2.jpg',
      'https://res.cloudinary.com/sabq-ai/image/upload/v1/articles/image3.jpg',
      'https://res.cloudinary.com/sabq-ai/image/upload/v1/articles/image4.jpg',
      'https://res.cloudinary.com/sabq-ai/image/upload/v1/articles/image5.jpg'
    ];

    for (const article of articles.slice(0, 10)) {
      await prisma.articleMedia.create({
        data: {
          articleId: article.id,
          mediaType: 'IMAGE',
          url: mediaUrls[Math.floor(Math.random() * mediaUrls.length)],
          metadata: {
            alt: `صورة المقال ${article.title}`,
            caption: `صورة توضيحية للمقال`,
            width: 800,
            height: 600,
            size: 150000
          }
        }
      });
    }

    console.log('✅ تم إنشاء وسائط المقالات بنجاح');

    // إنشاء تعليقات تجريبية
    const publishedArticles = articles.filter(a => a.status === 'PUBLISHED');
    for (const article of publishedArticles.slice(0, 5)) {
      // تعليق رئيسي
      const mainComment = await prisma.articleComment.create({
        data: {
          articleId: article.id,
          userId: subscriberUser.id,
          content: `تعليق رائع على المقال "${article.title}". المحتوى مفيد جداً.`,
          status: 'APPROVED'
        }
      });

      // رد على التعليق الرئيسي
      await prisma.articleComment.create({
        data: {
          articleId: article.id,
          userId: authorUser.id,
          content: 'شكراً لك على التعليق الإيجابي. سعيد بأن المحتوى مفيد.',
          status: 'APPROVED',
          parentId: mainComment.id
        }
      });
    }

    console.log('✅ تم إنشاء التعليقات التجريبية بنجاح');

    // إنشاء أحداث تحليلية
    const eventTypes = ['PAGE_VIEW', 'SCROLL', 'CLICK', 'READING_TIME', 'LIKE', 'SHARE', 'BOOKMARK'];
    
    for (const article of publishedArticles.slice(0, 5)) {
      for (let i = 0; i < 10; i++) {
        await prisma.articleAnalyticsEvent.create({
          data: {
            articleId: article.id,
            userId: Math.random() > 0.5 ? subscriberUser.id : null,
            eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
            eventData: {
              timestamp: new Date().toISOString(),
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              screenSize: '1920x1080',
              scrollDepth: Math.floor(Math.random() * 100),
              readingTime: Math.floor(Math.random() * 300) + 30
            }
          }
        });
      }
    }

    console.log('✅ تم إنشاء أحداث التحليلات بنجاح');

    // إنشاء تفضيلات المستخدمين
    const users = [adminUser, editorUser, authorUser, subscriberUser];
    for (const user of users) {
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          preferences: {
            theme: 'light',
            language: 'ar',
            timezone: 'Asia/Riyadh',
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            privacy: {
              showEmail: false,
              showPhone: false,
              allowAnalytics: true
            },
            categories: allSections.slice(0, 3).map(s => s.name)
          }
        }
      });
    }

    console.log('✅ تم إنشاء تفضيلات المستخدمين بنجاح');

    // إنشاء إشعارات
    for (const user of users) {
      await prisma.userNotification.createMany({
        data: [
          {
            userId: user.id,
            type: 'welcome',
            content: `مرحباً ${user.name}! أهلاً بك في منظومة سبق الذكية للمحتوى.`,
            isRead: false
          },
          {
            userId: user.id,
            type: 'article_published',
            content: 'تم نشر مقال جديد في قسم اهتمامك.',
            isRead: Math.random() > 0.5
          }
        ]
      });
    }

    console.log('✅ تم إنشاء الإشعارات بنجاح');

    // إنشاء نقاط الولاء
    for (const user of users) {
      await prisma.loyaltyPoint.createMany({
        data: [
          {
            userId: user.id,
            points: 100,
            reason: 'مكافأة التسجيل'
          },
          {
            userId: user.id,
            points: 50,
            reason: 'قراءة مقال كامل'
          },
          {
            userId: user.id,
            points: 25,
            reason: 'مشاركة مقال'
          }
        ]
      });
    }

    console.log('✅ تم إنشاء نقاط الولاء بنجاح');

    // إنشاء التكاملات
    const integrations = await prisma.integration.createMany({
      data: [
        {
          name: 'Supabase',
          type: 'STORAGE',
          config: {
            url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
            apiKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
            features: ['database', 'auth', 'storage']
          },
          status: 'ACTIVE'
        },
        {
          name: 'Cloudinary',
          type: 'CDN',
          config: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'sabq-ai',
            apiKey: process.env.CLOUDINARY_API_KEY || 'your-api-key',
            features: ['image_upload', 'transformation', 'optimization']
          },
          status: 'ACTIVE'
        },
        {
          name: 'OpenAI',
          type: 'AI',
          config: {
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
            model: 'gpt-4',
            features: ['content_generation', 'summarization', 'translation']
          },
          status: 'ACTIVE'
        },
        {
          name: 'Anthropic',
          type: 'AI',
          config: {
            apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key',
            model: 'claude-3-sonnet',
            features: ['content_analysis', 'moderation', 'classification']
          },
          status: 'ACTIVE'
        }
      ]
    });

    console.log('✅ تم إنشاء التكاملات بنجاح');

    // إنشاء مقدمي CDN
    await prisma.cDNProvider.createMany({
      data: [
        {
          name: 'Cloudinary',
          config: {
            cloudName: 'sabq-ai',
            region: 'auto',
            features: ['image_optimization', 'video_streaming', 'auto_format']
          },
          status: 'ACTIVE'
        },
        {
          name: 'CloudFront',
          config: {
            distributionId: 'EXAMPLE123',
            region: 'us-east-1',
            features: ['global_cdn', 'edge_locations', 'cache_optimization']
          },
          status: 'INACTIVE'
        }
      ]
    });

    console.log('✅ تم إنشاء مقدمي CDN بنجاح');

    // إنشاء توصيات
    for (const user of users) {
      const randomArticles = publishedArticles.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      for (const article of randomArticles) {
        await prisma.recommendation.create({
          data: {
            userId: user.id,
            articleId: article.id,
            score: Math.random() * 0.5 + 0.5, // بين 0.5 و 1.0
            reason: {
              type: 'content_similarity',
              factors: ['user_interests', 'article_category', 'reading_history'],
              confidence: Math.random() * 0.3 + 0.7
            }
          }
        });
      }
    }

    console.log('✅ تم إنشاء التوصيات بنجاح');

    // إنشاء مهام النسخ الاحتياطي
    await prisma.backupJob.createMany({
      data: [
        {
          jobType: 'database_backup',
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          finishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          details: {
            size: '2.5GB',
            tables: 15,
            records: 50000,
            compressionRatio: 0.65
          }
        },
        {
          jobType: 'media_backup',
          status: 'RUNNING',
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          details: {
            totalFiles: 1200,
            processedFiles: 800,
            progress: 66.7
          }
        }
      ]
    });

    console.log('✅ تم إنشاء مهام النسخ الاحتياطي بنجاح');

    // إنشاء إشعارات push
    for (const user of users) {
      await prisma.pushNotification.createMany({
        data: [
          {
            userId: user.id,
            title: 'مقال جديد',
            body: 'تم نشر مقال جديد في قسم اهتمامك',
            data: {
              action: 'open_article',
              articleId: articles[0].id,
              category: 'new_content'
            },
            status: 'SENT',
            sentAt: new Date(Date.now() - 60 * 60 * 1000)
          },
          {
            userId: user.id,
            title: 'تحديث النظام',
            body: 'تم تحديث النظام بميزات جديدة',
            data: {
              action: 'open_changelog',
              version: '1.2.0',
              category: 'system_update'
            },
            status: 'DELIVERED',
            sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]
      });
    }

    console.log('✅ تم إنشاء إشعارات Push بنجاح');

    // إنشاء سجلات المراجعة
    await prisma.auditLog.createMany({
      data: [
        {
          userId: adminUser.id,
          action: 'CREATE',
          entity: 'Article',
          entityId: articles[0].id,
          newValue: { title: articles[0].title, status: 'PUBLISHED' },
          summary: 'تم إنشاء مقال جديد ونشره'
        },
        {
          userId: editorUser.id,
          action: 'UPDATE',
          entity: 'Article',
          entityId: articles[1].id,
          oldValue: { status: 'DRAFT' },
          newValue: { status: 'PUBLISHED' },
          summary: 'تم تحديث حالة المقال إلى منشور'
        },
        {
          userId: adminUser.id,
          action: 'CREATE',
          entity: 'User',
          entityId: subscriberUser.id,
          newValue: { email: subscriberUser.email, status: 'ACTIVE' },
          summary: 'تم إنشاء مستخدم جديد'
        }
      ]
    });

    console.log('✅ تم إنشاء سجلات المراجعة بنجاح');

    console.log('🎉 تم إدخال جميع البيانات الأولية بنجاح!');
    console.log('📊 إحصائيات البيانات المُدخلة:');
    console.log(`👥 المستخدمين: ${users.length}`);
    console.log(`🗂️ الأقسام: ${allSections.length}`);
    console.log(`📝 المقالات: ${articles.length}`);
    console.log(`🏷️ الوسوم: ${allTags.length}`);
    console.log(`🔗 التكاملات: 4`);
    console.log(`📱 الإشعارات: ${users.length * 2}`);
    console.log(`🎯 التوصيات: ${users.length * 3}`);

  } catch (error) {
    console.error('❌ خطأ في إدخال البيانات:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ خطأ في تنفيذ سكريبت البيانات الأولية:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 