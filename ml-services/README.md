# 🧠 خدمات الذكاء الاصطناعي - سبق الذكية CMS

## 📖 نظرة عامة

تحتوي هذه المجموعة على خدمات الذكاء الاصطناعي ومعالجة اللغة الطبيعية العربية المتخصصة لنظام سبق الذكية CMS. هذه الخدمات تعمل بشكل مستقل وتتفاعل مع النظام الرئيسي عبر APIs.

---

## 🎯 الميزات الرئيسية

### 📊 توقع الأداء
- توقع عدد المشاهدات والتفاعل للمقالات
- تحليل المحتوى العربي والتنبؤ بالنجاح
- توصيات لتحسين الأداء

### 🔍 تحليل النصوص العربية
- تحليل المشاعر للنصوص العربية
- استخراج الكلمات المفتاحية
- حساب سهولة القراءة
- تنظيف وتطبيع النصوص العربية

### 🎯 التوصيات الذكية
- توصية المحتوى بناءً على اهتمامات المستخدم
- تحليل سلوك القراءة
- تخصيص تجربة المستخدم

### 📈 التحليلات المتقدمة
- تحليل ترند المواضيع
- اكتشاف الأنماط في سلوك المستخدمين
- تحليل أداء المحتوى

---

## 🏗️ هيكل المشروع

```
ml-services/
├── README.md                    # هذا الملف
├── requirements.txt             # متطلبات Python
├── start-ml.sh                 # سكريبت بدء الخدمات
├── config/
│   ├── settings.py             # إعدادات عامة
│   └── models.py               # إعدادات النماذج
├── nlp/                        # معالجة اللغة الطبيعية
│   ├── __init__.py
│   ├── performance_predictor.py # توقع أداء المحتوى
│   ├── text_analyzer.py        # تحليل النصوص
│   ├── sentiment_analyzer.py   # تحليل المشاعر
│   └── keyword_extractor.py    # استخراج الكلمات المفتاحية
├── recommendations/            # نظام التوصيات
│   ├── __init__.py
│   ├── content_recommender.py  # توصية المحتوى
│   ├── user_profiler.py        # تحليل ملفات المستخدمين
│   └── collaborative_filter.py # التصفية التعاونية
├── analytics/                  # التحليلات المتقدمة
│   ├── __init__.py
│   ├── trend_detector.py       # اكتشاف الترند
│   ├── user_behavior.py        # تحليل سلوك المستخدم
│   └── content_analytics.py    # تحليل المحتوى
├── models/                     # النماذج المدربة
│   ├── performance/            # نماذج توقع الأداء
│   ├── sentiment/              # نماذج تحليل المشاعر
│   └── recommendations/        # نماذج التوصيات
├── data/                       # بيانات التدريب والاختبار
│   ├── training/
│   ├── testing/
│   └── cache/
├── api/                        # واجهات برمجة التطبيقات
│   ├── __init__.py
│   ├── main.py                 # FastAPI الرئيسي
│   ├── routes/                 # مسارات API
│   └── middleware/             # طبقات وسطى
├── utils/                      # أدوات مساعدة
│   ├── __init__.py
│   ├── arabic_processing.py    # معالجة النصوص العربية
│   ├── data_preprocessing.py   # معالجة البيانات
│   └── model_utils.py          # أدوات النماذج
└── tests/                      # اختبارات
    ├── test_nlp.py
    ├── test_recommendations.py
    └── test_analytics.py
```

---

## 🚀 التثبيت والإعداد

### المتطلبات الأساسية

```bash
# Python 3.8 أو أحدث
python --version

# pip و virtualenv
pip install virtualenv
```

### 1. إنشاء البيئة الافتراضية

```bash
# إنشاء البيئة الافتراضية
python -m venv ml-services-env

# تفعيل البيئة (Linux/Mac)
source ml-services-env/bin/activate

# تفعيل البيئة (Windows)
ml-services-env\Scripts\activate
```

### 2. تثبيت المتطلبات

```bash
# الانتقال لمجلد الخدمات
cd ml-services

# تثبيت المتطلبات
pip install -r requirements.txt

# أو باستخدام Poetry (مُفضل)
pip install poetry
poetry install
```

### 3. إعداد متغيرات البيئة

```bash
# إنشاء ملف البيئة
cp .env.example .env

# تحرير المتغيرات
nano .env
```

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sabq_cms"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# API Keys
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# Model Paths
MODELS_PATH="./models"
DATA_PATH="./data"

# API Configuration
API_HOST="0.0.0.0"
API_PORT=8000
API_WORKERS=4

# Logging
LOG_LEVEL="INFO"
LOG_FILE="./logs/ml-services.log"
```

---

## 🏃‍♂️ تشغيل الخدمات

### الطريقة الأولى: السكريبت التلقائي

```bash
# تشغيل جميع الخدمات
./start-ml.sh

# تشغيل خدمة محددة
./start-ml.sh --service=nlp

# تشغيل في الخلفية
./start-ml.sh --daemon
```

### الطريقة الثانية: تشغيل يدوي

```bash
# تشغيل خدمة NLP
cd nlp
python -m uvicorn app:app --host 0.0.0.0 --port 8001

# تشغيل خدمة التوصيات
cd recommendations
python -m uvicorn app:app --host 0.0.0.0 --port 8002

# تشغيل خدمة التحليلات
cd analytics
python -m uvicorn app:app --host 0.0.0.0 --port 8003
```

### الطريقة الثالثة: Docker

```bash
# بناء الصورة
docker build -t sabq-ml-services .

# تشغيل الحاوية
docker run -p 8000:8000 -e DATABASE_URL="your-db-url" sabq-ml-services

# أو باستخدام Docker Compose
docker-compose up -d
```

---

## 📡 APIs المتاحة

### خدمة NLP (Port 8001)

#### توقع الأداء
```http
POST /api/v1/predict-performance
Content-Type: application/json

{
  "title": "عنوان المقالة",
  "content": "محتوى المقالة...",
  "category": "تقنية",
  "tags": ["ذكاء اصطناعي", "تقنية"],
  "author_followers": 5000,
  "publish_time": "2024-12-20T10:00:00Z"
}
```

#### تحليل المشاعر
```http
POST /api/v1/analyze-sentiment
Content-Type: application/json

{
  "text": "النص المراد تحليله",
  "language": "ar"
}
```

#### استخراج الكلمات المفتاحية
```http
POST /api/v1/extract-keywords
Content-Type: application/json

{
  "text": "النص المراد استخراج الكلمات منه",
  "max_keywords": 10
}
```

### خدمة التوصيات (Port 8002)

#### توصية المحتوى
```http
GET /api/v1/recommend/content?user_id=123&limit=10&category=تقنية
```

#### توصية المستخدمين
```http
GET /api/v1/recommend/users?user_id=123&limit=5
```

### خدمة التحليلات (Port 8003)

#### اكتشاف الترند
```http
GET /api/v1/analytics/trends?period=7d&category=all
```

#### تحليل سلوك المستخدم
```http
GET /api/v1/analytics/user-behavior?user_id=123&period=30d
```

---

## 🧪 الاختبار

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
python -m pytest tests/ -v

# اختبار وحدة محددة
python -m pytest tests/test_nlp.py -v

# اختبار مع تغطية الكود
python -m pytest tests/ --cov=. --cov-report=html
```

### اختبارات الأداء

```bash
# اختبار أداء API
python -m pytest tests/performance/ -v

# اختبار تحت الضغط
locust -f tests/load_testing.py --host=http://localhost:8001
```

---

## 🔧 التكوين والضبط

### إعدادات النماذج

```python
# config/models.py
MODELS_CONFIG = {
    'performance_predictor': {
        'model_type': 'random_forest',
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 5
    },
    'sentiment_analyzer': {
        'model_name': 'aubmindlab/bert-base-arabert',
        'max_length': 512,
        'batch_size': 16
    },
    'content_recommender': {
        'algorithm': 'collaborative_filtering',
        'n_factors': 50,
        'n_epochs': 20,
        'learning_rate': 0.005
    }
}
```

### إعدادات الأداء

```python
# config/settings.py
PERFORMANCE_CONFIG = {
    'cache_ttl': 3600,  # ساعة واحدة
    'batch_size': 32,
    'max_workers': 4,
    'timeout': 30,
    'memory_limit': '2GB'
}
```

---

## 📊 المراقبة والسجلات

### تكوين السجلات

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml-services.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
```

### مراقبة الأداء

```bash
# مراقبة استخدام الذاكرة والمعالج
htop

# مراقبة سجلات الخدمة
tail -f logs/ml-services.log

# مراقبة APIs
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

---

## 🔄 تدريب النماذج

### تدريب نموذج توقع الأداء

```bash
# تدريب النموذج على بيانات جديدة
python nlp/performance_predictor.py --train --data-path=./data/training/

# تقييم النموذج
python nlp/performance_predictor.py --evaluate --test-data=./data/testing/

# حفظ النموذج
python nlp/performance_predictor.py --save --model-path=./models/performance/
```

### تدريب نموذج التوصيات

```bash
# تدريب نموذج التوصيات
python recommendations/content_recommender.py --train

# تحديث النموذج بشكل دوري
python recommendations/content_recommender.py --update --incremental
```

---

## 🚀 النشر

### Docker

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  ml-services:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./models:/app/models
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=sabq_cms
      - POSTGRES_USER=sabq_user
      - POSTGRES_PASSWORD=secure_password
    ports:
      - "5432:5432"
```

### Kubernetes

```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-services
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-services
  template:
    metadata:
      labels:
        app: ml-services
    spec:
      containers:
      - name: ml-services
        image: sabq-ml-services:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ml-services-secrets
              key: database-url
```

---

## 🔧 استكشاف الأخطاء

### مشاكل شائعة

#### خطأ: ModuleNotFoundError

```bash
# تأكد من تفعيل البيئة الافتراضية
source ml-services-env/bin/activate

# إعادة تثبيت المتطلبات
pip install -r requirements.txt
```

#### خطأ: CUDA out of memory

```python
# تقليل حجم الدفعة
BATCH_SIZE = 8  # بدلاً من 32

# استخدام CPU بدلاً من GPU
device = 'cpu'
```

#### خطأ: Database connection failed

```bash
# تحقق من رابط قاعدة البيانات
echo $DATABASE_URL

# اختبار الاتصال
python -c "import psycopg2; print('Database connected')"
```

### تشخيص الأداء

```bash
# فحص استخدام الذاكرة
python -m memory_profiler script.py

# فحص سرعة التنفيذ
python -m cProfile script.py

# مراقبة استخدام GPU
nvidia-smi
```

---

## 📚 الموارد والمراجع

### مكتبات مستخدمة

- **FastAPI**: إطار عمل API سريع وحديث
- **scikit-learn**: مكتبة تعلم الآلة
- **transformers**: نماذج Transformer من Hugging Face
- **torch**: مكتبة PyTorch للتعلم العميق
- **pandas**: معالجة البيانات
- **numpy**: العمليات الحسابية
- **redis**: التخزين المؤقت
- **sqlalchemy**: ORM لقاعدة البيانات

### النماذج المُدربة مسبقاً

- **aubmindlab/bert-base-arabert**: نموذج BERT للعربية
- **CAMeL-Lab/bert-base-arabic-camelbert-mix**: تحليل المشاعر العربية
- **wisdomify/Arabic-BERT**: نموذج BERT عربي آخر

### مراجع مفيدة

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Transformers Documentation](https://huggingface.co/docs/transformers/)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Arabic NLP Resources](https://github.com/Arabic-NLP/Arabic-NLP)

---

## 🤝 المساهمة

### إضافة ميزة جديدة

1. إنشاء فرع جديد
```bash
git checkout -b feature/new-ml-service
```

2. تطوير الميزة
3. إضافة اختبارات
4. تحديث التوثيق
5. إرسال Pull Request

### معايير الكود

- استخدام Type Hints
- توثيق شامل للدوال
- اختبارات شاملة
- الالتزام بـ PEP 8

---

## 📄 الرخصة

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](../LICENSE) للمزيد من التفاصيل.

---

## 📞 الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل:

- إنشاء Issue على GitHub
- التواصل عبر البريد الإلكتروني: support@sabq.ai
- مراجعة الوثائق: [docs.sabq.ai](https://docs.sabq.ai)

---

**آخر تحديث:** ديسمبر 2024  
**النسخة:** 1.0.0 