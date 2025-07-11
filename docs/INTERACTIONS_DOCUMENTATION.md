# نظام التفاعل الشامل - Sabq AI CMS

## نظرة عامة

نظام التفاعل في Sabq AI CMS هو نظام متكامل يوفر للمستخدمين إمكانية التفاعل مع المحتوى من خلال:

- **التعليقات المتداخلة**: تعليقات رئيسية مع إمكانية الرد
- **الإعجابات**: إعجاب بالمقالات والتعليقات
- **المشاركة**: مشاركة المحتوى عبر المنصات المختلفة
- **التبليغ**: تبليغ عن المحتوى المسيء
- **الإشعارات**: إشعارات فورية للتفاعلات
- **الحماية من السبام**: نظام متقدم لمنع المحتوى المسيء

## البنية التقنية

### قاعدة البيانات

#### جداول التعليقات
```sql
-- التعليقات الرئيسية
ArticleComment {
  id: String (UUID)
  article_id: String
  user_id: String
  content: String
  parent_id: String? -- للردود
  status: String -- visible, hidden, reported, deleted
  like_count: Int
  reply_count: Int
  report_count: Int
  is_pinned: Boolean
  is_edited: Boolean
  created_at: DateTime
  updated_at: DateTime
}

-- إعجابات التعليقات
CommentLike {
  id: String (UUID)
  comment_id: String
  user_id: String
  created_at: DateTime
}

-- تبليغات التعليقات
CommentReport {
  id: String (UUID)
  comment_id: String
  user_id: String
  reason: String -- spam, inappropriate, offensive, harassment, misinformation, other
  description: String?
  status: String -- pending, reviewed, resolved, dismissed
  created_at: DateTime
}
```

#### جداول الإعجابات والمشاركات
```sql
-- إعجابات المقالات
ArticleLike {
  id: String (UUID)
  article_id: String
  user_id: String
  created_at: DateTime
}

-- مشاركات المقالات
ArticleShare {
  id: String (UUID)
  article_id: String
  user_id: String?
  platform: String -- facebook, twitter, whatsapp, linkedin, telegram, copy, email
  share_url: String?
  ip_address: String?
  created_at: DateTime
}
```

#### جداول الإشعارات والحماية
```sql
-- الإشعارات
Notification {
  id: String (UUID)
  user_id: String
  sender_id: String?
  type: String -- comment_reply, comment_like, article_like, mention, system
  title: String
  message: String
  data: Json?
  read: Boolean
  action_url: String?
  created_at: DateTime
  expires_at: DateTime?
}

-- فلاتر السبام
SpamFilter {
  id: String (UUID)
  pattern: String
  type: String -- keyword, regex, domain, ip
  action: String -- block, flag, moderate
  severity: Int -- 1-10
  is_active: Boolean
  created_at: DateTime
}
```

### APIs الرئيسية

#### التعليقات

**GET /api/articles/[id]/comments**
```typescript
// جلب تعليقات المقال
interface GetCommentsParams {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'popular';
  status?: 'visible' | 'all';
}

interface GetCommentsResponse {
  success: boolean;
  data: {
    comments: Comment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    article: {
      id: string;
      title: string;
    };
  };
}
```

**POST /api/articles/[id]/comments**
```typescript
// إضافة تعليق جديد
interface CreateCommentRequest {
  content: string;
  parent_id?: string; // للردود
}

interface CreateCommentResponse {
  success: boolean;
  data: {
    comment: Comment;
  };
}
```

**PUT /api/comments/[id]**
```typescript
// تحديث تعليق
interface UpdateCommentRequest {
  content: string;
}

// يمكن التحديث خلال 15 دقيقة من النشر فقط
```

**DELETE /api/comments/[id]**
```typescript
// حذف تعليق
// حذف فعلي إذا لم يكن له ردود
// حذف ناعم (تغيير المحتوى) إذا كان له ردود
```

#### الإعجابات

**POST /api/comments/[id]/like**
```typescript
// إضافة إعجاب للتعليق
interface LikeResponse {
  success: boolean;
  data: {
    like: CommentLike;
    comment: {
      id: string;
      like_count: number;
    };
  };
}
```

**DELETE /api/comments/[id]/like**
```typescript
// إلغاء الإعجاب
```

**POST /api/articles/[id]/like**
```typescript
// إعجاب بالمقال
```

**GET /api/articles/[id]/like**
```typescript
// التحقق من حالة الإعجاب
interface LikeStatusResponse {
  success: boolean;
  data: {
    liked: boolean;
    likes_count: number;
  };
}
```

#### المشاركة

**POST /api/articles/[id]/share**
```typescript
interface ShareRequest {
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin' | 'telegram' | 'copy' | 'email' | 'other';
  referrer?: string;
}

interface ShareResponse {
  success: boolean;
  data: {
    share: ArticleShare;
    article: {
      id: string;
      share_count: number;
    };
    share_url: string;
    platform_url: string;
  };
}
```

**GET /api/articles/[id]/share**
```typescript
// إحصائيات المشاركة
interface ShareStatsResponse {
  success: boolean;
  data: {
    total_shares: number;
    shares_by_platform: Record<string, number>;
    share_links: Record<string, string>;
  };
}
```

#### التبليغ

**POST /api/comments/[id]/report**
```typescript
interface ReportRequest {
  reason: 'spam' | 'inappropriate' | 'offensive' | 'harassment' | 'misinformation' | 'other';
  description?: string;
}

interface ReportResponse {
  success: boolean;
  data: {
    report: CommentReport;
    message: string;
  };
}
```

#### الإشعارات

**GET /api/notifications**
```typescript
interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}

interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: Pagination;
    unread_count: number;
  };
}
```

**PUT /api/notifications/[id]**
```typescript
// تحديد الإشعار كمقروء
```

**PUT /api/notifications**
```typescript
// تحديد جميع الإشعارات كمقروءة
interface MarkAllReadRequest {
  action: 'mark_all_read';
}
```

## مكونات الواجهة

### CommentSection
```typescript
interface CommentSectionProps {
  articleId: string;
  initialComments?: Comment[];
  totalComments?: number;
  className?: string;
}
```

**الميزات:**
- جلب وعرض التعليقات مع الترقيم
- ترتيب التعليقات (الأحدث، الأقدم، الأكثر شعبية)
- نموذج إضافة تعليق جديد
- تحديث فوري للتعليقات

### CommentItem
```typescript
interface CommentItemProps {
  comment: Comment;
  articleId: string;
  currentUserId?: string;
  depth?: number;
  onReply?: (content: string) => void;
  onDelete?: () => void;
  onUpdate?: (updatedComment: Comment) => void;
}
```

**الميزات:**
- عرض التعليق مع معلومات المستخدم
- أزرار الإعجاب والرد والتبليغ
- تحرير التعليق (للمالك فقط)
- عرض الردود المتداخلة
- قائمة خيارات متقدمة

### CommentForm
```typescript
interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  submitting?: boolean;
  placeholder?: string;
  compact?: boolean;
  maxLength?: number;
}
```

**الميزات:**
- تحقق من صحة المحتوى
- عداد الأحرف
- اختصارات لوحة المفاتيح
- نصائح للمستخدم
- دعم RTL

### LikeButton
```typescript
interface LikeButtonProps {
  commentId?: string;
  articleId?: string;
  liked: boolean;
  likeCount: number;
  onLikeChange: (liked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
}
```

**الميزات:**
- تحديث فوري للحالة
- رسوم متحركة
- دعم المقالات والتعليقات
- أحجام مختلفة

### ShareSection
```typescript
interface ShareSectionProps {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  className?: string;
}
```

**الميزات:**
- روابط مشاركة لمختلف المنصات
- إحصائيات المشاركة
- نسخ الرابط
- تتبع المشاركات

### ReportButton
```typescript
interface ReportButtonProps {
  commentId: string;
  disabled?: boolean;
  className?: string;
}
```

**الميزات:**
- نموذج تبليغ تفاعلي
- أسباب متعددة للتبليغ
- تحذيرات للمستخدم
- منع التبليغ المتكرر

### NotificationCenter
```typescript
interface NotificationCenterProps {
  className?: string;
}
```

**الميزات:**
- قائمة منسدلة للإشعارات
- عداد الإشعارات غير المقروءة
- تحديث تلقائي
- تصنيف الإشعارات
- إجراءات سريعة

## نظام الحماية من السبام

### المكونات الأساسية

#### فحص المحتوى
```typescript
interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  severity: number; // 1-10
  suggestions?: string[];
}

async function checkForSpam(
  content: string,
  userId: string,
  context: 'comment' | 'article'
): Promise<SpamCheckResult>
```

#### أنواع الفحوصات

1. **الكلمات المحظورة**
   - قاموس الكلمات المسيئة
   - فلاتر مخصصة
   - دعم التعبيرات النمطية

2. **الأنماط المشبوهة**
   - تكرار الأحرف
   - نسبة الأحرف الكبيرة
   - الروابط المفرطة
   - الأرقام الطويلة

3. **معدل النشر**
   - حد أقصى للتعليقات في الدقيقة
   - فحص IP للمستخدمين غير المسجلين
   - تاريخ المستخدم

4. **المحتوى المكرر**
   - فحص التطابق التام
   - حساب التشابه
   - التحقق من آخر 24 ساعة

5. **تاريخ المستخدم**
   - عمر الحساب
   - التعليقات المبلغ عنها
   - نقاط السمعة

6. **جودة المحتوى**
   - طول المحتوى
   - نسبة الأرقام والرموز
   - التنوع اللغوي

### الإعدادات والتخصيص

```typescript
// تحديث فلاتر السبام
await updateSpamFilters([
  {
    pattern: 'كلمة محظورة',
    type: 'keyword',
    severity: 9,
    description: 'كلمة مسيئة'
  },
  {
    pattern: '\\b(buy|sell)\\s+now\\b',
    type: 'regex',
    severity: 7,
    description: 'إعلان مشبوه'
  }
]);

// تقرير السبام
const report = await generateSpamReport(7); // آخر 7 أيام
```

## التحليلات والإحصائيات

### تحليل أنماط المستخدمين
```typescript
const userAnalysis = await analyzeUserInteractionPatterns('user-id', 30);

interface UserInteractionAnalysis {
  timePatterns: {
    hourlyActivity: number[];
    dailyActivity: number[];
    mostActiveHour: number;
    mostActiveDay: number;
  };
  categoryInterests: Array<{
    categoryId: string;
    score: number;
  }>;
  engagementLevel: {
    score: number;
    level: 'high' | 'medium' | 'low';
    avgDailyActivity: number;
  };
  interactionQuality: {
    score: number;
    factors: string[];
  };
}
```

### تحليل المحتوى
```typescript
const contentAnalysis = await analyzeContentInteraction('article-id');

interface ContentInteractionAnalysis {
  metrics: {
    total_comments: number;
    total_likes: number;
    total_shares: number;
    engagement_rate: number;
  };
  timeAnalysis: {
    timeline: Record<string, InteractionCounts>;
    peakDay: string;
  };
  viralityScore: {
    score: number;
    level: 'viral' | 'trending' | 'normal';
  };
  platformAnalysis: {
    platforms: Array<{
      platform: string;
      count: number;
      percentage: number;
    }>;
  };
}
```

### اتجاهات التفاعل
```typescript
const trends = await analyzeInteractionTrends(30);

interface InteractionTrends {
  dailyData: Record<string, {
    comments: number;
    likes: number;
    shares: number;
  }>;
  trends: {
    comments: 'increasing' | 'decreasing' | 'stable';
    likes: 'increasing' | 'decreasing' | 'stable';
    shares: 'increasing' | 'decreasing' | 'stable';
  };
}
```

## لوحة الإدارة

### مكونات الإدارة

#### InteractionsDashboard
```typescript
interface InteractionStats {
  total_comments: number;
  total_likes: number;
  total_shares: number;
  total_reports: number;
  pending_reports: number;
  hidden_comments: number;
  spam_blocked: number;
}
```

**الميزات:**
- إحصائيات شاملة
- إدارة التبليغات
- إعدادات الحماية
- تقارير مفصلة

#### إدارة التبليغات
- مراجعة التبليغات المعلقة
- إخفاء/إظهار التعليقات
- تتبع حالة التبليغات
- إشعارات الإدارة

#### إعدادات الحماية
- تفعيل/إلغاء فلاتر السبام
- تخصيص حدود التبليغ
- إدارة الكلمات المحظورة
- إحصائيات الحماية

## الأمان والخصوصية

### التحقق من الصلاحيات
```typescript
// التحقق من المستخدم
const authResult = await authMiddleware(request);

// التحقق من الملكية
const canEdit = user.id === comment.user_id || user.role === 'admin';

// التحقق من الوقت
const canEditTime = timeSinceCreation <= 15 * 60 * 1000;
```

### حماية البيانات
- تشفير البيانات الحساسة
- إخفاء معلومات المستخدمين
- تسجيل الأنشطة
- Rate limiting

### التحقق من المدخلات
```typescript
// تنظيف HTML
const sanitizedContent = sanitizeHtml(content);

// التحقق من الطول
if (content.length > 2000) {
  throw new Error('Content too long');
}

// فحص السبام
const spamResult = await checkForSpam(content, userId);
```

## الاستخدام والتكامل

### التثبيت والإعداد

1. **قاعدة البيانات**
```bash
npx prisma migrate dev
npx prisma generate
```

2. **متغيرات البيئة**
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL="https://sabq.ai"
```

3. **التكامل في الصفحات**
```typescript
import { CommentSection } from '@/components/interactions/CommentSection';
import { ShareSection } from '@/components/interactions/ShareSection';
import { NotificationCenter } from '@/components/interactions/NotificationCenter';

export default function ArticlePage({ article }) {
  return (
    <div>
      <article>{/* محتوى المقال */}</article>
      
      <ShareSection
        articleId={article.id}
        articleTitle={article.title}
        articleSlug={article.slug}
      />
      
      <CommentSection
        articleId={article.id}
        initialComments={article.comments}
        totalComments={article.comment_count}
      />
    </div>
  );
}
```

### التخصيص والتطوير

#### إضافة فلاتر سبام مخصصة
```typescript
await updateSpamFilters([
  {
    pattern: 'نمط مخصص',
    type: 'regex',
    severity: 8,
    description: 'وصف الفلتر'
  }
]);
```

#### تخصيص الإشعارات
```typescript
// إنشاء إشعار مخصص
await prisma.notification.create({
  data: {
    user_id: userId,
    type: 'custom_notification',
    title: 'عنوان الإشعار',
    message: 'محتوى الإشعار',
    data: { custom_data: 'value' }
  }
});
```

#### إضافة منصات مشاركة جديدة
```typescript
const SHARE_PLATFORMS = [
  // المنصات الموجودة...
  {
    key: 'new_platform',
    name: 'منصة جديدة',
    icon: '🆕',
    color: 'bg-purple-600',
    textColor: 'text-white'
  }
];
```

## الاختبارات

### اختبارات الوحدة
```typescript
describe('Comments API', () => {
  it('should create comment successfully', async () => {
    const result = await createComment(articleId, userId, {
      content: 'Test comment'
    });
    expect(result.success).toBe(true);
  });

  it('should reject spam comments', async () => {
    const spamResult = await checkForSpam('spam content', userId);
    expect(spamResult.isSpam).toBe(true);
  });
});
```

### اختبارات التكامل
```typescript
describe('Interaction Flow', () => {
  it('should handle complete interaction flow', async () => {
    // إنشاء تعليق
    const comment = await createComment(articleId, userId, commentData);
    
    // إضافة إعجاب
    const like = await addLike(comment.id, otherUserId);
    
    // إنشاء إشعار
    const notification = await getNotifications(userId);
    
    expect(notification.length).toBe(1);
  });
});
```

## الأداء والتحسين

### فهرسة قاعدة البيانات
```sql
-- فهارس مهمة للأداء
CREATE INDEX idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX idx_article_comments_created_at ON article_comments(created_at);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
```

### التخزين المؤقت
```typescript
// تخزين مؤقت للتعليقات
const cacheKey = `comments:${articleId}:${page}`;
const cachedComments = await redis.get(cacheKey);

if (cachedComments) {
  return JSON.parse(cachedComments);
}

const comments = await fetchComments(articleId, page);
await redis.setex(cacheKey, 300, JSON.stringify(comments)); // 5 دقائق
```

### تحسين الاستعلامات
```typescript
// جلب التعليقات مع العلاقات
const comments = await prisma.articleComment.findMany({
  where: { article_id: articleId },
  include: {
    user: {
      select: { id: true, name: true, avatar_url: true }
    },
    _count: {
      select: { likes: true, replies: true }
    }
  },
  orderBy: { created_at: 'desc' },
  take: limit,
  skip: offset
});
```

## استكشاف الأخطاء

### مشاكل شائعة

1. **التعليقات لا تظهر**
   - تحقق من حالة المقال (منشور؟)
   - تحقق من صلاحيات المستخدم
   - تحقق من فلاتر السبام

2. **الإشعارات لا تصل**
   - تحقق من إعدادات الإشعارات
   - تحقق من انتهاء صلاحية الإشعارات
   - تحقق من حالة المستخدم

3. **مشاكل الأداء**
   - تحقق من الفهارس
   - استخدم التخزين المؤقت
   - حسن الاستعلامات

### سجلات الأخطاء
```typescript
// تسجيل الأخطاء
console.error('Error in comment creation:', {
  error: error.message,
  userId,
  articleId,
  timestamp: new Date().toISOString()
});

// مراقبة الأداء
const startTime = Date.now();
// ... عملية
const duration = Date.now() - startTime;
if (duration > 1000) {
  console.warn('Slow operation detected:', { duration, operation: 'fetchComments' });
}
```

## خارطة الطريق

### الميزات المستقبلية

1. **تحسينات التفاعل**
   - ردود فعل متعددة (😍, 😢, 😡)
   - تعليقات صوتية
   - مشاركة أجزاء من المقال

2. **الذكاء الاصطناعي**
   - تصنيف التعليقات تلقائياً
   - اقتراح ردود
   - تحليل المشاعر

3. **التكامل المتقدم**
   - تسجيل الدخول الاجتماعي
   - مزامنة التعليقات
   - تحليلات متقدمة

4. **تحسينات الأداء**
   - تحديث فوري (WebSocket)
   - تحسين الصور
   - ضغط البيانات

## الخلاصة

نظام التفاعل في Sabq AI CMS يوفر تجربة تفاعلية شاملة وآمنة للمستخدمين مع إمكانيات إدارة متقدمة. النظام مصمم ليكون قابلاً للتوسع والتخصيص مع الحفاظ على الأمان والأداء.

للمزيد من المعلومات أو الدعم، يرجى مراجعة الوثائق الأخرى أو التواصل مع فريق التطوير.

---

**تم التطوير بواسطة:** فريق Sabq AI  
**تاريخ التحديث:** ${new Date().toLocaleDateString('ar-SA')}  
**الإصدار:** 1.0.0 