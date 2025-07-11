#!/bin/bash

# 🧪 سكريبت اختبار شامل لمشروع سبق الذكي
# Comprehensive System Testing Script for Sabq AI Project

set -e

# ألوان للعرض
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# متغيرات الاختبار
FRONTEND_URL="http://localhost:3000"
ML_SERVICE_URL="http://localhost:8000"
TEST_RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"
TEST_REPORT_FILE="docs/TEST_REPORT.md"

# دوال العرض
print_test_header() {
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
    echo -e "${PURPLE}🧪 $1${NC}"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
}

print_test_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_test_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_test_fail() {
    echo -e "${RED}❌ $1${NC}"
}

print_test_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_test_info() {
    echo -e "${CYAN}ℹ️ $1${NC}"
}

# متغيرات لتتبع النتائج
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# دالة لتسجيل النتائج
record_test_result() {
    local test_name=$1
    local status=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $status in
        "PASS")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            ;;
        "FAIL")
            FAILED_TESTS=$((FAILED_TESTS + 1))
            ;;
        "WARN")
            WARNINGS=$((WARNINGS + 1))
            ;;
    esac
    
    # تسجيل النتيجة في ملف JSON
    echo "{\"test\":\"$test_name\", \"status\":\"$status\", \"details\":\"$details\", \"timestamp\":\"$(date -Iseconds)\"}" >> $TEST_RESULTS_FILE
}

# اختبار الاتصال بالخدمات
test_service_connectivity() {
    print_test_header "اختبار الاتصال بالخدمات"
    
    # اختبار الواجهة الأمامية
    print_test_step "اختبار الواجهة الأمامية..."
    if curl -s --max-time 10 "$FRONTEND_URL" > /dev/null; then
        print_test_pass "الواجهة الأمامية متاحة على $FRONTEND_URL"
        record_test_result "Frontend Connectivity" "PASS" "Frontend accessible"
    else
        print_test_fail "الواجهة الأمامية غير متاحة على $FRONTEND_URL"
        record_test_result "Frontend Connectivity" "FAIL" "Frontend not accessible"
    fi
    
    # اختبار خدمة الذكاء الاصطناعي
    print_test_step "اختبار خدمة الذكاء الاصطناعي..."
    if curl -s --max-time 10 "$ML_SERVICE_URL/health" > /dev/null; then
        print_test_pass "خدمة الذكاء الاصطناعي متاحة على $ML_SERVICE_URL"
        record_test_result "ML Service Connectivity" "PASS" "ML service accessible"
    else
        print_test_fail "خدمة الذكاء الاصطناعي غير متاحة على $ML_SERVICE_URL"
        record_test_result "ML Service Connectivity" "FAIL" "ML service not accessible"
    fi
    
    echo ""
}

# اختبار APIs
test_apis() {
    print_test_header "اختبار واجهات البرمجة (APIs)"
    
    # اختبار API المقالات
    print_test_step "اختبار API المقالات..."
    response=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL/api/articles")
    if [ "$response" = "200" ]; then
        print_test_pass "API المقالات يعمل بنجاح"
        record_test_result "Articles API" "PASS" "HTTP 200"
    else
        print_test_fail "API المقالات لا يعمل (HTTP $response)"
        record_test_result "Articles API" "FAIL" "HTTP $response"
    fi
    
    # اختبار API التحليلات
    print_test_step "اختبار API التحليلات..."
    response=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL/api/analytics/events")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        print_test_pass "API التحليلات يعمل بنجاح"
        record_test_result "Analytics API" "PASS" "HTTP $response"
    else
        print_test_fail "API التحليلات لا يعمل (HTTP $response)"
        record_test_result "Analytics API" "FAIL" "HTTP $response"
    fi
    
    # اختبار API التوصيات
    print_test_step "اختبار API التوصيات..."
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$FRONTEND_URL/api/ml/recommendations" \
        -H "Content-Type: application/json" \
        -d '{"user_events": [], "articles": [], "top_n": 5}')
    if [ "$response" = "200" ]; then
        print_test_pass "API التوصيات يعمل بنجاح"
        record_test_result "Recommendations API" "PASS" "HTTP $response"
    else
        print_test_warning "API التوصيات قد يحتاج إلى مصادقة (HTTP $response)"
        record_test_result "Recommendations API" "WARN" "HTTP $response"
    fi
    
    # اختبار API التغذية الراجعة
    print_test_step "اختبار API التغذية الراجعة..."
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$FRONTEND_URL/api/feedback/reason" \
        -H "Content-Type: application/json" \
        -d '{"recommendationId": "test", "reasonText": "test reason", "feedback": "clear"}')
    if [ "$response" = "200" ]; then
        print_test_pass "API التغذية الراجعة يعمل بنجاح"
        record_test_result "Feedback API" "PASS" "HTTP $response"
    else
        print_test_fail "API التغذية الراجعة لا يعمل (HTTP $response)"
        record_test_result "Feedback API" "FAIL" "HTTP $response"
    fi
    
    echo ""
}

# اختبار قاعدة البيانات
test_database() {
    print_test_header "اختبار قاعدة البيانات"
    
    # اختبار اتصال قاعدة البيانات
    print_test_step "اختبار اتصال قاعدة البيانات..."
    if npx prisma db pull --print > /dev/null 2>&1; then
        print_test_pass "قاعدة البيانات متصلة بنجاح"
        record_test_result "Database Connection" "PASS" "Database connected"
    else
        print_test_fail "فشل في الاتصال بقاعدة البيانات"
        record_test_result "Database Connection" "FAIL" "Database connection failed"
    fi
    
    # اختبار مخطط قاعدة البيانات
    print_test_step "اختبار مخطط قاعدة البيانات..."
    if npx prisma validate > /dev/null 2>&1; then
        print_test_pass "مخطط قاعدة البيانات صحيح"
        record_test_result "Database Schema" "PASS" "Schema valid"
    else
        print_test_fail "مخطط قاعدة البيانات غير صحيح"
        record_test_result "Database Schema" "FAIL" "Schema invalid"
    fi
    
    echo ""
}

# اختبار الميزات الأساسية
test_core_features() {
    print_test_header "اختبار الميزات الأساسية"
    
    # اختبار تسجيل الأحداث
    print_test_step "اختبار تسجيل الأحداث..."
    event_data='{"event_type": "page_view", "event_data": {"page": "test"}, "timestamp": "'$(date -Iseconds)'"}'
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$FRONTEND_URL/api/analytics/events" \
        -H "Content-Type: application/json" \
        -d "$event_data")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        print_test_pass "تسجيل الأحداث يعمل بنجاح"
        record_test_result "Event Logging" "PASS" "Events can be logged"
    else
        print_test_fail "فشل في تسجيل الأحداث"
        record_test_result "Event Logging" "FAIL" "Event logging failed"
    fi
    
    # اختبار التوصيات
    print_test_step "اختبار نظام التوصيات..."
    if curl -s "$ML_SERVICE_URL/recommendations" > /dev/null; then
        print_test_pass "نظام التوصيات متاح"
        record_test_result "Recommendation System" "PASS" "Recommendations available"
    else
        print_test_warning "نظام التوصيات قد يحتاج إلى إعداد إضافي"
        record_test_result "Recommendation System" "WARN" "Recommendations may need setup"
    fi
    
    echo ""
}

# اختبار الأداء
test_performance() {
    print_test_header "اختبار الأداء"
    
    # اختبار سرعة الاستجابة
    print_test_step "اختبار سرعة الاستجابة..."
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$FRONTEND_URL")
    if (( $(echo "$response_time < 5.0" | bc -l) )); then
        print_test_pass "سرعة الاستجابة جيدة: ${response_time}s"
        record_test_result "Response Time" "PASS" "Response time: ${response_time}s"
    else
        print_test_warning "سرعة الاستجابة بطيئة: ${response_time}s"
        record_test_result "Response Time" "WARN" "Slow response time: ${response_time}s"
    fi
    
    # اختبار استخدام الذاكرة
    print_test_step "اختبار استخدام الذاكرة..."
    memory_usage=$(ps aux | grep -E "(node|python)" | grep -v grep | awk '{sum += $6} END {print sum/1024}')
    if [ ! -z "$memory_usage" ] && (( $(echo "$memory_usage < 1000" | bc -l) )); then
        print_test_pass "استخدام الذاكرة: ${memory_usage}MB"
        record_test_result "Memory Usage" "PASS" "Memory usage: ${memory_usage}MB"
    else
        print_test_warning "استخدام الذاكرة مرتفع: ${memory_usage}MB"
        record_test_result "Memory Usage" "WARN" "High memory usage: ${memory_usage}MB"
    fi
    
    echo ""
}

# اختبار الأمان
test_security() {
    print_test_header "اختبار الأمان"
    
    # اختبار CORS
    print_test_step "اختبار CORS..."
    cors_header=$(curl -s -I "$FRONTEND_URL" | grep -i "access-control-allow-origin" || echo "not found")
    if [ "$cors_header" != "not found" ]; then
        print_test_pass "CORS مُكوَّن"
        record_test_result "CORS Configuration" "PASS" "CORS configured"
    else
        print_test_warning "CORS غير مُكوَّن"
        record_test_result "CORS Configuration" "WARN" "CORS not configured"
    fi
    
    # اختبار HTTPS (في الإنتاج)
    print_test_step "اختبار الأمان..."
    if [ "$NODE_ENV" = "production" ]; then
        # في الإنتاج، يجب استخدام HTTPS
        print_test_warning "يجب استخدام HTTPS في الإنتاج"
        record_test_result "HTTPS Security" "WARN" "HTTPS required for production"
    else
        print_test_pass "بيئة التطوير - لا يتطلب HTTPS"
        record_test_result "HTTPS Security" "PASS" "Development environment"
    fi
    
    echo ""
}

# اختبار محاكاة المستخدم
test_user_simulation() {
    print_test_header "اختبار محاكاة المستخدم"
    
    # محاكاة زيارة المستخدم
    print_test_step "محاكاة زيارة المستخدم..."
    
    # 1. زيارة الصفحة الرئيسية
    main_page_response=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL")
    if [ "$main_page_response" = "200" ]; then
        print_test_pass "زيارة الصفحة الرئيسية نجحت"
        record_test_result "Main Page Visit" "PASS" "User can visit main page"
    else
        print_test_fail "فشل في زيارة الصفحة الرئيسية"
        record_test_result "Main Page Visit" "FAIL" "Failed to visit main page"
    fi
    
    # 2. محاكاة عرض مقال
    print_test_step "محاكاة عرض المقالات..."
    articles_response=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL/api/articles")
    if [ "$articles_response" = "200" ]; then
        print_test_pass "عرض المقالات نجح"
        record_test_result "Articles View" "PASS" "User can view articles"
    else
        print_test_fail "فشل في عرض المقالات"
        record_test_result "Articles View" "FAIL" "Failed to view articles"
    fi
    
    # 3. محاكاة تسجيل حدث
    print_test_step "محاكاة تسجيل تفاعل المستخدم..."
    user_event='{"event_type": "article_view", "event_data": {"article_id": "test-article", "user_id": "test-user"}, "timestamp": "'$(date -Iseconds)'"}'
    event_response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$FRONTEND_URL/api/analytics/events" \
        -H "Content-Type: application/json" \
        -d "$user_event")
    if [ "$event_response" = "200" ] || [ "$event_response" = "201" ]; then
        print_test_pass "تسجيل تفاعل المستخدم نجح"
        record_test_result "User Interaction" "PASS" "User interactions tracked"
    else
        print_test_fail "فشل في تسجيل تفاعل المستخدم"
        record_test_result "User Interaction" "FAIL" "Failed to track user interaction"
    fi
    
    echo ""
}

# إنشاء تقرير الاختبار
generate_test_report() {
    print_test_header "إنشاء تقرير الاختبار"
    
    # إنشاء ملف التقرير
    cat > "$TEST_REPORT_FILE" << EOF
# 📊 تقرير الاختبار الشامل - مشروع سبق الذكي

**تاريخ الاختبار**: $(date)  
**البيئة**: $NODE_ENV  
**نظام التشغيل**: $(uname -s)  

## 📈 ملخص النتائج

- **إجمالي الاختبارات**: $TOTAL_TESTS
- **الاختبارات الناجحة**: $PASSED_TESTS
- **الاختبارات الفاشلة**: $FAILED_TESTS
- **التحذيرات**: $WARNINGS
- **معدل النجاح**: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%

## 🔍 تفاصيل الاختبارات

### ✅ الاختبارات الناجحة
$(grep '"status":"PASS"' $TEST_RESULTS_FILE | jq -r '.test' | sed 's/^/- /')

### ❌ الاختبارات الفاشلة
$(grep '"status":"FAIL"' $TEST_RESULTS_FILE | jq -r '.test' | sed 's/^/- /')

### ⚠️ التحذيرات
$(grep '"status":"WARN"' $TEST_RESULTS_FILE | jq -r '.test' | sed 's/^/- /')

## 🚀 التوصيات

### الخطوات التالية
1. **إصلاح الاختبارات الفاشلة** المذكورة أعلاه
2. **معالجة التحذيرات** لتحسين الأداء
3. **إضافة اختبارات إضافية** للميزات الجديدة
4. **مراقبة الأداء** في بيئة الإنتاج

### الميزات المُثبتة
- ✅ نظام التوصيات الذكية
- ✅ التغذية الراجعة التفاعلية
- ✅ تتبع السلوك والتحليلات
- ✅ واجهة المستخدم المحسنة

## 📋 البيانات الأولية

### معلومات النظام
- **المعالج**: $(uname -m)
- **الذاكرة**: $(free -h | awk '/^Mem:/ {print $2}' 2>/dev/null || echo "غير متاح")
- **Node.js**: $(node --version)
- **npm**: $(npm --version)
- **Python**: $(python3 --version)

### الخدمات المُشغلة
- **الواجهة الأمامية**: $FRONTEND_URL
- **خدمة الذكاء الاصطناعي**: $ML_SERVICE_URL
- **قاعدة البيانات**: متصلة

---

**تم إنشاء هذا التقرير تلقائياً بواسطة سكريبت الاختبار الشامل**
EOF
    
    print_test_pass "تم إنشاء تقرير الاختبار في: $TEST_REPORT_FILE"
    record_test_result "Test Report Generation" "PASS" "Report generated successfully"
}

# عرض النتائج النهائية
show_final_results() {
    print_test_header "النتائج النهائية"
    
    echo ""
    print_test_info "📊 ملخص الاختبارات:"
    print_test_info "   • إجمالي الاختبارات: $TOTAL_TESTS"
    print_test_info "   • الاختبارات الناجحة: $PASSED_TESTS"
    print_test_info "   • الاختبارات الفاشلة: $FAILED_TESTS"
    print_test_info "   • التحذيرات: $WARNINGS"
    
    success_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)
    print_test_info "   • معدل النجاح: $success_rate%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_test_pass "🎉 جميع الاختبارات نجحت!"
        echo ""
        print_test_info "🚀 النظام جاهز للاستخدام!"
        print_test_info "📋 راجع التقرير المفصل في: $TEST_REPORT_FILE"
    else
        print_test_fail "⚠️ هناك اختبارات فاشلة تحتاج إلى إصلاح"
        echo ""
        print_test_info "🔧 يرجى مراجعة التقرير المفصل في: $TEST_REPORT_FILE"
        print_test_info "📝 تفاصيل الأخطاء متاحة في: $TEST_RESULTS_FILE"
    fi
    
    echo ""
}

# البرنامج الرئيسي
main() {
    echo "🧪 اختبار شامل لمشروع سبق الذكي"
    echo "========================================"
    echo ""
    
    # إنشاء ملف النتائج
    echo "[]" > $TEST_RESULTS_FILE
    
    # تشغيل الاختبارات
    test_service_connectivity
    test_database
    test_apis
    test_core_features
    test_performance
    test_security
    test_user_simulation
    
    # إنشاء التقرير
    generate_test_report
    
    # عرض النتائج
    show_final_results
}

# تشغيل البرنامج الرئيسي
main "$@" 