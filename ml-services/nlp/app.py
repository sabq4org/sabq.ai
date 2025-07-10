"""
خدمة الذكاء الاصطناعي للتوصيات والتحليلات
AI Service for Recommendations and Analytics
@version 3.0.0
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uvicorn
import json
import logging
from datetime import datetime

from .interest_model import UserInterestModel
from .recommendation_engine import RecommendationEngine

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# إنشاء التطبيق
app = FastAPI(
    title="Sabq AI ML Services",
    description="خدمات الذكاء الاصطناعي لنظام سبق",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج، حدد النطاقات المسموحة
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تهيئة النماذج
interest_model = UserInterestModel()
recommendation_engine = RecommendationEngine()

# نماذج البيانات
class AnalyticsEvent(BaseModel):
    event_type: str
    event_data: Dict[str, Any]
    timestamp: str
    user_id: Optional[str] = None
    article_id: Optional[str] = None

class Article(BaseModel):
    id: str
    title: str
    category: Dict[str, str]
    tags: List[str] = []
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    published_at: Optional[str] = None
    author: Optional[Dict[str, str]] = None

class RecommendationRequest(BaseModel):
    user_events: List[AnalyticsEvent]
    articles: List[Article]
    top_n: int = Field(default=5, ge=1, le=20)
    context: str = "homepage"

class InterestAnalysisRequest(BaseModel):
    user_events: List[AnalyticsEvent]

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    analysis_type: str = Field(default="all")

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    user_profile: Dict[str, Any]
    timestamp: str

# الصفحة الرئيسية
@app.get("/")
async def root():
    return {
        "service": "Sabq AI ML Services",
        "version": "3.0.0",
        "status": "running",
        "endpoints": [
            "/recommendations",
            "/interest-analysis", 
            "/text-analysis",
            "/user-profile",
            "/health"
        ]
    }

# فحص صحة الخدمة
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "interest_model": "loaded",
            "recommendation_engine": "loaded"
        },
        "version": "3.0.0"
    }

# خدمة التوصيات الرئيسية
@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    توليد توصيات مخصصة للمستخدم
    """
    try:
        logger.info(f"Processing recommendation request for {len(request.articles)} articles")
        
        # تحويل البيانات للنماذج
        user_events = [event.dict() for event in request.user_events]
        articles = [article.dict() for article in request.articles]
        
        # توليد التوصيات
        recommendations = recommendation_engine.recommend_articles(
            user_events=user_events,
            articles=articles,
            top_n=request.top_n,
            context=request.context
        )
        
        # حساب مقاييس الجودة
        metrics = recommendation_engine.get_recommendation_metrics(recommendations)
        
        # إنشاء ملف المستخدم
        user_profile = interest_model.get_user_profile(user_events)
        
        return RecommendationResponse(
            recommendations=recommendations,
            metrics=metrics,
            user_profile=user_profile,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في توليد التوصيات: {str(e)}")

# تحليل اهتمامات المستخدم
@app.post("/interest-analysis")
async def analyze_user_interests(request: InterestAnalysisRequest):
    """
    تحليل اهتمامات المستخدم بناءً على سلوكه
    """
    try:
        user_events = [event.dict() for event in request.user_events]
        
        # حساب درجات الاهتمام
        interest_scores = interest_model.compute_interest_score(user_events)
        
        # إنشاء ملف المستخدم الكامل
        user_profile = interest_model.get_user_profile(user_events)
        
        return {
            "interest_scores": interest_scores,
            "user_profile": user_profile,
            "total_events": len(user_events),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in interest analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحليل الاهتمامات: {str(e)}")

# تحليل النصوص
@app.post("/text-analysis")
async def analyze_text(request: TextAnalysisRequest):
    """
    تحليل النصوص العربية (تحليل المشاعر، استخراج الكلمات المفتاحية، إلخ)
    """
    try:
        text = request.text
        analysis_type = request.analysis_type
        
        results = {}
        
        if analysis_type in ["all", "keywords"]:
            # استخراج الكلمات المفتاحية (مثال مبسط)
            keywords = extract_keywords(text)
            results["keywords"] = keywords
        
        if analysis_type in ["all", "sentiment"]:
            # تحليل المشاعر (مثال مبسط)
            sentiment = analyze_sentiment(text)
            results["sentiment"] = sentiment
        
        if analysis_type in ["all", "categories"]:
            # تصنيف النص (مثال مبسط)
            category = classify_text(text)
            results["category"] = category
        
        if analysis_type in ["all", "summary"]:
            # تلخيص النص (مثال مبسط)
            summary = summarize_text(text)
            results["summary"] = summary
        
        return {
            "analysis": results,
            "text_length": len(text),
            "analysis_type": analysis_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in text analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحليل النص: {str(e)}")

# ملف المستخدم الشامل
@app.post("/user-profile")
async def get_user_profile(request: InterestAnalysisRequest):
    """
    إنشاء ملف شامل للمستخدم
    """
    try:
        user_events = [event.dict() for event in request.user_events]
        
        # إنشاء ملف المستخدم
        profile = interest_model.get_user_profile(user_events)
        
        # إضافة إحصائيات إضافية
        profile["statistics"] = {
            "total_events": len(user_events),
            "unique_articles": len(set(
                event.get("article_id") for event in user_events
                if event.get("article_id")
            )),
            "event_types": list(set(
                event.get("event_type") for event in user_events
            )),
            "analysis_date": datetime.now().isoformat()
        }
        
        return profile
        
    except Exception as e:
        logger.error(f"Error creating user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء ملف المستخدم: {str(e)}")

# إحصائيات النظام
@app.get("/system-stats")
async def get_system_stats():
    """
    إحصائيات عامة عن أداء النظام
    """
    return {
        "service": "Sabq AI ML Services",
        "version": "3.0.0",
        "uptime": "active",
        "models": {
            "interest_model": {
                "status": "loaded",
                "algorithm_weights": interest_model.event_weights
            },
            "recommendation_engine": {
                "status": "loaded",
                "algorithm_weights": recommendation_engine.algorithm_weights
            }
        },
        "capabilities": [
            "user_interest_analysis",
            "content_recommendations",
            "text_analysis",
            "sentiment_analysis",
            "keyword_extraction",
            "content_classification"
        ],
        "timestamp": datetime.now().isoformat()
    }

# دوال مساعدة لتحليل النصوص
def extract_keywords(text: str) -> List[str]:
    """استخراج الكلمات المفتاحية (مثال مبسط)"""
    # في التطبيق الحقيقي، نحتاج لمكتبات NLP متخصصة
    words = text.split()
    # فلترة الكلمات الشائعة
    stop_words = {'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'أن', 'أو'}
    keywords = [word for word in words if len(word) > 3 and word not in stop_words]
    return keywords[:10]  # أفضل 10 كلمات

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """تحليل المشاعر (مثال مبسط)"""
    # في التطبيق الحقيقي، نحتاج لنموذج مدرب على النصوص العربية
    positive_words = ['جيد', 'ممتاز', 'رائع', 'مفيد', 'إيجابي']
    negative_words = ['سيء', 'ضعيف', 'مشكلة', 'خطأ', 'سلبي']
    
    positive_count = sum(1 for word in positive_words if word in text)
    negative_count = sum(1 for word in negative_words if word in text)
    
    if positive_count > negative_count:
        sentiment = 'positive'
        confidence = min((positive_count / (positive_count + negative_count + 1)) * 100, 95)
    elif negative_count > positive_count:
        sentiment = 'negative'
        confidence = min((negative_count / (positive_count + negative_count + 1)) * 100, 95)
    else:
        sentiment = 'neutral'
        confidence = 50
    
    return {
        'sentiment': sentiment,
        'confidence': round(confidence, 2),
        'positive_indicators': positive_count,
        'negative_indicators': negative_count
    }

def classify_text(text: str) -> Dict[str, Any]:
    """تصنيف النص (مثال مبسط)"""
    # في التطبيق الحقيقي، نحتاج لنموذج تصنيف مدرب
    categories = {
        'تقنية': ['تقنية', 'ذكاء', 'اصطناعي', 'برمجة', 'حاسوب'],
        'رياضة': ['كرة', 'رياضة', 'فريق', 'لاعب', 'مباراة'],
        'أخبار': ['خبر', 'حدث', 'جديد', 'عاجل', 'تطور'],
        'اقتصاد': ['اقتصاد', 'مال', 'استثمار', 'سوق', 'أسهم']
    }
    
    scores = {}
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in text.lower())
        if score > 0:
            scores[category] = score
    
    if scores:
        predicted_category = max(scores, key=scores.get)
        confidence = (scores[predicted_category] / sum(scores.values())) * 100
    else:
        predicted_category = 'عام'
        confidence = 30
    
    return {
        'category': predicted_category,
        'confidence': round(confidence, 2),
        'all_scores': scores
    }

def summarize_text(text: str) -> str:
    """تلخيص النص (مثال مبسط)"""
    # في التطبيق الحقيقي، نحتاج لنموذج تلخيص متقدم
    sentences = text.split('.')
    if len(sentences) <= 2:
        return text
    
    # أخذ أول جملتين كتلخيص مبسط
    summary = '. '.join(sentences[:2]).strip()
    if summary and not summary.endswith('.'):
        summary += '.'
    
    return summary or "ملخص غير متاح"

# تشغيل الخدمة
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 