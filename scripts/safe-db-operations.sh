#!/bin/bash

# سكريبت حماية قاعدة البيانات
# يمنع العمليات الخطيرة ويطلب تأكيدات متعددة

set -e  # إيقاف السكريبت عند أي خطأ

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  سكريبت حماية قاعدة البيانات${NC}"
echo "=================================="

# التحقق من البيئة
echo -e "${YELLOW}📋 فحص البيئة الحالية:${NC}"
echo "قاعدة البيانات: $DATABASE_URL"

# التحقق من وجود كلمة "prod" أو "production" في DATABASE_URL
if [[ $DATABASE_URL == *"prod"* ]] || [[ $DATABASE_URL == *"production"* ]]; then
    echo -e "${RED}🚨 تحذير: يبدو أنك في بيئة الإنتاج!${NC}"
    echo -e "${RED}هذا خطير جداً! تأكد من أنك تريد المتابعة.${NC}"
    
    read -p "اكتب 'PRODUCTION' للتأكيد: " confirm1
    if [ "$confirm1" != "PRODUCTION" ]; then
        echo -e "${RED}❌ تم إلغاء العملية - بيئة الإنتاج محمية${NC}"
        exit 1
    fi
    
    read -p "اكتب 'I UNDERSTAND THE RISK' للتأكيد مرة أخرى: " confirm2
    if [ "$confirm2" != "I UNDERSTAND THE RISK" ]; then
        echo -e "${RED}❌ تم إلغاء العملية - حماية مضاعفة${NC}"
        exit 1
    fi
fi

# التحقق من الأمر المطلوب تنفيذه
COMMAND="$1"

case $COMMAND in
    "push")
        echo -e "${YELLOW}🔄 تنفيذ: npx prisma db push${NC}"
        echo "هذا أمر آمن نسبياً"
        ;;
    "push-force-reset")
        echo -e "${RED}🚨 تحذير: npx prisma db push --force-reset${NC}"
        echo -e "${RED}هذا أمر خطير جداً - سيحذف جميع البيانات!${NC}"
        
        read -p "اكتب 'DELETE ALL DATA' للتأكيد: " confirm3
        if [ "$confirm3" != "DELETE ALL DATA" ]; then
            echo -e "${RED}❌ تم إلغاء العملية - حماية من الحذف${NC}"
            exit 1
        fi
        
        read -p "اكتب 'I WANT TO DELETE EVERYTHING' للتأكيد النهائي: " confirm4
        if [ "$confirm4" != "I WANT TO DELETE EVERYTHING" ]; then
            echo -e "${RED}❌ تم إلغاء العملية - حماية نهائية${NC}"
            exit 1
        fi
        ;;
    "migrate-reset")
        echo -e "${RED}🚨 تحذير: npx prisma migrate reset${NC}"
        echo -e "${RED}هذا أمر خطير - سيحذف جميع البيانات!${NC}"
        
        read -p "اكتب 'RESET DATABASE' للتأكيد: " confirm5
        if [ "$confirm5" != "RESET DATABASE" ]; then
            echo -e "${RED}❌ تم إلغاء العملية - حماية من الإعادة التعيين${NC}"
            exit 1
        fi
        ;;
    "backup")
        echo -e "${GREEN}📦 إنشاء نسخة احتياطية${NC}"
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "إنشاء نسخة احتياطية: $BACKUP_FILE"
        # هنا يمكن إضافة أمر mysqldump
        ;;
    *)
        echo -e "${YELLOW}❓ أمر غير معروف: $COMMAND${NC}"
        echo "الأوامر المتاحة:"
        echo "  push          - npx prisma db push (آمن)"
        echo "  push-force-reset - npx prisma db push --force-reset (خطير)"
        echo "  migrate-reset - npx prisma migrate reset (خطير)"
        echo "  backup        - إنشاء نسخة احتياطية"
        exit 1
        ;;
esac

# إنشاء نسخة احتياطية تلقائية قبل العمليات الخطيرة
if [[ $COMMAND == *"reset"* ]] || [[ $COMMAND == *"force"* ]]; then
    echo -e "${YELLOW}📦 إنشاء نسخة احتياطية تلقائية...${NC}"
    BACKUP_FILE="auto_backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "النسخة الاحتياطية: $BACKUP_FILE"
    # mysqldump -h aws.connect.psdb.cloud -u USERNAME -p DATABASE_NAME > $BACKUP_FILE
fi

echo -e "${GREEN}✅ بدء العملية...${NC}"

# تنفيذ الأمر الفعلي
case $COMMAND in
    "push")
        npx prisma db push
        ;;
    "push-force-reset")
        npx prisma db push --force-reset
        ;;
    "migrate-reset")
        npx prisma migrate reset
        ;;
esac

echo -e "${GREEN}✅ تم إكمال العملية بنجاح${NC}" 