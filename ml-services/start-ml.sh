#!/bin/bash
# =============================================================================
# سكريبت بدء خدمات الذكاء الاصطناعي - سبق الذكية CMS
# =============================================================================

set -e  # توقف عند أي خطأ

# ألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# متغيرات التكوين
PROJECT_DIR=$(dirname "$0")
LOG_DIR="$PROJECT_DIR/logs"
VENV_DIR="$PROJECT_DIR/ml-services-env"
PID_DIR="$PROJECT_DIR/pids"

# المنافذ الافتراضية
NLP_PORT=8001
RECOMMENDATIONS_PORT=8002
ANALYTICS_PORT=8003
API_GATEWAY_PORT=8000

# أسماء الخدمات
declare -A SERVICES=(
    ["nlp"]="معالجة اللغة الطبيعية"
    ["recommendations"]="نظام التوصيات"
    ["analytics"]="التحليلات المتقدمة"
    ["api-gateway"]="بوابة API الرئيسية"
)

declare -A SERVICE_PORTS=(
    ["nlp"]=$NLP_PORT
    ["recommendations"]=$RECOMMENDATIONS_PORT
    ["analytics"]=$ANALYTICS_PORT
    ["api-gateway"]=$API_GATEWAY_PORT
)

# إنشاء المجلدات المطلوبة
create_directories() {
    echo -e "${BLUE}📁 إنشاء المجلدات المطلوبة...${NC}"
    mkdir -p "$LOG_DIR" "$PID_DIR"
    
    # إنشاء مجلدات البيانات والنماذج
    mkdir -p "$PROJECT_DIR/data/training" \
             "$PROJECT_DIR/data/testing" \
             "$PROJECT_DIR/data/cache" \
             "$PROJECT_DIR/models/performance" \
             "$PROJECT_DIR/models/sentiment" \
             "$PROJECT_DIR/models/recommendations"
}

# طباعة رسالة ترحيب
print_banner() {
    echo -e "${PURPLE}"
    echo "=============================================="
    echo "🧠  خدمات الذكاء الاصطناعي - سبق الذكية CMS"
    echo "=============================================="
    echo -e "${NC}"
}

# عرض المساعدة
show_help() {
    echo -e "${CYAN}الاستخدام:${NC}"
    echo "  $0 [OPTIONS] [SERVICE]"
    echo ""
    echo -e "${CYAN}الخيارات:${NC}"
    echo "  -h, --help                    عرض هذه المساعدة"
    echo "  -s, --service SERVICE         تشغيل خدمة محددة"
    echo "  -a, --all                     تشغيل جميع الخدمات"
    echo "  -d, --daemon                  تشغيل في الخلفية"
    echo "  -k, --kill                    إيقاف جميع الخدمات"
    echo "  -r, --restart                 إعادة تشغيل الخدمات"
    echo "  -l, --logs                    عرض السجلات"
    echo "  -c, --check                   فحص حالة الخدمات"
    echo "  --install                     تثبيت المتطلبات"
    echo "  --setup                       إعداد البيئة الكاملة"
    echo ""
    echo -e "${CYAN}الخدمات المتاحة:${NC}"
    for service in "${!SERVICES[@]}"; do
        echo "  $service                      ${SERVICES[$service]}"
    done
    echo ""
    echo -e "${CYAN}أمثلة:${NC}"
    echo "  $0 --all                      # تشغيل جميع الخدمات"
    echo "  $0 --service nlp              # تشغيل خدمة NLP فقط"
    echo "  $0 --daemon --all             # تشغيل جميع الخدمات في الخلفية"
    echo "  $0 --kill                     # إيقاف جميع الخدمات"
    echo "  $0 --check                    # فحص حالة الخدمات"
}

# فحص المتطلبات
check_requirements() {
    echo -e "${BLUE}🔍 فحص المتطلبات...${NC}"
    
    # فحص Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 غير مثبت${NC}"
        exit 1
    fi
    
    # فحص pip
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}❌ pip3 غير مثبت${NC}"
        exit 1
    fi
    
    # فحص البيئة الافتراضية
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}⚠️  البيئة الافتراضية غير موجودة. سيتم إنشاؤها...${NC}"
        python3 -m venv "$VENV_DIR"
    fi
    
    echo -e "${GREEN}✅ جميع المتطلبات متوفرة${NC}"
}

# تفعيل البيئة الافتراضية
activate_venv() {
    echo -e "${BLUE}🐍 تفعيل البيئة الافتراضية...${NC}"
    source "$VENV_DIR/bin/activate"
}

# تثبيت المتطلبات
install_requirements() {
    echo -e "${BLUE}📦 تثبيت المتطلبات...${NC}"
    
    activate_venv
    
    # تحديث pip
    pip install --upgrade pip
    
    # تثبيت المتطلبات الأساسية
    if [ -f "$PROJECT_DIR/requirements.txt" ]; then
        pip install -r "$PROJECT_DIR/requirements.txt"
    else
        echo -e "${YELLOW}⚠️  ملف requirements.txt غير موجود. تثبيت المتطلبات الأساسية...${NC}"
        pip install fastapi uvicorn scikit-learn transformers torch pandas numpy redis psycopg2-binary python-dotenv
    fi
    
    echo -e "${GREEN}✅ تم تثبيت المتطلبات بنجاح${NC}"
}

# فحص متغيرات البيئة
check_env_vars() {
    echo -e "${BLUE}🔧 فحص متغيرات البيئة...${NC}"
    
    if [ -f "$PROJECT_DIR/.env" ]; then
        source "$PROJECT_DIR/.env"
        echo -e "${GREEN}✅ تم تحميل متغيرات البيئة${NC}"
    else
        echo -e "${YELLOW}⚠️  ملف .env غير موجود. استخدام القيم الافتراضية...${NC}"
    fi
    
    # فحص المتغيرات المطلوبة
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL غير محدد${NC}"
    fi
    
    if [ -z "$REDIS_URL" ]; then
        echo -e "${YELLOW}⚠️  REDIS_URL غير محدد${NC}"
    fi
}

# التحقق من توفر المنفذ
is_port_available() {
    local port=$1
    ! nc -z localhost $port >/dev/null 2>&1
}

# الحصول على PID للخدمة
get_service_pid() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"
    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# فحص حالة الخدمة
check_service_status() {
    local service=$1
    local port=${SERVICE_PORTS[$service]}
    local pid=$(get_service_pid $service)
    
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        if ! is_port_available $port; then
            echo -e "${GREEN}✅ $service (PID: $pid, Port: $port)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  $service (PID: $pid, Port: $port غير متاح)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $service (متوقف)${NC}"
        return 1
    fi
}

# بدء خدمة واحدة
start_service() {
    local service=$1
    local daemon=${2:-false}
    local port=${SERVICE_PORTS[$service]}
    
    echo -e "${BLUE}🚀 بدء خدمة $service على المنفذ $port...${NC}"
    
    # فحص إذا كانت الخدمة تعمل بالفعل
    if check_service_status $service >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  خدمة $service تعمل بالفعل${NC}"
        return 0
    fi
    
    # فحص توفر المنفذ
    if ! is_port_available $port; then
        echo -e "${RED}❌ المنفذ $port مستخدم بالفعل${NC}"
        return 1
    fi
    
    activate_venv
    
    local log_file="$LOG_DIR/${service}.log"
    local pid_file="$PID_DIR/${service}.pid"
    
    # إنشاء أمر التشغيل حسب نوع الخدمة
    local cmd=""
    case $service in
        "nlp")
            cmd="python -m uvicorn nlp.app:app --host 0.0.0.0 --port $port"
            ;;
        "recommendations")
            cmd="python -m uvicorn recommendations.app:app --host 0.0.0.0 --port $port"
            ;;
        "analytics")
            cmd="python -m uvicorn analytics.app:app --host 0.0.0.0 --port $port"
            ;;
        "api-gateway")
            cmd="python -m uvicorn api.main:app --host 0.0.0.0 --port $port"
            ;;
        *)
            echo -e "${RED}❌ خدمة غير معروفة: $service${NC}"
            return 1
            ;;
    esac
    
    # تشغيل الخدمة
    if [ "$daemon" = true ]; then
        nohup $cmd > "$log_file" 2>&1 & echo $! > "$pid_file"
        echo -e "${GREEN}✅ تم بدء خدمة $service في الخلفية (PID: $(cat $pid_file))${NC}"
    else
        echo -e "${CYAN}💡 لإيقاف الخدمة، اضغط Ctrl+C${NC}"
        $cmd
    fi
}

# إيقاف خدمة واحدة
stop_service() {
    local service=$1
    local pid=$(get_service_pid $service)
    
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        echo -e "${BLUE}🛑 إيقاف خدمة $service (PID: $pid)...${NC}"
        kill $pid
        
        # انتظار توقف الخدمة
        local timeout=10
        while [ $timeout -gt 0 ] && kill -0 $pid 2>/dev/null; do
            sleep 1
            ((timeout--))
        done
        
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}⚠️  إنهاء قسري للخدمة $service${NC}"
            kill -9 $pid
        fi
        
        rm -f "$PID_DIR/${service}.pid"
        echo -e "${GREEN}✅ تم إيقاف خدمة $service${NC}"
    else
        echo -e "${YELLOW}⚠️  خدمة $service غير متاحة${NC}"
    fi
}

# بدء جميع الخدمات
start_all_services() {
    local daemon=${1:-false}
    
    echo -e "${BLUE}🚀 بدء جميع الخدمات...${NC}"
    
    for service in "${!SERVICES[@]}"; do
        start_service $service $daemon
        sleep 2  # انتظار قصير بين الخدمات
    done
    
    if [ "$daemon" = true ]; then
        echo ""
        echo -e "${GREEN}✅ تم بدء جميع الخدمات في الخلفية${NC}"
        check_all_services
    fi
}

# إيقاف جميع الخدمات
stop_all_services() {
    echo -e "${BLUE}🛑 إيقاف جميع الخدمات...${NC}"
    
    for service in "${!SERVICES[@]}"; do
        stop_service $service
    done
    
    echo -e "${GREEN}✅ تم إيقاف جميع الخدمات${NC}"
}

# فحص حالة جميع الخدمات
check_all_services() {
    echo -e "${BLUE}📊 حالة الخدمات:${NC}"
    echo ""
    
    for service in "${!SERVICES[@]}"; do
        printf "%-20s" "$service:"
        check_service_status $service
    done
    
    echo ""
}

# عرض السجلات
show_logs() {
    local service=${1:-"all"}
    
    if [ "$service" = "all" ]; then
        echo -e "${BLUE}📋 عرض سجلات جميع الخدمات:${NC}"
        for svc in "${!SERVICES[@]}"; do
            local log_file="$LOG_DIR/${svc}.log"
            if [ -f "$log_file" ]; then
                echo -e "\n${YELLOW}=== سجلات $svc ===${NC}"
                tail -20 "$log_file"
            fi
        done
    else
        local log_file="$LOG_DIR/${service}.log"
        if [ -f "$log_file" ]; then
            echo -e "${BLUE}📋 عرض سجلات $service:${NC}"
            tail -f "$log_file"
        else
            echo -e "${RED}❌ ملف السجل غير موجود: $log_file${NC}"
        fi
    fi
}

# إعداد البيئة الكاملة
setup_environment() {
    echo -e "${BLUE}🔧 إعداد البيئة الكاملة...${NC}"
    
    create_directories
    check_requirements
    install_requirements
    check_env_vars
    
    # إنشاء ملفات التكوين الأساسية
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${BLUE}📝 إنشاء ملف .env أساسي...${NC}"
        cat > "$PROJECT_DIR/.env" << EOF
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/sabq_cms"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# API Configuration
API_HOST="0.0.0.0"
API_WORKERS=4

# Logging Configuration
LOG_LEVEL="INFO"
LOG_FILE="./logs/ml-services.log"

# Model Configuration
MODELS_PATH="./models"
DATA_PATH="./data"
EOF
        echo -e "${GREEN}✅ تم إنشاء ملف .env أساسي${NC}"
    fi
    
    echo -e "${GREEN}✅ تم إعداد البيئة بنجاح${NC}"
}

# إعادة تشغيل الخدمات
restart_services() {
    local service=${1:-"all"}
    
    if [ "$service" = "all" ]; then
        echo -e "${BLUE}🔄 إعادة تشغيل جميع الخدمات...${NC}"
        stop_all_services
        sleep 3
        start_all_services true
    else
        echo -e "${BLUE}🔄 إعادة تشغيل خدمة $service...${NC}"
        stop_service $service
        sleep 2
        start_service $service true
    fi
}

# التنظيف عند الخروج
cleanup() {
    echo -e "\n${YELLOW}🧹 تنظيف العمليات...${NC}"
    stop_all_services
    exit 0
}

# تسجيل إشارة التوقف
trap cleanup SIGINT SIGTERM

# معالجة المعاملات
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            -a|--all)
                ALL_SERVICES=true
                shift
                ;;
            -d|--daemon)
                DAEMON=true
                shift
                ;;
            -k|--kill)
                KILL_SERVICES=true
                shift
                ;;
            -r|--restart)
                RESTART_SERVICES=true
                shift
                ;;
            -l|--logs)
                SHOW_LOGS=true
                shift
                ;;
            -c|--check)
                CHECK_STATUS=true
                shift
                ;;
            --install)
                INSTALL_REQUIREMENTS=true
                shift
                ;;
            --setup)
                SETUP_ENVIRONMENT=true
                shift
                ;;
            *)
                echo -e "${RED}❌ معامل غير معروف: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# الدالة الرئيسية
main() {
    print_banner
    
    # تحليل المعاملات
    parse_arguments "$@"
    
    # إنشاء المجلدات
    create_directories
    
    # تنفيذ الإجراءات المطلوبة
    if [ "$SETUP_ENVIRONMENT" = true ]; then
        setup_environment
        exit 0
    fi
    
    if [ "$INSTALL_REQUIREMENTS" = true ]; then
        check_requirements
        install_requirements
        exit 0
    fi
    
    if [ "$KILL_SERVICES" = true ]; then
        stop_all_services
        exit 0
    fi
    
    if [ "$RESTART_SERVICES" = true ]; then
        restart_services "$SERVICE"
        exit 0
    fi
    
    if [ "$CHECK_STATUS" = true ]; then
        check_all_services
        exit 0
    fi
    
    if [ "$SHOW_LOGS" = true ]; then
        show_logs "$SERVICE"
        exit 0
    fi
    
    # فحص المتطلبات قبل البدء
    check_requirements
    check_env_vars
    
    # بدء الخدمات
    if [ "$ALL_SERVICES" = true ]; then
        start_all_services "$DAEMON"
    elif [ -n "$SERVICE" ]; then
        if [[ " ${!SERVICES[@]} " =~ " $SERVICE " ]]; then
            start_service "$SERVICE" "$DAEMON"
        else
            echo -e "${RED}❌ خدمة غير معروفة: $SERVICE${NC}"
            echo -e "${CYAN}الخدمات المتاحة: ${!SERVICES[@]}${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  لم يتم تحديد خدمة للتشغيل${NC}"
        show_help
        exit 1
    fi
}

# تشغيل الدالة الرئيسية
main "$@" 