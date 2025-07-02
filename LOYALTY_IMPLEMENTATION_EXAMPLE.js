// ===========================================
// أمثلة عملية لتفعيل نظام الولاء
// Practical Loyalty System Implementation Examples
// ===========================================

// ===============================
// 1. تفعيل النظام في صفحة المقال
// ===============================

// components/ArticlePage.js
import { useEffect, useState } from 'react';
import { initializeLoyaltyTracker } from '../lib/loyaltyTracker';

export default function ArticlePage({ article, currentUser }) {
  const [tracker, setTracker] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      // تفعيل مُتتبع الولاء
      const loyaltyTracker = initializeLoyaltyTracker({
        userId: currentUser.id,
        debug: process.env.NODE_ENV === 'development',
        apiUrl: '/api/interactions'
      });

      // بدء تتبع المقال تلقائياً
      loyaltyTracker.trackArticle(article.id);
      
      setTracker(loyaltyTracker);

      return () => {
        loyaltyTracker.destroy();
      };
    }
  }, [article.id, currentUser?.id]);

  // تفاعل الإعجاب
  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      // تسجيل النقاط تلقائياً
      tracker?.trackLike(article.id);
      
      alert('تمت إضافة الإعجاب! حصلت على نقطة واحدة 👍');
    } catch (error) {
      console.error('خطأ في الإعجاب:', error);
    }
  };

  // تفاعل المشاركة
  const handleShare = async (platform) => {
    if (!currentUser) return;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    };

    // فتح نافذة المشاركة
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');

    // تسجيل النقاط فوراً
    tracker?.trackShare(article.id, platform);
    alert('تمت المشاركة! حصلت على 5 نقاط 🎉');
  };

  return (
    <div className="article-page">
      <article className="prose">
        <h1>{article.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          💡 ابق في هذه الصفحة لأكثر من 30 ثانية للحصول على نقاط!
        </p>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>

      {/* أزرار التفاعل */}
      <div className="interaction-bar flex gap-4 mt-6 p-4 bg-gray-100 rounded-lg">
        <button 
          onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          👍 إعجاب (+1 نقطة)
        </button>
        
        <button 
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
        >
          🐦 تويتر (+5 نقاط)
        </button>
        
        <button 
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          💬 واتساب (+5 نقاط)
        </button>
      </div>
    </div>
  );
}

// ===============================
// 2. اختبار سريع للنظام
// ===============================

// تشغيل هذا الكود في Console المتصفح للاختبار
const testLoyaltySystem = async () => {
  console.log('🎯 اختبار نظام الولاء...');
  
  const userId = 1; // معرف المستخدم للاختبار
  const articleId = 123; // معرف المقال للاختبار
  
  try {
    // اختبار تسجيل قراءة
    console.log('📖 اختبار قراءة مقال...');
    const readResponse = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        articleId,
        interactionType: 'read',
        metadata: { duration: 45, scrollDepth: 80 }
      })
    });
    
    const readResult = await readResponse.json();
    console.log('✅ نتيجة القراءة:', readResult);
    
    // اختبار تسجيل إعجاب
    console.log('👍 اختبار إعجاب...');
    const likeResponse = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        articleId,
        interactionType: 'like'
      })
    });
    
    const likeResult = await likeResponse.json();
    console.log('✅ نتيجة الإعجاب:', likeResult);
    
    // جلب إحصائيات المستخدم
    console.log('📊 جلب الإحصائيات...');
    const statsResponse = await fetch(`/api/loyalty/register?userId=${userId}`);
    const statsResult = await statsResponse.json();
    console.log('📈 إحصائيات المستخدم:', statsResult);
    
    console.log('🎉 انتهى الاختبار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
};

// ===============================
// 3. مثال شامل للاستخدام
// ===============================

// استخدام النظام في صفحة Next.js
export default function ExampleUsage() {
  useEffect(() => {
    // تفعيل النظام
    const tracker = initializeLoyaltyTracker({
      userId: 1, // استبدل بـ ID المستخدم الحقيقي
      debug: true // لرؤية العمليات في Console
    });

    // محاكاة تتبع مقال
    tracker.trackArticle(123);

    // تنظيف
    return () => tracker.destroy();
  }, []);

  const simulateInteractions = async () => {
    console.log('🎮 محاكاة التفاعلات...');
    
    // محاكاة قراءة (ستحصل على نقاط بعد 30 ثانية تلقائياً)
    console.log('⏱️ انتظر 30 ثانية للحصول على نقاط القراءة...');
    
    // محاكاة إعجاب فوري
    await trackArticleLike(123);
    console.log('👍 تم تسجيل الإعجاب');
    
    // محاكاة مشاركة
    await trackArticleShare(123, 'twitter');
    console.log('🐦 تم تسجيل المشاركة');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">اختبار نظام الولاء</h1>
      
      <div className="space-y-4">
        <button 
          onClick={simulateInteractions}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          🎮 محاكاة التفاعلات
        </button>
        
        <button 
          onClick={testLoyaltySystem}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          🧪 اختبار API
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">عرض النقاط:</h2>
        <LoyaltyWidget userId={1} />
      </div>
    </div>
  );
}

// ===============================
// ملاحظات مهمة للتطبيق
// ===============================

/*
✅ الخطوات للتفعيل:

1. تنفيذ SQL Schema:
   mysql -u root -p your_database < database/loyalty_system.sql

2. إضافة imports في صفحات المقالات:
   import { initializeLoyaltyTracker } from '../lib/loyaltyTracker';

3. تفعيل النظام:
   const tracker = initializeLoyaltyTracker({ userId: currentUser.id });
   tracker.trackArticle(articleId);

4. عرض النقاط:
   <LoyaltyWidget userId={currentUser.id} />

🎯 النتائج المتوقعة:
- نقاط تلقائية عند القراءة (30+ ثانية = 2 نقطة، 60+ ثانية = 3 نقاط)
- نقاط فورية عند الإعجاب والمشاركة والتعليق
- مكافآت للمقالات المتتالية (5 مقالات = 10 نقاط إضافية)
- حماية من التكرار والتلاعب
- إشعارات جميلة للمستخدم

🔧 للتخصيص:
- تعديل النقاط في loyalty_rules
- إضافة قواعد جديدة
- تغيير المستويات والألوان
- ربط مع قاعدة بيانات حقيقية بدلاً من التخزين المؤقت
*/ 