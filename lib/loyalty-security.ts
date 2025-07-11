import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// إعدادات الحماية
const SECURITY_CONFIG = {
  // حدود الإجراءات في الدقيقة
  RATE_LIMITS: {
    comment: 5,
    like: 20,
    share: 10,
    login: 3,
    general: 50
  },
  
  // حدود الإجراءات في الساعة
  HOURLY_LIMITS: {
    comment: 30,
    like: 100,
    share: 50,
    points_earned: 500
  },
  
  // حدود الإجراءات في اليوم
  DAILY_LIMITS: {
    comment: 100,
    like: 500,
    share: 200,
    points_earned: 2000
  },
  
  // حدود الإجراءات في الأسبوع
  WEEKLY_LIMITS: {
    comment: 500,
    like: 2000,
    share: 1000,
    points_earned: 10000
  },
  
  // نقاط الخطر
  RISK_THRESHOLDS: {
    suspicious: 50,
    high_risk: 80,
    blocked: 100
  },
  
  // مدة الحظر (بالدقائق)
  BLOCK_DURATIONS: {
    temporary: 15,
    short: 60,
    medium: 360,
    long: 1440,
    permanent: -1
  }
};

interface SecurityCheck {
  allowed: boolean;
  reason?: string;
  risk_score: number;
  action_required?: 'warning' | 'temporary_block' | 'review' | 'permanent_block';
  remaining_time?: number;
}

interface UserSecurityProfile {
  user_id: string;
  risk_score: number;
  blocked_until?: Date;
  suspicious_activities: number;
  last_activity: Date;
  ip_addresses: string[];
  user_agents: string[];
  activity_patterns: any;
}

/**
 * فئة نظام الحماية من التلاعب
 */
export class LoyaltySecurityManager {
  
  /**
   * فحص شامل للأمان قبل منح النقاط
   */
  static async performSecurityCheck(
    userId: string,
    actionType: string,
    metadata: {
      ip_address?: string;
      user_agent?: string;
      referrer?: string;
      timestamp?: Date;
      target_id?: string;
      target_type?: string;
    }
  ): Promise<SecurityCheck> {
    try {
      let riskScore = 0;
      const checks: string[] = [];

      // 1. فحص حدود المعدل
      const rateLimitCheck = await this.checkRateLimit(userId, actionType);
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          reason: rateLimitCheck.reason,
          risk_score: 100,
          action_required: 'temporary_block',
          remaining_time: rateLimitCheck.remaining_time
        };
      }
      riskScore += rateLimitCheck.risk_score;

      // 2. فحص الأنماط المشبوهة
      const patternCheck = await this.checkSuspiciousPatterns(userId, actionType, metadata);
      riskScore += patternCheck.risk_score;
      if (patternCheck.suspicious) {
        checks.push('suspicious_pattern');
      }

      // 3. فحص IP والجهاز
      const deviceCheck = await this.checkDeviceFingerprint(userId, metadata);
      riskScore += deviceCheck.risk_score;
      if (deviceCheck.suspicious) {
        checks.push('device_anomaly');
      }

      // 4. فحص تاريخ المستخدم
      const historyCheck = await this.checkUserHistory(userId);
      riskScore += historyCheck.risk_score;
      if (historyCheck.suspicious) {
        checks.push('user_history');
      }

      // 5. فحص التوقيت
      const timingCheck = await this.checkTimingPatterns(userId, actionType);
      riskScore += timingCheck.risk_score;
      if (timingCheck.suspicious) {
        checks.push('timing_anomaly');
      }

      // 6. فحص التفاعل مع المحتوى
      const contentCheck = await this.checkContentInteraction(userId, actionType, metadata);
      riskScore += contentCheck.risk_score;
      if (contentCheck.suspicious) {
        checks.push('content_interaction');
      }

      // تحديد الإجراء المطلوب
      let actionRequired: SecurityCheck['action_required'] = undefined;
      let allowed = true;

      if (riskScore >= SECURITY_CONFIG.RISK_THRESHOLDS.blocked) {
        allowed = false;
        actionRequired = 'permanent_block';
      } else if (riskScore >= SECURITY_CONFIG.RISK_THRESHOLDS.high_risk) {
        allowed = false;
        actionRequired = 'review';
      } else if (riskScore >= SECURITY_CONFIG.RISK_THRESHOLDS.suspicious) {
        actionRequired = 'warning';
      }

      // تسجيل الفحص الأمني
      await this.logSecurityCheck(userId, actionType, {
        risk_score: riskScore,
        checks_failed: checks,
        action_required: actionRequired,
        metadata
      });

      return {
        allowed,
        reason: checks.length > 0 ? `فحص أمني: ${checks.join(', ')}` : undefined,
        risk_score: riskScore,
        action_required: actionRequired
      };

    } catch (error) {
      console.error('Security check failed:', error);
      // في حالة فشل الفحص، نسمح بالإجراء لتجنب تعطيل النظام
      return {
        allowed: true,
        risk_score: 0
      };
    }
  }

  /**
   * فحص حدود المعدل
   */
  static async checkRateLimit(userId: string, actionType: string): Promise<{
    allowed: boolean;
    reason?: string;
    risk_score: number;
    remaining_time?: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // فحص الحد في الدقيقة
    const minuteCount = await prisma.loyaltyPoint.count({
      where: {
        user_id: userId,
        action_type: actionType,
        created_at: { gte: oneMinuteAgo }
      }
    });

    const minuteLimit = SECURITY_CONFIG.RATE_LIMITS[actionType] || SECURITY_CONFIG.RATE_LIMITS.general;
    if (minuteCount >= minuteLimit) {
      return {
        allowed: false,
        reason: 'تجاوز الحد المسموح في الدقيقة',
        risk_score: 100,
        remaining_time: 60 - Math.floor((now.getTime() - oneMinuteAgo.getTime()) / 1000)
      };
    }

    // فحص الحد في الساعة
    const hourCount = await prisma.loyaltyPoint.count({
      where: {
        user_id: userId,
        action_type: actionType,
        created_at: { gte: oneHourAgo }
      }
    });

    const hourLimit = SECURITY_CONFIG.HOURLY_LIMITS[actionType] || 0;
    if (hourLimit > 0 && hourCount >= hourLimit) {
      return {
        allowed: false,
        reason: 'تجاوز الحد المسموح في الساعة',
        risk_score: 90,
        remaining_time: 3600 - Math.floor((now.getTime() - oneHourAgo.getTime()) / 1000)
      };
    }

    // فحص الحد في اليوم
    const dayCount = await prisma.loyaltyPoint.count({
      where: {
        user_id: userId,
        action_type: actionType,
        created_at: { gte: oneDayAgo }
      }
    });

    const dayLimit = SECURITY_CONFIG.DAILY_LIMITS[actionType] || 0;
    if (dayLimit > 0 && dayCount >= dayLimit) {
      return {
        allowed: false,
        reason: 'تجاوز الحد المسموح في اليوم',
        risk_score: 80,
        remaining_time: 86400 - Math.floor((now.getTime() - oneDayAgo.getTime()) / 1000)
      };
    }

    // حساب نقاط الخطر بناءً على الاستخدام
    let riskScore = 0;
    if (minuteCount > minuteLimit * 0.8) riskScore += 30;
    if (hourCount > (hourLimit || 100) * 0.8) riskScore += 20;
    if (dayCount > (dayLimit || 1000) * 0.8) riskScore += 15;

    return {
      allowed: true,
      risk_score: riskScore
    };
  }

  /**
   * فحص الأنماط المشبوهة
   */
  static async checkSuspiciousPatterns(
    userId: string,
    actionType: string,
    metadata: any
  ): Promise<{
    suspicious: boolean;
    risk_score: number;
    patterns: string[];
  }> {
    const patterns: string[] = [];
    let riskScore = 0;

    // فحص الأنماط الزمنية
    const recentActions = await prisma.loyaltyPoint.findMany({
      where: {
        user_id: userId,
        created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    // نمط الأنشطة المنتظمة جداً
    if (recentActions.length >= 10) {
      const intervals = recentActions.slice(0, -1).map((action, index) => {
        const nextAction = recentActions[index + 1];
        return action.created_at.getTime() - nextAction.created_at.getTime();
      });

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((acc, interval) => {
        return acc + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;

      if (variance < 1000) { // تباين أقل من ثانية واحدة
        patterns.push('regular_timing');
        riskScore += 40;
      }
    }

    // نمط الأنشطة السريعة جداً
    if (recentActions.length >= 5) {
      const rapidActions = recentActions.filter((action, index) => {
        if (index === 0) return false;
        const prevAction = recentActions[index - 1];
        return action.created_at.getTime() - prevAction.created_at.getTime() < 2000; // أقل من ثانيتين
      });

      if (rapidActions.length >= 3) {
        patterns.push('rapid_fire');
        riskScore += 35;
      }
    }

    // نمط التفاعل مع نفس المحتوى
    if (metadata.target_id) {
      const sameTargetActions = await prisma.loyaltyPoint.count({
        where: {
          user_id: userId,
          reference_id: metadata.target_id,
          created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      if (sameTargetActions > 5) {
        patterns.push('same_target_spam');
        riskScore += 30;
      }
    }

    // نمط الأنشطة خارج الساعات العادية
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 23) {
      const nightActions = await prisma.loyaltyPoint.count({
        where: {
          user_id: userId,
          created_at: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lte: new Date()
          }
        }
      });

      // إذا كان أكثر من 70% من الأنشطة في الليل
      const totalActions = await prisma.loyaltyPoint.count({
        where: {
          user_id: userId,
          created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      if (totalActions > 0 && (nightActions / totalActions) > 0.7) {
        patterns.push('night_activity');
        riskScore += 25;
      }
    }

    return {
      suspicious: patterns.length > 0,
      risk_score: riskScore,
      patterns
    };
  }

  /**
   * فحص بصمة الجهاز
   */
  static async checkDeviceFingerprint(
    userId: string,
    metadata: any
  ): Promise<{
    suspicious: boolean;
    risk_score: number;
  }> {
    let riskScore = 0;

    if (!metadata.ip_address || !metadata.user_agent) {
      return { suspicious: false, risk_score: 0 };
    }

    // فحص IP addresses المتعددة
    const userIPs = await prisma.loyaltyPoint.findMany({
      where: {
        user_id: userId,
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        metadata: { path: ['ip_address'], not: null }
      },
      select: { metadata: true }
    });

    const uniqueIPs = new Set(userIPs.map(action => action.metadata?.ip_address).filter(Boolean));
    
    if (uniqueIPs.size > 5) {
      riskScore += 40;
    } else if (uniqueIPs.size > 3) {
      riskScore += 20;
    }

    // فحص User Agents المتعددة
    const userAgents = await prisma.loyaltyPoint.findMany({
      where: {
        user_id: userId,
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        metadata: { path: ['user_agent'], not: null }
      },
      select: { metadata: true }
    });

    const uniqueAgents = new Set(userAgents.map(action => action.metadata?.user_agent).filter(Boolean));
    
    if (uniqueAgents.size > 3) {
      riskScore += 30;
    } else if (uniqueAgents.size > 2) {
      riskScore += 15;
    }

    // فحص IP المشبوهة (VPN/Proxy)
    const suspiciousIP = await this.checkSuspiciousIP(metadata.ip_address);
    if (suspiciousIP) {
      riskScore += 50;
    }

    return {
      suspicious: riskScore > 20,
      risk_score: riskScore
    };
  }

  /**
   * فحص تاريخ المستخدم
   */
  static async checkUserHistory(userId: string): Promise<{
    suspicious: boolean;
    risk_score: number;
  }> {
    let riskScore = 0;

    // فحص عمر الحساب
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { created_at: true }
    });

    if (user) {
      const accountAge = Date.now() - user.created_at.getTime();
      const daysSinceCreated = accountAge / (24 * 60 * 60 * 1000);

      if (daysSinceCreated < 1) {
        riskScore += 30;
      } else if (daysSinceCreated < 7) {
        riskScore += 15;
      }
    }

    // فحص التبليغات السابقة
    const reports = await prisma.commentReport.count({
      where: {
        comment: { user_id: userId },
        status: 'confirmed'
      }
    });

    riskScore += reports * 10;

    // فحص المحتوى المحذوف
    const deletedContent = await prisma.articleComment.count({
      where: {
        user_id: userId,
        status: 'deleted'
      }
    });

    riskScore += deletedContent * 5;

    return {
      suspicious: riskScore > 25,
      risk_score: Math.min(riskScore, 50)
    };
  }

  /**
   * فحص أنماط التوقيت
   */
  static async checkTimingPatterns(userId: string, actionType: string): Promise<{
    suspicious: boolean;
    risk_score: number;
  }> {
    const recentActions = await prisma.loyaltyPoint.findMany({
      where: {
        user_id: userId,
        action_type: actionType,
        created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    if (recentActions.length < 5) {
      return { suspicious: false, risk_score: 0 };
    }

    let riskScore = 0;

    // فحص الأنشطة المتتالية بسرعة
    let rapidSequence = 0;
    for (let i = 0; i < recentActions.length - 1; i++) {
      const timeDiff = recentActions[i].created_at.getTime() - recentActions[i + 1].created_at.getTime();
      if (timeDiff < 3000) { // أقل من 3 ثوان
        rapidSequence++;
      } else {
        break;
      }
    }

    if (rapidSequence >= 5) {
      riskScore += 40;
    } else if (rapidSequence >= 3) {
      riskScore += 20;
    }

    return {
      suspicious: riskScore > 15,
      risk_score: riskScore
    };
  }

  /**
   * فحص التفاعل مع المحتوى
   */
  static async checkContentInteraction(
    userId: string,
    actionType: string,
    metadata: any
  ): Promise<{
    suspicious: boolean;
    risk_score: number;
  }> {
    let riskScore = 0;

    // فحص التفاعل مع المحتوى الخاص بالمستخدم نفسه
    if (metadata.target_id && metadata.target_type) {
      if (metadata.target_type === 'article') {
        const article = await prisma.article.findUnique({
          where: { id: metadata.target_id },
          select: { author_id: true }
        });

        if (article?.author_id === userId) {
          riskScore += 30; // التفاعل مع المحتوى الخاص
        }
      } else if (metadata.target_type === 'comment') {
        const comment = await prisma.articleComment.findUnique({
          where: { id: metadata.target_id },
          select: { user_id: true }
        });

        if (comment?.user_id === userId) {
          riskScore += 25; // التفاعل مع التعليق الخاص
        }
      }
    }

    // فحص التفاعل مع محتوى جديد جداً
    if (metadata.target_id && metadata.target_type === 'article') {
      const article = await prisma.article.findUnique({
        where: { id: metadata.target_id },
        select: { created_at: true }
      });

      if (article) {
        const articleAge = Date.now() - article.created_at.getTime();
        if (articleAge < 60 * 1000) { // أقل من دقيقة
          riskScore += 20;
        }
      }
    }

    return {
      suspicious: riskScore > 20,
      risk_score: riskScore
    };
  }

  /**
   * فحص IP المشبوهة
   */
  static async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    // قائمة بسيطة من IP ranges المشبوهة
    const suspiciousRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8'
    ];

    // هنا يمكن إضافة فحص أكثر تقدماً مع خدمات external
    // مثل فحص VPN/Proxy/Tor
    
    return false;
  }

  /**
   * تسجيل الفحص الأمني
   */
  static async logSecurityCheck(
    userId: string,
    actionType: string,
    checkResult: {
      risk_score: number;
      checks_failed: string[];
      action_required?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          user_id: userId,
          action_type: actionType,
          risk_score: checkResult.risk_score,
          checks_failed: checkResult.checks_failed,
          action_required: checkResult.action_required,
          metadata: checkResult.metadata || {},
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log security check:', error);
    }
  }

  /**
   * حظر مستخدم مؤقتاً
   */
  static async blockUser(
    userId: string,
    duration: 'temporary' | 'short' | 'medium' | 'long' | 'permanent',
    reason: string
  ): Promise<void> {
    const blockDuration = SECURITY_CONFIG.BLOCK_DURATIONS[duration];
    const blockedUntil = blockDuration === -1 
      ? null 
      : new Date(Date.now() + blockDuration * 60 * 1000);

    await prisma.userSecurityProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        blocked_until: blockedUntil,
        block_reason: reason,
        risk_score: 100
      },
      update: {
        blocked_until: blockedUntil,
        block_reason: reason,
        risk_score: 100
      }
    });

    // إرسال إشعار للمستخدم
    const { sendRealTimeNotification } = await import('./real-time-notifications');
    await sendRealTimeNotification(userId, {
      type: 'security_block',
      category: 'system',
      title: 'تم حظر الحساب',
      message: `تم حظر حسابك مؤقتاً بسبب: ${reason}`,
      icon: '🚫',
      priority: 'urgent',
      data: { duration, reason, blocked_until: blockedUntil }
    });
  }

  /**
   * التحقق من حالة الحظر
   */
  static async checkBlockStatus(userId: string): Promise<{
    blocked: boolean;
    reason?: string;
    blocked_until?: Date;
    remaining_time?: number;
  }> {
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile || !profile.blocked_until) {
      return { blocked: false };
    }

    const now = new Date();
    if (profile.blocked_until > now) {
      return {
        blocked: true,
        reason: profile.block_reason,
        blocked_until: profile.blocked_until,
        remaining_time: Math.floor((profile.blocked_until.getTime() - now.getTime()) / 1000)
      };
    }

    // انتهى الحظر، إزالة الحظر
    await prisma.userSecurityProfile.update({
      where: { user_id: userId },
      data: {
        blocked_until: null,
        block_reason: null
      }
    });

    return { blocked: false };
  }

  /**
   * تحديث نقاط الخطر للمستخدم
   */
  static async updateRiskScore(userId: string, scoreChange: number): Promise<void> {
    await prisma.userSecurityProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        risk_score: Math.max(0, Math.min(100, scoreChange))
      },
      update: {
        risk_score: {
          increment: scoreChange
        }
      }
    });

    // تقليل نقاط الخطر تدريجياً بمرور الوقت
    const profile = await prisma.userSecurityProfile.findUnique({
      where: { user_id: userId }
    });

    if (profile && profile.risk_score > 0) {
      const daysSinceLastUpdate = profile.updated_at 
        ? (Date.now() - profile.updated_at.getTime()) / (24 * 60 * 60 * 1000)
        : 0;

      if (daysSinceLastUpdate >= 1) {
        const reduction = Math.floor(daysSinceLastUpdate) * 2;
        await prisma.userSecurityProfile.update({
          where: { user_id: userId },
          data: {
            risk_score: Math.max(0, profile.risk_score - reduction)
          }
        });
      }
    }
  }

  /**
   * إنشاء تقرير أمني
   */
  static async generateSecurityReport(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
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

    const [
      totalChecks,
      blockedActions,
      suspiciousUsers,
      topRiskUsers,
      securityEvents
    ] = await Promise.all([
      prisma.securityLog.count({
        where: { created_at: { gte: startDate } }
      }),
      prisma.securityLog.count({
        where: {
          created_at: { gte: startDate },
          action_required: { in: ['temporary_block', 'permanent_block'] }
        }
      }),
      prisma.userSecurityProfile.count({
        where: { risk_score: { gte: SECURITY_CONFIG.RISK_THRESHOLDS.suspicious } }
      }),
      prisma.userSecurityProfile.findMany({
        where: { risk_score: { gte: SECURITY_CONFIG.RISK_THRESHOLDS.suspicious } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { risk_score: 'desc' },
        take: 10
      }),
      prisma.securityLog.groupBy({
        by: ['action_type'],
        where: { created_at: { gte: startDate } },
        _count: { id: true },
        _avg: { risk_score: true }
      })
    ]);

    return {
      timeframe,
      period: { start: startDate, end: now },
      summary: {
        total_checks: totalChecks,
        blocked_actions: blockedActions,
        suspicious_users: suspiciousUsers,
        block_rate: totalChecks > 0 ? (blockedActions / totalChecks) * 100 : 0
      },
      top_risk_users: topRiskUsers,
      security_events: securityEvents,
      generated_at: now
    };
  }
}

// إضافة جداول الأمان إلى Prisma Schema
export const SECURITY_SCHEMA_ADDITIONS = `
model UserSecurityProfile {
  id            String   @id @default(uuid())
  user_id       String   @unique
  risk_score    Int      @default(0)
  blocked_until DateTime?
  block_reason  String?
  suspicious_activities Int @default(0)
  last_activity DateTime @default(now())
  ip_addresses  Json     @default("[]")
  user_agents   Json     @default("[]")
  activity_patterns Json @default("{}")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("user_security_profiles")
}

model SecurityLog {
  id              String   @id @default(uuid())
  user_id         String
  action_type     String
  risk_score      Int
  checks_failed   Json     @default("[]")
  action_required String?
  metadata        Json     @default("{}")
  created_at      DateTime @default(now())
  
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id, created_at])
  @@index([action_type])
  @@index([risk_score])
  @@map("security_logs")
}
`;

export default LoyaltySecurityManager; 