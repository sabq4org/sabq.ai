#!/bin/bash

# 🚀 سكريبت تشغيل شامل لمشروع سبق الذكي
# Comprehensive Startup Script for Sabq AI Project

set -e

echo "🌟 مرحباً بك في مشروع سبق الذكي!"
echo "🚀 سيتم تشغيل جميع الخدمات المطلوبة..."
echo ""

# ألوان للعرض
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# دالة لعرض الحالة
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️ $1${NC}"
}

# التحقق من وجود الملفات المطلوبة
check_requirements() {
    print_status "التحقق من المتطلبات..."
    
    # التحقق من Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت. يرجى تثبيت Node.js أولاً."
        exit 1
    fi
    
    # التحقق من npm
    if ! command -v npm &> /dev/null; then
        print_error "npm غير مثبت. يرجى تثبيت npm أولاً."
        exit 1
    fi
    
    # التحقق من Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 غير مثبت. يرجى تثبيت Python 3 أولاً."
        exit 1
    fi
    
    # التحقق من pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 غير مثبت. يرجى تثبيت pip3 أولاً."
        exit 1
    fi
    
    # التحقق من ملف البيئة
    if [ ! -f .env ]; then
        print_warning "ملف .env غير موجود. سيتم إنشاء ملف افتراضي."
        cp .env.example .env 2>/dev/null || true
    fi
    
    print_success "جميع المتطلبات متوفرة"
}

# إعداد قاعدة البيانات
setup_database() {
    print_status "إعداد قاعدة البيانات..."
    
    # طباعة متغير البيئة للتأكد
    print_info "DATABASE_URL is: $DATABASE_URL"

    # تثبيت التبعيات
    print_info "تثبيت التبعيات..."
    npm install --silent
    
    # تشغيل Migration
    print_info "تحديث مخطط قاعدة البيانات..."
    DATABASE_URL="${DATABASE_URL}" npx prisma generate
    DATABASE_URL="${DATABASE_URL}" npx prisma db push
    
    # تشغيل Seed (إذا كان متوفراً)
    if [ -f prisma/seed.ts ]; then
        print_info "إدراج البيانات الأولية..."
        npx prisma db seed
    fi
    
    print_success "تم إعداد قاعدة البيانات بنجاح"
}

# تشغيل خدمة الذكاء الاصطناعي
start_ml_service() {
    print_status "تشغيل خدمة الذكاء الاصطناعي..."
    
    cd ml-services
    
    # تثبيت المتطلبات
    print_info "تثبيت متطلبات Python..."
    pip3 install -r requirements.txt --quiet
    
    # تشغيل الخدمة في الخلفية
    print_info "تشغيل خدمة ML على المنفذ 8000..."
    python3 -m uvicorn nlp.app:app --reload --host 0.0.0.0 --port 8000 &
    ML_PID=$!
    
    cd ..
    
    # انتظار حتى تبدأ الخدمة
    print_info "انتظار تشغيل خدمة ML..."
    sleep 5
    
    # التحقق من تشغيل الخدمة
    if curl -s "http://localhost:8000/health" > /dev/null; then
        print_success "خدمة الذكاء الاصطناعي تعمل بنجاح على http://localhost:8000"
    else
        print_error "فشل في تشغيل خدمة الذكاء الاصطناعي"
        return 1
    fi
}

# تشغيل الواجهة الخلفية
start_backend() {
    print_status "تشغيل الواجهة الخلفية..."
    
    # التحقق من وجود API routes
    if [ ! -d "src/app/api" ]; then
        print_error "مجلد API غير موجود"
        return 1
    fi
    
    # تشغيل Next.js في وضع التطوير
    print_info "تشغيل Next.js على المنفذ 3000..."
    npm run dev &
    BACKEND_PID=$!
    
    # انتظار حتى تبدأ الخدمة
    print_info "انتظار تشغيل الواجهة الخلفية..."
    sleep 10
    
    # التحقق من تشغيل الخدمة
    if curl -s "http://localhost:3000" > /dev/null; then
        print_success "الواجهة الخلفية تعمل بنجاح على http://localhost:3000"
    else
        print_error "فشل في تشغيل الواجهة الخلفية"
        return 1
    fi
}

# اختبار APIs
test_apis() {
    print_status "اختبار APIs..."
    
    # اختبار API الأساسي
    if curl -s "http://localhost:3000/api/articles" > /dev/null; then
        print_success "API المقالات يعمل بنجاح"
    else
        print_warning "API المقالات لا يستجيب"
    fi
    
    # اختبار API التحليلات
    if curl -s "http://localhost:3000/api/analytics/events" > /dev/null; then
        print_success "API التحليلات يعمل بنجاح"
    else
        print_warning "API التحليلات لا يستجيب"
    fi
    
    # اختبار API التوصيات
    if curl -s "http://localhost:3000/api/ml/recommendations" > /dev/null; then
        print_success "API التوصيات يعمل بنجاح"
    else
        print_warning "API التوصيات لا يستجيب"
    fi
    
    # اختبار API التغذية الراجعة
    if curl -s "http://localhost:3000/api/feedback/reason" > /dev/null; then
        print_success "API التغذية الراجعة يعمل بنجاح"
    else
        print_warning "API التغذية الراجعة لا يستجيب"
    fi
}

# عرض معلومات الخدمات
show_services_info() {
    print_status "معلومات الخدمات المُشغلة:"
    echo ""
    
    print_info "🌐 الواجهة الأمامية: http://localhost:3000"
    print_info "🔧 APIs الخلفية: http://localhost:3000/api"
    print_info "🤖 خدمة الذكاء الاصطناعي: http://localhost:8000"
    print_info "📊 خدمة التحليلات: http://localhost:3000/api/analytics"
    print_info "💬 خدمة التغذية الراجعة: http://localhost:3000/api/feedback"
    echo ""
    
    print_info "📋 لوحات التحكم المتاحة:"
    print_info "   • الصفحة الرئيسية: http://localhost:3000"
    print_info "   • لوحة التحليلات: http://localhost:3000/dashboard/analytics"
    print_info "   • لوحة التغذية الراجعة: http://localhost:3000/dashboard/feedback"
    print_info "   • API Documentation: http://localhost:8000/docs"
    echo ""
}

# دالة تنظيف عند الخروج
cleanup() {
    print_status "إيقاف الخدمات..."
    
    if [ ! -z "$ML_PID" ]; then
        kill $ML_PID 2>/dev/null || true
        print_info "تم إيقاف خدمة الذكاء الاصطناعي"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_info "تم إيقاف الواجهة الخلفية"
    fi
    
    print_success "تم إيقاف جميع الخدمات"
    exit 0
}

# التعامل مع إشارات الإيقاف
trap cleanup SIGINT SIGTERM

# البرنامج الرئيسي
main() {
    echo "🚀 بدء تشغيل مشروع سبق الذكي..."
    echo "================================================"
    
    check_requirements
    echo ""
    
    setup_database
    echo ""
    
    start_ml_service
    echo ""
    
    start_backend
    echo ""
    
    test_apis
    echo ""
    
    show_services_info
    
    print_success "🎉 تم تشغيل جميع الخدمات بنجاح!"
    print_info "اضغط Ctrl+C لإيقاف جميع الخدمات"
    
    # انتظار إشارة الإيقاف
    while true; do
        sleep 1
    done
}

# تشغيل البرنامج الرئيسي
main "$@" 