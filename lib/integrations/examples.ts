/**
 * أمثلة تطبيقية لاستخدام موفري الخدمات والتكامل
 * Service Providers Integration Examples
 * @version 1.0.0
 * @author Sabq AI Team
 */

import {
  providersManager,
  ProviderType,
  ProviderStatus,
  ServiceProvider,
  ProviderUtils
} from './providers';

/**
 * أمثلة على استخدام Supabase
 */
export class SupabaseExamples {
  
  /**
   * مثال على استخدام قاعدة البيانات
   */
  static async databaseExample(): Promise<void> {
    console.log('📦 مثال على استخدام Supabase Database');
    console.log('=====================================');

    try {
      // جلب المقالات
      const articlesResponse = await providersManager.makeApiCall(
        'supabase',
        '/articles',
        {
          method: 'GET',
          headers: {
            'Prefer': 'return=representation'
          }
        }
      );

      if (articlesResponse.success) {
        console.log('✅ تم جلب المقالات بنجاح:', articlesResponse.data);
      } else {
        console.error('❌ خطأ في جلب المقالات:', articlesResponse.error);
      }

      // إنشاء مقال جديد
      const newArticle = {
        title: 'مقال تجريبي',
        content: 'محتوى المقال التجريبي',
        category: 'تقنية',
        author: 'كاتب تجريبي',
        published: false
      };

      const createResponse = await providersManager.makeApiCall(
        'supabase',
        '/articles',
        {
          method: 'POST',
          data: newArticle,
          headers: {
            'Prefer': 'return=minimal'
          }
        }
      );

      if (createResponse.success) {
        console.log('✅ تم إنشاء المقال بنجاح');
      } else {
        console.error('❌ خطأ في إنشاء المقال:', createResponse.error);
      }

    } catch (error) {
      console.error('❌ خطأ في مثال قاعدة البيانات:', error);
    }
  }

  /**
   * مثال على المصادقة
   */
  static async authenticationExample(): Promise<void> {
    console.log('🔐 مثال على مصادقة Supabase');
    console.log('============================');

    try {
      // تسجيل مستخدم جديد
      const signUpData = {
        email: 'user@example.com',
        password: 'SecurePassword123!',
        options: {
          data: {
            full_name: 'مستخدم تجريبي'
          }
        }
      };

      const signUpResponse = await providersManager.makeApiCall(
        'supabase',
        '/signup',
        {
          method: 'POST',
          data: signUpData
        }
      );

      if (signUpResponse.success) {
        console.log('✅ تم تسجيل المستخدم بنجاح');
      }

      // تسجيل الدخول
      const signInData = {
        email: 'user@example.com',
        password: 'SecurePassword123!'
      };

      const signInResponse = await providersManager.makeApiCall(
        'supabase',
        '/token?grant_type=password',
        {
          method: 'POST',
          data: signInData
        }
      );

      if (signInResponse.success) {
        console.log('✅ تم تسجيل الدخول بنجاح');
        console.log('🎫 Token:', signInResponse.data?.access_token);
      }

    } catch (error) {
      console.error('❌ خطأ في مثال المصادقة:', error);
    }
  }

  /**
   * مثال على التخزين
   */
  static async storageExample(): Promise<void> {
    console.log('💾 مثال على تخزين الملفات في Supabase');
    console.log('======================================');

    try {
      // رفع ملف
      const fileData = {
        name: 'test-image.jpg',
        type: 'image/jpeg',
        size: 1024 * 50, // 50KB
        lastModified: Date.now()
      };

      const uploadResponse = await providersManager.makeApiCall(
        'supabase',
        '/storage/v1/object/sabq-cms/images/test-image.jpg',
        {
          method: 'POST',
          data: fileData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (uploadResponse.success) {
        console.log('✅ تم رفع الملف بنجاح');
      }

      // جلب قائمة الملفات
      const listResponse = await providersManager.makeApiCall(
        'supabase',
        '/storage/v1/object/list/sabq-cms',
        {
          method: 'POST',
          data: {
            limit: 100,
            offset: 0
          }
        }
      );

      if (listResponse.success) {
        console.log('📁 قائمة الملفات:', listResponse.data);
      }

    } catch (error) {
      console.error('❌ خطأ في مثال التخزين:', error);
    }
  }
}

/**
 * أمثلة على استخدام Cloudinary
 */
export class CloudinaryExamples {
  
  /**
   * مثال على رفع الصور
   */
  static async imageUploadExample(): Promise<void> {
    console.log('🖼️ مثال على رفع الصور إلى Cloudinary');
    console.log('====================================');

    try {
      const imageData = {
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // Base64 image data
        upload_preset: 'sabq_cms_preset',
        folder: 'articles',
        public_id: 'test_image_' + Date.now(),
        tags: ['test', 'article', 'cms'],
        context: 'alt=Test Image|caption=مثال على صورة'
      };

      const uploadResponse = await providersManager.makeApiCall(
        'cloudinary',
        '/image/upload',
        {
          method: 'POST',
          data: imageData
        }
      );

      if (uploadResponse.success) {
        console.log('✅ تم رفع الصورة بنجاح');
        console.log('🔗 رابط الصورة:', uploadResponse.data?.secure_url);
        console.log('🆔 معرف الصورة:', uploadResponse.data?.public_id);
      }

    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
    }
  }

  /**
   * مثال على تحويل الصور
   */
  static async imageTransformationExample(): Promise<void> {
    console.log('🔄 مثال على تحويل الصور في Cloudinary');
    console.log('====================================');

    const transformations = [
      {
        name: 'صورة مصغرة',
        params: 'w_150,h_150,c_fill,f_auto,q_auto'
      },
      {
        name: 'صورة متوسطة',
        params: 'w_500,h_300,c_scale,f_auto,q_auto'
      },
      {
        name: 'صورة كبيرة',
        params: 'w_1200,h_800,c_limit,f_auto,q_auto'
      },
      {
        name: 'صورة بتأثيرات',
        params: 'w_400,h_400,c_fill,r_20,e_sepia,f_auto,q_auto'
      }
    ];

    const baseImageId = 'test_image_123456789';

    transformations.forEach(transformation => {
      const transformedUrl = `https://res.cloudinary.com/sabq-cms/image/upload/${transformation.params}/${baseImageId}.jpg`;
      console.log(`🎨 ${transformation.name}: ${transformedUrl}`);
    });

    // تحسين الصور تلقائياً
    const optimizedUrl = 'https://res.cloudinary.com/sabq-cms/image/upload/f_auto,q_auto,w_auto,dpr_auto/v1/articles/hero-image.jpg';
    console.log('⚡ صورة محسنة تلقائياً:', optimizedUrl);
  }

  /**
   * مثال على إدارة الملفات
   */
  static async assetManagementExample(): Promise<void> {
    console.log('📂 مثال على إدارة الملفات في Cloudinary');
    console.log('======================================');

    try {
      // البحث عن الصور
      const searchResponse = await providersManager.makeApiCall(
        'cloudinary',
        '/resources/search',
        {
          method: 'POST',
          data: {
            expression: 'folder:articles AND tags:cms',
            sort_by: [['created_at', 'desc']],
            max_results: 30
          }
        }
      );

      if (searchResponse.success) {
        console.log('🔍 نتائج البحث:', searchResponse.data?.resources?.length, 'صورة');
      }

      // حذف صورة
      const deleteResponse = await providersManager.makeApiCall(
        'cloudinary',
        '/image/destroy',
        {
          method: 'POST',
          data: {
            public_id: 'test_image_to_delete',
            type: 'upload',
            resource_type: 'image'
          }
        }
      );

      if (deleteResponse.success) {
        console.log('🗑️ تم حذف الصورة بنجاح');
      }

    } catch (error) {
      console.error('❌ خطأ في إدارة الملفات:', error);
    }
  }
}

/**
 * أمثلة على استخدام OpenAI
 */
export class OpenAIExamples {
  
  /**
   * مثال على توليد النصوص
   */
  static async textGenerationExample(): Promise<void> {
    console.log('✍️ مثال على توليد النصوص مع OpenAI');
    console.log('==================================');

    try {
      const completionData = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي متخصص في كتابة المقالات الإخبارية باللغة العربية.'
          },
          {
            role: 'user',
            content: 'اكتب مقالاً قصيراً عن أهمية الذكاء الاصطناعي في الصحافة'
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      };

      const response = await providersManager.makeApiCall(
        'openai',
        '/chat/completions',
        {
          method: 'POST',
          data: completionData
        }
      );

      if (response.success) {
        console.log('✅ تم توليد النص بنجاح:');
        console.log(response.data?.choices?.[0]?.message?.content);
      }

    } catch (error) {
      console.error('❌ خطأ في توليد النص:', error);
    }
  }

  /**
   * مثال على توليد العناوين
   */
  static async headlineGenerationExample(): Promise<void> {
    console.log('📰 مثال على توليد عناوين الأخبار');
    console.log('==============================');

    const newsTopics = [
      'تطوير جديد في تقنية الذكاء الاصطناعي',
      'انطلاق مشروع نيوم في السعودية',
      'اكتشاف علمي جديد في مجال الطب'
    ];

    for (const topic of newsTopics) {
      try {
        const headlineData = {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'أنت محرر أخبار محترف. اكتب 3 عناوين جذابة ومهنية للموضوع المعطى.'
            },
            {
              role: 'user',
              content: `الموضوع: ${topic}`
            }
          ],
          max_tokens: 150,
          temperature: 0.8
        };

        const response = await providersManager.makeApiCall(
          'openai',
          '/chat/completions',
          {
            method: 'POST',
            data: headlineData
          }
        );

        if (response.success) {
          console.log(`📋 عناوين للموضوع "${topic}":`);
          console.log(response.data?.choices?.[0]?.message?.content);
          console.log('---');
        }

      } catch (error) {
        console.error(`❌ خطأ في توليد عناوين للموضوع "${topic}":`, error);
      }
    }
  }

  /**
   * مثال على تحليل المشاعر
   */
  static async sentimentAnalysisExample(): Promise<void> {
    console.log('💭 مثال على تحليل المشاعر للنصوص');
    console.log('==============================');

    const textsToAnalyze = [
      'هذا المقال رائع ومفيد جداً!',
      'لست راضياً عن الخدمة المقدمة',
      'المحتوى جيد لكن يحتاج إلى تحسين',
      'أحببت هذا التقرير كثيراً'
    ];

    for (const text of textsToAnalyze) {
      try {
        const analysisData = {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'حلل المشاعر في النص التالي وأعط النتيجة كـ إيجابي، سلبي، أو محايد مع درجة الثقة من 1 إلى 10.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        };

        const response = await providersManager.makeApiCall(
          'openai',
          '/chat/completions',
          {
            method: 'POST',
            data: analysisData
          }
        );

        if (response.success) {
          console.log(`📝 النص: "${text}"`);
          console.log(`🎯 التحليل: ${response.data?.choices?.[0]?.message?.content}`);
          console.log('---');
        }

      } catch (error) {
        console.error(`❌ خطأ في تحليل النص "${text}":`, error);
      }
    }
  }
}

/**
 * أمثلة على استخدام Anthropic Claude
 */
export class AnthropicExamples {
  
  /**
   * مثال على التحليل والتلخيص
   */
  static async analysisExample(): Promise<void> {
    console.log('📊 مثال على التحليل والتلخيص مع Claude');
    console.log('====================================');

    try {
      const longArticle = `
        في عصر التكنولوجيا الرقمية، شهد القطاع الإعلامي تحولات جذرية غيرت من طبيعة العمل الصحفي...
        [المقال الطويل هنا]
      `;

      const analysisData = {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `لخص هذا المقال في نقاط رئيسية:\n\n${longArticle}`
          }
        ]
      };

      const response = await providersManager.makeApiCall(
        'anthropic',
        '/messages',
        {
          method: 'POST',
          data: analysisData
        }
      );

      if (response.success) {
        console.log('✅ تم التلخيص بنجاح:');
        console.log(response.data?.content?.[0]?.text);
      }

    } catch (error) {
      console.error('❌ خطأ في التحليل والتلخيص:', error);
    }
  }

  /**
   * مثال على مراجعة المحتوى
   */
  static async contentReviewExample(): Promise<void> {
    console.log('🔍 مثال على مراجعة المحتوى مع Claude');
    console.log('===================================');

    const articles = [
      {
        title: 'تطورات الذكاء الاصطناعي',
        content: 'محتوى المقال الأول...'
      },
      {
        title: 'الاقتصاد الرقمي في السعودية',
        content: 'محتوى المقال الثاني...'
      }
    ];

    for (const article of articles) {
      try {
        const reviewData = {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: `راجع هذا المقال وأعط تقييماً للجودة، الوضوح، والدقة:\n\nالعنوان: ${article.title}\nالمحتوى: ${article.content}`
            }
          ]
        };

        const response = await providersManager.makeApiCall(
          'anthropic',
          '/messages',
          {
            method: 'POST',
            data: reviewData
          }
        );

        if (response.success) {
          console.log(`📝 مراجعة المقال "${article.title}":`);
          console.log(response.data?.content?.[0]?.text);
          console.log('---');
        }

      } catch (error) {
        console.error(`❌ خطأ في مراجعة المقال "${article.title}":`, error);
      }
    }
  }
}

/**
 * أمثلة شاملة على التكامل
 */
export class IntegrationWorkflowExamples {
  
  /**
   * سير عمل كامل لنشر مقال
   */
  static async fullArticleWorkflow(): Promise<void> {
    console.log('🚀 مثال شامل على سير عمل نشر مقال');
    console.log('====================================');

    try {
      // 1. توليد العنوان والمحتوى بـ OpenAI
      console.log('1️⃣ توليد المحتوى...');
      const contentData = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'اكتب مقالاً قصيراً عن التقنية'
          },
          {
            role: 'user',
            content: 'اكتب مقالاً عن مستقبل المدن الذكية'
          }
        ],
        max_tokens: 400
      };

      const contentResponse = await providersManager.makeApiCall(
        'openai',
        '/chat/completions',
        {
          method: 'POST',
          data: contentData
        }
      );

      if (!contentResponse.success) {
        throw new Error('فشل في توليد المحتوى');
      }

      const generatedContent = contentResponse.data?.choices?.[0]?.message?.content;
      console.log('✅ تم توليد المحتوى');

      // 2. مراجعة المحتوى بـ Claude
      console.log('2️⃣ مراجعة المحتوى...');
      const reviewData = {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `راجع هذا المحتوى وأعط تقييماً سريعاً:\n\n${generatedContent}`
          }
        ]
      };

      const reviewResponse = await providersManager.makeApiCall(
        'anthropic',
        '/messages',
        {
          method: 'POST',
          data: reviewData
        }
      );

      if (reviewResponse.success) {
        console.log('✅ تم مراجعة المحتوى');
      }

      // 3. رفع صورة للمقال في Cloudinary
      console.log('3️⃣ رفع صورة المقال...');
      const imageData = {
        file: 'data:image/jpeg;base64,example',
        upload_preset: 'articles',
        folder: 'smart_cities',
        tags: ['article', 'technology', 'smart_cities']
      };

      const imageResponse = await providersManager.makeApiCall(
        'cloudinary',
        '/image/upload',
        {
          method: 'POST',
          data: imageData
        }
      );

      if (imageResponse.success) {
        console.log('✅ تم رفع الصورة');
      }

      // 4. حفظ المقال في قاعدة البيانات
      console.log('4️⃣ حفظ المقال في قاعدة البيانات...');
      const articleData = {
        title: 'مستقبل المدن الذكية',
        content: generatedContent,
        category: 'تقنية',
        featured_image: imageResponse.data?.secure_url,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      const saveResponse = await providersManager.makeApiCall(
        'supabase',
        '/articles',
        {
          method: 'POST',
          data: articleData
        }
      );

      if (saveResponse.success) {
        console.log('✅ تم حفظ المقال في قاعدة البيانات');
      }

      console.log('🎉 اكتمل سير العمل بنجاح!');

    } catch (error) {
      console.error('❌ خطأ في سير العمل:', error);
    }
  }

  /**
   * مثال على المراقبة والصحة
   */
  static async monitoringExample(): Promise<void> {
    console.log('🔧 مثال على مراقبة موفري الخدمات');
    console.log('=================================');

    // فحص حالة جميع الخدمات
    console.log('🏥 فحص الحالة الصحية...');
    const healthResults = await providersManager.healthCheckAll();

    console.log('📊 نتائج فحص الحالة:');
    Object.entries(healthResults).forEach(([providerId, isHealthy]) => {
      const status = isHealthy ? '✅ سليم' : '❌ مشكلة';
      console.log(`  ${providerId}: ${status}`);
    });

    // إحصائيات الخدمات
    console.log('\n📈 إحصائيات موفري الخدمات:');
    const stats = providersManager.getProvidersStats();
    console.log(`  إجمالي الموفرين: ${stats.total}`);
    console.log(`  النشطين: ${stats.active}`);
    console.log(`  غير النشطين: ${stats.inactive}`);
    
    console.log('\n📋 حسب النوع:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count}`);
      }
    });
  }

  /**
   * مثال على إدارة API Tokens
   */
  static async tokenManagementExample(): Promise<void> {
    console.log('🎫 مثال على إدارة رموز API');
    console.log('=========================');

    // إنشاء رموز للخدمات المختلفة
    const providers = ['supabase', 'cloudinary', 'openai', 'anthropic'];
    const userId = 'user_123';

    providers.forEach(providerId => {
      const token = ProviderUtils.generateApiToken(providerId, userId);
      console.log(`🔑 رمز ${providerId}: ${token.substring(0, 20)}...`);

      // التحقق من الرمز
      const verification = ProviderUtils.verifyApiToken(token);
      const status = verification.isValid ? '✅ صالح' : '❌ غير صالح';
      console.log(`   الحالة: ${status}`);
    });
  }
}

// تصدير جميع الأمثلة
export {
  SupabaseExamples,
  CloudinaryExamples,
  OpenAIExamples,
  AnthropicExamples,
  IntegrationWorkflowExamples
};

// مثال سريع للتشغيل
if (require.main === module) {
  console.log('🎯 تشغيل أمثلة التكامل...\n');
  
  Promise.all([
    SupabaseExamples.databaseExample(),
    CloudinaryExamples.imageUploadExample(),
    OpenAIExamples.textGenerationExample(),
    AnthropicExamples.analysisExample(),
    IntegrationWorkflowExamples.monitoringExample()
  ]).then(() => {
    console.log('\n🏁 انتهت جميع الأمثلة');
  }).catch(console.error);
} 