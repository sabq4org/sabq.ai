"""
خدمة معالجة اللغة الطبيعية العربية الأساسية
تتضمن: التلخيص، استخراج الكلمات المفتاحية، اقتراح العلامات
"""

import re
import logging
from typing import List, Dict, Any
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Configure logging
logger = logging.getLogger(__name__)

class NLPService:
    """خدمة معالجة اللغة الطبيعية للنصوص العربية"""
    
    def __init__(self):
        """تهيئة الخدمة وتحميل الموارد المطلوبة"""
        try:
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            # Arabic stopwords
            self.arabic_stopwords = set([
                'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
                'التي', 'الذي', 'التي', 'اللذان', 'اللتان', 'اللذين', 'اللتين',
                'كان', 'كانت', 'يكون', 'تكون', 'ليس', 'ليست', 'لم', 'لن', 'لا',
                'ما', 'ماذا', 'متى', 'أين', 'كيف', 'لماذا', 'أن', 'إن', 'لكن',
                'لكن', 'غير', 'سوى', 'عند', 'عندما', 'حيث', 'بينما', 'ولكن',
                'أو', 'أم', 'إما', 'كل', 'كلا', 'كلتا', 'جميع', 'بعض', 'قد',
                'لقد', 'قال', 'قالت', 'يقول', 'تقول', 'ذكر', 'ذكرت', 'أضاف',
                'أضافت', 'أشار', 'أشارت', 'بين', 'أكد', 'أكدت'
            ])
            
            # Common Arabic patterns for entity extraction
            self.arabic_patterns = {
                'name': r'[أ-ي]+\s+[أ-ي]+(?:\s+[أ-ي]+)?',
                'organization': r'(?:شركة|مؤسسة|منظمة|جمعية|جامعة|وزارة)\s+[أ-ي\s]+',
                'location': r'(?:مدينة|محافظة|منطقة|دولة)\s+[أ-ي\s]+',
                'date': r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}'
            }
            
            logger.info("NLP Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing NLP Service: {str(e)}")
            raise
    
    def clean_arabic_text(self, text: str) -> str:
        """تنظيف النص العربي"""
        # Remove diacritics (tashkeel)
        text = re.sub(r'[ًٌٍَُِّْ]', '', text)
        
        # Normalize Arabic characters
        text = re.sub(r'[إأآا]', 'ا', text)
        text = re.sub(r'ى', 'ي', text)
        text = re.sub(r'ة', 'ه', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters but keep Arabic and basic punctuation
        text = re.sub(r'[^\u0600-\u06FF\s\.\،\؟\!\:]', '', text)
        
        return text
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """استخراج الكلمات المفتاحية من النص"""
        try:
            # Clean text
            cleaned_text = self.clean_arabic_text(text)
            
            # Tokenize
            words = word_tokenize(cleaned_text)
            
            # Filter out stopwords and short words
            filtered_words = [
                word.lower() for word in words
                if len(word) > 2 and word not in self.arabic_stopwords
                and re.match(r'^[أ-ي]+$', word)
            ]
            
            # Count frequency
            word_freq = Counter(filtered_words)
            
            # Return top keywords
            keywords = [word for word, freq in word_freq.most_common(max_keywords)]
            
            logger.info(f"Extracted {len(keywords)} keywords from text")
            return keywords
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def summarize(self, text: str, max_length: int = 150, language: str = "ar") -> str:
        """تلخيص النص العربي"""
        try:
            # Clean text
            cleaned_text = self.clean_arabic_text(text)
            
            # Split into sentences
            sentences = sent_tokenize(cleaned_text)
            
            if len(sentences) <= 3:
                return cleaned_text[:max_length] + "..." if len(cleaned_text) > max_length else cleaned_text
            
            # Calculate sentence scores based on word frequency
            word_freq = Counter()
            for sentence in sentences:
                words = word_tokenize(sentence.lower())
                for word in words:
                    if word not in self.arabic_stopwords and len(word) > 2:
                        word_freq[word] += 1
            
            # Score sentences
            sentence_scores = {}
            for sentence in sentences:
                words = word_tokenize(sentence.lower())
                score = 0
                word_count = 0
                for word in words:
                    if word in word_freq:
                        score += word_freq[word]
                        word_count += 1
                if word_count > 0:
                    sentence_scores[sentence] = score / word_count
            
            # Select top sentences
            top_sentences = sorted(sentence_scores.items(), key=lambda x: x[1], reverse=True)
            
            # Build summary
            summary_sentences = []
            current_length = 0
            
            for sentence, score in top_sentences:
                if current_length + len(sentence) <= max_length:
                    summary_sentences.append(sentence)
                    current_length += len(sentence)
                else:
                    break
            
            # Sort sentences by original order
            original_order = []
            for sentence in sentences:
                if sentence in [s for s, _ in summary_sentences]:
                    original_order.append(sentence)
            
            summary = ' '.join(original_order[:3])  # Limit to 3 sentences max
            
            logger.info(f"Generated summary of length {len(summary)} from original text of length {len(text)}")
            return summary
            
        except Exception as e:
            logger.error(f"Error in summarization: {str(e)}")
            return text[:max_length] + "..." if len(text) > max_length else text
    
    def generate_tags(self, text: str, max_tags: int = 5) -> List[str]:
        """اقتراح علامات للمحتوى"""
        try:
            # Extract keywords first
            keywords = self.extract_keywords(text, max_keywords=20)
            
            # Predefined categories mapping
            category_keywords = {
                'تقنية': ['تقنية', 'تكنولوجيا', 'ذكاء', 'اصطناعي', 'حاسوب', 'إنترنت', 'برمجة', 'تطبيق'],
                'رياضة': ['رياضة', 'كرة', 'قدم', 'مباراة', 'فريق', 'لاعب', 'نادي', 'بطولة'],
                'اقتصاد': ['اقتصاد', 'مال', 'استثمار', 'شركة', 'بورصة', 'تجارة', 'أعمال'],
                'سياسة': ['سياسة', 'حكومة', 'وزير', 'رئيس', 'مجلس', 'قانون', 'انتخابات'],
                'صحة': ['صحة', 'طب', 'مرض', 'علاج', 'دواء', 'مستشفى', 'طبيب'],
                'تعليم': ['تعليم', 'جامعة', 'مدرسة', 'طالب', 'دراسة', 'شهادة', 'تخرج'],
                'ثقافة': ['ثقافة', 'فن', 'أدب', 'كتاب', 'مؤلف', 'شعر', 'مسرح', 'سينما']
            }
            
            # Generate category-based tags
            suggested_tags = []
            
            for category, category_words in category_keywords.items():
                overlap = set(keywords) & set(category_words)
                if overlap:
                    suggested_tags.append(category)
            
            # Add top keywords as tags
            for keyword in keywords[:max_tags - len(suggested_tags)]:
                if keyword not in suggested_tags:
                    suggested_tags.append(keyword)
            
            # Ensure we don't exceed max_tags
            suggested_tags = suggested_tags[:max_tags]
            
            logger.info(f"Generated {len(suggested_tags)} tags for content")
            return suggested_tags
            
        except Exception as e:
            logger.error(f"Error generating tags: {str(e)}")
            return ['عام']  # Return default tag
    
    def analyze_readability(self, text: str) -> Dict[str, Any]:
        """تحليل سهولة قراءة النص"""
        try:
            cleaned_text = self.clean_arabic_text(text)
            sentences = sent_tokenize(cleaned_text)
            words = word_tokenize(cleaned_text)
            
            # Basic readability metrics
            avg_sentence_length = len(words) / len(sentences) if sentences else 0
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            
            # Calculate complexity score (simple heuristic)
            complexity_score = 0
            if avg_sentence_length > 20:
                complexity_score += 2
            elif avg_sentence_length > 15:
                complexity_score += 1
                
            if avg_word_length > 6:
                complexity_score += 2
            elif avg_word_length > 4:
                complexity_score += 1
            
            # Determine readability level
            if complexity_score <= 1:
                level = "سهل"
            elif complexity_score <= 3:
                level = "متوسط"
            else:
                level = "صعب"
            
            return {
                'level': level,
                'avg_sentence_length': round(avg_sentence_length, 2),
                'avg_word_length': round(avg_word_length, 2),
                'total_sentences': len(sentences),
                'total_words': len(words),
                'complexity_score': complexity_score
            }
            
        except Exception as e:
            logger.error(f"Error analyzing readability: {str(e)}")
            return {'level': 'غير محدد', 'error': str(e)}
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """استخراج الكيانات المسماة من النص"""
        try:
            entities = {
                'names': [],
                'organizations': [],
                'locations': [],
                'dates': []
            }
            
            # Extract using regex patterns
            for entity_type, pattern in self.arabic_patterns.items():
                matches = re.findall(pattern, text, re.IGNORECASE)
                if entity_type == 'name':
                    entities['names'].extend(matches)
                elif entity_type == 'organization':
                    entities['organizations'].extend(matches)
                elif entity_type == 'location':
                    entities['locations'].extend(matches)
                elif entity_type == 'date':
                    entities['dates'].extend(matches)
            
            # Remove duplicates and clean
            for key in entities:
                entities[key] = list(set(entities[key]))
                entities[key] = [entity.strip() for entity in entities[key]]
            
            logger.info(f"Extracted entities: {sum(len(v) for v in entities.values())} total")
            return entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {'names': [], 'organizations': [], 'locations': [], 'dates': []} 