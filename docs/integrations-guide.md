# دليل التكاملات الشامل
## Comprehensive Integrations Guide

### المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [البدء السريع](#البدء-السريع)
3. [موفرو الخدمات المدعومون](#موفرو-الخدمات-المدعومون)
4. [التكوين والإعداد](#التكوين-والإعداد)
5. [الأمان والخصوصية](#الأمان-والخصوصية)
6. [أمثلة الاستخدام](#أمثلة-الاستخدام)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)
8. [المساهمة](#المساهمة)

## نظرة عامة

نظام التكاملات في **Sabq AI CMS** يوفر واجهة موحدة للتعامل مع الخدمات الخارجية المختلفة. تم تصميم النظام ليكون:

- **آمن**: تشفير كامل للبيانات الحساسة
- **قابل للتوسع**: إضافة موفرين جدد بسهولة
- **موثوق**: آليات إعادة المحاولة ومراقبة الصحة
- **متوافق مع الخصوصية**: احترام قوانين حماية البيانات

### الميزات الرئيسية

✅ **إدارة موفري الخدمات** - إضافة وتحديث وحذف الموفرين  
✅ **مصادقة آمنة** - دعم OAuth, API Keys, وطرق أخرى  
✅ **مراقبة الصحة** - فحص دوري لحالة الخدمات  
✅ **إحصائيات مفصلة** - تتبع الاستخدام والأداء  
✅ **معالجة الأخطاء** - آليات ذكية للتعامل مع الأخطاء  
✅ **التخزين المؤقت** - تحسين الأداء وتقليل التكلفة  

## البدء السريع

### 1. تثبيت المتطلبات

```bash
npm install @sabq/integrations
```

### 2. الإعداد الأساسي

```typescript
import { providersManager } from './lib/integrations/providers';

// إضافة موفر خدمة جديد
const supabaseProvider = {
  id: 'supabase-main',
  name: 'Supabase Production',
  type: 'database',
  configuration: {
    baseUrl: process.env.SUPABASE_URL,
    region: 'us-east-1'
  },
  authentication: {
    type: 'api_key',
    credentials: {
      apiKey: process.env.SUPABASE_API_KEY
    }
  }
};

providersManager.addProvider(supabaseProvider);
```

### 3. استخدام بسيط

```typescript
// إجراء استدعاء API
const result = await providersManager.makeApiCall(
  'supabase-main',
  '/rest/v1/articles',
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  }
);

if (result.success) {
  console.log('البيانات:', result.data);
} else {
  console.error('خطأ:', result.error);
}
```

## موفرو الخدمات المدعومون

### قواعد البيانات
| الموفر | النوع | الوصف | الحالة |
|--------|-------|--------|---------|
| **Supabase** | `database` | قاعدة بيانات PostgreSQL مع REST API | ✅ مدعوم |
| **MongoDB Atlas** | `database` | قاعدة بيانات NoSQL السحابية | 🔄 قيد التطوير |
| **PlanetScale** | `database` | قاعدة بيانات MySQL بدون خادم | 📋 مخطط |

### التخزين والوسائط
| الموفر | النوع | الوصف | الحالة |
|--------|-------|--------|---------|
| **Cloudinary** | `storage` | إدارة وتحسين الصور والفيديو | ✅ مدعوم |
| **AWS S3** | `storage` | تخزين الملفات السحابي | 🔄 قيد التطوير |
| **Vercel Blob** | `storage` | تخزين الملفات بدون خادم | 📋 مخطط |

### الذكاء الاصطناعي
| الموفر | النوع | الوصف | الحالة |
|--------|-------|--------|---------|
| **OpenAI** | `ai` | GPT-4, DALL-E, والخدمات الأخرى | ✅ مدعوم |
| **Anthropic** | `ai` | Claude AI للمحادثات والتحليل | ✅ مدعوم |
| **Google AI** | `ai` | Gemini وخدمات الذكاء الاصطناعي | 📋 مخطط |

### التحليلات والمراقبة
| الموفر | النوع | الوصف | الحالة |
|--------|-------|--------|---------|
| **Google Analytics** | `analytics` | تحليلات الويب والتطبيقات | 🔄 قيد التطوير |
| **Mixpanel** | `analytics` | تحليلات الأحداث والسلوك | 📋 مخطط |
| **Sentry** | `monitoring` | مراقبة الأخطاء والأداء | 📋 مخطط |

## التكوين والإعداد

### متغيرات البيئة

إنشاء ملف `.env.local` مع المتغيرات المطلوبة:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_ORGANIZATION=org-your-organization

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# تشفير البيانات
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_IV=your-16-character-iv
```

### التكوين المتقدم

```typescript
import { ProvidersManager, ProviderConfiguration } from './lib/integrations/providers';

const advancedConfig: ProviderConfiguration = {
  id: 'openai-gpt4',
  name: 'OpenAI GPT-4 Production',
  type: 'ai',
  version: '1.0.0',
  status: 'active',
  configuration: {
    baseUrl: 'https://api.openai.com/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimiting: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
      concurrentRequests: 5
    },
    customHeaders: {
      'User-Agent': 'Sabq-AI-CMS/1.0.0'
    }
  },
  authentication: {
    type: 'bearer_token',
    credentials: {
      token: process.env.OPENAI_API_KEY
    },
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Organization': process.env.OPENAI_ORGANIZATION
    }
  },
  features: [
    'text-generation',
    'image-generation',
    'code-completion',
    'embeddings'
  ],
  limitations: {
    maxRequestSize: '100MB',
    maxResponseTime: '30s',
    supportedFormats: ['json', 'text', 'multipart']
  },
  pricing: {
    model: 'pay-per-use',
    currency: 'USD',
    rates: {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002
    }
  },
  metadata: {
    environment: 'production',
    region: 'us-east-1',
    lastHealthCheck: new Date(),
    healthStatus: 'healthy'
  }
};

providersManager.addProvider(advancedConfig);
```

## الأمان والخصوصية

### تشفير البيانات

جميع البيانات الحساسة يتم تشفيرها باستخدام AES-256:

```typescript
import { encryptData, decryptData } from './lib/security';

// تشفير بيانات الاعتماد
const encryptedCredentials = encryptData(apiKey);

// فك التشفير عند الحاجة
const decryptedKey = decryptData(encryptedCredentials);
```

### إدارة الصلاحيات

```typescript
import { authManager, UserRole } from './lib/auth';

// فحص الصلاحيات قبل الوصول للتكاملات
const canManageIntegrations = authManager.hasPermission(
  currentUser,
  'manage_integrations'
);

if (!canManageIntegrations) {
  throw new Error('غير مسموح بإدارة التكاملات');
}
```

### تسجيل العمليات

```typescript
import { privacyManager, PersonalDataType } from './lib/privacy-controls';

// تسجيل كل عملية وصول للبيانات
await privacyManager.logDataProcessing({
  userId: currentUser.id,
  action: 'api_call',
  dataType: PersonalDataType.SENSITIVE,
  purpose: ProcessingPurpose.INTEGRATION,
  justification: 'Calling external API for user data'
});
```

## أمثلة الاستخدام

### 1. تحميل صورة إلى Cloudinary

```typescript
import { CloudinaryExamples } from './lib/integrations/examples';

const uploadResult = await CloudinaryExamples.uploadImage({
  file: imageFile,
  folder: 'articles',
  transformation: {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto'
  }
});

if (uploadResult.success) {
  console.log('رابط الصورة:', uploadResult.data.secure_url);
}
```

### 2. توليد محتوى بـ OpenAI

```typescript
import { OpenAIExamples } from './lib/integrations/examples';

const content = await OpenAIExamples.generateArticle({
  topic: 'الذكاء الاصطناعي في الصحافة',
  length: 'medium',
  tone: 'professional',
  language: 'ar'
});

console.log('المقال المولد:', content.data.text);
```

### 3. تخزين البيانات في Supabase

```typescript
import { SupabaseExamples } from './lib/integrations/examples';

const article = await SupabaseExamples.createArticle({
  title: 'عنوان المقال',
  content: 'محتوى المقال...',
  author_id: 'user-123',
  category: 'تقنية',
  published: true
});

console.log('تم إنشاء المقال:', article.data.id);
```

### 4. تحليل المشاعر

```typescript
import { AnthropicExamples } from './lib/integrations/examples';

const sentiment = await AnthropicExamples.analyzeSentiment({
  text: 'نص المقال أو التعليق...',
  language: 'ar'
});

console.log('تحليل المشاعر:', sentiment.data.sentiment);
```

## واجهات برمجة التطبيقات

### إدارة الموفرين

```http
# جلب جميع الموفرين
GET /api/integrations

# جلب موفر محدد
GET /api/integrations/{provider_id}

# إضافة موفر جديد
POST /api/integrations
Content-Type: application/json

{
  "id": "new-provider",
  "name": "New Provider",
  "type": "api",
  "configuration": {...},
  "authentication": {...}
}

# تحديث موفر
PUT /api/integrations/{provider_id}

# حذف موفر
DELETE /api/integrations/{provider_id}
```

### اختبار الموفرين

```http
# اختبار شامل
POST /api/integrations/{provider_id}/test
Content-Type: application/json

{
  "testType": "comprehensive"
}

# اختبار الاتصال فقط
POST /api/integrations/{provider_id}/test
Content-Type: application/json

{
  "testType": "connection"
}
```

### الإحصائيات

```http
# إحصائيات موفر محدد
GET /api/integrations/{provider_id}/stats?period=30d&include_details=true

# تحديث الإحصائيات
POST /api/integrations/{provider_id}/stats
Content-Type: application/json

{
  "action": "record_usage",
  "data": {
    "endpoint": "/api/data",
    "method": "GET",
    "responseTime": 250,
    "success": true
  }
}
```

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. فشل المصادقة
```
❌ خطأ: Authentication failed for provider 'openai'
```

**الحل:**
1. تأكد من صحة مفتاح API
2. فحص تواريخ انتهاء الصلاحية
3. التحقق من الصلاحيات المطلوبة

```typescript
// فحص صحة المصادقة
const authTest = await providersManager.testAuthentication('openai');
console.log('حالة المصادقة:', authTest);
```

#### 2. تجاوز حدود المعدل
```
❌ خطأ: Rate limit exceeded for provider 'cloudinary'
```

**الحل:**
1. زيادة التأخير بين الطلبات
2. تنفيذ آلية التخزين المؤقت
3. ترقية الاشتراك

```typescript
// تخصيص حدود المعدل
providersManager.updateProvider('cloudinary', {
  configuration: {
    rateLimiting: {
      requestsPerMinute: 30, // تقليل العدد
      retryAfter: 2000 // زيادة التأخير
    }
  }
});
```

#### 3. مهلة انتهاء الاتصال
```
❌ خطأ: Request timeout for provider 'supabase'
```

**الحل:**
1. زيادة مهلة الاتصال
2. فحص حالة الشبكة
3. اختبار الاتصال المباشر

```typescript
// زيادة مهلة الاتصال
providersManager.updateProvider('supabase', {
  configuration: {
    timeout: 45000 // 45 ثانية
  }
});
```

### أدوات التشخيص

#### فحص الصحة الشامل
```typescript
// فحص جميع الموفرين
const healthReport = await providersManager.getHealthReport();

healthReport.providers.forEach(provider => {
  console.log(`${provider.name}: ${provider.status}`);
  if (!provider.healthy) {
    console.log('المشاكل:', provider.issues);
  }
});
```

#### مراقبة الأداء
```typescript
// تتبع أداء الطلبات
const performanceMetrics = await providersManager.getPerformanceMetrics('openai', {
  period: '24h',
  includeDetails: true
});

console.log('متوسط وقت الاستجابة:', performanceMetrics.averageResponseTime);
console.log('معدل النجاح:', performanceMetrics.successRate);
```

### تفعيل التسجيل المفصل

```typescript
// في ملف التكوين
export const IntegrationConfig = {
  logging: {
    level: 'debug',
    includeRequestBodies: true,
    includeResponseBodies: false,
    logToConsole: true,
    logToFile: '/logs/integrations.log'
  }
};
```

## أفضل الممارسات

### 1. إدارة الأخطاء
```typescript
try {
  const result = await providersManager.makeApiCall('provider-id', '/endpoint');
  
  if (!result.success) {
    // تسجيل الخطأ
    console.error('API Error:', result.error);
    
    // معالجة مخصصة حسب نوع الخطأ
    switch (result.statusCode) {
      case 401:
        // إعادة تجديد المصادقة
        await refreshAuthentication('provider-id');
        break;
      case 429:
        // انتظار وإعادة المحاولة
        await delay(result.retryAfter || 5000);
        return await retryApiCall('provider-id', '/endpoint');
      case 500:
        // تسجيل في نظام المراقبة
        await reportError(result.error);
        break;
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 2. التحسين والأداء
```typescript
// استخدام التخزين المؤقت
const cachedResult = await cacheManager.get(`api:${providerId}:${endpoint}`);
if (cachedResult) {
  return cachedResult;
}

const result = await providersManager.makeApiCall(providerId, endpoint);
if (result.success) {
  await cacheManager.set(`api:${providerId}:${endpoint}`, result, 300); // 5 دقائق
}
```

### 3. الأمان
```typescript
// تدوير مفاتيح API دورياً
setInterval(async () => {
  await rotateApiKeys();
}, 30 * 24 * 60 * 60 * 1000); // كل 30 يوم

// فحص أمني دوري
setInterval(async () => {
  await performSecurityAudit();
}, 7 * 24 * 60 * 60 * 1000); // كل أسبوع
```

## المساهمة

### إضافة موفر خدمة جديد

1. **إنشاء ملف التكوين**
```typescript
// lib/integrations/providers/new-provider.ts
export const NewProviderConfig: ProviderConfiguration = {
  id: 'new-provider',
  name: 'New Provider',
  type: 'custom',
  // باقي التكوين...
};
```

2. **تنفيذ الواجهات المطلوبة**
```typescript
export class NewProviderClient implements ProviderClient {
  async makeRequest(endpoint: string, options: RequestOptions) {
    // تنفيذ منطق الطلبات
  }
  
  async authenticate() {
    // تنفيذ المصادقة
  }
  
  async healthCheck() {
    // فحص الصحة
  }
}
```

3. **إضافة الاختبارات**
```typescript
// tests/integrations/new-provider.test.ts
describe('New Provider Integration', () => {
  test('should authenticate successfully', async () => {
    // اختبارات...
  });
});
```

4. **تحديث التوثيق**
- إضافة الموفر لجدول الموفرين المدعومين
- إضافة أمثلة الاستخدام
- تحديث دليل التكوين

### مبادئ التطوير

- **الأمان أولاً**: لا تعرض بيانات حساسة أبداً
- **معالجة الأخطاء**: تعامل مع جميع الحالات المحتملة
- **الأداء**: استخدم التخزين المؤقت وتحسين الطلبات
- **التوثيق**: وثق كل شيء بوضوح
- **الاختبار**: اكتب اختبارات شاملة

## الدعم

- 📧 **البريد الإلكتروني**: integrations@sabq.ai
- 💬 **Discord**: [رابط الخادم]
- 📚 **الوثائق**: [docs.sabq.ai](https://docs.sabq.ai)
- 🐛 **المشاكل**: [GitHub Issues](https://github.com/sabq4org/sabq-ai-cms/issues)

---

**آخر تحديث**: ديسمبر 2024  
**الإصدار**: 1.0.0  
**الحالة**: ✅ نشط 