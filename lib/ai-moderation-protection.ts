import { PrismaClient } from '@prisma/client';
import { aiModerationService } from './ai-moderation';

const prisma = new PrismaClient();

/**
 * نظام الحماية من الأخطاء الإيجابية والسلبية في الإشراف الذكي
 */
export class AIModerationProtection {
  
  /**
   * تحليل دقة النموذج وتحديد نقاط الضعف
   */
  static async analyzeModelAccuracy(timeframe: number = 30): Promise<{
    overall_accuracy: number;
    false_positive_rate: number;
    false_negative_rate: number;
    category_accuracy: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
      
      // جلب التعليقات التي تم مراجعتها بشرياً
      const reviewedComments = await prisma.articleComment.findMany({
        where: {
          reviewed_at: { gte: startDate },
          ai_processed: true,
          reviewed_by: { not: null }
        },
        select: {
          id: true,
          status: true,
          ai_category: true,
          ai_risk_score: true,
          ai_confidence: true,
          reviewed_by: true
        }
      });

      if (reviewedComments.length === 0) {
        return {
          overall_accuracy: 0,
          false_positive_rate: 0,
          false_negative_rate: 0,
          category_accuracy: {},
          recommendations: ['لا توجد بيانات كافية للتحليل']
        };
      }

      let correctPredictions = 0;
      let falsePositives = 0; // AI رفض ولكن المشرف اعتمد
      let falseNegatives = 0; // AI اعتمد ولكن المشرف رفض
      const categoryStats: Record<string, { correct: number; total: number }> = {};

      for (const comment of reviewedComments) {
        // تحديد توقع الذكاء الاصطناعي الأصلي
        const aiPrediction = this.getAIPrediction(comment.ai_risk_score, comment.ai_category);
        const humanDecision = comment.status;

        // تحديث إحصائيات الفئة
        if (!categoryStats[comment.ai_category]) {
          categoryStats[comment.ai_category] = { correct: 0, total: 0 };
        }
        categoryStats[comment.ai_category].total++;

        // مقارنة التوقعات
        if (aiPrediction === humanDecision) {
          correctPredictions++;
          categoryStats[comment.ai_category].correct++;
        } else {
          if (aiPrediction === 'rejected' && humanDecision === 'approved') {
            falsePositives++;
          } else if (aiPrediction === 'approved' && humanDecision === 'rejected') {
            falseNegatives++;
          }
        }
      }

      // حساب المعدلات
      const totalComments = reviewedComments.length;
      const overall_accuracy = (correctPredictions / totalComments) * 100;
      const false_positive_rate = (falsePositives / totalComments) * 100;
      const false_negative_rate = (falseNegatives / totalComments) * 100;

      // حساب دقة كل فئة
      const category_accuracy: Record<string, number> = {};
      for (const [category, stats] of Object.entries(categoryStats)) {
        category_accuracy[category] = (stats.correct / stats.total) * 100;
      }

      // توصيات التحسين
      const recommendations = this.generateRecommendations({
        overall_accuracy,
        false_positive_rate,
        false_negative_rate,
        category_accuracy,
        totalComments
      });

      return {
        overall_accuracy,
        false_positive_rate,
        false_negative_rate,
        category_accuracy,
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing model accuracy:', error);
      throw error;
    }
  }

  /**
   * تحديد توقع الذكاء الاصطناعي الأصلي
   */
  private static getAIPrediction(risk_score: number, category: string): string {
    // استخدام نفس منطق اتخاذ القرار في الخدمة الأصلية
    const blockedCategories = ['spam', 'hate', 'bullying', 'nsfw', 'toxic'];
    
    if (blockedCategories.includes(category)) {
      return 'rejected';
    }
    
    if (risk_score < 0.3) {
      return 'approved';
    } else if (risk_score > 0.7) {
      return 'rejected';
    } else {
      return 'needs_review';
    }
  }

  /**
   * توليد توصيات التحسين
   */
  private static generateRecommendations(stats: {
    overall_accuracy: number;
    false_positive_rate: number;
    false_negative_rate: number;
    category_accuracy: Record<string, number>;
    totalComments: number;
  }): string[] {
    const recommendations: string[] = [];

    // دقة عامة منخفضة
    if (stats.overall_accuracy < 80) {
      recommendations.push('الدقة العامة منخفضة - يُنصح بإعادة تدريب النموذج');
    }

    // معدل الأخطاء الإيجابية عالي
    if (stats.false_positive_rate > 15) {
      recommendations.push('معدل الأخطاء الإيجابية عالي - قم بتقليل حساسية النموذج');
      recommendations.push('راجع عتبة نقاط الخطر للرفض التلقائي');
    }

    // معدل الأخطاء السلبية عالي
    if (stats.false_negative_rate > 10) {
      recommendations.push('معدل الأخطاء السلبية عالي - قم بزيادة حساسية النموذج');
      recommendations.push('راجع عتبة نقاط الخطر للاعتماد التلقائي');
    }

    // فئات ضعيفة الأداء
    for (const [category, accuracy] of Object.entries(stats.category_accuracy)) {
      if (accuracy < 70) {
        recommendations.push(`فئة "${category}" تحتاج تحسين - دقة ${accuracy.toFixed(1)}%`);
      }
    }

    // بيانات غير كافية
    if (stats.totalComments < 50) {
      recommendations.push('البيانات غير كافية للتحليل الدقيق - انتظر المزيد من المراجعات');
    }

    return recommendations;
  }

  /**
   * تحسين عتبات اتخاذ القرار تلقائياً
   */
  static async optimizeThresholds(): Promise<{
    recommended_approve_threshold: number;
    recommended_reject_threshold: number;
    current_performance: any;
    projected_improvement: string;
  }> {
    try {
      // تحليل الأداء الحالي
      const currentPerformance = await this.analyzeModelAccuracy(30);
      
      // جلب بيانات التدريب
      const trainingData = await prisma.moderationTrainingData.findMany({
        where: {
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        select: {
          human_decision: true,
          ai_confidence: true,
          ai_prediction: true
        }
      });

      if (trainingData.length < 20) {
        return {
          recommended_approve_threshold: 0.3,
          recommended_reject_threshold: 0.7,
          current_performance: currentPerformance,
          projected_improvement: 'بيانات غير كافية للتحسين'
        };
      }

      // تحليل النقاط المثلى
      const thresholds = this.findOptimalThresholds(trainingData);
      
      return {
        recommended_approve_threshold: thresholds.approve,
        recommended_reject_threshold: thresholds.reject,
        current_performance: currentPerformance,
        projected_improvement: thresholds.improvement
      };

    } catch (error) {
      console.error('Error optimizing thresholds:', error);
      throw error;
    }
  }

  /**
   * العثور على العتبات المثلى
   */
  private static findOptimalThresholds(trainingData: any[]): {
    approve: number;
    reject: number;
    improvement: string;
  } {
    let bestAccuracy = 0;
    let bestApproveThreshold = 0.3;
    let bestRejectThreshold = 0.7;

    // اختبار عتبات مختلفة
    for (let approveThreshold = 0.1; approveThreshold <= 0.5; approveThreshold += 0.05) {
      for (let rejectThreshold = 0.5; rejectThreshold <= 0.9; rejectThreshold += 0.05) {
        if (rejectThreshold <= approveThreshold) continue;

        let correct = 0;
        for (const data of trainingData) {
          const predictedDecision = this.simulateDecision(data.ai_confidence, approveThreshold, rejectThreshold);
          if (predictedDecision === data.human_decision) {
            correct++;
          }
        }

        const accuracy = correct / trainingData.length;
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestApproveThreshold = approveThreshold;
          bestRejectThreshold = rejectThreshold;
        }
      }
    }

    const currentAccuracy = 0.8; // تقدير الدقة الحالية
    const improvement = ((bestAccuracy - currentAccuracy) * 100).toFixed(1);

    return {
      approve: bestApproveThreshold,
      reject: bestRejectThreshold,
      improvement: `تحسين متوقع: ${improvement}%`
    };
  }

  /**
   * محاكاة قرار مع عتبات جديدة
   */
  private static simulateDecision(confidence: number, approveThreshold: number, rejectThreshold: number): string {
    if (confidence < approveThreshold) {
      return 'approved';
    } else if (confidence > rejectThreshold) {
      return 'rejected';
    } else {
      return 'needs_review';
    }
  }

  /**
   * نظام الإنذار المبكر للمشاكل
   */
  static async checkForAnomalies(): Promise<{
    anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
    overall_health: 'good' | 'warning' | 'critical';
  }> {
    try {
      const anomalies: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        recommendation: string;
      }> = [];

      // فحص معدل الرفض المفاجئ
      const recentRejectRate = await this.getRecentRejectRate();
      const historicalRejectRate = await this.getHistoricalRejectRate();
      
      if (recentRejectRate > historicalRejectRate * 1.5) {
        anomalies.push({
          type: 'high_reject_rate',
          severity: 'high',
          description: `معدل الرفض ارتفع إلى ${recentRejectRate.toFixed(1)}% مقارنة بالمعدل التاريخي ${historicalRejectRate.toFixed(1)}%`,
          recommendation: 'فحص إعدادات النموذج والتحقق من تغييرات في نوعية التعليقات'
        });
      }

      // فحص معدل المراجعة البشرية
      const humanReviewRate = await this.getHumanReviewRate();
      if (humanReviewRate > 30) {
        anomalies.push({
          type: 'high_human_review',
          severity: 'medium',
          description: `معدل المراجعة البشرية عالي: ${humanReviewRate.toFixed(1)}%`,
          recommendation: 'تحسين دقة النموذج لتقليل الحاجة للمراجعة البشرية'
        });
      }

      // فحص انخفاض الثقة
      const avgConfidence = await this.getAverageConfidence();
      if (avgConfidence < 0.7) {
        anomalies.push({
          type: 'low_confidence',
          severity: 'medium',
          description: `متوسط ثقة النموذج منخفض: ${avgConfidence.toFixed(2)}`,
          recommendation: 'إعادة تدريب النموذج بمزيد من البيانات'
        });
      }

      // فحص أخطاء النموذج
      const errorRate = await this.getModelErrorRate();
      if (errorRate > 5) {
        anomalies.push({
          type: 'model_errors',
          severity: 'high',
          description: `معدل أخطاء النموذج عالي: ${errorRate.toFixed(1)}%`,
          recommendation: 'فحص اتصال API والتحقق من حالة الخدمة'
        });
      }

      // تحديد الحالة العامة
      let overall_health: 'good' | 'warning' | 'critical' = 'good';
      
      const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
      const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
      
      if (highSeverityCount > 0) {
        overall_health = 'critical';
      } else if (mediumSeverityCount > 1) {
        overall_health = 'warning';
      }

      return { anomalies, overall_health };

    } catch (error) {
      console.error('Error checking for anomalies:', error);
      return {
        anomalies: [{
          type: 'system_error',
          severity: 'high',
          description: 'خطأ في نظام المراقبة',
          recommendation: 'فحص النظام وإعادة المحاولة'
        }],
        overall_health: 'critical'
      };
    }
  }

  /**
   * حساب معدل الرفض الحديث
   */
  private static async getRecentRejectRate(): Promise<number> {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [total, rejected] = await Promise.all([
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate },
          ai_processed: true
        }
      }),
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate },
          status: 'rejected'
        }
      })
    ]);

    return total > 0 ? (rejected / total) * 100 : 0;
  }

  /**
   * حساب معدل الرفض التاريخي
   */
  private static async getHistoricalRejectRate(): Promise<number> {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [total, rejected] = await Promise.all([
      prisma.articleComment.count({
        where: {
          created_at: { gte: startDate, lte: endDate },
          ai_processed: true
        }
      }),
      prisma.articleComment.count({
        where: {
          created_at: { gte: startDate, lte: endDate },
          status: 'rejected'
        }
      })
    ]);

    return total > 0 ? (rejected / total) * 100 : 0;
  }

  /**
   * حساب معدل المراجعة البشرية
   */
  private static async getHumanReviewRate(): Promise<number> {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [total, needsReview] = await Promise.all([
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate },
          ai_processed: true
        }
      }),
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate },
          status: 'needs_review'
        }
      })
    ]);

    return total > 0 ? (needsReview / total) * 100 : 0;
  }

  /**
   * حساب متوسط الثقة
   */
  private static async getAverageConfidence(): Promise<number> {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await prisma.articleComment.aggregate({
      where: {
        created_at: { gte: recentDate },
        ai_processed: true,
        ai_confidence: { not: null }
      },
      _avg: {
        ai_confidence: true
      }
    });

    return result._avg.ai_confidence || 0;
  }

  /**
   * حساب معدل أخطاء النموذج
   */
  private static async getModelErrorRate(): Promise<number> {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [total, errors] = await Promise.all([
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate }
        }
      }),
      prisma.articleComment.count({
        where: {
          created_at: { gte: recentDate },
          ai_processed: false,
          status: 'needs_review'
        }
      })
    ]);

    return total > 0 ? (errors / total) * 100 : 0;
  }

  /**
   * تطبيق التحسينات المقترحة
   */
  static async applyRecommendations(recommendations: {
    approve_threshold?: number;
    reject_threshold?: number;
    categories_to_block?: string[];
    keywords_blacklist?: string[];
  }): Promise<{ success: boolean; message: string }> {
    try {
      await aiModerationService.updateConfig({
        ai_threshold_approve: recommendations.approve_threshold,
        ai_threshold_reject: recommendations.reject_threshold,
        categories_to_block: recommendations.categories_to_block,
        keywords_blacklist: recommendations.keywords_blacklist
      });

      return {
        success: true,
        message: 'تم تطبيق التحسينات بنجاح'
      };

    } catch (error) {
      console.error('Error applying recommendations:', error);
      return {
        success: false,
        message: 'فشل في تطبيق التحسينات'
      };
    }
  }

  /**
   * تقرير شامل عن حالة النظام
   */
  static async generateHealthReport(): Promise<{
    accuracy_analysis: any;
    anomalies: any;
    optimization_suggestions: any;
    system_health: 'good' | 'warning' | 'critical';
    last_updated: string;
  }> {
    try {
      const [accuracyAnalysis, anomalies, optimizationSuggestions] = await Promise.all([
        this.analyzeModelAccuracy(30),
        this.checkForAnomalies(),
        this.optimizeThresholds()
      ]);

      // تحديد الحالة العامة للنظام
      let systemHealth: 'good' | 'warning' | 'critical' = 'good';
      
      if (anomalies.overall_health === 'critical' || accuracyAnalysis.overall_accuracy < 70) {
        systemHealth = 'critical';
      } else if (anomalies.overall_health === 'warning' || accuracyAnalysis.overall_accuracy < 85) {
        systemHealth = 'warning';
      }

      return {
        accuracy_analysis: accuracyAnalysis,
        anomalies,
        optimization_suggestions: optimizationSuggestions,
        system_health: systemHealth,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating health report:', error);
      throw error;
    }
  }
}

export default AIModerationProtection; 