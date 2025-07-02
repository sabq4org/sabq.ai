# تعليمات إضافة مفتاح OpenAI API الكامل

## المشكلة الحالية
المفتاح الموجود في ملف `.env` مختصر (`sk-...`) وهذا يسبب خطأ 401 عند محاولة استخدام OpenAI API.

## الحل خطوة بخطوة

### 1. احصل على مفتاح جديد من OpenAI
1. افتح المتصفح واذهب إلى: https://platform.openai.com/api-keys
2. سجل الدخول بحسابك
3. انقر على زر **"Create new secret key"**
4. أعط المفتاح اسماً مثل "Sabq CMS Development"
5. **مهم جداً**: انسخ المفتاح الكامل فوراً (لن تتمكن من رؤيته مرة أخرى!)
   - المفتاح الكامل يبدو مثل: `sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ`

### 2. حدّث ملف .env
```bash
# افتح ملف .env في محرر النصوص
nano .env

# أو استخدم VS Code
code .env
```

### 3. استبدل المفتاح المختصر
ابحث عن السطر:
```
OPENAI_API_KEY=sk-...
```

واستبدله بـ:
```
OPENAI_API_KEY=sk-proj-YOUR_FULL_API_KEY_HERE
```

### 4. احفظ الملف وأعد تشغيل السيرفر
1. احفظ الملف (Ctrl+S في VS Code أو Ctrl+X ثم Y في nano)
2. أوقف السيرفر بالضغط على Ctrl+C
3. أعد تشغيله:
```bash
npm run dev
```

## نصائح مهمة
- تأكد من عدم وجود مسافات قبل أو بعد المفتاح
- تأكد من عدم وجود علامات اقتباس حول المفتاح
- تأكد من أن لديك رصيد في حساب OpenAI

## للتحقق من صحة المفتاح
بعد إضافة المفتاح، يمكنك التحقق من صحته من خلال:
1. الذهاب إلى: http://localhost:3000/dashboard/settings
2. النقر على تبويب "الذكاء الاصطناعي"
3. النقر على زر "اختبار"

## مثال على مفتاح صحيح
```
OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```
(هذا مجرد مثال، استخدم مفتاحك الحقيقي) 