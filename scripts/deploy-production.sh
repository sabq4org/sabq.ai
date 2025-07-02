#!/bin/bash

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 بدء نشر sabq-ai-cms في الإنتاج${NC}"
echo "====================================="

# 1. التحقق من البيئة
echo -e "\n${YELLOW}1. التحقق من البيئة...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ ملف .env.production غير موجود!${NC}"
    echo "يرجى إنشاء الملف من env.production.example"
    exit 1
fi

# 2. تشغيل فحص الإنتاج
echo -e "\n${YELLOW}2. فحص جاهزية الإنتاج...${NC}"
if [ -f "scripts/production-checklist.sh" ]; then
    ./scripts/production-checklist.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ فشل فحص الإنتاج!${NC}"
        exit 1
    fi
fi

# 3. النسخ الاحتياطي
echo -e "\n${YELLOW}3. إنشاء نسخة احتياطية...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# نسخ الملفات المهمة
cp -r public/uploads $BACKUP_DIR/ 2>/dev/null || echo "لا توجد ملفات مرفوعة"
echo -e "${GREEN}✅ تم إنشاء النسخة الاحتياطية في $BACKUP_DIR${NC}"

# 4. البناء
echo -e "\n${YELLOW}4. بناء التطبيق...${NC}"
npm run build:production
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ فشل البناء!${NC}"
    exit 1
fi

# 5. تطبيق تغييرات قاعدة البيانات
echo -e "\n${YELLOW}5. تحديث قاعدة البيانات...${NC}"
NODE_ENV=production npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ فشل تحديث قاعدة البيانات!${NC}"
    exit 1
fi

# 6. الخيارات للنشر
echo -e "\n${YELLOW}6. اختر طريقة النشر:${NC}"
echo "1) PM2 (موصى به للخوادم VPS)"
echo "2) Docker"
echo "3) Systemd service"
echo "4) تصدير الملفات فقط"

read -p "اختر رقم الخيار: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo -e "\n${GREEN}نشر باستخدام PM2...${NC}"
        # التحقق من تثبيت PM2
        if ! command -v pm2 &> /dev/null; then
            echo "تثبيت PM2..."
            npm install -g pm2
        fi
        
        # إيقاف التطبيق السابق
        pm2 stop sabq-ai-cms 2>/dev/null || true
        pm2 delete sabq-ai-cms 2>/dev/null || true
        
        # بدء التطبيق
        NODE_ENV=production pm2 start npm --name sabq-ai-cms -- start
        pm2 save
        pm2 startup
        
        echo -e "${GREEN}✅ تم النشر باستخدام PM2${NC}"
        pm2 status
        ;;
        
    2)
        echo -e "\n${GREEN}نشر باستخدام Docker...${NC}"
        # بناء وتشغيل Docker
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml build
        docker-compose -f docker-compose.prod.yml up -d
        
        echo -e "${GREEN}✅ تم النشر باستخدام Docker${NC}"
        docker ps
        ;;
        
    3)
        echo -e "\n${GREEN}إنشاء Systemd service...${NC}"
        # إنشاء ملف service
        sudo tee /etc/systemd/system/sabq-ai-cms.service > /dev/null <<EOF
[Unit]
Description=Sabq AI CMS
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
        
        # تفعيل وبدء الخدمة
        sudo systemctl daemon-reload
        sudo systemctl enable sabq-ai-cms
        sudo systemctl restart sabq-ai-cms
        
        echo -e "${GREEN}✅ تم إنشاء وتشغيل systemd service${NC}"
        sudo systemctl status sabq-ai-cms
        ;;
        
    4)
        echo -e "\n${GREEN}تصدير الملفات...${NC}"
        EXPORT_DIR="export-$(date +%Y%m%d-%H%M%S)"
        mkdir -p $EXPORT_DIR
        
        # نسخ الملفات المطلوبة
        cp -r .next $EXPORT_DIR/
        cp -r public $EXPORT_DIR/
        cp -r prisma $EXPORT_DIR/
        cp package*.json $EXPORT_DIR/
        cp .env.production $EXPORT_DIR/.env
        
        # إنشاء سكريبت البدء
        cat > $EXPORT_DIR/start.sh <<'EOF'
#!/bin/bash
npm install --production
npx prisma generate
NODE_ENV=production npm start
EOF
        chmod +x $EXPORT_DIR/start.sh
        
        # ضغط الملفات
        tar -czf $EXPORT_DIR.tar.gz $EXPORT_DIR
        rm -rf $EXPORT_DIR
        
        echo -e "${GREEN}✅ تم تصدير الملفات إلى $EXPORT_DIR.tar.gz${NC}"
        echo "يمكنك رفع هذا الملف إلى الخادم وفك الضغط ثم تشغيل start.sh"
        ;;
        
    *)
        echo -e "${RED}خيار غير صالح${NC}"
        exit 1
        ;;
esac

# 7. التحقق من صحة النشر
echo -e "\n${YELLOW}7. التحقق من صحة النشر...${NC}"
sleep 5

# محاولة الوصول لـ health endpoint
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ التطبيق يعمل بنجاح!${NC}"
    echo -e "\n${GREEN}يمكنك الآن الوصول للتطبيق على:${NC}"
    echo "http://localhost:3000"
    echo "https://jur3a.ai (إذا كان DNS مُعد)"
else
    echo -e "${RED}⚠️  التطبيق قد يحتاج وقت إضافي للبدء${NC}"
    echo "تحقق من السجلات للمزيد من المعلومات"
fi

echo -e "\n${GREEN}✅ اكتمل النشر!${NC}"
echo "=====================================" 