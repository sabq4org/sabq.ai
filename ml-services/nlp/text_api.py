"""
خدمة تحليل النصوص المتقدمة للمحتوى العربي
تتضمن: تحليل المشاعر، استخراج الكيانات، التصنيف
"""

import re
import logging
from typing import Dict, List, Any, Optional
from collections import Counter
import numpy as np

# Configure logging
logger = logging.getLogger(__name__)

class TextAnalyzer:
    """محلل النصوص المتقدم للمحتوى العربي"""
    
    def __init__(self):
        """تهيئة محلل النصوص"""
        try:
            # Sentiment analysis keywords
            self.positive_words = {
                'ممتاز', 'رائع', 'عظيم', 'جيد', 'مفيد', 'ناجح', 'إيجابي', 'سعيد',
                'محبوب', 'مقبول', 'مرضي', 'حلو', 'لطيف', 'جميل', 'أنيق', 'مدهش',
                'استثنائي', 'فريد', 'مميز', 'قوي', 'فعال', 'مثير', 'ملهم', 'مشجع'
            }
            
            self.negative_words = {
                'سيء', 'فظيع', 'مروع', 'كريه', 'منفر', 'مؤذي', 'ضار', 'خطير',
                'فاشل', 'ضعيف', 'مملل', 'مكروه', 'مرفوض', 'سلبي', 'حزين', 'غاضب',
                'مؤسف', 'محبط', 'مخيب', 'كارثي', 'مدمر', 'مؤلم', 'صعب', 'معقد'
            }
            
            self.neutral_words = {
                'عادي', 'طبيعي', 'متوسط', 'مقبول', 'معقول', 'منطقي', 'واضح',
                'بسيط', 'مباشر', 'صريح', 'واقعي', 'حقيقي', 'فعلي', 'أساسي'
            }
            
            # Entity patterns for Arabic text
            self.entity_patterns = {
                'person': [
                    r'(?:الدكتور|الأستاذ|المهندس|الطبيب)\s+([أ-ي\s]+)',
                    r'([أ-ي]+\s+[أ-ي]+)(?:\s+قال|أضاف|ذكر|أشار)',
                    r'(?:السيد|السيدة)\s+([أ-ي\s]+)',
                ],
                'organization': [
                    r'(?:شركة|مؤسسة|منظمة|جمعية|هيئة|وزارة|مجلس)\s+([أ-ي\s]+)',
                    r'(?:جامعة|معهد|مركز|مستشفى|مدرسة)\s+([أ-ي\s]+)',
                    r'(?:بنك|مصرف)\s+([أ-ي\s]+)',
                ],
                'location': [
                    r'(?:مدينة|محافظة|منطقة|إقليم|دولة|بلد)\s+([أ-ي\s]+)',
                    r'(?:في|إلى|من)\s+(الرياض|جدة|مكة|المدينة|الدمام|تبوك|أبها|حائل|الطائف)',
                    r'(?:شارع|طريق|حي)\s+([أ-ي\s]+)',
                ],
                'date': [
                    r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
                    r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',
                    r'(?:يوم|أمس|اليوم|غداً|بعد غد)',
                    r'(?:الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|الأحد)',
                ],
                'money': [
                    r'\d+(?:,\d{3})*\s*(?:ريال|دولار|يورو|دينار|درهم)',
                    r'(?:مليون|مليار|ألف)\s+(?:ريال|دولار|يورو)',
                ],
                'phone': [
                    r'(?:\+966|0096656)\d{8}',
                    r'05\d{8}',
                    r'\d{3}-\d{3}-\d{4}',
                ],
                'email': [
                    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
                ],
                'url': [
                    r'https?://[^\s]+',
                    r'www\.[^\s]+',
                ]
            }
            
            # Category keywords for text classification
            self.category_keywords = {
                'تقنية': {
                    'keywords': ['تقنية', 'تكنولوجيا', 'ذكاء', 'اصطناعي', 'حاسوب', 'برمجة', 'إنترنت', 'تطبيق', 'موقع', 'رقمي'],
                    'weight': 1.0
                },
                'رياضة': {
                    'keywords': ['رياضة', 'كرة', 'قدم', 'مباراة', 'فريق', 'لاعب', 'نادي', 'بطولة', 'دوري', 'هدف'],
                    'weight': 1.0
                },
                'اقتصاد': {
                    'keywords': ['اقتصاد', 'مال', 'استثمار', 'شركة', 'بورصة', 'تجارة', 'أعمال', 'ربح', 'خسارة', 'سوق'],
                    'weight': 1.0
                },
                'سياسة': {
                    'keywords': ['سياسة', 'حكومة', 'وزير', 'رئيس', 'مجلس', 'قانون', 'انتخابات', 'برلمان', 'دولة', 'رسمي'],
                    'weight': 1.0
                },
                'صحة': {
                    'keywords': ['صحة', 'طب', 'مرض', 'علاج', 'دواء', 'مستشفى', 'طبيب', 'عملية', 'فيروس', 'لقاح'],
                    'weight': 1.0
                },
                'تعليم': {
                    'keywords': ['تعليم', 'جامعة', 'مدرسة', 'طالب', 'دراسة', 'شهادة', 'تخرج', 'معلم', 'أستاذ', 'منهج'],
                    'weight': 1.0
                },
                'ثقافة': {
                    'keywords': ['ثقافة', 'فن', 'أدب', 'كتاب', 'مؤلف', 'شعر', 'مسرح', 'سينما', 'معرض', 'مهرجان'],
                    'weight': 1.0
                }
            }
            
            logger.info("Text Analyzer initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Text Analyzer: {str(e)}")
            raise
    
    def clean_text(self, text: str) -> str:
        """تنظيف النص"""
        # Remove diacritics
        text = re.sub(r'[ًٌٍَُِّْ]', '', text)
        
        # Normalize Arabic characters
        text = re.sub(r'[إأآا]', 'ا', text)
        text = re.sub(r'ى', 'ي', text)
        text = re.sub(r'ة', 'ه', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        return text
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """تحليل المشاعر في النص"""
        try:
            cleaned_text = self.clean_text(text).lower()
            words = cleaned_text.split()
            
            positive_count = sum(1 for word in words if word in self.positive_words)
            negative_count = sum(1 for word in words if word in self.negative_words)
            neutral_count = sum(1 for word in words if word in self.neutral_words)
            
            total_sentiment_words = positive_count + negative_count + neutral_count
            
            if total_sentiment_words == 0:
                sentiment = 'محايد'
                confidence = 0.5
            else:
                if positive_count > negative_count and positive_count > neutral_count:
                    sentiment = 'إيجابي'
                    confidence = positive_count / total_sentiment_words
                elif negative_count > positive_count and negative_count > neutral_count:
                    sentiment = 'سلبي'
                    confidence = negative_count / total_sentiment_words
                else:
                    sentiment = 'محايد'
                    confidence = neutral_count / total_sentiment_words if neutral_count > 0 else 0.5
            
            # Calculate polarity score (-1 to 1)
            polarity = (positive_count - negative_count) / max(total_sentiment_words, 1)
            
            result = {
                'sentiment': sentiment,
                'polarity': round(polarity, 3),
                'confidence': round(confidence, 3),
                'details': {
                    'positive_words': positive_count,
                    'negative_words': negative_count,
                    'neutral_words': neutral_count,
                    'total_words': len(words)
                }
            }
            
            logger.info(f"Sentiment analysis completed: {sentiment} ({confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {
                'sentiment': 'غير محدد',
                'polarity': 0,
                'confidence': 0,
                'error': str(e)
            }
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """استخراج الكيانات المسماة"""
        try:
            entities = {
                'person': [],
                'organization': [],
                'location': [],
                'date': [],
                'money': [],
                'phone': [],
                'email': [],
                'url': []
            }
            
            for entity_type, patterns in self.entity_patterns.items():
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    if matches:
                        if isinstance(matches[0], tuple):
                            # If pattern has groups, extract the groups
                            entities[entity_type].extend([match[0] if match[0] else match for match in matches])
                        else:
                            # If pattern doesn't have groups, use the whole match
                            entities[entity_type].extend(matches)
            
            # Clean and deduplicate entities
            for entity_type in entities:
                entities[entity_type] = list(set([
                    entity.strip() for entity in entities[entity_type] 
                    if entity and entity.strip()
                ]))
            
            logger.info(f"Extracted {sum(len(v) for v in entities.values())} entities")
            return entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {entity_type: [] for entity_type in self.entity_patterns.keys()}
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[Dict[str, Any]]:
        """استخراج الكلمات المفتاحية مع درجات الأهمية"""
        try:
            cleaned_text = self.clean_text(text).lower()
            words = cleaned_text.split()
            
            # Remove common stop words
            stop_words = {
                'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
                'التي', 'الذي', 'كان', 'كانت', 'يكون', 'تكون', 'ليس', 'ليست',
                'لم', 'لن', 'لا', 'ما', 'متى', 'أين', 'كيف', 'لماذا', 'أن', 'إن'
            }
            
            filtered_words = [
                word for word in words 
                if len(word) > 2 and word not in stop_words 
                and re.match(r'^[أ-ي]+$', word)
            ]
            
            # Calculate word frequencies
            word_freq = Counter(filtered_words)
            
            # Calculate TF-IDF-like scores
            total_words = len(filtered_words)
            keywords = []
            
            for word, freq in word_freq.most_common(max_keywords):
                tf_score = freq / total_words
                # Simple IDF approximation (can be improved with a larger corpus)
                idf_score = np.log(total_words / freq) if freq > 0 else 0
                importance = tf_score * idf_score
                
                keywords.append({
                    'word': word,
                    'frequency': freq,
                    'importance': round(importance, 4),
                    'tf_score': round(tf_score, 4)
                })
            
            logger.info(f"Extracted {len(keywords)} keywords")
            return keywords
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def classify_text(self, text: str) -> Dict[str, Any]:
        """تصنيف النص إلى فئات"""
        try:
            cleaned_text = self.clean_text(text).lower()
            words = set(cleaned_text.split())
            
            category_scores = {}
            
            for category, data in self.category_keywords.items():
                category_words = set(data['keywords'])
                overlap = words & category_words
                
                if overlap:
                    # Calculate score based on word overlap and weights
                    score = len(overlap) / len(category_words) * data['weight']
                    category_scores[category] = {
                        'score': round(score, 4),
                        'matched_words': list(overlap)
                    }
            
            # Sort categories by score
            sorted_categories = sorted(
                category_scores.items(), 
                key=lambda x: x[1]['score'], 
                reverse=True
            )
            
            primary_category = sorted_categories[0][0] if sorted_categories else 'عام'
            confidence = sorted_categories[0][1]['score'] if sorted_categories else 0.0
            
            result = {
                'primary_category': primary_category,
                'confidence': confidence,
                'all_categories': dict(sorted_categories),
                'suggested_categories': [cat for cat, data in sorted_categories[:3]]
            }
            
            logger.info(f"Text classified as: {primary_category} ({confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"Error in text classification: {str(e)}")
            return {
                'primary_category': 'عام',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def analyze_text_quality(self, text: str) -> Dict[str, Any]:
        """تحليل جودة النص"""
        try:
            cleaned_text = self.clean_text(text)
            sentences = [s.strip() for s in cleaned_text.split('.') if s.strip()]
            words = cleaned_text.split()
            
            # Basic metrics
            avg_sentence_length = len(words) / len(sentences) if sentences else 0
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            
            # Readability assessment
            readability_score = 0
            if 10 <= avg_sentence_length <= 20:
                readability_score += 2
            elif avg_sentence_length <= 25:
                readability_score += 1
                
            if 3 <= avg_word_length <= 6:
                readability_score += 2
            elif avg_word_length <= 8:
                readability_score += 1
            
            # Determine readability level
            if readability_score >= 3:
                readability = 'سهل القراءة'
            elif readability_score >= 2:
                readability = 'متوسط'
            else:
                readability = 'صعب القراءة'
            
            # Text diversity (unique words ratio)
            unique_words = len(set(words))
            diversity = unique_words / len(words) if words else 0
            
            result = {
                'readability': readability,
                'readability_score': readability_score,
                'metrics': {
                    'total_characters': len(text),
                    'total_words': len(words),
                    'total_sentences': len(sentences),
                    'unique_words': unique_words,
                    'avg_sentence_length': round(avg_sentence_length, 2),
                    'avg_word_length': round(avg_word_length, 2),
                    'lexical_diversity': round(diversity, 3)
                }
            }
            
            logger.info(f"Text quality analysis completed: {readability}")
            return result
            
        except Exception as e:
            logger.error(f"Error in text quality analysis: {str(e)}")
            return {
                'readability': 'غير محدد',
                'error': str(e)
            } 