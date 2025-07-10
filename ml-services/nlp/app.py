"""
خدمة الذكاء الاصطناعي لنظام سبق
AI Service for Sabq CMS
@version 2.1.0
@author Sabq AI Team
"""

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import logging
from datetime import datetime, timedelta
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation
import pickle
import os
import json
import redis
from collections import Counter, defaultdict
import re
from itertools import combinations

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# إنشاء تطبيق FastAPI
app = FastAPI(
    title="Sabq AI Service",
    description="خدمة الذكاء الاصطناعي لنظام سبق",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إعداد Redis للتخزين المؤقت
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    logger.info("✅ تم الاتصال بـ Redis بنجاح")
except:
    redis_client = None
    logger.warning("⚠️ فشل الاتصال بـ Redis - سيتم استخدام الذاكرة المحلية")

# نماذج البيانات
class Event(BaseModel):
    event_type: str = Field(..., description="نوع الحدث")
    event_data: Dict[str, Any] = Field(default_factory=dict, description="بيانات الحدث")
    timestamp: Optional[datetime] = Field(None, description="وقت الحدث")
    user_id: Optional[str] = Field(None, description="معرف المستخدم")
    session_id: Optional[str] = Field(None, description="معرف الجلسة")

class RecommendRequest(BaseModel):
    events: List[Event] = Field(..., description="قائمة الأحداث")
    user_id: Optional[str] = Field(None, description="معرف المستخدم")
    limit: int = Field(10, ge=1, le=50, description="عدد التوصيات")
    exclude_articles: List[str] = Field(default_factory=list, description="المقالات المستبعدة")

class TrainRequest(BaseModel):
    data: List[Dict[str, Any]] = Field(..., description="بيانات التدريب")
    model_type: str = Field(..., description="نوع النموذج")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="معاملات التدريب")

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., description="النص المراد تحليله")
    analysis_type: str = Field("sentiment", description="نوع التحليل")
    language: str = Field("ar", description="لغة النص")

class Article(BaseModel):
    id: str = Field(..., description="معرف المقال")
    title: str = Field(..., description="عنوان المقال")
    content: str = Field(..., description="محتوى المقال")
    summary: str = Field(..., description="ملخص المقال")
    category: str = Field(..., description="تصنيف المقال")
    tags: List[str] = Field(default_factory=list, description="علامات المقال")
    views: int = Field(0, description="عدد المشاهدات")
    likes: int = Field(0, description="عدد الإعجابات")
    published_at: Optional[datetime] = Field(None, description="تاريخ النشر")

# متغيرات عامة للنماذج
recommendation_model = None
text_analyzer = None
article_embeddings = {}
user_profiles = {}

# الفئات الرئيسية
class RecommendationEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words=None,  # سنضيف كلمات الإيقاف العربية لاحقاً
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.8
        )
        self.similarity_matrix = None
        self.article_features = None
        self.user_item_matrix = None
        self.item_similarity = None
        
    def preprocess_arabic_text(self, text: str) -> str:
        """معالجة النص العربي"""
        # إزالة الرموز الخاصة
        text = re.sub(r'[^\w\s]', '', text)
        # إزالة الأرقام
        text = re.sub(r'\d+', '', text)
        # إزالة المسافات الزائدة
        text = re.sub(r'\s+', ' ', text).strip()
        return text
        
    def extract_article_features(self, articles: List[Article]) -> np.ndarray:
        """استخراج ميزات المقالات"""
        # دمج العنوان والمحتوى والملخص
        texts = []
        for article in articles:
            combined_text = f"{article.title} {article.summary} {article.content}"
            processed_text = self.preprocess_arabic_text(combined_text)
            texts.append(processed_text)
        
        # تحويل النصوص إلى vectors
        features = self.vectorizer.fit_transform(texts)
        return features.toarray()
    
    def calculate_similarity(self, features: np.ndarray) -> np.ndarray:
        """حساب التشابه بين المقالات"""
        return cosine_similarity(features)
    
    def build_user_profile(self, user_events: List[Event]) -> Dict[str, float]:
        """بناء ملف المستخدم بناءً على تفاعلاته"""
        profile = defaultdict(float)
        
        for event in user_events:
            if event.event_type == "ARTICLE_VIEW":
                profile["views"] += 1
            elif event.event_type == "ARTICLE_LIKE":
                profile["likes"] += 2
            elif event.event_type == "ARTICLE_SHARE":
                profile["shares"] += 3
            elif event.event_type == "ARTICLE_COMMENT":
                profile["comments"] += 1.5
                
            # إضافة معلومات التصنيف والعلامات
            if "category" in event.event_data:
                profile[f"category_{event.event_data['category']}"] += 1
            if "tags" in event.event_data:
                for tag in event.event_data["tags"]:
                    profile[f"tag_{tag}"] += 0.5
        
        return dict(profile)
    
    def recommend_articles(
        self, 
        user_events: List[Event], 
        articles: List[Article], 
        limit: int = 10,
        exclude_articles: List[str] = None
    ) -> List[Dict[str, Any]]:
        """توصية المقالات للمستخدم"""
        if not articles:
            return []
        
        exclude_articles = exclude_articles or []
        
        # بناء ملف المستخدم
        user_profile = self.build_user_profile(user_events)
        
        # حساب النقاط لكل مقال
        article_scores = []
        
        for article in articles:
            if article.id in exclude_articles:
                continue
                
            score = self.calculate_article_score(article, user_profile)
            article_scores.append({
                "article_id": article.id,
                "title": article.title,
                "score": score,
                "category": article.category,
                "tags": article.tags,
                "views": article.views,
                "likes": article.likes,
                "reason": self.get_recommendation_reason(article, user_profile)
            })
        
        # ترتيب وإرجاع أفضل التوصيات
        article_scores.sort(key=lambda x: x["score"], reverse=True)
        return article_scores[:limit]
    
    def calculate_article_score(self, article: Article, user_profile: Dict[str, float]) -> float:
        """حساب نقاط المقال للمستخدم"""
        score = 0.0
        
        # النقاط الأساسية
        score += article.views * 0.001  # نقاط المشاهدات
        score += article.likes * 0.01   # نقاط الإعجابات
        
        # التطابق مع تفضيلات المستخدم
        category_key = f"category_{article.category}"
        if category_key in user_profile:
            score += user_profile[category_key] * 0.5
            
        # التطابق مع العلامات
        for tag in article.tags:
            tag_key = f"tag_{tag}"
            if tag_key in user_profile:
                score += user_profile[tag_key] * 0.3
        
        # نقاط الحداثة
        if article.published_at:
            days_old = (datetime.now() - article.published_at).days
            freshness_score = max(0, 1 - (days_old / 30))  # يقل التأثير مع الوقت
            score += freshness_score * 0.2
        
        return score
    
    def get_recommendation_reason(self, article: Article, user_profile: Dict[str, float]) -> str:
        """تحديد سبب التوصية"""
        reasons = []
        
        category_key = f"category_{article.category}"
        if category_key in user_profile and user_profile[category_key] > 2:
            reasons.append(f"يعجبك تصنيف {article.category}")
        
        matching_tags = [tag for tag in article.tags if f"tag_{tag}" in user_profile]
        if matching_tags:
            reasons.append(f"يحتوي على علامات مثل: {', '.join(matching_tags[:2])}")
        
        if article.views > 1000:
            reasons.append("مقال شائع")
        
        if article.likes > 100:
            reasons.append("مقال محبوب")
        
        return reasons[0] if reasons else "مقال مميز"

class TextAnalyzer:
    def __init__(self):
        self.sentiment_keywords = {
            "positive": ["ممتاز", "رائع", "جيد", "مفيد", "مذهل", "إيجابي", "سعيد", "جميل"],
            "negative": ["سيء", "فظيع", "سلبي", "مؤسف", "محزن", "غاضب", "مزعج", "صعب"],
            "neutral": ["عادي", "مقبول", "متوسط", "لا بأس"]
        }
        
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """تحليل المشاعر للنص العربي"""
        text = text.lower()
        
        positive_score = sum(1 for word in self.sentiment_keywords["positive"] if word in text)
        negative_score = sum(1 for word in self.sentiment_keywords["negative"] if word in text)
        neutral_score = sum(1 for word in self.sentiment_keywords["neutral"] if word in text)
        
        total_score = positive_score + negative_score + neutral_score
        
        if total_score == 0:
            return {"sentiment": "neutral", "confidence": 0.5, "scores": {"positive": 0, "negative": 0, "neutral": 1}}
        
        scores = {
            "positive": positive_score / total_score,
            "negative": negative_score / total_score,
            "neutral": neutral_score / total_score
        }
        
        sentiment = max(scores, key=scores.get)
        confidence = scores[sentiment]
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": scores
        }
    
    def extract_keywords(self, text: str, top_k: int = 10) -> List[str]:
        """استخراج الكلمات المفتاحية"""
        # تنظيف النص
        text = self.preprocess_arabic_text(text)
        words = text.split()
        
        # حساب تكرار الكلمات
        word_freq = Counter(words)
        
        # إزالة الكلمات الشائعة
        stop_words = ["في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "التي", "الذي", "أن", "أو", "لا", "ما", "كل", "بعض", "كان", "يكون", "قد", "لقد", "وقد"]
        
        filtered_words = {word: freq for word, freq in word_freq.items() if word not in stop_words and len(word) > 2}
        
        # إرجاع أهم الكلمات
        return [word for word, _ in Counter(filtered_words).most_common(top_k)]
    
    def preprocess_arabic_text(self, text: str) -> str:
        """معالجة النص العربي"""
        # إزالة الرموز الخاصة
        text = re.sub(r'[^\w\s]', '', text)
        # إزالة الأرقام
        text = re.sub(r'\d+', '', text)
        # إزالة المسافات الزائدة
        text = re.sub(r'\s+', ' ', text).strip()
        return text

# إنشاء المحركات
recommendation_engine = RecommendationEngine()
text_analyzer = TextAnalyzer()

# المسارات الأساسية
@app.get("/")
async def root():
    return {
        "message": "مرحباً بك في خدمة الذكاء الاصطناعي لنظام سبق",
        "version": "2.1.0",
        "status": "active",
        "endpoints": {
            "recommend": "/recommend",
            "train": "/train",
            "analyze": "/analyze",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    redis_status = "connected" if redis_client else "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0",
        "services": {
            "recommendation_engine": "active",
            "text_analyzer": "active",
            "redis": redis_status
        }
    }

@app.post("/recommend")
async def recommend_articles(request: RecommendRequest):
    """توصية المقالات للمستخدم"""
    try:
        # التحقق من وجود البيانات
        if not request.events:
            raise HTTPException(status_code=400, detail="قائمة الأحداث مطلوبة")
        
        # محاولة الحصول على النتائج من التخزين المؤقت
        cache_key = f"recommendations:{request.user_id}:{len(request.events)}"
        if redis_client:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
        
        # بناء قائمة وهمية من المقالات للتوضيح
        # في التطبيق الحقيقي، ستأتي من قاعدة البيانات
        sample_articles = [
            Article(
                id="1",
                title="أحدث تطورات الذكاء الاصطناعي",
                content="محتوى المقال حول الذكاء الاصطناعي...",
                summary="ملخص المقال",
                category="تقنية",
                tags=["ذكاء اصطناعي", "تقنية", "مستقبل"],
                views=1500,
                likes=120,
                published_at=datetime.now() - timedelta(days=1)
            ),
            Article(
                id="2",
                title="الاقتصاد السعودي في 2024",
                content="محتوى المقال حول الاقتصاد...",
                summary="ملخص المقال",
                category="أعمال",
                tags=["اقتصاد", "سعودي", "2024"],
                views=2000,
                likes=200,
                published_at=datetime.now() - timedelta(days=2)
            ),
            Article(
                id="3",
                title="كأس العالم FIFA 2026",
                content="محتوى المقال حول كأس العالم...",
                summary="ملخص المقال",
                category="رياضة",
                tags=["كأس العالم", "فيفا", "2026"],
                views=3000,
                likes=300,
                published_at=datetime.now() - timedelta(days=3)
            )
        ]
        
        # الحصول على التوصيات
        recommendations = recommendation_engine.recommend_articles(
            request.events,
            sample_articles,
            request.limit,
            request.exclude_articles
        )
        
        result = {
            "recommendations": recommendations,
            "user_id": request.user_id,
            "generated_at": datetime.now().isoformat(),
            "algorithm": "collaborative_filtering_with_content"
        }
        
        # حفظ النتائج في التخزين المؤقت
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(result))  # ساعة واحدة
        
        return result
        
    except Exception as e:
        logger.error(f"خطأ في توصية المقالات: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في توصية المقالات: {str(e)}")

@app.post("/train")
async def train_model(request: TrainRequest, background_tasks: BackgroundTasks):
    """تدريب النموذج"""
    try:
        # بدء تدريب النموذج في الخلفية
        training_id = f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        background_tasks.add_task(
            train_recommendation_model,
            request.data,
            request.model_type,
            training_id,
            request.parameters
        )
        
        return {
            "message": "تم بدء تدريب النموذج",
            "training_id": training_id,
            "status": "started",
            "estimated_time": "10-30 دقيقة"
        }
        
    except Exception as e:
        logger.error(f"خطأ في تدريب النموذج: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تدريب النموذج: {str(e)}")

@app.post("/analyze")
async def analyze_text(request: TextAnalysisRequest):
    """تحليل النص"""
    try:
        if request.analysis_type == "sentiment":
            result = text_analyzer.analyze_sentiment(request.text)
        elif request.analysis_type == "keywords":
            keywords = text_analyzer.extract_keywords(request.text)
            result = {"keywords": keywords}
        else:
            # تحليل شامل
            sentiment = text_analyzer.analyze_sentiment(request.text)
            keywords = text_analyzer.extract_keywords(request.text)
            result = {
                "sentiment": sentiment,
                "keywords": keywords,
                "text_length": len(request.text),
                "word_count": len(request.text.split())
            }
        
        return {
            "analysis": result,
            "text_sample": request.text[:100] + "..." if len(request.text) > 100 else request.text,
            "language": request.language,
            "analyzed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"خطأ في تحليل النص: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحليل النص: {str(e)}")

# دوال مساعدة
async def train_recommendation_model(data: List[Dict], model_type: str, training_id: str, parameters: Dict):
    """تدريب نموذج التوصية في الخلفية"""
    try:
        logger.info(f"بدء تدريب النموذج {training_id}")
        
        # محاكاة عملية التدريب
        await asyncio.sleep(2)  # محاكاة وقت التدريب
        
        # حفظ النموذج المدرب
        model_path = f"models/{model_type}_{training_id}.pkl"
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # حفظ النموذج (مثال)
        with open(model_path, 'wb') as f:
            pickle.dump({"model": "trained_model", "training_id": training_id}, f)
        
        logger.info(f"تم الانتهاء من تدريب النموذج {training_id}")
        
        # تحديث حالة التدريب في Redis
        if redis_client:
            redis_client.setex(f"training:{training_id}", 86400, json.dumps({
                "status": "completed",
                "completed_at": datetime.now().isoformat(),
                "model_path": model_path
            }))
        
    except Exception as e:
        logger.error(f"خطأ في تدريب النموذج {training_id}: {str(e)}")
        
        # تحديث حالة التدريب كخطأ
        if redis_client:
            redis_client.setex(f"training:{training_id}", 86400, json.dumps({
                "status": "failed",
                "error": str(e),
                "failed_at": datetime.now().isoformat()
            }))

@app.get("/training/{training_id}")
async def get_training_status(training_id: str):
    """الحصول على حالة التدريب"""
    if redis_client:
        status = redis_client.get(f"training:{training_id}")
        if status:
            return json.loads(status)
    
    raise HTTPException(status_code=404, detail="معرف التدريب غير موجود")

# تشغيل الخدمة
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 