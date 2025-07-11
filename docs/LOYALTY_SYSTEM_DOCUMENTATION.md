# نظام النقاط والشارات والإشعارات الفورية - دليل شامل

## نظرة عامة

نظام النقاط والشارات والإشعارات الفورية هو نظام تحفيزي متقدم مصمم لتعزيز تفاعل المستخدمين مع منصة Sabq AI CMS. يوفر النظام مكافآت ذكية وإشعارات فورية وتجربة مستخدم تفاعلية.

### الميزات الرئيسية

- **نظام نقاط ذكي**: احتساب تلقائي للنقاط بناءً على التفاعل
- **شارات متنوعة**: مجموعة شاملة من الشارات والإنجازات
- **إشعارات فورية**: تحديثات مباشرة عبر WebSocket
- **مستويات ولاء**: نظام تدرجي للمستخدمين
- **حماية متقدمة**: نظام أمان ضد التلاعب
- **تحليلات شاملة**: إحصائيات وتقارير مفصلة
- **إدارة مرنة**: لوحة تحكم للإدارة

---

## البنية التقنية

### قاعدة البيانات

#### الجداول الأساسية

```sql
-- جدول نقاط الولاء
CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    description TEXT,
    metadata JSONB,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الشارات
CREATE TABLE badges (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color VARCHAR(7) DEFAULT '#FFD700',
    category VARCHAR(50) NOT NULL,
    tier VARCHAR(20) DEFAULT 'bronze',
    points_required INTEGER DEFAULT 0,
    conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول شارات المستخدمين
CREATE TABLE user_badges (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    badge_id UUID NOT NULL,
    awarded_at TIMESTAMP DEFAULT NOW(),
    awarded_by UUID,
    reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    progress JSONB,
    metadata JSONB,
    UNIQUE(user_id, badge_id)
);

-- جدول الإشعارات الفورية
CREATE TABLE realtime_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    sender_id UUID,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'system',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    action_url TEXT,
    icon VARCHAR(10),
    priority VARCHAR(20) DEFAULT 'normal',
    delivery_method VARCHAR(20) DEFAULT 'in_app',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP,
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### المكونات الأساسية

#### 1. محرك النقاط (loyalty-engine.ts)

```typescript
// إضافة نقاط للمستخدم
export async function addLoyaltyPoints(
  userId: string,
  actionType: string,
  points?: number,
  referenceId?: string,
  referenceType?: string,
  metadata?: any
): Promise<{
  success: boolean;
  points: number;
  newTotal: number;
  levelUp?: boolean;
  newLevel?: string;
}>
```

**قواعد النقاط الافتراضية:**
- تعليق: 5 نقاط
- رد على تعليق: 7 نقاط
- إعجاب بمقال: 2 نقطة
- إعجاب بتعليق: 1 نقطة
- مشاركة مقال: 3 نقاط
- نشر مقال: 20 نقطة
- تسجيل دخول يومي: 2 نقطة

#### 2. نظام الشارات

```typescript
// التحقق من الشارات ومنحها
export async function checkAndAwardBadges(userId: string): Promise<void>

// منح شارة يدوياً
async function awardBadge(
  userId: string, 
  badgeId: string, 
  awardedBy: string
): Promise<void>
```

**أنواع الشارات:**
- **التفاعل**: مرحباً بك، معلق نشط، متواصل يومي
- **المحتوى**: كاتب موهوب، مقال مميز
- **الاجتماعي**: محبوب، مشارك اجتماعي
- **الإنجازات**: إنجازات خاصة ومعالم
- **خاص**: شارات موسمية ومناسبات

#### 3. نظام الإشعارات الفورية

```typescript
// إرسال إشعار فوري
export async function sendRealTimeNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    icon?: string;
    priority?: string;
    data?: any;
    actionUrl?: string;
  }
): Promise<void>
```

**أنواع الإشعارات:**
- رد على تعليق
- إعجاب مستلم
- شارة جديدة
- إنجاز مفتوح
- ترقية مستوى
- مشاركة مقال

---

## APIs المتاحة

### 1. API النقاط والشارات

#### جلب نقاط المستخدم
```http
GET /api/users/{id}/loyalty
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "current_points": 1250,
      "lifetime_points": 2500,
      "badges_count": 12,
      "current_streak": 7
    },
    "currentLevel": {
      "name": "متفاعل",
      "name_ar": "متفاعل",
      "min_points": 300,
      "max_points": 699,
      "icon": "⭐"
    },
    "badges": [...],
    "recentPoints": [...]
  }
}
```

#### إضافة نقاط يدوياً (إدارة)
```http
POST /api/users/{id}/loyalty
Content-Type: application/json

{
  "points": 50,
  "reason": "مكافأة إدارية",
  "action_type": "manual_award"
}
```

### 2. API الشارات

#### جلب شارات المستخدم
```http
GET /api/users/{id}/badges?featured=true
```

#### منح شارة (إدارة)
```http
POST /api/users/{id}/badges
Content-Type: application/json

{
  "badge_id": "badge-123",
  "reason": "استحقاق خاص",
  "is_featured": true
}
```

### 3. API الإشعارات

#### جلب إشعارات المستخدم
```http
GET /api/users/{id}/notifications?unread=true&limit=20
```

#### تحديث حالة الإشعار
```http
PUT /api/users/{id}/notifications
Content-Type: application/json

{
  "notification_id": "notif-123",
  "action": "read"
}
```

#### تحديد جميع الإشعارات كمقروءة
```http
PUT /api/users/{id}/notifications
Content-Type: application/json

{
  "action": "read",
  "all": true
}
```

---

## مكونات واجهة المستخدم

### 1. لوحة النقاط (LoyaltyPanel.tsx)

```typescript
<LoyaltyPanel userId={userId} className="w-full" />
```

**الميزات:**
- عرض النقاط الحالية والإجمالية
- تقدم المستوى الحالي
- الشارات المميزة
- النقاط الأخيرة المكتسبة

### 2. جرس الإشعارات (NotificationBell.tsx)

```typescript
<NotificationBell userId={userId} className="relative" />
```

**الميزات:**
- عداد الإشعارات غير المقروءة
- قائمة منسدلة بالإشعارات
- فلترة حسب النوع
- تحديث فوري عبر WebSocket

### 3. عرض الشارات (BadgeDisplay.tsx)

```typescript
<BadgeDisplay 
  badges={userBadges} 
  variant="inline" 
  maxDisplay={3}
  showTooltip={true}
/>
```

**أنواع العرض:**
- `inline`: عرض مضمن للتعليقات
- `grid`: عرض شبكي للملف الشخصي
- `featured`: عرض الشارات المميزة فقط

### 4. لوحة الإدارة (LoyaltyAdminPanel.tsx)

```typescript
<LoyaltyAdminPanel className="admin-panel" />
```

**الميزات:**
- إحصائيات شاملة
- إدارة قواعد النقاط
- إدارة الشارات
- قوائم المتصدرين

---

## نظام الأمان

### الحماية من التلاعب

#### 1. حدود المعدل (Rate Limiting)
```typescript
const RATE_LIMITS = {
  comment: 5,    // 5 تعليقات في الدقيقة
  like: 20,      // 20 إعجاب في الدقيقة
  share: 10,     // 10 مشاركات في الدقيقة
  general: 50    // 50 إجراء عام في الدقيقة
};
```

#### 2. فحص الأنماط المشبوهة
- الأنشطة المنتظمة جداً
- الأنشطة السريعة المتتالية
- التفاعل مع نفس المحتوى بكثرة
- الأنشطة خارج الساعات العادية

#### 3. فحص بصمة الجهاز
- عناوين IP متعددة
- User Agents مختلفة
- كشف VPN/Proxy

#### 4. تحليل تاريخ المستخدم
- عمر الحساب
- التبليغات السابقة
- المحتوى المحذوف

### نقاط الخطر

```typescript
const RISK_THRESHOLDS = {
  suspicious: 50,    // مشبوه
  high_risk: 80,     // خطر عالي
  blocked: 100       // محظور
};
```

---

## التحليلات والإحصائيات

### 1. التقارير الأساسية

```typescript
// إنشاء تقرير شامل
const report = await LoyaltyAnalyticsManager.generateAnalyticsReport({
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31'),
  period: 'day'
});
```

### 2. المقاييس المتاحة

#### نظرة عامة
- إجمالي المستخدمين
- المستخدمين النشطين
- إجمالي النقاط الموزعة
- إجمالي الشارات الممنوحة
- متوسط النقاط لكل مستخدم
- معدل المشاركة

#### الاتجاهات
- النقاط عبر الوقت
- الشارات عبر الوقت
- نشاط المستخدمين

#### التوزيع
- النقاط حسب نوع العمل
- الشارات حسب الفئة
- الشارات حسب المستوى
- المستخدمين حسب مستوى الولاء

#### الرؤى
- معدل الاحتفاظ
- معدل الانقطاع
- متوسط مدة الجلسة
- الأنشطة الشائعة

### 3. التصدير

```typescript
// تصدير التقرير
const csvReport = await LoyaltyAnalyticsManager.exportReport(report, 'csv');
const pdfReport = await LoyaltyAnalyticsManager.exportReport(report, 'pdf');
```

---

## دليل التكامل

### 1. تكامل مع نظام التفاعل

```typescript
// عند إضافة تعليق
await LoyaltyIntegration.logInteractionEvent(
  userId,
  'comment_added',
  commentId,
  'comment',
  { parentId, isFirst: true }
);

// عند الإعجاب
await LoyaltyIntegration.logInteractionEvent(
  userId,
  'like_added',
  likeId,
  'article',
  { targetId: articleId }
);
```

### 2. تكامل مع نظام المصادقة

```typescript
// عند تسجيل الدخول
await LoyaltyIntegration.logInteractionEvent(
  userId,
  'daily_login'
);
```

### 3. تكامل مع نظام النشر

```typescript
// عند نشر مقال
await LoyaltyIntegration.logInteractionEvent(
  userId,
  'article_published',
  articleId,
  'article',
  { isFeatured: true, isFirst: false }
);
```

---

## إعداد النظام

### 1. متطلبات النظام

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "react": "^18.0.0",
    "next": "^14.0.0"
  }
}
```

### 2. متغيرات البيئة

```env
# قاعدة البيانات
DATABASE_URL="postgresql://user:password@localhost:5432/sabq_ai"

# الإشعارات
WEBSOCKET_PORT=3001
FRONTEND_URL="http://localhost:3000"

# الأمان
SECURITY_SECRET="your-security-secret"
MAX_RISK_SCORE=100
```

### 3. التهيئة الأولية

```typescript
// تهيئة النظام
import { initializeLoyaltySystem } from './lib/loyalty-engine';
import { initializeRealTimeNotifications } from './lib/real-time-notifications';

// تهيئة البيانات الافتراضية
await initializeLoyaltySystem();

// تشغيل خادم الإشعارات
const server = createServer(app);
initializeRealTimeNotifications(server);
```

---

## الاختبارات

### 1. تشغيل الاختبارات

```bash
# اختبارات الوحدة
npm run test:unit

# اختبارات التكامل
npm run test:integration

# اختبارات الأداء
npm run test:performance

# جميع الاختبارات
npm run test
```

### 2. تغطية الاختبارات

```bash
# تقرير التغطية
npm run test:coverage
```

**الهدف:** تغطية 90% أو أكثر

### 3. أنواع الاختبارات

#### اختبارات الوحدة
- محرك النقاط
- نظام الشارات
- نظام الأمان
- التحليلات

#### اختبارات التكامل
- APIs
- قاعدة البيانات
- الإشعارات الفورية

#### اختبارات الأداء
- إضافة نقاط متعددة
- فحص أمني متعدد
- تحليلات كبيرة

---

## استكشاف الأخطاء

### 1. مشاكل شائعة

#### النقاط لا تُضاف
```typescript
// التحقق من الأخطاء
const result = await addLoyaltyPoints(userId, actionType, points);
if (!result.success) {
  console.error('Failed to add points:', result.reason);
}
```

#### الشارات لا تُمنح
```typescript
// فحص شروط الشارة
const badge = await prisma.badge.findUnique({
  where: { id: badgeId }
});
console.log('Badge conditions:', badge.conditions);
```

#### الإشعارات لا تصل
```typescript
// فحص اتصال WebSocket
if (socket.connected) {
  console.log('WebSocket connected');
} else {
  console.log('WebSocket disconnected');
}
```

### 2. السجلات والمراقبة

```typescript
// تفعيل السجلات المفصلة
process.env.DEBUG = 'loyalty:*';

// مراقبة الأداء
console.time('loyalty-operation');
await addLoyaltyPoints(userId, actionType, points);
console.timeEnd('loyalty-operation');
```

### 3. أدوات التشخيص

```typescript
// فحص حالة النظام
const systemHealth = await checkLoyaltySystemHealth();
console.log('System health:', systemHealth);

// إحصائيات الأداء
const performance = await getLoyaltyPerformanceStats();
console.log('Performance stats:', performance);
```

---

## الأمان والخصوصية

### 1. حماية البيانات

- جميع البيانات الحساسة مشفرة
- النقاط والشارات مرتبطة بالمستخدم المصادق
- الإشعارات محمية بصلاحيات المستخدم

### 2. الخصوصية

```typescript
// إعدادات الخصوصية
const privacySettings = {
  share_points: false,        // عدم مشاركة النقاط
  share_badges: true,         // مشاركة الشارات
  show_in_leaderboard: false, // عدم الظهور في المتصدرين
  receive_notifications: true // استلام الإشعارات
};
```

### 3. الامتثال

- متوافق مع GDPR
- حق المستخدم في حذف البيانات
- شفافية في جمع البيانات
- موافقة المستخدم على الإشعارات

---

## خارطة الطريق

### الإصدار الحالي (v1.0)
- ✅ نظام النقاط الأساسي
- ✅ الشارات والإنجازات
- ✅ الإشعارات الفورية
- ✅ الحماية من التلاعب
- ✅ التحليلات الأساسية

### الإصدار القادم (v1.1)
- 🔄 إشعارات Push للمتصفح
- 🔄 شارات موسمية
- 🔄 نظام المكافآت القابلة للاستبدال
- 🔄 تحليلات متقدمة

### الإصدار المستقبلي (v2.0)
- 📋 نظام المهام والتحديات
- 📋 المسابقات والفعاليات
- 📋 نظام الرعاية والمنتورينغ
- 📋 تكامل مع منصات خارجية

---

## الدعم والمساعدة

### 1. التوثيق التقني
- [دليل المطور](./DEVELOPER_GUIDE.md)
- [مرجع APIs](./API_REFERENCE.md)
- [دليل الاختبارات](./TESTING_GUIDE.md)

### 2. الدعم الفني
- البريد الإلكتروني: support@sabq.ai
- نظام التذاكر: [support.sabq.ai](https://support.sabq.ai)
- المجتمع: [Discord](https://discord.gg/sabq-ai)

### 3. المساهمة
- [دليل المساهمة](./CONTRIBUTING.md)
- [قواعد السلوك](./CODE_OF_CONDUCT.md)
- [تقرير الأخطاء](./BUG_REPORT.md)

---

## الخلاصة

نظام النقاط والشارات والإشعارات الفورية هو نظام متكامل ومتقدم يهدف إلى تحسين تجربة المستخدم وزيادة التفاعل مع المنصة. يوفر النظام:

- **تحفيز ذكي**: نقاط وشارات تلقائية
- **تفاعل فوري**: إشعارات مباشرة
- **أمان متقدم**: حماية من التلاعب
- **تحليلات شاملة**: رؤى وإحصائيات مفصلة
- **إدارة مرنة**: تحكم كامل من لوحة الإدارة

النظام قابل للتوسع والتخصيص ويمكن تكييفه مع احتياجات المشروع المختلفة.

---

*آخر تحديث: ديسمبر 2024*  
*الإصدار: 1.0.0*  
*المطور: فريق Sabq AI* 