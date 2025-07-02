# 🚨 خطة العمل الفورية لحماية البيانات الحية

## المشكلة الحرجة
البيانات الحقيقية (الأخبار والمحتوى) تُستبدل بالبيانات التجريبية عند كل تحديث من GitHub!

## الخطوات الفورية (يجب تنفيذها اليوم)

### 1️⃣ على السيرفر الحي - الآن فوراً (15 دقيقة)

```bash
# SSH إلى السيرفر
ssh user@jur3a.ai

# انتقل إلى مجلد المشروع
cd /var/www/jur3a-cms

# خذ نسخة احتياطية فورية
mkdir -p emergency_backup_$(date +%Y%m%d)
cp -r data/ emergency_backup_$(date +%Y%m%d)/
cp .env emergency_backup_$(date +%Y%m%d)/

# إنشاء ملف .env.production
cp .env .env.production

# تحديث .env.production
nano .env.production
# أضف هذه السطور:
# NODE_ENV=production
# SEED_FAKE_DATA=false
# USE_MOCK_DATA=false

# حماية مجلد البيانات
chmod 755 data/
chmod 644 data/*.json
```

### 2️⃣ إعداد قاعدة بيانات حقيقية (1 ساعة)

#### Option A: PostgreSQL على نفس السيرفر
```bash
# تثبيت PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# إنشاء قاعدة البيانات
sudo -u postgres psql
CREATE DATABASE jur3a_production;
CREATE USER jur3a_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE jur3a_production TO jur3a_user;
\q

# تحديث .env.production
DATABASE_URL=postgres://jur3a_user:strong_password_here@localhost:5432/jur3a_production
```

#### Option B: Supabase (أسرع وأسهل)
1. اذهب إلى https://supabase.com
2. أنشئ مشروع جديد
3. احصل على connection string
4. أضفه إلى .env.production

### 3️⃣ نقل البيانات من JSON إلى قاعدة البيانات (30 دقيقة)

```bash
# على السيرفر
cd /var/www/jur3a-cms

# إنشاء سكريبت النقل
cat > scripts/migrate-to-db.js << 'EOF'
const fs = require('fs');
const { Pool } = require('pg');

// قراءة البيانات الحالية
const articles = JSON.parse(fs.readFileSync('data/articles.json', 'utf8'));
const users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));

// الاتصال بقاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log('🔄 بدء نقل البيانات...');
  
  // نقل المستخدمين
  for (const user of users) {
    await pool.query(`
      INSERT INTO users (id, email, name, role, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [user.id, user.email, user.name, user.role, user.createdAt]);
  }
  
  // نقل المقالات
  for (const article of articles) {
    await pool.query(`
      INSERT INTO articles (id, title, content, slug, author_id, published, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [article.id, article.title, article.content, article.slug, 
        article.authorId, article.published, article.createdAt]);
  }
  
  console.log('✅ تم نقل البيانات بنجاح!');
  process.exit(0);
}

migrate().catch(console.error);
EOF

# تشغيل النقل
node scripts/migrate-to-db.js
```

### 4️⃣ تحديث الكود لاستخدام قاعدة البيانات (20 دقيقة)

في ملف `app/api/articles/route.ts`:
```typescript
// قبل
const articles = JSON.parse(fs.readFileSync('data/articles.json'));

// بعد
const { rows: articles } = await pool.query(
  'SELECT * FROM articles WHERE published = true ORDER BY created_at DESC'
);
```

### 5️⃣ إعداد النسخ الاحتياطي التلقائي (10 دقائق)

```bash
# إضافة cron job
crontab -e

# أضف هذا السطر (نسخة يومية في الساعة 2 صباحاً)
0 2 * * * cd /var/www/jur3a-cms && ./scripts/backup-production.sh
```

### 6️⃣ تحديث عملية النشر (15 دقيقة)

في ملف deploy script الحالي، أضف:
```bash
#!/bin/bash
# deploy.sh

# فحص السلامة أولاً
node scripts/check-production-safety.js || exit 1

# نسخة احتياطية قبل التحديث
./scripts/backup-production.sh

# سحب التحديثات (الكود فقط)
git pull origin main

# تثبيت dependencies
npm ci --production

# بناء المشروع
npm run build:production

# إعادة تشغيل PM2
pm2 reload ecosystem.config.js

echo "✅ تم النشر بدون المساس بالبيانات!"
```

## 📋 قائمة الفحص السريع

- [ ] نسخة احتياطية من البيانات الحالية
- [ ] إنشاء .env.production مع SEED_FAKE_DATA=false
- [ ] إعداد قاعدة بيانات PostgreSQL أو Supabase
- [ ] نقل البيانات من JSON إلى قاعدة البيانات
- [ ] تحديث APIs لقراءة من قاعدة البيانات
- [ ] إعداد نسخ احتياطي يومي تلقائي
- [ ] اختبار عملية نشر بدون فقدان بيانات

## ⚠️ تحذيرات مهمة

1. **لا تشغل أبداً** في الإنتاج:
   - `npm run seed`
   - `npm run db:reset`
   - أي سكريبت يحتوي على "mock" أو "test"

2. **تأكد دائماً** من:
   - وجود نسخة احتياطية قبل أي تحديث
   - أن NODE_ENV=production
   - أن SEED_FAKE_DATA=false

3. **احذف فوراً** من السيرفر:
   - مجلد data/mock/
   - مجلد data/seed/
   - أي ملفات تجريبية

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه الخطوات:
- ✅ البيانات الحية محمية في قاعدة بيانات منفصلة
- ✅ التحديثات من GitHub تؤثر على الكود فقط
- ✅ نسخ احتياطية يومية تلقائية
- ✅ لا يمكن للبيانات التجريبية أن تستبدل البيانات الحقيقية
- ✅ نظام آمن وموثوق للإنتاج

## 🆘 في حالة الطوارئ

إذا فُقدت البيانات:
```bash
# استعادة من آخر نسخة احتياطية
cd /var/www/jur3a-cms
tar -xzf backups/backup_[latest_date].tar.gz
pg_restore -d jur3a_production backups/db_[latest_date].sql
```

---

⏰ **الوقت المقدر للتنفيذ الكامل: 2-3 ساعات**

🚀 **ابدأ الآن - كل دقيقة تأخير تزيد من خطر فقدان البيانات!** 