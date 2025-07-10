"""
محرك التوصيات الذكي
Intelligent Recommendation Engine
@version 3.0.0
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import json
import math
from .interest_model import UserInterestModel

class RecommendationEngine:
    """محرك التوصيات الذكي"""
    
    def __init__(self):
        self.interest_model = UserInterestModel()
        
        # أوزان خوارزميات التوصية المختلفة
        self.algorithm_weights = {
            'content_based': 0.4,      # بناءً على المحتوى
            'collaborative': 0.3,      # التصفية التعاونية
            'popularity': 0.2,         # الشعبية
            'diversity': 0.1,          # التنوع
        }
        
        # معاملات التوصية
        self.freshness_weight = 0.2    # وزن الحداثة
        self.diversity_threshold = 0.3  # عتبة التنوع
        self.min_score_threshold = 0.1  # حد أدنى للدرجة
        
    def recommend_articles(
        self, 
        user_events: List[Dict], 
        articles: List[Dict], 
        top_n: int = 5,
        context: str = 'homepage'
    ) -> List[Dict]:
        """
        توليد توصيات مخصصة للمستخدم
        
        Args:
            user_events: الأحداث السلوكية للمستخدم
            articles: المقالات المتاحة
            top_n: عدد التوصيات المطلوبة
            context: سياق التوصية
            
        Returns:
            قائمة المقالات الموصى بها مع الدرجات
        """
        
        if not articles:
            return []
        
        # حساب درجات الاهتمام للمستخدم
        user_interests = self.interest_model.compute_interest_score(user_events)
        
        # حساب درجات التوصية لكل مقال
        article_scores = []
        
        for article in articles:
            # حساب درجة التوصية الإجمالية
            total_score = self._calculate_article_score(
                article, user_interests, user_events, context
            )
            
            if total_score >= self.min_score_threshold:
                article_scores.append({
                    **article,
                    'recommendation_score': total_score,
                    'recommendation_reason': self._generate_reason(article, user_interests)
                })
        
        # ترتيب المقالات حسب الدرجة
        sorted_articles = sorted(
            article_scores, 
            key=lambda x: x['recommendation_score'], 
            reverse=True
        )
        
        # تطبيق التنوع
        diverse_articles = self._apply_diversity_filter(sorted_articles, user_interests)
        
        # إرجاع أفضل N مقالات
        return diverse_articles[:top_n]
    
    def _calculate_article_score(
        self, 
        article: Dict, 
        user_interests: Dict[str, float], 
        user_events: List[Dict],
        context: str
    ) -> float:
        """حساب درجة التوصية للمقال"""
        
        # 1. التوصية بناءً على المحتوى
        content_score = self._content_based_score(article, user_interests)
        
        # 2. التوصية بناءً على التصفية التعاونية
        collaborative_score = self._collaborative_score(article, user_events)
        
        # 3. درجة الشعبية
        popularity_score = self._popularity_score(article)
        
        # 4. درجة التنوع
        diversity_score = self._diversity_score(article, user_interests)
        
        # 5. درجة الحداثة
        freshness_score = self._freshness_score(article)
        
        # 6. تعديل حسب السياق
        context_multiplier = self._get_context_multiplier(context)
        
        # حساب الدرجة الإجمالية
        total_score = (
            content_score * self.algorithm_weights['content_based'] +
            collaborative_score * self.algorithm_weights['collaborative'] +
            popularity_score * self.algorithm_weights['popularity'] +
            diversity_score * self.algorithm_weights['diversity']
        )
        
        # تطبيق الحداثة والسياق
        total_score = (total_score * (1 + freshness_score * self.freshness_weight) * 
                      context_multiplier)
        
        return round(total_score, 3)
    
    def _content_based_score(self, article: Dict, user_interests: Dict[str, float]) -> float:
        """حساب درجة التوصية بناءً على المحتوى"""
        
        score = 0.0
        
        # درجة التصنيف
        category = article.get('category', {}).get('name', '')
        if category in user_interests:
            score += user_interests[category] * 0.4
        
        # درجة الكلمات المفتاحية
        tags = article.get('tags', [])
        tag_scores = [user_interests.get(tag, 0) for tag in tags]
        if tag_scores:
            score += np.mean(tag_scores) * 0.3
        
        # درجة الكاتب (إذا كان المستخدم يتابع كاتب معين)
        author = article.get('author', {}).get('name', '')
        if author in user_interests:
            score += user_interests[author] * 0.3
        
        return min(score / 100, 1.0)  # تطبيع بين 0 و 1
    
    def _collaborative_score(self, article: Dict, user_events: List[Dict]) -> float:
        """حساب درجة التوصية بناءً على التصفية التعاونية"""
        
        # هذا مثال مبسط - في الواقع نحتاج لمقارنة مع مستخدمين آخرين
        article_id = article.get('id', '')
        
        # البحث عن تفاعلات مماثلة
        similar_interactions = 0
        for event in user_events:
            if event.get('event_data', {}).get('articleId') == article_id:
                similar_interactions += 1
        
        # حساب درجة بسيطة بناءً على التفاعلات السابقة
        return min(similar_interactions * 0.1, 1.0)
    
    def _popularity_score(self, article: Dict) -> float:
        """حساب درجة الشعبية للمقال"""
        
        view_count = article.get('view_count', 0)
        like_count = article.get('like_count', 0)
        comment_count = article.get('comment_count', 0)
        
        # حساب درجة الشعبية مع تطبيق اللوغاريتم لتقليل التحيز
        popularity = (
            math.log(view_count + 1) * 0.5 +
            math.log(like_count + 1) * 0.3 +
            math.log(comment_count + 1) * 0.2
        )
        
        # تطبيع نسبية (يمكن تحسينها)
        return min(popularity / 10, 1.0)
    
    def _diversity_score(self, article: Dict, user_interests: Dict[str, float]) -> float:
        """حساب درجة التنوع للمقال"""
        
        category = article.get('category', {}).get('name', '')
        
        # كلما قل اهتمام المستخدم بالتصنيف، زادت درجة التنوع
        interest_score = user_interests.get(category, 0)
        
        # عكس درجة الاهتمام لحساب التنوع
        diversity = 1.0 - min(interest_score / 100, 1.0)
        
        return diversity
    
    def _freshness_score(self, article: Dict) -> float:
        """حساب درجة الحداثة للمقال"""
        
        published_at = article.get('published_at')
        if not published_at:
            return 0.0
        
        try:
            pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            now = datetime.now(pub_date.tzinfo)
            
            # عدد الأيام منذ النشر
            days_old = (now - pub_date).days
            
            # درجة الحداثة تتناقص مع الوقت
            if days_old < 1:
                return 1.0
            elif days_old < 7:
                return 0.8
            elif days_old < 30:
                return 0.5
            else:
                return 0.2
        
        except Exception:
            return 0.0
    
    def _get_context_multiplier(self, context: str) -> float:
        """حساب مضاعف السياق"""
        
        context_multipliers = {
            'homepage': 1.0,
            'article_page': 1.2,    # توصيات أكثر دقة في صفحة المقال
            'category_page': 1.1,
            'search_results': 0.9,
            'profile_page': 1.3,
        }
        
        return context_multipliers.get(context, 1.0)
    
    def _apply_diversity_filter(
        self, 
        articles: List[Dict], 
        user_interests: Dict[str, float]
    ) -> List[Dict]:
        """تطبيق فلتر التنوع على التوصيات"""
        
        if not articles:
            return []
        
        diverse_articles = []
        category_counts = {}
        
        for article in articles:
            category = article.get('category', {}).get('name', '')
            category_count = category_counts.get(category, 0)
            
            # السماح بحد أقصى مقالين من نفس التصنيف
            if category_count < 2:
                diverse_articles.append(article)
                category_counts[category] = category_count + 1
        
        return diverse_articles
    
    def _generate_reason(self, article: Dict, user_interests: Dict[str, float]) -> str:
        """توليد سبب التوصية"""
        
        category = article.get('category', {}).get('name', '')
        tags = article.get('tags', [])
        
        # إيجاد أقوى سبب للتوصية
        reasons = []
        
        if category in user_interests and user_interests[category] > 50:
            reasons.append(f"لأنك مهتم بـ {category}")
        
        for tag in tags:
            if tag in user_interests and user_interests[tag] > 40:
                reasons.append(f"لأنك تقرأ عن {tag}")
        
        if article.get('view_count', 0) > 1000:
            reasons.append("مقال شائع")
        
        if not reasons:
            reasons.append("قد يثير اهتمامك")
        
        return reasons[0]
    
    def get_recommendation_metrics(self, recommendations: List[Dict]) -> Dict:
        """حساب مقاييس جودة التوصيات"""
        
        if not recommendations:
            return {'diversity': 0, 'coverage': 0, 'freshness': 0}
        
        categories = [r.get('category', {}).get('name', '') for r in recommendations]
        unique_categories = set(categories)
        
        # مقياس التنوع
        diversity = len(unique_categories) / len(recommendations)
        
        # مقياس التغطية
        coverage = len(unique_categories) / max(len(categories), 1)
        
        # مقياس الحداثة
        freshness_scores = [self._freshness_score(r) for r in recommendations]
        freshness = np.mean(freshness_scores) if freshness_scores else 0
        
        return {
            'diversity': round(diversity, 2),
            'coverage': round(coverage, 2),
            'freshness': round(freshness, 2),
            'total_recommendations': len(recommendations)
        }

# مثال على الاستخدام
if __name__ == "__main__":
    # بيانات تجريبية
    sample_events = [
        {
            'event_type': 'article_view',
            'event_data': {'category': 'تقنية', 'tags': ['AI']},
            'timestamp': '2024-01-15T10:00:00Z'
        }
    ]
    
    sample_articles = [
        {
            'id': '1',
            'title': 'مستقبل الذكاء الاصطناعي',
            'category': {'name': 'تقنية'},
            'tags': ['AI', 'تقنية'],
            'view_count': 1500,
            'like_count': 50,
            'published_at': '2024-01-14T12:00:00Z'
        },
        {
            'id': '2',
            'title': 'أخبار الرياضة اليوم',
            'category': {'name': 'رياضة'},
            'tags': ['كرة القدم'],
            'view_count': 800,
            'like_count': 25,
            'published_at': '2024-01-15T08:00:00Z'
        }
    ]
    
    engine = RecommendationEngine()
    recommendations = engine.recommend_articles(
        sample_events, 
        sample_articles, 
        top_n=5
    )
    
    print("التوصيات:")
    for rec in recommendations:
        print(f"  {rec['title']}: {rec['recommendation_score']} - {rec['recommendation_reason']}")
    
    # مقاييس الجودة
    metrics = engine.get_recommendation_metrics(recommendations)
    print(f"\nمقاييس الجودة: {metrics}") 