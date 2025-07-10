"""
نموذج حساب درجة الاهتمام للمستخدم
User Interest Scoring Model
@version 3.0.0
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import json
import math

class UserInterestModel:
    """نموذج حساب درجة اهتمام المستخدم"""
    
    def __init__(self):
        # أوزان الأحداث المختلفة
        self.event_weights = {
            'article_view': 1.0,
            'article_like': 3.0,
            'article_share': 2.5,
            'article_comment': 2.0,
            'article_bookmark': 2.5,
            'reading_time': 1.5,  # يُعدّل حسب المدة
            'scroll_depth': 0.5,
            'search_query': 1.0,
            'click_element': 0.3,
        }
        
        # معامل تراجع الاهتمام مع الوقت
        self.decay_rate = 0.95
        
        # حد أدنى لدرجة الاهتمام
        self.min_interest_score = 0.1
        
        # حد أقصى لدرجة الاهتمام
        self.max_interest_score = 100.0
    
    def compute_interest_score(self, user_events: List[Dict]) -> Dict[str, float]:
        """
        حساب درجة الاهتمام للمستخدم بناءً على الأحداث
        
        Args:
            user_events: قائمة الأحداث السلوكية للمستخدم
            
        Returns:
            قاموس يحتوي على درجة الاهتمام لكل موضوع/تصنيف
        """
        category_scores = {}
        topic_scores = {}
        
        # تجميع الأحداث حسب التصنيف والموضوع
        for event in user_events:
            event_type = event.get('event_type', '')
            event_data = event.get('event_data', {})
            timestamp = event.get('timestamp', '')
            
            # حساب وزن الحدث
            weight = self._calculate_event_weight(event_type, event_data)
            
            # حساب عامل التراجع الزمني
            time_decay = self._calculate_time_decay(timestamp)
            
            # الدرجة النهائية للحدث
            final_score = weight * time_decay
            
            # تحديث درجة التصنيف
            category = event_data.get('category')
            if category:
                category_scores[category] = category_scores.get(category, 0) + final_score
            
            # تحديث درجة الموضوع
            topic = event_data.get('topic')
            if topic:
                topic_scores[topic] = topic_scores.get(topic, 0) + final_score
            
            # معالجة الكلمات المفتاحية
            tags = event_data.get('tags', [])
            for tag in tags:
                topic_scores[tag] = topic_scores.get(tag, 0) + final_score * 0.5
        
        # دمج النتائج
        all_scores = {**category_scores, **topic_scores}
        
        # تطبيق التطبيع والحدود
        normalized_scores = self._normalize_scores(all_scores)
        
        return normalized_scores
    
    def _calculate_event_weight(self, event_type: str, event_data: Dict) -> float:
        """حساب وزن الحدث بناءً على نوعه والبيانات المرافقة"""
        
        base_weight = self.event_weights.get(event_type, 0.1)
        
        # تعديل خاص لوقت القراءة
        if event_type == 'reading_time':
            duration = event_data.get('duration', 0)  # بالثواني
            duration_minutes = duration / 60
            # وزن أكبر للقراءة الأطول، مع حد أقصى
            base_weight *= min(duration_minutes / 2, 3.0)
        
        # تعديل خاص لعمق التمرير
        elif event_type == 'scroll_depth':
            depth = event_data.get('depth', 0)
            # وزن أكبر للتمرير الأعمق
            base_weight *= (depth / 100)
        
        # تعديل خاص للبحث
        elif event_type == 'search_query':
            query_length = len(event_data.get('query', ''))
            # وزن أكبر للاستعلامات الأطول
            base_weight *= min(query_length / 10, 2.0)
        
        return max(base_weight, 0.1)
    
    def _calculate_time_decay(self, timestamp: str) -> float:
        """حساب عامل التراجع الزمني للحدث"""
        
        if not timestamp:
            return 1.0
        
        try:
            event_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            current_time = datetime.now(event_time.tzinfo)
            
            # عدد الأيام منذ الحدث
            days_ago = (current_time - event_time).days
            
            # تطبيق التراجع الأسي
            decay_factor = math.pow(self.decay_rate, days_ago)
            
            return max(decay_factor, 0.1)
        
        except Exception:
            return 1.0
    
    def _normalize_scores(self, scores: Dict[str, float]) -> Dict[str, float]:
        """تطبيع درجات الاهتمام وتطبيق الحدود"""
        
        if not scores:
            return {}
        
        # العثور على أعلى وأقل درجة
        max_score = max(scores.values())
        min_score = min(scores.values())
        
        # تجنب القسمة على صفر
        if max_score == min_score:
            return {key: self.min_interest_score for key in scores}
        
        normalized = {}
        for key, score in scores.items():
            # تطبيع بين 0 و 1
            normalized_score = (score - min_score) / (max_score - min_score)
            
            # تطبيق الحدود
            final_score = (normalized_score * 
                          (self.max_interest_score - self.min_interest_score) + 
                          self.min_interest_score)
            
            normalized[key] = round(final_score, 2)
        
        return normalized
    
    def get_user_profile(self, user_events: List[Dict]) -> Dict:
        """إنشاء ملف شخصي شامل للمستخدم"""
        
        interest_scores = self.compute_interest_score(user_events)
        
        # تحليل أنماط السلوك
        behavior_patterns = self._analyze_behavior_patterns(user_events)
        
        # تحديد التفضيلات الرئيسية
        top_interests = sorted(
            interest_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
        
        # حساب مستوى التفاعل
        engagement_level = self._calculate_engagement_level(user_events)
        
        return {
            'interest_scores': interest_scores,
            'top_interests': top_interests,
            'behavior_patterns': behavior_patterns,
            'engagement_level': engagement_level,
            'last_updated': datetime.now().isoformat(),
        }
    
    def _analyze_behavior_patterns(self, user_events: List[Dict]) -> Dict:
        """تحليل أنماط السلوك للمستخدم"""
        
        patterns = {
            'reading_time_avg': 0,
            'scroll_depth_avg': 0,
            'interaction_frequency': 0,
            'preferred_categories': [],
            'activity_times': [],
        }
        
        reading_times = []
        scroll_depths = []
        interactions = 0
        category_counts = {}
        
        for event in user_events:
            event_type = event.get('event_type', '')
            event_data = event.get('event_data', {})
            
            if event_type == 'reading_time':
                reading_times.append(event_data.get('duration', 0))
            
            elif event_type == 'scroll_depth':
                scroll_depths.append(event_data.get('depth', 0))
            
            elif event_type in ['article_like', 'article_share', 'article_comment']:
                interactions += 1
            
            # تجميع التصنيفات
            category = event_data.get('category')
            if category:
                category_counts[category] = category_counts.get(category, 0) + 1
        
        # حساب المتوسطات
        if reading_times:
            patterns['reading_time_avg'] = sum(reading_times) / len(reading_times)
        
        if scroll_depths:
            patterns['scroll_depth_avg'] = sum(scroll_depths) / len(scroll_depths)
        
        patterns['interaction_frequency'] = interactions / max(len(user_events), 1)
        
        # التصنيفات المفضلة
        patterns['preferred_categories'] = sorted(
            category_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return patterns
    
    def _calculate_engagement_level(self, user_events: List[Dict]) -> str:
        """حساب مستوى التفاعل للمستخدم"""
        
        if not user_events:
            return 'low'
        
        # حساب عدد الأحداث التفاعلية
        interactive_events = [
            'article_like', 'article_share', 'article_comment',
            'article_bookmark', 'search_query'
        ]
        
        interaction_count = sum(
            1 for event in user_events 
            if event.get('event_type') in interactive_events
        )
        
        total_events = len(user_events)
        interaction_ratio = interaction_count / total_events
        
        if interaction_ratio >= 0.3:
            return 'high'
        elif interaction_ratio >= 0.1:
            return 'medium'
        else:
            return 'low'

# مثال على الاستخدام
if __name__ == "__main__":
    # بيانات تجريبية
    sample_events = [
        {
            'event_type': 'article_view',
            'event_data': {
                'category': 'تقنية',
                'topic': 'ذكاء اصطناعي',
                'tags': ['AI', 'Machine Learning']
            },
            'timestamp': '2024-01-15T10:00:00Z'
        },
        {
            'event_type': 'article_like',
            'event_data': {
                'category': 'تقنية',
                'topic': 'ذكاء اصطناعي'
            },
            'timestamp': '2024-01-15T10:05:00Z'
        },
        {
            'event_type': 'reading_time',
            'event_data': {
                'duration': 180,
                'category': 'تقنية'
            },
            'timestamp': '2024-01-15T10:03:00Z'
        }
    ]
    
    model = UserInterestModel()
    
    # حساب درجات الاهتمام
    interests = model.compute_interest_score(sample_events)
    print("درجات الاهتمام:")
    for topic, score in interests.items():
        print(f"  {topic}: {score}")
    
    # إنشاء ملف المستخدم
    profile = model.get_user_profile(sample_events)
    print(f"\nملف المستخدم:")
    print(f"  مستوى التفاعل: {profile['engagement_level']}")
    print(f"  أهم الاهتمامات: {profile['top_interests'][:3]}") 