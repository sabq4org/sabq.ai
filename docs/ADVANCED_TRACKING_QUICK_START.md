# دليل البدء السريع - نظام التتبع والتحليل الذكي

## 🚀 البدء السريع

### 1. إضافة التتبع لصفحة المقال

```tsx
// app/article/[id]/page.tsx
import { useArticleTracking } from '@/hooks/useBehaviorTracking';

export default function ArticlePage({ params }) {
  const { onLike, onSave, onShare } = useArticleTracking(params.id);
  
  return (
    <article>
      {/* محتوى المقال */}
      
      <div className="article-actions">
        <button onClick={() => onLike(true)}>
          👍 إعجاب
        </button>
        <button onClick={() => onSave(true)}>
          🔖 حفظ
        </button>
        <button onClick={() => onShare('twitter')}>
          🔗 مشاركة
        </button>
      </div>
    </article>
  );
}
```

### 2. إضافة Dashboard Footer للوحة التحكم

```tsx
// app/dashboard/layout.tsx
import DashboardFooter from '@/components/dashboard/DashboardFooter';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      <main className="flex-1">
        {children}
      </main>
      <DashboardFooter />
    </div>
  );
}
```

### 3. تتبع المقالات في الصفحة الرئيسية

```tsx
// components/ArticleCard.tsx
import { useArticlesTracking } from '@/hooks/useBehaviorTracking';
import { useInView } from 'react-intersection-observer';

export default function ArticleCard({ article }) {
  const tracking = useArticlesTracking();
  const { ref, inView } = useInView({ 
    threshold: 0.5,
    triggerOnce: false 
  });
  
  useEffect(() => {
    if (inView) {
      tracking.startTrackingArticle(article.id);
    } else {
      tracking.stopTrackingArticle(article.id);
    }
  }, [inView, article.id]);
  
  return (
    <div ref={ref} className="article-card">
      {/* محتوى البطاقة */}
    </div>
  );
}
```

## 📊 عرض التوصيات المخصصة

```tsx
// components/PersonalizedRecommendations.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/recommendations?userId=${user.id}&limit=5`)
        .then(res => res.json())
        .then(data => setRecommendations(data.recommendations));
    }
  }, [user?.id]);
  
  return (
    <div className="recommendations">
      <h3>مقترحات لك</h3>
      {recommendations.map(article => (
        <a key={article.id} href={`/article/${article.id}`}>
          {article.title}
        </a>
      ))}
    </div>
  );
}
```

## 🎯 التحقق من عمل النظام

### 1. في وحدة تحكم المتصفح (Console)
```javascript
// تفعيل وضع التصحيح
localStorage.setItem('behaviorTrackerDebug', 'true');

// ستظهر رسائل مثل:
// [BehaviorTracker] Session started: {...}
// [BehaviorTracker] Impression started: article-123
// [BehaviorTracker] Interaction tracked: like article-123
```

### 2. التحقق من APIs
```bash
# جلب تحليلات المستخدم
curl http://localhost:3000/api/analytics/behavior?userId=USER_ID

# جلب التوصيات
curl http://localhost:3000/api/recommendations?userId=USER_ID&includeReasons=true
```

### 3. مراقبة قاعدة البيانات
```sql
-- عرض الجلسات النشطة
SELECT * FROM sessions WHERE ended_at IS NULL;

-- عرض الانطباعات الأخيرة
SELECT * FROM impressions ORDER BY started_at DESC LIMIT 10;

-- عرض التوصيات
SELECT * FROM recommendations WHERE user_id = 'USER_ID';
```

## 🛠️ نصائح وحيل

### 1. تخصيص مدة عدم النشاط
```javascript
initBehaviorTracker({
  userId: user.id,
  inactivityTimeout: 60000 // 60 ثانية بدلاً من 30
});
```

### 2. تتبع أحداث مخصصة
```javascript
const { trackInteraction } = useBehaviorTracking();

// تتبع حدث مخصص
trackInteraction('custom_event', {
  category: 'engagement',
  value: 'newsletter_signup'
});
```

### 3. تحليل أداء الصفحة
```javascript
// في Dashboard Footer
<DashboardFooter 
  onInteraction={(type, data) => {
    console.log('User interaction:', type, data);
    // يمكنك إرسال البيانات لـ Google Analytics
  }}
/>
```

## ⚠️ أخطاء شائعة وحلولها

### 1. "Session not found"
```javascript
// تأكد من بدء الجلسة قبل التتبع
const tracker = getBehaviorTracker();
if (!tracker?.getSession()) {
  await tracker?.startSession();
}
```

### 2. "Impression already started"
```javascript
// النظام يمنع تتبع نفس المقال مرتين في نفس الجلسة
// هذا سلوك طبيعي وليس خطأ
```

### 3. عدم ظهور التوصيات
```javascript
// تحقق من:
// 1. وجود بيانات كافية (3+ مقالات مقروءة)
// 2. تسجيل دخول المستخدم
// 3. وجود مقالات منشورة في الفئات المفضلة
```

## 📈 مؤشرات الأداء

للتحقق من فعالية النظام، راقب:

1. **معدل النقر على التوصيات (CTR)**
   - الهدف: > 15%
   
2. **معدل إكمال القراءة**
   - الهدف: > 60%
   
3. **متوسط وقت القراءة النشط**
   - الهدف: > 50% من الوقت الكلي

4. **معدل العودة للموقع**
   - الهدف: زيادة 20% خلال شهر

---

للمساعدة أو الإبلاغ عن مشكلة، تواصل مع فريق التطوير.
آخر تحديث: ٢٩-٦-١٤٤٦ هـ 