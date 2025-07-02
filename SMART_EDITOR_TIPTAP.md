# محرر سبق الذكي - TipTap Smart Editor

## نظرة عامة
تم تطوير محرر ذكي متقدم باستخدام TipTap (مبني على ProseMirror) مع دعم كامل للذكاء الاصطناعي، يوفر تجربة كتابة احترافية وعصرية مشابهة لـ Notion مع قدرات AI متقدمة.

## المميزات الرئيسية

### 1. محرر متقدم
- ✅ دعم كامل لـ RTL والعربية
- ✅ جميع أدوات التنسيق الأساسية (Bold, Italic, Underline, Code)
- ✅ العناوين متعددة المستويات (H1-H6)
- ✅ القوائم (مرقمة ونقطية)
- ✅ الاقتباسات (Blockquotes)
- ✅ الجداول مع إمكانية التحرير
- ✅ الروابط والصور
- ✅ تضمين فيديوهات YouTube
- ✅ محاذاة النص (يمين، وسط، يسار، ضبط)
- ✅ عداد الكلمات والحروف
- ✅ حفظ تلقائي
- ✅ دعم الوضع الليلي

### 2. الذكاء الاصطناعي المدمج
- 🤖 **توليد فقرة**: إنشاء محتوى جديد بناءً على السياق
- 🧠 **إعادة صياغة**: تحسين وإعادة كتابة النص المحدد
- 📋 **تلخيص**: اختصار الفقرات الطويلة
- 🏷️ **اقتراح وسوم**: استخراج كلمات مفتاحية ذكية
- 🎯 **توليد عنوان**: اقتراح عناوين جذابة

## الملفات الرئيسية

### 1. `/components/Editor/Editor.tsx`
المحرر الأساسي مع جميع الإضافات والإعدادات.

### 2. `/components/Editor/EditorToolbar.tsx`
شريط الأدوات مع أزرار التنسيق وقائمة الذكاء الاصطناعي.

### 3. `/components/Editor/EditorStyles.tsx`
أنماط CSS مخصصة للمحرر مع دعم RTL والوضع الليلي.

### 4. `/components/ContentEditorWithTiptap.tsx`
Wrapper component يدمج المحرر مع نظام المقالات الحالي.

### 5. `/app/api/ai/editor/route.ts`
API endpoint للذكاء الاصطناعي (جاهز للربط مع OpenAI).

## التثبيت والإعداد

### الحزم المطلوبة
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-underline @tiptap/extension-youtube @tiptap/extension-placeholder @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-link @tiptap/extension-table @tiptap/extension-text-align @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-character-count styled-jsx
```

## الاستخدام

### في صفحة إنشاء مقال
```tsx
import ContentEditorWithTiptap from '@/components/ContentEditorWithTiptap';

<ContentEditorWithTiptap 
  formData={formData}
  setFormData={setFormData}
  categories={categories}
  onGenerateTitle={generateTitle}
  onGenerateDescription={generateDescription}
  aiLoading={aiLoading}
/>
```

### استخدام المحرر مباشرة
```tsx
import Editor from '@/components/Editor/Editor';

<Editor
  content={initialContent}
  onChange={handleChange}
  placeholder="ابدأ كتابة مقالك هنا..."
  enableAI={true}
  onAIAction={handleAIAction}
/>
```

## تخصيص الذكاء الاصطناعي

### ربط OpenAI API
في `/app/api/ai/editor/route.ts`:

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

// استبدل generateAIResponse بـ:
async function generateAIResponse(prompt: string, action: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { 
        role: 'system', 
        content: 'أنت مساعد صحفي محترف يكتب بالعربية' 
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
}
```

### إضافة إجراءات AI جديدة
في `/components/Editor/EditorToolbar.tsx`:

```typescript
const aiActions = [
  // أضف إجراءات جديدة هنا
  { 
    id: 'translate', 
    label: '🌐 ترجمة', 
    icon: Globe 
  },
  { 
    id: 'fact_check', 
    label: '✓ تدقيق الحقائق', 
    icon: CheckCircle 
  }
];
```

## البنية التقنية

### تحويل البيانات
- **من Blocks إلى HTML**: `convertBlocksToEditorContent()`
- **من Editor إلى Blocks**: `convertEditorToBlocks()`

### معالجة المحتوى
```typescript
// البنية المستخدمة
interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | ...;
  content: any;
  order: number;
}
```

## التطويرات المستقبلية

### قريبًا
- [ ] رفع الصور مباشرة (Drag & Drop)
- [ ] تضمين التغريدات
- [ ] Markdown shortcuts
- [ ] نسخ/لصق محسّن
- [ ] تعاون في الوقت الفعلي

### مخطط لها
- [ ] قوالب محتوى جاهزة
- [ ] إضافات مخصصة (Plugins)
- [ ] تصدير PDF/Word
- [ ] محرر رمز متقدم
- [ ] معاينة مباشرة

## حل المشاكل الشائعة

### 1. خطأ SSR
المحرر يستخدم `dynamic import` لتجنب مشاكل Server-Side Rendering:
```tsx
const Editor = dynamic(() => import('./Editor/Editor'), { 
  ssr: false 
});
```

### 2. مشكلة RTL
تأكد من وجود `dir="rtl"` في editorProps:
```tsx
editorProps: {
  attributes: {
    dir: 'rtl',
    // ...
  }
}
```

### 3. عداد الكلمات لا يعمل
تأكد من إضافة CharacterCount extension:
```tsx
CharacterCount.configure({
  limit: 10000,
})
```

## الأمان
- تنظيف المحتوى من XSS
- التحقق من الصور والروابط
- حدود على حجم المحتوى
- معالجة آمنة لطلبات AI

## الأداء
- Lazy loading للمحرر
- Debounce للحفظ التلقائي
- تحسين عمليات التحويل
- ذاكرة تخزين مؤقت لنتائج AI

## الدعم والمساعدة
للمساعدة أو الإبلاغ عن مشاكل، يرجى فتح issue في المشروع. 