# DigitalOcean App Platform Deployment

## النشر السريع

### استخدام Deploy Button
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/sabq4org/sabq-ai-cms/tree/clean-main)

### النشر اليدوي
1. استخدم `app.yaml` أو `deploy.template.yaml`
2. تأكد من اختيار الفرع `clean-main`
3. استخدم Build Command: `npm run build:do`

## المتغيرات المطلوبة

### متغيرات سرية (Encrypted)
- `DATABASE_URL` - رابط قاعدة بيانات PlanetScale
- `JWT_SECRET` - مفتاح JWT للمصادقة
- `CLOUDINARY_API_SECRET` - مفتاح Cloudinary السري
- `NEXTAUTH_SECRET` - مفتاح NextAuth

### متغيرات اختيارية
- `OPENAI_API_KEY` - مفتاح OpenAI (اختياري - لميزات AI)

## ملاحظات مهمة
- استخدم Node.js 18.x أو 20.x
- لا تستخدم Node.js 22 (غير متوافق حالياً)
- حجم الذاكرة المطلوب: 512MB على الأقل
- الفرع الصحيح: `clean-main` (ليس `main`) 