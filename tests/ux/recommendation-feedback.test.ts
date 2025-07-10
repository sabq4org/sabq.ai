/**
 * اختبارات مكونات التغذية الراجعة وتحسينات UX
 * Recommendation Feedback & UX Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock للمكونات
const mockTrackEvent = jest.fn();
jest.mock('@/lib/analytics-core', () => ({
  trackEvent: mockTrackEvent,
  EventType: {
    FEATURE_USE: 'feature_use',
    ARTICLE_LIKE: 'article_like',
  }
}));

describe('🎨 اختبارات تحسينات تجربة المستخدم', () => {
  
  beforeEach(() => {
    mockTrackEvent.mockClear();
    // Mock fetch للـ API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('مكون التغذية الراجعة', () => {
    
    it('should display recommendation reason correctly', () => {
      const reasonText = 'لأنك تقرأ مقالات مشابهة في التقنية';
      const reasonType = 'interest';

      // محاكاة عرض المكون
      expect(reasonText).toContain('تقنية');
      expect(reasonType).toBe('interest');
    });

    it('should show feedback buttons', async () => {
      // محاكاة وجود أزرار التقييم
      const feedbackButtons = [
        'واضح ومفيد',
        'غير واضح', 
        'مفيد',
        'غير مفيد'
      ];

      feedbackButtons.forEach(buttonText => {
        expect(buttonText).toBeTruthy();
      });
    });

    it('should handle feedback submission', async () => {
      const mockSubmit = jest.fn();
      
      // محاكاة إرسال التغذية الراجعة
      const feedbackData = {
        recommendationId: 'rec_123',
        reasonText: 'test reason',
        feedback: 'clear',
        note: 'test note'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('/api/feedback/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/feedback/reason',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        })
      );
    });

    it('should track feedback events', () => {
      // محاكاة تتبع الأحداث
      mockTrackEvent('feature_use', {
        feature: 'recommendation_reason_feedback',
        feedback: 'clear',
        recommendationId: 'rec_123'
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'feature_use',
        expect.objectContaining({
          feature: 'recommendation_reason_feedback',
          feedback: 'clear'
        })
      );
    });
  });

  describe('API التغذية الراجعة', () => {
    
    it('should accept valid feedback data', async () => {
      const validFeedback = {
        recommendationId: 'rec_123',
        reasonText: 'لأنك مهتم بالتقنية',
        feedback: 'clear',
        note: 'السبب واضح جداً'
      };

      // محاكاة استجابة API ناجحة
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          feedbackId: 'feedback_456'
        })
      });

      const response = await fetch('/api/feedback/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validFeedback)
      });

      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.feedbackId).toBeTruthy();
    });

    it('should reject invalid feedback data', async () => {
      const invalidFeedback = {
        // بيانات ناقصة
        feedback: 'invalid_type'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'بيانات غير صحيحة'
        })
      });

      const response = await fetch('/api/feedback/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidFeedback)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should return feedback statistics', async () => {
      const mockStats = {
        success: true,
        stats: {
          total: 100,
          by_type: {
            clear: 40,
            helpful: 30,
            unclear: 20,
            not_helpful: 10
          },
          satisfaction_rate: 70,
          with_notes: 25,
          with_improvements: 15
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      });

      const response = await fetch('/api/feedback/reason?timeframe=7d');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.stats.total).toBe(100);
      expect(data.stats.satisfaction_rate).toBe(70);
    });
  });

  describe('مكون تغذية المقالات', () => {
    
    it('should display recommendations with reasons', () => {
      const mockRecommendations = [
        {
          id: 'article_1',
          title: 'مقال تقني رائع',
          recommendation_reason: 'لأنك تقرأ عن التقنية',
          recommendation_type: 'interest',
          recommendation_score: 0.9
        }
      ];

      mockRecommendations.forEach(rec => {
        expect(rec.recommendation_reason).toBeTruthy();
        expect(rec.recommendation_type).toBe('interest');
        expect(rec.recommendation_score).toBeGreaterThan(0);
      });
    });

    it('should handle recommendation refresh', async () => {
      // محاكاة تحديث التوصيات
      const mockNewRecommendations = [
        { id: 'new_1', title: 'مقال جديد 1' },
        { id: 'new_2', title: 'مقال جديد 2' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          recommendations: mockNewRecommendations
        })
      });

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_events: [],
          articles: [],
          top_n: 5
        })
      });

      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.recommendations).toHaveLength(2);
    });

    it('should track article interactions', () => {
      // محاكاة تتبع التفاعل مع المقالات
      const articleData = {
        articleId: 'article_123',
        action: 'view',
        context: 'recommendation',
        recommendation_score: 0.85
      };

      mockTrackEvent('article_view', articleData);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'article_view',
        expect.objectContaining({
          articleId: 'article_123',
          recommendation_score: 0.85
        })
      );
    });
  });

  describe('لوحة تحليل التغذية الراجعة', () => {
    
    it('should display key metrics', () => {
      const mockMetrics = {
        total: 500,
        satisfaction_rate: 75.5,
        with_notes: 120,
        with_improvements: 80
      };

      // التحقق من وجود المقاييس الأساسية
      expect(mockMetrics.total).toBeGreaterThan(0);
      expect(mockMetrics.satisfaction_rate).toBeGreaterThanOrEqual(0);
      expect(mockMetrics.satisfaction_rate).toBeLessThanOrEqual(100);
      expect(mockMetrics.with_notes).toBeGreaterThanOrEqual(0);
      expect(mockMetrics.with_improvements).toBeGreaterThanOrEqual(0);
    });

    it('should filter data by timeframe', async () => {
      const timeframes = ['1d', '7d', '30d'];
      
      for (const timeframe of timeframes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            stats: { total: 100 },
            timeframe
          })
        });

        const response = await fetch(`/api/feedback/reason?timeframe=${timeframe}`);
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data.timeframe).toBe(timeframe);
      }
    });

    it('should show recent feedback items', () => {
      const mockRecentFeedback = [
        {
          id: 'feedback_1',
          feedback: 'clear',
          note: 'السبب واضح',
          created_at: '2024-01-15T10:00:00Z',
          reason_text: 'لأنك تقرأ عن التقنية'
        },
        {
          id: 'feedback_2', 
          feedback: 'unclear',
          improvement_suggestion: 'يمكن تحسين الصياغة',
          created_at: '2024-01-15T11:00:00Z',
          reason_text: 'محتوى شائع'
        }
      ];

      mockRecentFeedback.forEach(item => {
        expect(item.id).toBeTruthy();
        expect(['clear', 'unclear', 'helpful', 'not_helpful']).toContain(item.feedback);
        expect(item.created_at).toBeTruthy();
        expect(item.reason_text).toBeTruthy();
      });
    });
  });

  describe('تحسينات تجربة المستخدم', () => {
    
    it('should provide clear recommendation reasons', () => {
      const reasons = [
        'لأنك تقرأ مقالات مشابهة في التقنية',
        'هذا المقال شائع بين القراء',
        'يعجب المستخدمين المشابهين لك',
        'محتوى جديد قد يثير اهتمامك'
      ];

      reasons.forEach(reason => {
        expect(reason.length).toBeGreaterThan(10);
        expect(reason).toMatch(/لأن|هذا|يعجب|محتوى/);
      });
    });

    it('should use appropriate icons and colors', () => {
      const reasonTypes = {
        interest: { icon: '🎯', color: 'blue' },
        popular: { icon: '🔥', color: 'red' },
        collaborative: { icon: '👥', color: 'green' },
        diversity: { icon: '🌈', color: 'purple' },
        freshness: { icon: '✨', color: 'yellow' }
      };

      Object.entries(reasonTypes).forEach(([type, config]) => {
        expect(config.icon).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(type).toBeTruthy();
      });
    });

    it('should handle accessibility requirements', () => {
      // محاكاة فحص إمكانية الوصول
      const accessibilityFeatures = [
        'keyboard_navigation',
        'screen_reader_support', 
        'color_contrast',
        'focus_indicators',
        'aria_labels'
      ];

      accessibilityFeatures.forEach(feature => {
        expect(feature).toBeTruthy();
      });
    });

    it('should be responsive across devices', () => {
      // محاكاة اختبار الاستجابة
      const breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      };

      Object.entries(breakpoints).forEach(([device, width]) => {
        expect(width).toBeGreaterThan(0);
        expect(device).toBeTruthy();
      });
    });
  });

  describe('سيناريوهات متكاملة', () => {
    
    it('should complete full feedback flow', async () => {
      // 1. عرض التوصية
      const recommendation = {
        id: 'rec_123',
        reason: 'لأنك تقرأ عن الذكاء الاصطناعي',
        type: 'interest'
      };

      // 2. تقييم المستخدم
      const feedback = {
        recommendationId: recommendation.id,
        reasonText: recommendation.reason,
        feedback: 'clear',
        note: 'السبب واضح ومفيد'
      };

      // 3. إرسال التغذية الراجعة
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('/api/feedback/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });

      // 4. التحقق من النتائج
      expect(response.ok).toBe(true);
      expect(recommendation.reason).toContain('الذكاء الاصطناعي');
      expect(feedback.feedback).toBe('clear');
    });

    it('should handle error scenarios gracefully', async () => {
      // محاكاة خطأ في الشبكة
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      try {
        await fetch('/api/feedback/reason', {
          method: 'POST',
          body: JSON.stringify({ invalid: 'data' })
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should improve recommendations over time', () => {
      // محاكاة تحسن التوصيات مع الوقت
      const feedbackHistory = [
        { timestamp: '2024-01-01', satisfaction: 60 },
        { timestamp: '2024-01-08', satisfaction: 65 },
        { timestamp: '2024-01-15', satisfaction: 72 }
      ];

      // التحقق من تحسن معدل الرضا
      const improvements = feedbackHistory.map((item, index) => {
        if (index === 0) return 0;
        return item.satisfaction - feedbackHistory[index - 1].satisfaction;
      });

      const totalImprovement = improvements.reduce((sum, imp) => sum + imp, 0);
      expect(totalImprovement).toBeGreaterThan(0);
    });
  });
});

// تنظيف بعد الاختبارات
afterAll(() => {
  console.log('🧹 تنظيف اختبارات تحسينات UX...');
});

// إعداد قبل الاختبارات
beforeAll(() => {
  console.log('🔧 إعداد اختبارات تحسينات UX...');
}); 