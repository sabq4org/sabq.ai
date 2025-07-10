from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
from nlp_service import NLPService
from text_api import TextAnalyzer
from performance_predictor import PerformancePredictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sabq AI - NLP Services",
    description="خدمات الذكاء الاصطناعي لمعالجة النصوص العربية",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
nlp_service = NLPService()
text_analyzer = TextAnalyzer()
performance_predictor = PerformancePredictor()

# Pydantic models
class TextInput(BaseModel):
    text: str
    language: Optional[str] = "ar"

class SummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = 150
    language: Optional[str] = "ar"

class AnalyzeRequest(BaseModel):
    text: str
    include_sentiment: Optional[bool] = True
    include_entities: Optional[bool] = True
    include_keywords: Optional[bool] = True

class PredictPerformanceRequest(BaseModel):
    title: str
    content: str
    category: str
    publish_time: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """فحص حالة الخدمة"""
    return {
        "status": "healthy",
        "message": "خدمة الذكاء الاصطناعي تعمل بشكل طبيعي",
        "version": "1.0.0"
    }

# Text summarization endpoint
@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    """تلخيص النص العربي"""
    try:
        logger.info(f"Summarizing text of length: {len(request.text)}")
        
        summary = nlp_service.summarize(
            text=request.text,
            max_length=request.max_length,
            language=request.language
        )
        
        return {
            "success": True,
            "summary": summary,
            "original_length": len(request.text),
            "summary_length": len(summary),
            "compression_ratio": len(summary) / len(request.text)
        }
    except Exception as e:
        logger.error(f"Error in summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تلخيص النص: {str(e)}")

# Text analysis endpoint
@app.post("/analyze")
async def analyze_text(request: AnalyzeRequest):
    """تحليل شامل للنص العربي"""
    try:
        logger.info(f"Analyzing text of length: {len(request.text)}")
        
        analysis_results = {}
        
        if request.include_sentiment:
            analysis_results["sentiment"] = text_analyzer.analyze_sentiment(request.text)
        
        if request.include_entities:
            analysis_results["entities"] = text_analyzer.extract_entities(request.text)
        
        if request.include_keywords:
            analysis_results["keywords"] = text_analyzer.extract_keywords(request.text)
        
        # Basic text statistics
        analysis_results["statistics"] = {
            "character_count": len(request.text),
            "word_count": len(request.text.split()),
            "sentence_count": len([s for s in request.text.split('.') if s.strip()]),
            "paragraph_count": len([p for p in request.text.split('\n') if p.strip()])
        }
        
        return {
            "success": True,
            "analysis": analysis_results
        }
    except Exception as e:
        logger.error(f"Error in text analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في تحليل النص: {str(e)}")

# Performance prediction endpoint
@app.post("/predict-performance")
async def predict_performance(request: PredictPerformanceRequest):
    """توقع أداء المقال"""
    try:
        logger.info(f"Predicting performance for article: {request.title[:50]}...")
        
        prediction = performance_predictor.predict(
            title=request.title,
            content=request.content,
            category=request.category,
            publish_time=request.publish_time
        )
        
        return {
            "success": True,
            "prediction": prediction
        }
    except Exception as e:
        logger.error(f"Error in performance prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في توقع الأداء: {str(e)}")

# Content recommendations endpoint
@app.post("/recommend-tags")
async def recommend_tags(text_input: TextInput):
    """اقتراح علامات للمحتوى"""
    try:
        logger.info(f"Generating tag recommendations for text of length: {len(text_input.text)}")
        
        tags = nlp_service.generate_tags(text_input.text)
        
        return {
            "success": True,
            "recommended_tags": tags,
            "confidence_scores": [0.8, 0.7, 0.6, 0.5, 0.4][:len(tags)]  # Mock scores
        }
    except Exception as e:
        logger.error(f"Error in tag recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في اقتراح العلامات: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 