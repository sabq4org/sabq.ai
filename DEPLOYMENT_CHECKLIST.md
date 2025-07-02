# قائمة تحقق رفع المشروع للإنتاج 🚀

## ✅ قبل الرفع:

### 1️⃣ **التأكد من البناء المحلي**
```bash
npm run build
```

### 2️⃣ **تنظيف الملفات غير الضرورية**
```bash
# حذف ملفات التطوير
rm -rf .env.temp
rm -rf app/api/test-db

# التأكد من .gitignore
git status
```

### 3️⃣ **متغيرات البيئة للإنتاج**
```env
# في Vercel/Netlify
DATABASE_URL=mysql://[YOUR_PLANETSCALE_USERNAME]:[YOUR_PLANETSCALE_PASSWORD]@[YOUR_HOST].psdb.cloud/[YOUR_DATABASE]?sslaccept=strict
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-strong-secret-32-chars-minimum
NODE_ENV=production
```

## 🌐 خيارات الاستضافة:

### **خيار 1: Vercel (الأسهل)**
1. اذهب إلى https://vercel.com
2. اربط GitHub
3. اختر المشروع
4. أضف Environment Variables
5. Deploy!

### **خيار 2: Netlify**
1. https://netlify.com
2. Drag & Drop أو GitHub
3. Build command: `npm run build`
4. Publish directory: `.next`

### **خيار 3: Railway**
1. https://railway.app
2. Deploy from GitHub
3. تلقائي 100%

## ⚙️ إعدادات مهمة:

### **Vercel - vercel.json**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/articles/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### **متغيرات البيئة المطلوبة**
- ✅ DATABASE_URL (من PlanetScale)
- ✅ NEXTAUTH_URL (رابط موقعك)
- ✅ NEXTAUTH_SECRET (سر قوي)
- ⚡️ OPENAI_API_KEY (اختياري)

## 🔧 أوامر مفيدة:

### **توليد NEXTAUTH_SECRET**
```bash
openssl rand -base64 32
```

### **اختبار البناء**
```bash
npm run build && npm start
```

## 🚨 تحذيرات مهمة:

1. **لا ترفع .env أبداً**
2. **تأكد من وضع DATABASE_URL في متغيرات البيئة**
3. **غيّر NEXTAUTH_SECRET في الإنتاج**
4. **فعّل HTTPS دائماً**

## 📝 بعد الرفع:

1. اختبر تسجيل الدخول
2. اختبر إنشاء مقال
3. اختبر التفاعلات
4. راقب الأخطاء في Logs

---

**جاهز للرفع؟** 🎉 