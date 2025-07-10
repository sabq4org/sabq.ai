#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
خدمة توقع الأداء للمحتوى العربي - سبق الذكية CMS
تستخدم تعلم الآلة لتوقع أداء المقالات والمحتوى العربي
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import json
import re
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict
from pathlib import Path

# استيراد مكتبات تعلم الآلة
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# مكتبات معالجة النصوص العربية
import arabic_reshaper
from bidi.algorithm import get_display
import pyarabic.araby as araby
from textblob import TextBlob
from transformers import pipeline, AutoTokenizer, AutoModel
import torch

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('performance_predictor.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ArticleMetrics:
    """مقاييس المقالة للتنبؤ"""
    title: str
    content: str
    category: str
    tags: List[str]
    author_followers: int
    publish_time: datetime
    content_length: int
    reading_time: int
    image_count: int
    video_count: int
    internal_links: int
    external_links: int
    author_reputation: float
    topic_trending_score: float
    seasonal_factor: float

@dataclass
class PerformancePrediction:
    """نتائج توقع الأداء"""
    predicted_views: int
    predicted_engagement: float
    predicted_reading_time: int
    predicted_shares: int
    predicted_comments: int
    confidence_score: float
    factors_analysis: Dict[str, float]
    recommendations: List[str]
    optimal_publish_time: datetime
    expected_peak_time: datetime

class ArabicTextAnalyzer:
    """محلل النصوص العربية"""
    
    def __init__(self):
        self.sentiment_pipeline = None
        self.tokenizer = None
        self.model = None
        self._initialize_models()
    
    def _initialize_models(self):
        """تهيئة نماذج معالجة النصوص العربية"""
        try:
            # نموذج تحليل المشاعر العربية
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis", 
                model="CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment",
                return_all_scores=True
            )
            
            # نموذج التضمين العربي
            self.tokenizer = AutoTokenizer.from_pretrained("aubmindlab/bert-base-arabert")
            self.model = AutoModel.from_pretrained("aubmindlab/bert-base-arabert")
            
            logger.info("تم تحميل نماذج معالجة النصوص العربية بنجاح")
        except Exception as e:
            logger.error(f"خطأ في تحميل النماذج: {e}")
            # استخدام النماذج البديلة
            self._load_fallback_models()
    
    def _load_fallback_models(self):
        """تحميل النماذج البديلة"""
        try:
            self.sentiment_pipeline = pipeline("sentiment-analysis")
            logger.info("تم تحميل النماذج البديلة")
        except Exception as e:
            logger.error(f"فشل في تحميل النماذج البديلة: {e}")
    
    def clean_arabic_text(self, text: str) -> str:
        """تنظيف النص العربي"""
        # إزالة التشكيل
        text = araby.strip_diacritics(text)
        
        # إزالة الأرقام الإنجليزية واستبدالها بالعربية
        text = re.sub(r'[0-9]', lambda m: araby.convert_to_arabic_number(m.group()), text)
        
        # إزالة الرموز غير المرغوبة
        text = re.sub(r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]', '', text)
        
        # توحيد المسافات
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_text_features(self, text: str) -> Dict[str, float]:
        """استخراج مميزات النص العربي"""
        cleaned_text = self.clean_arabic_text(text)
        
        features = {
            # مميزات أساسية
            'word_count': len(cleaned_text.split()),
            'char_count': len(cleaned_text),
            'sentence_count': len(re.split(r'[.!?؟]', cleaned_text)),
            'avg_word_length': np.mean([len(word) for word in cleaned_text.split()]) if cleaned_text.split() else 0,
            
            # مميزات النص العربي
            'arabic_char_ratio': len(re.findall(r'[\u0600-\u06FF]', text)) / len(text) if text else 0,
            'punctuation_ratio': len(re.findall(r'[.!?؟،]', text)) / len(text) if text else 0,
            'question_marks': text.count('؟') + text.count('?'),
            'exclamation_marks': text.count('!'),
            
            # مميزات المشاعر
            'sentiment_score': self._analyze_sentiment(cleaned_text),
            
            # مميزات المحتوى
            'readability_score': self._calculate_readability(cleaned_text),
            'keyword_density': self._calculate_keyword_density(cleaned_text),
            'title_similarity': 0.0  # سيتم حسابها لاحقاً
        }
        
        return features
    
    def _analyze_sentiment(self, text: str) -> float:
        """تحليل مشاعر النص"""
        try:
            if self.sentiment_pipeline and text.strip():
                result = self.sentiment_pipeline(text[:512])  # تحديد النص لتجنب الأخطاء
                if isinstance(result, list) and len(result) > 0:
                    if isinstance(result[0], list):
                        # إذا كان النتيجة قائمة من النتائج
                        positive_score = next((r['score'] for r in result[0] if r['label'] == 'POSITIVE'), 0.5)
                        return positive_score
                    else:
                        # إذا كان النتيجة واحدة
                        return result[0]['score'] if result[0]['label'] == 'POSITIVE' else 1 - result[0]['score']
            return 0.5  # قيمة محايدة
        except Exception as e:
            logger.warning(f"خطأ في تحليل المشاعر: {e}")
            return 0.5
    
    def _calculate_readability(self, text: str) -> float:
        """حساب سهولة القراءة للنص العربي"""
        words = text.split()
        if not words:
            return 0.0
        
        sentences = re.split(r'[.!?؟]', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return 0.0
        
        avg_words_per_sentence = len(words) / len(sentences)
        avg_chars_per_word = sum(len(word) for word in words) / len(words)
        
        # صيغة مبسطة لحساب سهولة القراءة العربية
        readability = 100 - (1.015 * avg_words_per_sentence) - (84.6 * avg_chars_per_word / 100)
        return max(0, min(100, readability)) / 100
    
    def _calculate_keyword_density(self, text: str) -> float:
        """حساب كثافة الكلمات المفتاحية"""
        words = text.split()
        if len(words) < 10:
            return 0.0
        
        # حساب تكرار الكلمات
        word_freq = {}
        for word in words:
            if len(word) > 3:  # تجاهل الكلمات القصيرة
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # حساب الكثافة للكلمات الأكثر تكراراً
        if word_freq:
            max_freq = max(word_freq.values())
            return min(max_freq / len(words), 0.1)  # حد أقصى 10%
        
        return 0.0

class PerformancePredictor:
    """متنبئ أداء المحتوى"""
    
    def __init__(self, model_path: str = "models/"):
        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)
        
        self.text_analyzer = ArabicTextAnalyzer()
        self.scaler = StandardScaler()
        self.encoders = {}
        
        # النماذج المختلفة
        self.models = {
            'views': RandomForestRegressor(n_estimators=100, random_state=42),
            'engagement': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'shares': RandomForestRegressor(n_estimators=100, random_state=42),
            'comments': LinearRegression()
        }
        
        self.is_trained = False
        self._load_models()
    
    def _load_models(self):
        """تحميل النماذج المحفوظة"""
        try:
            for metric, model in self.models.items():
                model_file = self.model_path / f"{metric}_model.joblib"
                if model_file.exists():
                    self.models[metric] = joblib.load(model_file)
                    logger.info(f"تم تحميل نموذج {metric}")
            
            scaler_file = self.model_path / "scaler.joblib"
            if scaler_file.exists():
                self.scaler = joblib.load(scaler_file)
            
            self.is_trained = True
            logger.info("تم تحميل جميع النماذج المحفوظة")
        except Exception as e:
            logger.warning(f"لم يتم العثور على نماذج محفوظة: {e}")
    
    def prepare_features(self, article: ArticleMetrics) -> np.ndarray:
        """تحضير المميزات للتنبؤ"""
        # استخراج مميزات النص
        title_features = self.text_analyzer.extract_text_features(article.title)
        content_features = self.text_analyzer.extract_text_features(article.content)
        
        # حساب التشابه بين العنوان والمحتوى
        title_content_similarity = self._calculate_similarity(article.title, article.content[:500])
        
        # مميزات زمنية
        publish_hour = article.publish_time.hour
        publish_day = article.publish_time.weekday()
        is_weekend = publish_day >= 5
        
        # تجميع جميع المميزات
        features = [
            # مميزات المحتوى
            article.content_length,
            article.reading_time,
            article.image_count,
            article.video_count,
            article.internal_links,
            article.external_links,
            
            # مميزات المؤلف
            article.author_followers,
            article.author_reputation,
            
            # مميزات الموضوع
            article.topic_trending_score,
            article.seasonal_factor,
            
            # مميزات النص
            title_features['word_count'],
            title_features['sentiment_score'],
            title_features['readability_score'],
            content_features['word_count'],
            content_features['sentiment_score'],
            content_features['readability_score'],
            content_features['keyword_density'],
            title_content_similarity,
            
            # مميزات زمنية
            publish_hour,
            publish_day,
            int(is_weekend),
            
            # مميزات الفئة والوسوم
            len(article.tags),
            self._encode_category(article.category)
        ]
        
        return np.array(features).reshape(1, -1)
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """حساب التشابه بين نصين"""
        try:
            # تحويل النصوص إلى كلمات
            words1 = set(self.text_analyzer.clean_arabic_text(text1).split())
            words2 = set(self.text_analyzer.clean_arabic_text(text2).split())
            
            if not words1 or not words2:
                return 0.0
            
            # حساب معامل Jaccard
            intersection = len(words1.intersection(words2))
            union = len(words1.union(words2))
            
            return intersection / union if union > 0 else 0.0
        except Exception as e:
            logger.warning(f"خطأ في حساب التشابه: {e}")
            return 0.0
    
    def _encode_category(self, category: str) -> float:
        """تشفير الفئة"""
        category_scores = {
            'سياسة': 0.8,
            'اقتصاد': 0.7,
            'رياضة': 0.9,
            'تقنية': 0.6,
            'صحة': 0.7,
            'ترفيه': 0.8,
            'ثقافة': 0.5,
            'دين': 0.6,
            'تعليم': 0.5,
            'مجتمع': 0.6
        }
        return category_scores.get(category, 0.5)
    
    async def predict_performance(self, article: ArticleMetrics) -> PerformancePrediction:
        """توقع أداء المقالة"""
        try:
            if not self.is_trained:
                # إذا لم يتم تدريب النماذج، استخدم تقديرات أساسية
                return self._generate_basic_prediction(article)
            
            # تحضير المميزات
            features = self.prepare_features(article)
            features_scaled = self.scaler.transform(features)
            
            # إجراء التنبؤات
            predictions = {}
            for metric, model in self.models.items():
                try:
                    pred = model.predict(features_scaled)[0]
                    predictions[metric] = max(0, pred)  # ضمان القيم الموجبة
                except Exception as e:
                    logger.warning(f"خطأ في التنبؤ لـ {metric}: {e}")
                    predictions[metric] = self._get_fallback_prediction(metric, article)
            
            # تحليل العوامل المؤثرة
            factors_analysis = self._analyze_factors(features_scaled)
            
            # إنشاء التوصيات
            recommendations = self._generate_recommendations(article, predictions, factors_analysis)
            
            # حساب الأوقات المثلى
            optimal_time, peak_time = self._calculate_optimal_times(article)
            
            # حساب درجة الثقة
            confidence = self._calculate_confidence(predictions, factors_analysis)
            
            return PerformancePrediction(
                predicted_views=int(predictions['views']),
                predicted_engagement=predictions['engagement'],
                predicted_reading_time=int(predictions.get('reading_time', article.reading_time)),
                predicted_shares=int(predictions['shares']),
                predicted_comments=int(predictions['comments']),
                confidence_score=confidence,
                factors_analysis=factors_analysis,
                recommendations=recommendations,
                optimal_publish_time=optimal_time,
                expected_peak_time=peak_time
            )
            
        except Exception as e:
            logger.error(f"خطأ في التنبؤ: {e}")
            return self._generate_basic_prediction(article)
    
    def _generate_basic_prediction(self, article: ArticleMetrics) -> PerformancePrediction:
        """إنشاء تنبؤ أساسي في حالة عدم وجود نماذج مدربة"""
        # تقديرات أساسية بناءً على طول المحتوى والفئة
        base_views = min(article.content_length * 2, 10000)
        base_engagement = min(article.author_followers * 0.05, 1000)
        
        category_multiplier = {
            'سياسة': 1.5,
            'رياضة': 2.0,
            'اقتصاد': 1.3,
            'تقنية': 1.1,
            'صحة': 1.2,
            'ترفيه': 1.8
        }.get(article.category, 1.0)
        
        return PerformancePrediction(
            predicted_views=int(base_views * category_multiplier),
            predicted_engagement=base_engagement * category_multiplier,
            predicted_reading_time=article.reading_time,
            predicted_shares=int(base_views * 0.1),
            predicted_comments=int(base_views * 0.05),
            confidence_score=0.3,  # ثقة منخفضة للتقديرات الأساسية
            factors_analysis={
                'content_length': 0.3,
                'category': 0.4,
                'author_reputation': 0.3
            },
            recommendations=[
                'تدريب النماذج على بيانات أكثر لتحسين دقة التنبؤات',
                'جمع المزيد من البيانات التاريخية'
            ],
            optimal_publish_time=datetime.now() + timedelta(hours=2),
            expected_peak_time=datetime.now() + timedelta(hours=8)
        )
    
    def _get_fallback_prediction(self, metric: str, article: ArticleMetrics) -> float:
        """قيم احتياطية للتنبؤات"""
        fallbacks = {
            'views': article.content_length * 2,
            'engagement': article.author_followers * 0.05,
            'shares': article.content_length * 0.1,
            'comments': article.content_length * 0.05
        }
        return fallbacks.get(metric, 100.0)
    
    def _analyze_factors(self, features: np.ndarray) -> Dict[str, float]:
        """تحليل العوامل المؤثرة على الأداء"""
        feature_names = [
            'content_length', 'reading_time', 'image_count', 'video_count',
            'internal_links', 'external_links', 'author_followers',
            'author_reputation', 'topic_trending', 'seasonal_factor',
            'title_words', 'title_sentiment', 'title_readability',
            'content_words', 'content_sentiment', 'content_readability',
            'keyword_density', 'title_similarity', 'publish_hour',
            'publish_day', 'is_weekend', 'tags_count', 'category_score'
        ]
        
        # تحليل بسيط للعوامل (في التطبيق الحقيقي، استخدم أهمية المميزات من النموذج)
        factors = {}
        if len(features[0]) >= len(feature_names):
            for i, name in enumerate(feature_names):
                # تطبيع القيم
                value = features[0][i]
                normalized_value = min(max(value / 100, 0), 1) if value > 10 else value
                factors[name] = float(normalized_value)
        
        return factors
    
    def _generate_recommendations(self, article: ArticleMetrics, 
                                predictions: Dict[str, float], 
                                factors: Dict[str, float]) -> List[str]:
        """إنشاء توصيات لتحسين الأداء"""
        recommendations = []
        
        # توصيات بناءً على طول المحتوى
        if article.content_length < 300:
            recommendations.append("زيادة طول المحتوى لتحسين الأداء (الطول المثالي 500-1500 كلمة)")
        elif article.content_length > 2000:
            recommendations.append("تقسيم المحتوى الطويل إلى أجزاء أو سلسلة مقالات")
        
        # توصيات بناءً على الوسائط
        if article.image_count == 0:
            recommendations.append("إضافة صور توضيحية لزيادة التفاعل")
        elif article.image_count > 10:
            recommendations.append("تقليل عدد الصور لتحسين سرعة التحميل")
        
        # توصيات بناءً على التوقيت
        hour = article.publish_time.hour
        if hour < 8 or hour > 22:
            recommendations.append("النشر في أوقات الذروة (8 صباحاً - 10 مساءً) لزيادة المشاهدات")
        
        # توصيات بناءً على المشاعر
        if factors.get('title_sentiment', 0.5) < 0.3:
            recommendations.append("تحسين نبرة العنوان ليكون أكثر إيجابية")
        
        # توصيات بناءً على الوسوم
        if len(article.tags) < 3:
            recommendations.append("إضافة المزيد من الوسوم المناسبة (3-7 وسوم)")
        elif len(article.tags) > 10:
            recommendations.append("تقليل عدد الوسوم والتركيز على الأكثر صلة")
        
        # توصيات بناءً على الروابط
        if article.external_links == 0:
            recommendations.append("إضافة روابط خارجية موثوقة لزيادة المصداقية")
        
        return recommendations
    
    def _calculate_optimal_times(self, article: ArticleMetrics) -> Tuple[datetime, datetime]:
        """حساب الأوقات المثلى للنشر والذروة"""
        # أوقات الذروة العامة
        peak_hours = [9, 12, 15, 20]  # 9 صباحاً، 12 ظهراً، 3 عصراً، 8 مساءً
        
        # اختيار أفضل وقت بناءً على الفئة
        category_best_hours = {
            'سياسة': [8, 12, 18],
            'رياضة': [16, 20, 22],
            'اقتصاد': [9, 13, 17],
            'تقنية': [10, 14, 19],
            'ترفيه': [18, 20, 21]
        }
        
        best_hours = category_best_hours.get(article.category, peak_hours)
        
        # العثور على أقرب وقت مثالي
        now = datetime.now()
        optimal_time = now
        
        for hour in best_hours:
            potential_time = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if potential_time <= now:
                potential_time += timedelta(days=1)
            
            if potential_time < optimal_time or optimal_time <= now:
                optimal_time = potential_time
        
        # وقت الذروة المتوقع (عادة بعد 4-8 ساعات من النشر)
        peak_time = optimal_time + timedelta(hours=6)
        
        return optimal_time, peak_time
    
    def _calculate_confidence(self, predictions: Dict[str, float], 
                            factors: Dict[str, float]) -> float:
        """حساب درجة الثقة في التنبؤات"""
        if not self.is_trained:
            return 0.3
        
        # حساب الثقة بناءً على جودة المميزات
        confidence_factors = [
            min(factors.get('author_reputation', 0) * 2, 1.0),
            min(factors.get('content_readability', 0) * 2, 1.0),
            min(factors.get('topic_trending', 0), 1.0),
            1.0 if factors.get('content_length', 0) > 0.3 else 0.5
        ]
        
        return float(np.mean(confidence_factors))
    
    async def train_models(self, training_data: List[Dict[str, Any]]) -> bool:
        """تدريب النماذج على البيانات التاريخية"""
        try:
            if len(training_data) < 50:
                logger.warning("بيانات التدريب قليلة، يُحتاج إلى 50 عينة على الأقل")
                return False
            
            logger.info(f"بدء تدريب النماذج على {len(training_data)} عينة")
            
            # تحضير البيانات
            X, y_dict = self._prepare_training_data(training_data)
            
            if X.shape[0] == 0:
                logger.error("فشل في تحضير بيانات التدريب")
                return False
            
            # تطبيع المميزات
            X_scaled = self.scaler.fit_transform(X)
            
            # تدريب كل نموذج
            for metric in self.models.keys():
                if metric in y_dict:
                    logger.info(f"تدريب نموذج {metric}")
                    
                    y = y_dict[metric]
                    X_train, X_test, y_train, y_test = train_test_split(
                        X_scaled, y, test_size=0.2, random_state=42
                    )
                    
                    # تدريب النموذج
                    self.models[metric].fit(X_train, y_train)
                    
                    # تقييم النموذج
                    y_pred = self.models[metric].predict(X_test)
                    score = r2_score(y_test, y_pred)
                    mae = mean_absolute_error(y_test, y_pred)
                    
                    logger.info(f"نموذج {metric} - R²: {score:.3f}, MAE: {mae:.3f}")
            
            # حفظ النماذج
            self._save_models()
            self.is_trained = True
            
            logger.info("تم تدريب جميع النماذج بنجاح")
            return True
            
        except Exception as e:
            logger.error(f"خطأ في تدريب النماذج: {e}")
            return False
    
    def _prepare_training_data(self, data: List[Dict[str, Any]]) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        """تحضير بيانات التدريب"""
        features_list = []
        targets = {'views': [], 'engagement': [], 'shares': [], 'comments': []}
        
        for item in data:
            try:
                # إنشاء ArticleMetrics من البيانات
                article = ArticleMetrics(
                    title=item.get('title', ''),
                    content=item.get('content', ''),
                    category=item.get('category', 'عام'),
                    tags=item.get('tags', []),
                    author_followers=item.get('author_followers', 0),
                    publish_time=datetime.fromisoformat(item.get('publish_time', datetime.now().isoformat())),
                    content_length=item.get('content_length', 0),
                    reading_time=item.get('reading_time', 0),
                    image_count=item.get('image_count', 0),
                    video_count=item.get('video_count', 0),
                    internal_links=item.get('internal_links', 0),
                    external_links=item.get('external_links', 0),
                    author_reputation=item.get('author_reputation', 0.5),
                    topic_trending_score=item.get('topic_trending_score', 0.5),
                    seasonal_factor=item.get('seasonal_factor', 1.0)
                )
                
                # استخراج المميزات
                features = self.prepare_features(article)
                features_list.append(features[0])
                
                # إضافة الأهداف
                targets['views'].append(item.get('actual_views', 0))
                targets['engagement'].append(item.get('actual_engagement', 0))
                targets['shares'].append(item.get('actual_shares', 0))
                targets['comments'].append(item.get('actual_comments', 0))
                
            except Exception as e:
                logger.warning(f"تجاهل عينة بسبب خطأ: {e}")
                continue
        
        X = np.array(features_list) if features_list else np.array([])
        y_dict = {k: np.array(v) for k, v in targets.items()}
        
        return X, y_dict
    
    def _save_models(self):
        """حفظ النماذج المدربة"""
        try:
            for metric, model in self.models.items():
                joblib.dump(model, self.model_path / f"{metric}_model.joblib")
            
            joblib.dump(self.scaler, self.model_path / "scaler.joblib")
            
            # حفظ معلومات النماذج
            model_info = {
                'trained_at': datetime.now().isoformat(),
                'models': list(self.models.keys()),
                'version': '1.0'
            }
            
            with open(self.model_path / "model_info.json", 'w', encoding='utf-8') as f:
                json.dump(model_info, f, ensure_ascii=False, indent=2)
            
            logger.info("تم حفظ النماذج بنجاح")
            
        except Exception as e:
            logger.error(f"خطأ في حفظ النماذج: {e}")

# مثال على الاستخدام
async def main():
    """مثال على استخدام خدمة توقع الأداء"""
    
    # إنشاء متنبئ الأداء
    predictor = PerformancePredictor()
    
    # مثال على مقالة
    article = ArticleMetrics(
        title="تطورات جديدة في عالم التقنية المالية",
        content="محتوى المقالة يتحدث عن أحدث التطورات في التقنية المالية والذكاء الاصطناعي...",
        category="تقنية",
        tags=["تقنية", "ذكاء اصطناعي", "مالية"],
        author_followers=5000,
        publish_time=datetime.now(),
        content_length=800,
        reading_time=4,
        image_count=2,
        video_count=0,
        internal_links=3,
        external_links=2,
        author_reputation=0.8,
        topic_trending_score=0.7,
        seasonal_factor=1.0
    )
    
    # توقع الأداء
    prediction = await predictor.predict_performance(article)
    
    print("=== نتائج توقع الأداء ===")
    print(f"المشاهدات المتوقعة: {prediction.predicted_views:,}")
    print(f"التفاعل المتوقع: {prediction.predicted_engagement:.1f}")
    print(f"المشاركات المتوقعة: {prediction.predicted_shares}")
    print(f"التعليقات المتوقعة: {prediction.predicted_comments}")
    print(f"درجة الثقة: {prediction.confidence_score:.1%}")
    print(f"الوقت الأمثل للنشر: {prediction.optimal_publish_time}")
    print(f"وقت الذروة المتوقع: {prediction.expected_peak_time}")
    
    print("\n=== التوصيات ===")
    for i, rec in enumerate(prediction.recommendations, 1):
        print(f"{i}. {rec}")

if __name__ == "__main__":
    asyncio.run(main()) 