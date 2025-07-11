import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI Moderation Configuration
interface ModerationConfig {
  ai_threshold_approve: number;
  ai_threshold_reject: number;
  categories_to_block: string[];
  keywords_blacklist: string[];
  keywords_whitelist: string[];
}

interface AIResponse {
  accepted: boolean;
  category: string;
  risk_score: number;
  confidence: number;
  reasons: string[];
  notes?: string;
  detected_keywords?: string[];
}

interface ModerationResult {
  status: 'approved' | 'rejected' | 'needs_review';
  ai_response: AIResponse;
  final_decision: string;
  reasons: string[];
}

/**
 * خدمة الإشراف الذكي على التعليقات
 */
export class AIModerationService {
  private config: ModerationConfig;

  constructor(config?: ModerationConfig) {
    this.config = config || {
      ai_threshold_approve: 0.3,
      ai_threshold_reject: 0.7,
      categories_to_block: ['spam', 'hate', 'bullying', 'nsfw'],
      keywords_blacklist: [],
      keywords_whitelist: []
    };
  }

  /**
   * تحليل التعليق باستخدام الذكاء الاصطناعي
   */
  async moderateComment(params: {
    comment: string;
    user_id: string;
    article_id: string;
    lang?: string;
    context?: any;
  }): Promise<ModerationResult> {
    try {
      // 1. فحص الكلمات المحظورة محلياً
      const localCheck = this.performLocalCheck(params.comment);
      if (localCheck.blocked) {
        return {
          status: 'rejected',
          ai_response: {
            accepted: false,
            category: 'blacklisted_keywords',
            risk_score: 1.0,
            confidence: 1.0,
            reasons: localCheck.reasons,
            detected_keywords: localCheck.keywords
          },
          final_decision: 'Auto-rejected due to blacklisted keywords',
          reasons: localCheck.reasons
        };
      }

      // 2. استدعاء خدمة الذكاء الاصطناعي
      const aiResponse = await this.callAIModerationAPI(params);

      // 3. تطبيق قواعد القرار
      const decision = this.makeDecision(aiResponse);

      // 4. تسجيل النتيجة للتدريب المستقبلي
      await this.logModerationResult(params, aiResponse, decision);

      return {
        status: decision.status,
        ai_response: aiResponse,
        final_decision: decision.reason,
        reasons: decision.reasons
      };

    } catch (error) {
      console.error('AI Moderation Error:', error);
      
      // في حالة فشل الذكاء الاصطناعي، استخدم الفحص المحلي
      const fallbackCheck = this.performFallbackModeration(params.comment);
      
      return {
        status: fallbackCheck.status,
        ai_response: {
          accepted: fallbackCheck.status === 'approved',
          category: 'fallback_check',
          risk_score: fallbackCheck.risk_score,
          confidence: 0.5,
          reasons: fallbackCheck.reasons,
          notes: 'AI service unavailable, used fallback moderation'
        },
        final_decision: 'Fallback moderation due to AI service error',
        reasons: fallbackCheck.reasons
      };
    }
  }

  /**
   * استدعاء API الذكاء الاصطناعي
   */
  private async callAIModerationAPI(params: {
    comment: string;
    user_id: string;
    article_id: string;
    lang?: string;
    context?: any;
  }): Promise<AIResponse> {
    const aiApiUrl = process.env.AI_MODERATION_URL || 'http://localhost:8000/moderate';
    
    const response = await fetch(aiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY || ''}`
      },
      body: JSON.stringify({
        text: params.comment,
        user_id: params.user_id,
        article_id: params.article_id,
        language: params.lang || 'ar',
        context: params.context || {}
      }),
      timeout: 10000 // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      accepted: data.accepted || false,
      category: data.category || 'unknown',
      risk_score: Math.max(0, Math.min(1, data.risk_score || 0)),
      confidence: Math.max(0, Math.min(1, data.confidence || 0)),
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      notes: data.notes || '',
      detected_keywords: Array.isArray(data.detected_keywords) ? data.detected_keywords : []
    };
  }

  /**
   * فحص محلي للكلمات المحظورة
   */
  private performLocalCheck(comment: string): {
    blocked: boolean;
    reasons: string[];
    keywords: string[];
  } {
    const lowerComment = comment.toLowerCase();
    const detectedKeywords: string[] = [];
    const reasons: string[] = [];

    // فحص الكلمات المحظورة
    for (const keyword of this.config.keywords_blacklist) {
      if (lowerComment.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        reasons.push(`Contains blacklisted keyword: ${keyword}`);
      }
    }

    // فحص الأنماط المشبوهة
    const suspiciousPatterns = [
      /(.)\1{4,}/g, // تكرار الحروف أكثر من 4 مرات
      /[A-Z]{10,}/g, // أحرف كبيرة متتالية
      /https?:\/\/[^\s]+/g, // روابط مشبوهة
      /\b\d{4,}\b/g, // أرقام طويلة (قد تكون أرقام هواتف)
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(comment)) {
        reasons.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    return {
      blocked: detectedKeywords.length > 0 || reasons.length > 0,
      reasons,
      keywords: detectedKeywords
    };
  }

  /**
   * اتخاذ القرار النهائي بناءً على استجابة الذكاء الاصطناعي
   */
  private makeDecision(aiResponse: AIResponse): {
    status: 'approved' | 'rejected' | 'needs_review';
    reason: string;
    reasons: string[];
  } {
    const reasons = [...aiResponse.reasons];

    // قرار تلقائي بالرفض للفئات المحظورة
    if (this.config.categories_to_block.includes(aiResponse.category)) {
      return {
        status: 'rejected',
        reason: `Auto-rejected: Category "${aiResponse.category}" is blocked`,
        reasons: [...reasons, `Blocked category: ${aiResponse.category}`]
      };
    }

    // قرار بناءً على نقاط الخطر
    if (aiResponse.risk_score < this.config.ai_threshold_approve) {
      return {
        status: 'approved',
        reason: `Auto-approved: Low risk score (${aiResponse.risk_score.toFixed(2)})`,
        reasons
      };
    }

    if (aiResponse.risk_score > this.config.ai_threshold_reject) {
      return {
        status: 'rejected',
        reason: `Auto-rejected: High risk score (${aiResponse.risk_score.toFixed(2)})`,
        reasons: [...reasons, `High risk score: ${aiResponse.risk_score.toFixed(2)}`]
      };
    }

    // قرار بالمراجعة البشرية
    return {
      status: 'needs_review',
      reason: `Needs human review: Medium risk score (${aiResponse.risk_score.toFixed(2)})`,
      reasons: [...reasons, `Medium risk score: ${aiResponse.risk_score.toFixed(2)}`]
    };
  }

  /**
   * الإشراف الاحتياطي في حالة فشل الذكاء الاصطناعي
   */
  private performFallbackModeration(comment: string): {
    status: 'approved' | 'rejected' | 'needs_review';
    risk_score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let risk_score = 0;

    // فحص الطول
    if (comment.length < 2) {
      risk_score += 0.3;
      reasons.push('Very short comment');
    } else if (comment.length > 2000) {
      risk_score += 0.2;
      reasons.push('Very long comment');
    }

    // فحص الأحرف الكبيرة
    const uppercaseRatio = (comment.match(/[A-Z]/g) || []).length / comment.length;
    if (uppercaseRatio > 0.5) {
      risk_score += 0.3;
      reasons.push('Excessive uppercase letters');
    }

    // فحص الروابط
    const urlCount = (comment.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 2) {
      risk_score += 0.4;
      reasons.push('Multiple URLs detected');
    }

    // فحص تكرار الأحرف
    if (/(.)\1{4,}/.test(comment)) {
      risk_score += 0.3;
      reasons.push('Repeated characters');
    }

    // فحص الرموز المفرطة
    const symbolRatio = (comment.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / comment.length;
    if (symbolRatio > 0.3) {
      risk_score += 0.2;
      reasons.push('Excessive special characters');
    }

    // تحديد الحالة
    let status: 'approved' | 'rejected' | 'needs_review';
    if (risk_score < 0.3) {
      status = 'approved';
    } else if (risk_score > 0.7) {
      status = 'rejected';
    } else {
      status = 'needs_review';
    }

    return { status, risk_score, reasons };
  }

  /**
   * تسجيل نتيجة الإشراف للتدريب المستقبلي
   */
  private async logModerationResult(
    params: { comment: string; user_id: string; article_id: string },
    aiResponse: AIResponse,
    decision: { status: string; reason: string }
  ): Promise<void> {
    try {
      // تسجيل في قاعدة البيانات لتحليل الأداء
      await prisma.moderationLog.create({
        data: {
          content: params.comment,
          user_id: params.user_id,
          article_id: params.article_id,
          ai_category: aiResponse.category,
          ai_risk_score: aiResponse.risk_score,
          ai_confidence: aiResponse.confidence,
          ai_reasons: aiResponse.reasons,
          final_decision: decision.status,
          decision_reason: decision.reason,
          processed_at: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging moderation result:', error);
    }
  }

  /**
   * تحديث إعدادات الإشراف
   */
  async updateConfig(newConfig: Partial<ModerationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // حفظ الإعدادات في قاعدة البيانات
    try {
      await prisma.moderationConfig.upsert({
        where: { config_name: 'default' },
        create: {
          config_name: 'default',
          ai_threshold_approve: this.config.ai_threshold_approve,
          ai_threshold_reject: this.config.ai_threshold_reject,
          categories_to_block: this.config.categories_to_block,
          keywords_blacklist: this.config.keywords_blacklist,
          keywords_whitelist: this.config.keywords_whitelist,
          created_by: 'system'
        },
        update: {
          ai_threshold_approve: this.config.ai_threshold_approve,
          ai_threshold_reject: this.config.ai_threshold_reject,
          categories_to_block: this.config.categories_to_block,
          keywords_blacklist: this.config.keywords_blacklist,
          keywords_whitelist: this.config.keywords_whitelist,
          updated_at: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating moderation config:', error);
    }
  }

  /**
   * الحصول على إحصائيات الإشراف
   */
  async getModerationStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    total_processed: number;
    auto_approved: number;
    auto_rejected: number;
    needs_review: number;
    accuracy_rate: number;
    categories_breakdown: Record<string, number>;
    average_risk_score: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await prisma.moderationLog.groupBy({
      by: ['final_decision', 'ai_category'],
      where: {
        processed_at: { gte: startDate }
      },
      _count: { id: true },
      _avg: { ai_risk_score: true }
    });

    const total_processed = stats.reduce((sum, stat) => sum + stat._count.id, 0);
    const auto_approved = stats.filter(s => s.final_decision === 'approved').reduce((sum, stat) => sum + stat._count.id, 0);
    const auto_rejected = stats.filter(s => s.final_decision === 'rejected').reduce((sum, stat) => sum + stat._count.id, 0);
    const needs_review = stats.filter(s => s.final_decision === 'needs_review').reduce((sum, stat) => sum + stat._count.id, 0);

    const categories_breakdown = stats.reduce((acc, stat) => {
      acc[stat.ai_category] = (acc[stat.ai_category] || 0) + stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const average_risk_score = stats.reduce((sum, stat) => sum + (stat._avg.ai_risk_score || 0), 0) / stats.length;

    // حساب معدل الدقة (يتطلب بيانات المراجعة البشرية)
    const accuracy_rate = await this.calculateAccuracyRate(startDate);

    return {
      total_processed,
      auto_approved,
      auto_rejected,
      needs_review,
      accuracy_rate,
      categories_breakdown,
      average_risk_score
    };
  }

  /**
   * حساب معدل دقة الذكاء الاصطناعي
   */
  private async calculateAccuracyRate(startDate: Date): Promise<number> {
    try {
      const reviewedComments = await prisma.articleComment.findMany({
        where: {
          reviewed_at: { gte: startDate },
          ai_processed: true
        },
        select: {
          status: true,
          ai_category: true,
          ai_risk_score: true
        }
      });

      if (reviewedComments.length === 0) return 0;

      let correctPredictions = 0;
      
      for (const comment of reviewedComments) {
        const aiPrediction = this.makeDecision({
          accepted: comment.status === 'approved',
          category: comment.ai_category || 'unknown',
          risk_score: comment.ai_risk_score || 0,
          confidence: 0.5,
          reasons: []
        });

        if (aiPrediction.status === comment.status) {
          correctPredictions++;
        }
      }

      return (correctPredictions / reviewedComments.length) * 100;
    } catch (error) {
      console.error('Error calculating accuracy rate:', error);
      return 0;
    }
  }

  /**
   * تدريب النموذج بناءً على القرارات البشرية
   */
  async trainFromHumanFeedback(commentId: string, humanDecision: string, adminId: string): Promise<void> {
    try {
      const comment = await prisma.articleComment.findUnique({
        where: { id: commentId },
        select: {
          content: true,
          ai_category: true,
          ai_risk_score: true,
          ai_confidence: true,
          status: true
        }
      });

      if (!comment) return;

      // تسجيل بيانات التدريب
      await prisma.moderationTrainingData.create({
        data: {
          content: comment.content,
          human_decision: humanDecision,
          ai_prediction: comment.status,
          ai_confidence: comment.ai_confidence,
          ai_category: comment.ai_category,
          feedback_type: humanDecision === comment.status ? 'confirmation' : 'correction',
          admin_id: adminId
        }
      });

      // إرسال البيانات لتدريب النموذج (إذا كان متاحاً)
      await this.sendTrainingData({
        text: comment.content,
        correct_label: humanDecision,
        ai_prediction: comment.status,
        feedback_type: humanDecision === comment.status ? 'confirmation' : 'correction'
      });

    } catch (error) {
      console.error('Error training from human feedback:', error);
    }
  }

  /**
   * إرسال بيانات التدريب لتحسين النموذج
   */
  private async sendTrainingData(data: {
    text: string;
    correct_label: string;
    ai_prediction: string;
    feedback_type: string;
  }): Promise<void> {
    try {
      const trainingApiUrl = process.env.AI_TRAINING_URL;
      if (!trainingApiUrl) return;

      await fetch(trainingApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY || ''}`
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error sending training data:', error);
    }
  }
}

// إنشاء مثيل افتراضي للخدمة
export const aiModerationService = new AIModerationService();

// دالة مساعدة لاستخدام الخدمة
export async function moderateCommentAI(params: {
  comment: string;
  user_id: string;
  article_id: string;
  lang?: string;
}): Promise<ModerationResult> {
  return await aiModerationService.moderateComment(params);
}

// إضافة نموذج ModerationLog إلى schema
export const MODERATION_LOG_SCHEMA = `
model ModerationLog {
  id              String   @id @default(uuid())
  content         String
  user_id         String
  article_id      String
  ai_category     String
  ai_risk_score   Float
  ai_confidence   Float
  ai_reasons      Json
  final_decision  String
  decision_reason String
  processed_at    DateTime @default(now())
  
  @@index([processed_at])
  @@index([final_decision])
  @@index([ai_category])
  @@map("moderation_logs")
}
`;

export default AIModerationService; 