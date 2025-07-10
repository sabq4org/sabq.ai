"""
اختبارات خدمات الذكاء الاصطناعي - Sabq AI CMS
تاريخ الإنشاء: ${new Date().toISOString().split('T')[0]}
المطور: Ali Alhazmi
الغرض: اختبار جميع خدمات معالجة النصوص العربية والذكاء الاصطناعي
"""

import unittest
import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# إضافة مسار المشروع
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp.arabic_processor import ArabicProcessor
from nlp.sentiment_analyzer import SentimentAnalyzer
from nlp.entity_extractor import EntityExtractor
from nlp.keyword_extractor import KeywordExtractor
from nlp.performance_predictor import PerformancePredictor


class TestArabicProcessor(unittest.TestCase):
    """اختبارات معالج النصوص العربية"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.processor = ArabicProcessor()
        
    def test_remove_diacritics(self):
        """اختبار إزالة التشكيل"""
        text_with_diacritics = "هَذَا نَصٌّ بِالتَّشْكِيلِ"
        expected = "هذا نص بالتشكيل"
        result = self.processor.remove_diacritics(text_with_diacritics)
        self.assertEqual(result, expected)
        
    def test_normalize_text(self):
        """اختبار تطبيع النصوص"""
        unnormalized = "الإســـلام ديـــن السلام"
        expected = "الإسلام دين السلام"
        result = self.processor.normalize_text(unnormalized)
        self.assertEqual(result, expected)
        
    def test_tokenize_arabic(self):
        """اختبار تقسيم النصوص العربية"""
        text = "هذا نص تجريبي للاختبار"
        tokens = self.processor.tokenize(text)
        expected_tokens = ["هذا", "نص", "تجريبي", "للاختبار"]
        self.assertEqual(tokens, expected_tokens)
        
    def test_extract_roots(self):
        """اختبار استخراج الجذور"""
        words = ["كاتب", "كتابة", "مكتوب"]
        roots = self.processor.extract_roots(words)
        expected_root = "كتب"
        self.assertTrue(all(root == expected_root for root in roots))
        
    def test_clean_text(self):
        """اختبار تنظيف النصوص"""
        dirty_text = "هذا نص   بمسافات زائدة!!!   ورموز%%%"
        clean_text = self.processor.clean_text(dirty_text)
        
        # التحقق من عدم وجود مسافات زائدة
        self.assertNotIn("  ", clean_text)
        # التحقق من عدم وجود رموز خاصة
        self.assertNotIn("!!!", clean_text)
        self.assertNotIn("%%%", clean_text)


class TestSentimentAnalyzer(unittest.TestCase):
    """اختبارات محلل المشاعر"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.analyzer = SentimentAnalyzer()
        
    def test_positive_sentiment(self):
        """اختبار تحليل المشاعر الإيجابية"""
        positive_text = "هذا خبر رائع ومفرح جداً!"
        result = self.analyzer.analyze(positive_text)
        
        self.assertEqual(result['label'], 'positive')
        self.assertGreater(result['score'], 0.5)
        self.assertGreater(result['confidence'], 0.7)
        
    def test_negative_sentiment(self):
        """اختبار تحليل المشاعر السلبية"""
        negative_text = "هذا أمر محزن ومؤسف للغاية"
        result = self.analyzer.analyze(negative_text)
        
        self.assertEqual(result['label'], 'negative')
        self.assertLess(result['score'], -0.5)
        self.assertGreater(result['confidence'], 0.7)
        
    def test_neutral_sentiment(self):
        """اختبار تحليل المشاعر المحايدة"""
        neutral_text = "هذا تقرير إخباري عن الأحداث اليومية"
        result = self.analyzer.analyze(neutral_text)
        
        self.assertEqual(result['label'], 'neutral')
        self.assertTrue(-0.3 <= result['score'] <= 0.3)
        
    def test_empty_text(self):
        """اختبار التعامل مع النص الفارغ"""
        with self.assertRaises(ValueError):
            self.analyzer.analyze("")
            
    def test_very_long_text(self):
        """اختبار التعامل مع النصوص الطويلة جداً"""
        long_text = "كلمة إيجابية رائعة " * 1000
        result = self.analyzer.analyze(long_text)
        
        self.assertIsNotNone(result)
        self.assertIn('label', result)
        self.assertIn('score', result)


class TestEntityExtractor(unittest.TestCase):
    """اختبارات مستخرج الكيانات"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.extractor = EntityExtractor()
        
    def test_extract_persons(self):
        """اختبار استخراج أسماء الأشخاص"""
        text = "التقى الملك سلمان مع الرئيس الأمريكي"
        entities = self.extractor.extract(text)
        
        persons = [e for e in entities if e['type'] == 'PERSON']
        self.assertGreater(len(persons), 0)
        
        # التحقق من وجود الملك سلمان
        person_names = [p['text'] for p in persons]
        self.assertTrue(any('سلمان' in name for name in person_names))
        
    def test_extract_locations(self):
        """اختبار استخراج أسماء الأماكن"""
        text = "زار الوفد مدينة الرياض والدمام"
        entities = self.extractor.extract(text)
        
        locations = [e for e in entities if e['type'] == 'LOCATION']
        self.assertGreater(len(locations), 0)
        
        location_names = [l['text'] for l in locations]
        self.assertIn('الرياض', location_names)
        
    def test_extract_organizations(self):
        """اختبار استخراج أسماء المنظمات"""
        text = "أعلنت شركة أرامكو السعودية عن شراكة مع جامعة الملك سعود"
        entities = self.extractor.extract(text)
        
        organizations = [e for e in entities if e['type'] == 'ORGANIZATION']
        self.assertGreater(len(organizations), 0)
        
    def test_extract_dates(self):
        """اختبار استخراج التواريخ"""
        text = "في عام 2023 وتحديداً في شهر يناير"
        entities = self.extractor.extract(text)
        
        dates = [e for e in entities if e['type'] == 'DATE']
        self.assertGreater(len(dates), 0)
        
    def test_confidence_scores(self):
        """اختبار درجات الثقة"""
        text = "محمد أحمد يعمل في الرياض"
        entities = self.extractor.extract(text)
        
        for entity in entities:
            self.assertIn('confidence', entity)
            self.assertTrue(0 <= entity['confidence'] <= 1)


class TestKeywordExtractor(unittest.TestCase):
    """اختبارات مستخرج الكلمات المفتاحية"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.extractor = KeywordExtractor()
        
    def test_extract_keywords(self):
        """اختبار استخراج الكلمات المفتاحية"""
        text = """
        الذكاء الاصطناعي تقنية حديثة تغير شكل المستقبل.
        التعلم الآلي يساعد في تطوير حلول مبتكرة.
        معالجة اللغات الطبيعية مجال مهم في الذكاء الاصطناعي.
        """
        
        keywords = self.extractor.extract(text, max_keywords=5)
        
        self.assertLessEqual(len(keywords), 5)
        self.assertGreater(len(keywords), 0)
        
        # التحقق من وجود كلمات مهمة
        keyword_texts = [k['word'] for k in keywords]
        self.assertTrue(any('ذكاء' in word for word in keyword_texts))
        
    def test_keyword_scores(self):
        """اختبار درجات الكلمات المفتاحية"""
        text = "الذكاء الاصطناعي الذكاء الاصطناعي التعلم الآلي"
        keywords = self.extractor.extract(text)
        
        for keyword in keywords:
            self.assertIn('score', keyword)
            self.assertTrue(0 <= keyword['score'] <= 1)
            
        # الكلمة المكررة أكثر يجب أن تحصل على درجة أعلى
        ai_keyword = next((k for k in keywords if 'ذكاء' in k['word']), None)
        self.assertIsNotNone(ai_keyword)
        
    def test_empty_text_handling(self):
        """اختبار التعامل مع النص الفارغ"""
        keywords = self.extractor.extract("")
        self.assertEqual(len(keywords), 0)
        
    def test_arabic_stopwords(self):
        """اختبار إزالة كلمات الوقف العربية"""
        text = "هذا هو النص الذي يحتوي على كلمات الوقف"
        keywords = self.extractor.extract(text)
        
        # التحقق من عدم وجود كلمات الوقف
        keyword_texts = [k['word'].lower() for k in keywords]
        stopwords = ['هذا', 'هو', 'الذي', 'على']
        
        for stopword in stopwords:
            self.assertNotIn(stopword, keyword_texts)


class TestPerformancePredictor(unittest.TestCase):
    """اختبارات متنبئ الأداء"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.predictor = PerformancePredictor()
        
    def test_predict_popularity(self):
        """اختبار التنبؤ بشعبية المقال"""
        article_data = {
            'title': 'مقال عن الذكاء الاصطناعي',
            'content': 'محتوى تفصيلي عن الذكاء الاصطناعي',
            'section': 'تقنية',
            'author_followers': 1000,
            'publish_time': '2024-01-15T10:00:00Z'
        }
        
        prediction = self.predictor.predict_popularity(article_data)
        
        self.assertIn('popularity_score', prediction)
        self.assertIn('predicted_views', prediction)
        self.assertIn('predicted_engagement', prediction)
        
        self.assertTrue(0 <= prediction['popularity_score'] <= 1)
        self.assertGreater(prediction['predicted_views'], 0)
        
    def test_predict_engagement(self):
        """اختبار التنبؤ بمعدل التفاعل"""
        article_data = {
            'title': 'عنوان جذاب ومثير',
            'content': 'محتوى عالي الجودة',
            'section': 'أخبار',
            'reading_time': 5  # 5 دقائق
        }
        
        engagement = self.predictor.predict_engagement(article_data)
        
        self.assertIn('click_rate', engagement)
        self.assertIn('share_rate', engagement)
        self.assertIn('comment_rate', engagement)
        
    def test_analyze_trends(self):
        """اختبار تحليل الاتجاهات"""
        keywords = ['ذكاء اصطناعي', 'تقنية', 'روبوت']
        trends = self.predictor.analyze_trends(keywords)
        
        self.assertIsInstance(trends, list)
        for trend in trends:
            self.assertIn('keyword', trend)
            self.assertIn('trend_score', trend)
            self.assertIn('growth_rate', trend)
            
    def test_content_quality_assessment(self):
        """اختبار تقييم جودة المحتوى"""
        content = """
        هذا مقال عالي الجودة يحتوي على معلومات قيمة ومفيدة.
        المحتوى منظم بشكل جيد ويستخدم لغة واضحة ومفهومة.
        الكاتب يقدم أمثلة عملية وحلول مبتكرة.
        """
        
        quality = self.predictor.assess_content_quality(content)
        
        self.assertIn('overall_score', quality)
        self.assertIn('readability', quality)
        self.assertIn('depth', quality)
        self.assertIn('engagement_potential', quality)
        
        self.assertTrue(0 <= quality['overall_score'] <= 100)


class TestMLIntegration(unittest.TestCase):
    """اختبارات التكامل بين خدمات ML"""
    
    def setUp(self):
        """إعداد الاختبارات"""
        self.processor = ArabicProcessor()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.entity_extractor = EntityExtractor()
        self.keyword_extractor = KeywordExtractor()
        
    def test_complete_text_analysis(self):
        """اختبار التحليل الشامل للنص"""
        text = """
        أعلنت شركة أبل الأمريكية عن إطلاق منتج جديد رائع.
        هذا الإعلان أثار حماس المستهلكين والخبراء في مجال التقنية.
        الشركة تتوقع نجاحاً كبيراً للمنتج الجديد في الأسواق العالمية.
        """
        
        # تنظيف النص
        clean_text = self.processor.clean_text(text)
        
        # تحليل المشاعر
        sentiment = self.sentiment_analyzer.analyze(clean_text)
        
        # استخراج الكيانات
        entities = self.entity_extractor.extract(clean_text)
        
        # استخراج الكلمات المفتاحية
        keywords = self.keyword_extractor.extract(clean_text)
        
        # التحقق من النتائج
        self.assertEqual(sentiment['label'], 'positive')
        
        # التحقق من وجود الكيانات المتوقعة
        entity_texts = [e['text'] for e in entities]
        self.assertTrue(any('أبل' in text for text in entity_texts))
        
        # التحقق من الكلمات المفتاحية
        keyword_texts = [k['word'] for k in keywords]
        self.assertTrue(any('منتج' in word for word in keyword_texts))
        
    def test_performance_benchmark(self):
        """اختبار أداء المعالجة"""
        import time
        
        text = "نص تجريبي للاختبار " * 100
        
        start_time = time.time()
        
        # تشغيل جميع المحللات
        self.processor.clean_text(text)
        self.sentiment_analyzer.analyze(text)
        self.entity_extractor.extract(text)
        self.keyword_extractor.extract(text)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # يجب أن تكون المعالجة أقل من 5 ثوان
        self.assertLess(processing_time, 5.0)
        
    def test_memory_usage(self):
        """اختبار استخدام الذاكرة"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # معالجة نصوص متعددة
        for i in range(100):
            text = f"نص تجريبي رقم {i}"
            self.processor.clean_text(text)
            
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # الزيادة في الذاكرة يجب أن تكون معقولة (أقل من 100MB)
        self.assertLess(memory_increase, 100 * 1024 * 1024)


class TestErrorHandling(unittest.TestCase):
    """اختبارات التعامل مع الأخطاء"""
    
    def test_invalid_input_handling(self):
        """اختبار التعامل مع المدخلات غير الصحيحة"""
        processor = ArabicProcessor()
        
        # اختبار None
        with self.assertRaises(ValueError):
            processor.clean_text(None)
            
        # اختبار نوع خاطئ
        with self.assertRaises(TypeError):
            processor.clean_text(123)
            
    def test_model_loading_failure(self):
        """اختبار فشل تحميل النماذج"""
        with patch('pickle.load', side_effect=FileNotFoundError):
            with self.assertRaises(FileNotFoundError):
                SentimentAnalyzer()
                
    def test_network_failure_handling(self):
        """اختبار التعامل مع فشل الشبكة"""
        with patch('requests.get', side_effect=ConnectionError):
            # يجب أن تعمل الخدمة مع النماذج المحلية
            analyzer = SentimentAnalyzer()
            result = analyzer.analyze("نص تجريبي")
            self.assertIsNotNone(result)


if __name__ == '__main__':
    # تشغيل جميع الاختبارات
    unittest.main(verbosity=2)
    
    # أو تشغيل اختبارات محددة
    # python -m pytest test_ml_services.py::TestArabicProcessor::test_remove_diacritics -v 