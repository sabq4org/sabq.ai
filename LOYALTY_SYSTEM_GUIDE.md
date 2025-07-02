# 🎯 دليل نظام نقاط الولاء لصحيفة سبق

## 📋 نظرة عامة

تم تطوير نظام نقاط الولاء ليعمل تلقائياً مع تفاعلات المستخدمين، بحيث يحصل القارئ على نقاط فورية بناءً على سلوكه داخل المنصة.

## 🎲 قواعد احتساب النقاط

| التفاعل | شرط التفعيل | النقاط الممنوحة |
|---------|-------------|------------------|
| قراءة خبر | مدة القراءة > 30 ثانية | 2 |
| بقاء في الصفحة > 60 ثانية | تراكمي يومي لكل الأخبار | 3 |
| مشاركة خبر (تويتر / واتساب) | كل مشاركة | 5 |
| تسجيل إعجاب (Like) | مرة واحدة لكل مقال | 1 |
| كتابة تعليق | أول تعليق فقط لكل مقال | 4 |
| قراءة 5 أخبار متتالية | خلال نفس الجلسة | 10 (Bonus) |
| فتح إشعار (Push Notification) | شرط فتحه فعليًا داخل الخبر | 2 |
| دعوة صديق للتسجيل | إذا سجل بالدعوة + تحقق الإيميل | 20 |

## 🏆 مستويات الولاء

- **🥉 Bronze (0-99 نقطة)**: مستوى البداية
- **🥈 Silver (100-499 نقطة)**: نقاط مضاعفة + وصول مبكر
- **🥇 Gold (500-999 نقطة)**: نقاط مضاعفة x2 + محتوى حصري
- **💎 Platinum (1000+ نقطة)**: نقاط مضاعفة x3 + محتوى VIP + هدايا شهرية

## 🚀 التفعيل والاستخدام

### 1. تشغيل قاعدة البيانات

```sql
-- تنفيذ الـ schema
mysql -u username -p database_name < database/loyalty_system.sql
```

### 2. تفعيل التتبع في الفرونت إند

```javascript
// في أي صفحة مقال
import { initializeLoyaltyTracker, trackArticleRead } from '../lib/loyaltyTracker';

// تهيئة النظام
const tracker = initializeLoyaltyTracker({
  userId: currentUserId,
  debug: true, // للاختبار
  sessionId: 'optional-session-id'
});

// بدء تتبع مقال (تلقائي)
trackArticleRead(articleId);
```

### 3. تسجيل التفاعلات يدوياً

```javascript
import { 
  trackArticleLike, 
  trackArticleShare, 
  trackArticleComment 
} from '../lib/loyaltyTracker';

// عند الإعجاب
trackArticleLike(articleId);

// عند المشاركة
trackArticleShare(articleId, 'twitter'); // أو 'whatsapp', 'facebook'

// عند التعليق
trackArticleComment(articleId, commentText);
```

## 📡 API Endpoints

### POST `/api/loyalty/register`
تسجيل النقاط تلقائياً

```json
{
  "userId": 123,
  "action": "READ",
  "sourceType": "article",
  "sourceId": 456,
  "metadata": {
    "duration": 45,
    "sessionId": "session_123"
  }
}
```

**الاستجابة:**
```json
{
  "success": true,
  "points_awarded": 2,
  "total_points": 127,
  "current_level": "Silver",
  "bonus_awarded": false,
  "message": "تم منح 2 نقطة بنجاح!"
}
```

### GET `/api/loyalty/register?userId=123`
جلب إحصائيات المستخدم

### POST `/api/interactions`
تسجيل التفاعلات مع المقالات

## 🎨 استخدام مكونات الواجهة

### مثال سريع للاستخدام

```tsx
// في أي صفحة React
import LoyaltyWidget from '../app/components/LoyaltyWidget';

// Widget كامل
<LoyaltyWidget 
  userId={currentUserId}
  showHistory={true}
  className="w-full max-w-md"
/>

// نسخة مدمجة
<LoyaltyWidget 
  userId={currentUserId}
  compact={true}
  className="inline-block"
/>
```

## 🔒 الحماية من التلاعب

- **حدود يومية**: منع تكرار النفس النشاط أكثر من المسموح
- **حدود لكل مقال**: منع الحصول على نقاط متكررة لنفس المقال
- **شروط زمنية**: التحقق من مدة القراءة الفعلية
- **تتبع الجلسة**: منع التلاعب في المقالات المتتالية
- **IP والUser Agent**: تسجيل بيانات إضافية للمراجعة

## 📊 مراقبة الأداء

### إحصائيات سريعة

```sql
-- أفضل المستخدمين
SELECT user_id, total_points, current_level 
FROM user_loyalty_summary 
ORDER BY total_points DESC 
LIMIT 10;

-- نشاط اليوم
SELECT action, COUNT(*) as count, SUM(points) as total_points
FROM loyalty_points 
WHERE DATE(created_at) = CURDATE()
GROUP BY action;

-- توزيع المستويات
SELECT current_level, COUNT(*) as users_count
FROM user_loyalty_summary
GROUP BY current_level;
```

## 🛠️ التخصيص والتوسع

### تعديل قواعد النقاط

```sql
-- تعديل نقاط موجودة
UPDATE loyalty_rules 
SET points = 3 
WHERE rule_name = 'read_article';

-- إضافة قاعدة جديدة
INSERT INTO loyalty_rules (rule_name, action, points, conditions, max_per_day) VALUES
('weekend_bonus', 'WEEKEND_READ', 3, '{"weekend_only": true}', 20);
```

## 🎁 مثال متكامل للاستخدام

```tsx
'use client';

import { useEffect } from 'react';
import { initializeLoyaltyTracker } from '../lib/loyaltyTracker';
import LoyaltyWidget from '../app/components/LoyaltyWidget';

export default function ArticlePage({ articleId, userId }) {
  useEffect(() => {
    // تفعيل التتبع التلقائي
    const tracker = initializeLoyaltyTracker({
      userId: userId,
      debug: process.env.NODE_ENV === 'development'
    });
    
    // بدء تتبع المقال
    tracker.trackArticle(articleId);
    
    return () => tracker.destroy();
  }, [articleId, userId]);

  const handleLike = () => {
    // منطق الإعجاب الخاص بك
    // ...
    
    // تسجيل النقاط
    trackArticleLike(articleId);
  };

  const handleShare = (platform) => {
    // منطق المشاركة الخاص بك
    // ...
    
    // تسجيل النقاط
    trackArticleShare(articleId, platform);
  };

  return (
    <div className="article-page">
      {/* محتوى المقال */}
      <article>
        {/* ... */}
      </article>
      
      {/* أزرار التفاعل */}
      <div className="interaction-buttons">
        <button onClick={handleLike}>👍 إعجاب</button>
        <button onClick={() => handleShare('twitter')}>🐦 تويتر</button>
        <button onClick={() => handleShare('whatsapp')}>💬 واتساب</button>
      </div>
      
      {/* عرض نقاط المستخدم */}
      <div className="loyalty-section">
        <LoyaltyWidget userId={userId} />
      </div>
    </div>
  );
}
```

## ✅ خطوات التفعيل النهائية

1. **تنفيذ الـ SQL Schema**:
   ```bash
   mysql -u root -p sabq_database < database/loyalty_system.sql
   ```

2. **إضافة التتبع للصفحات**:
   ```tsx
   import { initializeLoyaltyTracker } from '../lib/loyaltyTracker';
   
   const tracker = initializeLoyaltyTracker({
     userId: currentUser.id,
     debug: true
   });
   ```

3. **عرض النقاط في الواجهة**:
   ```tsx
   <LoyaltyWidget userId={currentUser.id} />
   ```

4. **تتبع التفاعلات**:
   ```javascript
   // تلقائي: القراءة والتمرير
   // يدوي: الإعجاب والمشاركة والتعليقات
   ```

## 🎉 النتيجة النهائية

- ✅ تتبع تلقائي لجميع التفاعلات
- ✅ نقاط فورية حسب الجدول المطلوب
- ✅ مستويات ولاء متدرجة
- ✅ واجهة جميلة لعرض النقاط
- ✅ حماية من التلاعب
- ✅ إحصائيات شاملة

**النظام جاهز للاستخدام!** 🚀 