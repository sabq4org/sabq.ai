# 🔗 دليل الربط الكامل بين الأنظمة

## 📋 فهرس المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [البنية التحتية](#البنية-التحتية)
3. [التكامل في صفحة المقال](#التكامل-في-صفحة-المقال)
4. [التكامل في الصفحة الرئيسية](#التكامل-في-الصفحة-الرئيسية)
5. [لوحة التحكم](#لوحة-التحكم)
6. [أمثلة الاستخدام](#أمثلة-الاستخدام)

## 🎯 نظرة عامة

النظام المتكامل يربط بين:
- **المستخدمين**: التسجيل، التفضيلات، السلوك
- **المقالات**: المحتوى، الإحصائيات، التصنيفات
- **التفاعلات**: القراءة، الإعجاب، المشاركة، التعليق
- **الولاء**: النقاط، المستويات، المكافآت
- **التخصيص**: المحتوى الذكي، التوصيات

## 🏗️ البنية التحتية

### 1. الملفات الأساسية
```
lib/
├── user-interactions.ts      # نظام التفاعلات المتكامل
├── loyalty.ts                # نظام الولاء والنقاط

data/
├── users.json                # بيانات المستخدمين
├── articles.json             # بيانات المقالات
├── user_article_interactions.json  # سجل التفاعلات
├── user_loyalty_points.json  # نقاط الولاء
├── user_preferences.json     # تفضيلات المستخدمين
└── loyalty_updates_log.json  # سجلات تحديثات الولاء

api/
├── interactions/             # API التفاعلات
├── content/personalized/     # API المحتوى المخصص
└── loyalty/                  # API نقاط الولاء

components/
├── PersonalizedFeed.tsx      # مكون المحتوى المخصص
└── InteractionButtons.tsx    # أزرار التفاعل

hooks/
└── useInteractions.ts        # Hook للتفاعلات
```

## 💻 التكامل في صفحة المقال

### مثال كامل لصفحة مقال مع جميع التفاعلات:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { useSession } from 'next-auth/react';
import { 
  Heart, Share2, MessageSquare, BookmarkPlus, 
  Clock, Eye, Calendar, User 
} from 'lucide-react';

interface ArticlePageProps {
  articleId: string;
}

export default function ArticlePage({ articleId }: ArticlePageProps) {
  const { data: session } = useSession();
  const { recordInteraction, trackReadingProgress } = useInteractions();
  
  const [article, setArticle] = useState<any>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState({
    liked: false,
    saved: false
  });
  
  const startTimeRef = useRef<Date>(new Date());
  const hasRecordedView = useRef(false);

  // تسجيل المشاهدة عند تحميل الصفحة
  useEffect(() => {
    if (session?.user && !hasRecordedView.current) {
      hasRecordedView.current = true;
      recordInteraction({
        userId: session.user.id,
        articleId,
        interactionType: 'view',
        source: 'article_page'
      });
    }
  }, [session, articleId]);

  // تتبع تقدم القراءة
  useEffect(() => {
    const handleScroll = () => {
      const element = document.documentElement;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      setReadingProgress(progress);
      
      // حساب وقت القراءة
      const currentTime = new Date();
      const duration = Math.floor((currentTime.getTime() - startTimeRef.current.getTime()) / 1000);
      setReadingTime(duration);
      
      // تتبع التقدم
      if (session?.user) {
        trackReadingProgress(session.user.id, articleId, progress, duration);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [session, articleId]);

  // دالة الإعجاب
  const handleLike = async () => {
    if (!session?.user) return;
    
    await recordInteraction({
      userId: session.user.id,
      articleId,
      interactionType: 'like',
      source: 'article_page'
    });
    
    setHasInteracted(prev => ({ ...prev, liked: true }));
    setArticle((prev: any) => ({
      ...prev,
      stats: {
        ...prev.stats,
        likes: prev.stats.likes + 1
      }
    }));
  };

  // دالة المشاركة
  const handleShare = async (platform: string) => {
    if (!session?.user) return;
    
    await recordInteraction({
      userId: session.user.id,
      articleId,
      interactionType: 'share',
      source: `share_${platform}`
    });
    
    // فتح نافذة المشاركة
    const url = window.location.href;
    const text = article?.title;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text} ${url}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  // دالة الحفظ
  const handleSave = async () => {
    if (!session?.user) return;
    
    await recordInteraction({
      userId: session.user.id,
      articleId,
      interactionType: 'save',
      source: 'article_page'
    });
    
    setHasInteracted(prev => ({ ...prev, saved: true }));
  };

  // دالة التعليق
  const handleComment = async (commentText: string) => {
    if (!session?.user) return;
    
    await recordInteraction({
      userId: session.user.id,
      articleId,
      interactionType: 'comment',
      source: 'article_page'
    });
    
    // حفظ التعليق...
  };

  return (
    <article className="max-w-4xl mx-auto p-6">
      {/* شريط التقدم */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* رأس المقال */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{article?.title}</h1>
        
        <div className="flex items-center justify-between text-gray-600 mb-6">
          <div className="flex items-center gap-4">
            {article?.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(article?.published_at).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{article?.reading_time} دقائق</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>{article?.stats?.views} مشاهدة</span>
          </div>
        </div>
      </header>

      {/* محتوى المقال */}
      <div className="prose prose-lg max-w-none mb-8">
        {/* محتوى المقال هنا */}
      </div>

      {/* أزرار التفاعل */}
      <div className="sticky bottom-4 bg-white rounded-full shadow-lg p-4 mx-auto w-fit">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              hasInteracted.liked 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasInteracted.liked ? 'fill-current' : ''}`} />
            <span>{article?.stats?.likes}</span>
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100">
              <Share2 className="w-5 h-5" />
              <span>مشاركة</span>
            </button>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex gap-2 bg-white p-2 rounded-lg shadow-lg">
              <button 
                onClick={() => handleShare('twitter')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                𝕏
              </button>
              <button 
                onClick={() => handleShare('whatsapp')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                📱
              </button>
              <button 
                onClick={() => handleShare('copy')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                📋
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100">
            <MessageSquare className="w-5 h-5" />
            <span>{article?.stats?.comments}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              hasInteracted.saved 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <BookmarkPlus className={`w-5 h-5 ${hasInteracted.saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* معلومات القراءة (للتطوير) */}
      {session?.user && (
        <div className="fixed bottom-20 right-4 bg-black/80 text-white p-3 rounded-lg text-sm">
          <div>وقت القراءة: {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}</div>
          <div>نسبة الإكمال: {readingProgress.toFixed(0)}%</div>
        </div>
      )}
    </article>
  );
}
```

## 🏠 التكامل في الصفحة الرئيسية

### استخدام مكون المحتوى المخصص:

```tsx
import PersonalizedFeed from '@/components/PersonalizedFeed';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div>
      {/* المحتوى المخصص للمستخدمين المسجلين */}
      {session?.user && (
        <section className="mb-12">
          <PersonalizedFeed 
            userId={session.user.id} 
            limit={10} 
          />
        </section>
      )}

      {/* المحتوى العام للزوار */}
      <section>
        <h2>أحدث الأخبار</h2>
        {/* قائمة الأخبار العامة */}
      </section>
    </div>
  );
}
```

## 📊 لوحة التحكم

### روابط لوحة التحكم المتكاملة:
- `/dashboard/analytics/behavior` - تحليل سلوك المستخدمين
- `/dashboard/loyalty` - إدارة نقاط الولاء
- `/dashboard/users` - إدارة المستخدمين مع مستويات الولاء
- `/dashboard/news/insights` - رؤى المقالات والتفاعل

## 🔧 أمثلة الاستخدام

### 1. تسجيل تفاعل بسيط:
```tsx
const { recordInteraction } = useInteractions();

await recordInteraction({
  userId: 'user-123',
  articleId: 'article-456',
  interactionType: 'like',
  source: 'home_page'
});
```

### 2. الحصول على محتوى مخصص:
```tsx
const { getPersonalizedContent } = useInteractions();

const content = await getPersonalizedContent('user-123', 20);
// يرجع مصفوفة من المقالات المخصصة
```

### 3. تحليل سلوك المستخدم:
```tsx
const { analyzeUserBehavior } = useInteractions();

const behavior = await analyzeUserBehavior('user-123');
console.log(behavior);
// {
//   total_interactions: 150,
//   by_type: { view: 100, like: 30, share: 20 },
//   completion_rate: 75,
//   ...
// }
```

### 4. حساب المكافآت:
```tsx
const { calculateBehaviorRewards } = useInteractions();

const bonusPoints = await calculateBehaviorRewards('user-123');
// يرجع عدد النقاط الإضافية الممنوحة
```

## 🎯 نصائح للتطبيق الأمثل

1. **تسجيل التفاعلات**: سجل كل تفاعل فوراً عند حدوثه
2. **التحديث المستمر**: حدث تفضيلات المستخدم بناءً على السلوك
3. **المكافآت**: احسب المكافآت دورياً (يومياً/أسبوعياً)
4. **التخصيص**: استخدم المحتوى المخصص في جميع الصفحات
5. **الأداء**: استخدم التخزين المؤقت للمحتوى المخصص

## 🔐 الأمان والخصوصية

1. **التحقق من الهوية**: تأكد من أن المستخدم مسجل دخول
2. **التحقق من الصلاحيات**: تحقق من صلاحيات المستخدم
3. **تشفير البيانات**: احم البيانات الحساسة
4. **السجلات**: سجل جميع العمليات الحرجة

## 📈 المراقبة والتحليل

1. **لوحة المعلومات**: راقب النشاط في الوقت الفعلي
2. **التقارير**: أنشئ تقارير دورية عن السلوك
3. **التنبيهات**: أرسل تنبيهات للأنشطة غير العادية
4. **التحسين**: حسن الخوارزميات بناءً على البيانات 