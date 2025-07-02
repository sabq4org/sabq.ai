# حل مشكلة مفتاح OpenAI API

## المشكلة
عند محاولة توليد تحليل عميق، تظهر رسالة الخطأ:
```
401 Incorrect API key provided: sk-....
```

## الأسباب المحتملة

### 1. المفتاح غير كامل في ملف .env
تأكد من أن المفتاح في ملف `.env` كامل وليس مختصراً:
```bash
# خاطئ
OPENAI_API_KEY=sk-...

# صحيح
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890
```

### 2. المفتاح منتهي الصلاحية أو محذوف
- تحقق من [OpenAI Dashboard](https://platform.openai.com/api-keys)
- تأكد أن المفتاح لا يزال نشطاً

### 3. عدم وجود رصيد في الحساب
- تحقق من [رصيدك](https://platform.openai.com/usage)
- قد تحتاج لإضافة طريقة دفع

## الحل الكامل

### الخطوة 1: الحصول على مفتاح جديد
1. اذهب إلى https://platform.openai.com/api-keys
2. انقر على "Create new secret key"
3. أعطه اسماً مثل "Sabq CMS"
4. انسخ المفتاح الكامل (يبدأ بـ `sk-proj-`)

### الخطوة 2: تحديث ملف .env
```bash
# افتح ملف .env في محرر النصوص
nano .env

# أو استخدم VS Code
code .env
```

استبدل السطر:
```
OPENAI_API_KEY=sk-...
```

بالمفتاح الكامل:
```
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_FULL_KEY_HERE
```

### الخطوة 3: إعادة تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C)
# ثم أعد تشغيله
npm run dev
```

### الخطوة 4: اختبار المفتاح من الإعدادات
1. اذهب إلى http://localhost:3000/dashboard/settings
2. انقر على تبويب "الذكاء الاصطناعي"
3. الصق نفس المفتاح في حقل "مفتاح OpenAI API"
4. انقر على زر "اختبار"
5. يجب أن تظهر رسالة "تم الاتصال بنجاح!"
6. انقر على "حفظ"

## طرق بديلة

### استخدام ملف .env.local
إذا كنت تفضل عدم تعديل .env:
```bash
# أنشئ ملف .env.local
cp .env.local.example .env.local

# أضف المفتاح
echo "OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE" >> .env.local
```

### استخدام متغير البيئة مباشرة
```bash
# على macOS/Linux
export OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
npm run dev

# على Windows PowerShell
$env:OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"
npm run dev
```

## التحقق من أن المفتاح يعمل

### من Terminal
```bash
# تحقق من قراءة المتغير
echo $OPENAI_API_KEY

# اختبر المفتاح مع curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### من الكود
أضف هذا السطر مؤقتاً في `app/api/deep-analyses/generate/route.ts`:
```javascript
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
```

## نصائح مهمة

1. **لا تشارك المفتاح**: احفظه في مكان آمن
2. **استخدم .gitignore**: تأكد أن .env مضاف لـ .gitignore
3. **حدود الاستخدام**: راقب استخدامك من [OpenAI Usage](https://platform.openai.com/usage)
4. **المفاتيح المتعددة**: يمكنك إنشاء مفاتيح مختلفة للتطوير والإنتاج

## استكشاف الأخطاء

### "Invalid API key"
- تأكد من نسخ المفتاح كاملاً بدون مسافات
- تحقق من أن المفتاح يبدأ بـ `sk-proj-`

### "Insufficient quota"
- أضف طريقة دفع في حسابك
- راجع حدود الاستخدام

### "Rate limit exceeded"
- انتظر قليلاً ثم حاول مرة أخرى
- قلل عدد الطلبات

## الدعم
إذا استمرت المشكلة:
1. تحقق من [OpenAI Status](https://status.openai.com/)
2. راجع [OpenAI Community](https://community.openai.com/)
3. اتصل بدعم OpenAI 