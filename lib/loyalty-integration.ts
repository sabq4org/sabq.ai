import { PrismaClient } from '@prisma/client';
import { addLoyaltyPoints, sendRealTimeNotification, updateDailyStreak } from './loyalty-engine';

const prisma = new PrismaClient();

/**
 * معالج الأحداث للتفاعل مع نظام النقاط
 */
export class LoyaltyIntegrationHandler {
  
  /**
   * معالج إضافة تعليق
   */
  static async handleCommentAdded(commentId: string, userId: string, parentId?: string) {
    try {
      // إضافة نقاط التعليق
      const isReply = !!parentId;
      const actionType = isReply ? 'comment_reply' : 'comment';
      
      await addLoyaltyPoints(userId, actionType, undefined, commentId, 'comment');
      
      // تحديث السلسلة اليومية
      await updateDailyStreak(userId);

      // إشعار صاحب التعليق الأصلي في حالة الرد
      if (isReply) {
        const parentComment = await prisma.articleComment.findUnique({
          where: { id: parentId },
          include: { user: true }
        });

        if (parentComment && parentComment.user_id !== userId) {
          const replier = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
          });

          await sendRealTimeNotification(parentComment.user_id, {
            type: 'comment_reply',
            title: 'رد جديد على تعليقك',
            message: `رد ${replier?.name} على تعليقك`,
            icon: '💬',
            priority: 'normal',
            actionUrl: `/articles/${parentComment.article_id}#comment-${commentId}`,
            data: { 
              comment_id: commentId,
              parent_id: parentId,
              replier: replier?.name
            }
          });
        }
      }

      console.log(`Loyalty points added for comment: ${commentId}`);
    } catch (error) {
      console.error('Error handling comment added:', error);
    }
  }

  /**
   * معالج إضافة إعجاب
   */
  static async handleLikeAdded(likeId: string, userId: string, targetType: 'article' | 'comment', targetId: string) {
    try {
      const actionType = targetType === 'article' ? 'like_article' : 'like_comment';
      
      await addLoyaltyPoints(userId, actionType, undefined, likeId, 'like');

      // إشعار صاحب المحتوى
      let targetOwner: any = null;
      let targetTitle = '';

      if (targetType === 'article') {
        targetOwner = await prisma.article.findUnique({
          where: { id: targetId },
          include: { author: true }
        });
        targetTitle = targetOwner?.title || 'المقال';
      } else {
        targetOwner = await prisma.articleComment.findUnique({
          where: { id: targetId },
          include: { user: true }
        });
        targetTitle = 'التعليق';
      }

      if (targetOwner && targetOwner.author_id !== userId && targetOwner.user_id !== userId) {
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        const ownerId = targetOwner.author_id || targetOwner.user_id;
        
        await sendRealTimeNotification(ownerId, {
          type: 'like_received',
          title: 'إعجاب جديد',
          message: `أعجب ${liker?.name} بـ${targetTitle}`,
          icon: '❤️',
          priority: 'low',
          actionUrl: targetType === 'article' ? `/articles/${targetId}` : `/articles/${targetOwner.article_id}#comment-${targetId}`,
          data: { 
            target_type: targetType,
            target_id: targetId,
            liker: liker?.name
          }
        });
      }

      console.log(`Loyalty points added for like: ${likeId}`);
    } catch (error) {
      console.error('Error handling like added:', error);
    }
  }

  /**
   * معالج مشاركة مقال
   */
  static async handleArticleShared(shareId: string, userId: string, articleId: string, platform: string) {
    try {
      await addLoyaltyPoints(userId, 'share_article', undefined, shareId, 'share');

      // إشعار صاحب المقال
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { author: true }
      });

      if (article && article.author_id !== userId) {
        const sharer = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true }
        });

        await sendRealTimeNotification(article.author_id, {
          type: 'article_shared',
          title: 'مشاركة جديدة',
          message: `شارك ${sharer?.name} مقالك على ${platform}`,
          icon: '🔗',
          priority: 'low',
          actionUrl: `/articles/${articleId}`,
          data: { 
            article_id: articleId,
            platform: platform,
            sharer: sharer?.name
          }
        });
      }

      console.log(`Loyalty points added for share: ${shareId}`);
    } catch (error) {
      console.error('Error handling article shared:', error);
    }
  }

  /**
   * معالج نشر مقال
   */
  static async handleArticlePublished(articleId: string, userId: string, isFeatured: boolean = false) {
    try {
      const actionType = isFeatured ? 'article_featured' : 'article_published';
      
      await addLoyaltyPoints(userId, actionType, undefined, articleId, 'article');

      // إشعار المؤلف
      await sendRealTimeNotification(userId, {
        type: 'article_published',
        title: isFeatured ? 'مقال مميز!' : 'تم نشر المقال',
        message: isFeatured ? 'تم اختيار مقالك كمقال مميز' : 'تم نشر مقالك بنجاح',
        icon: isFeatured ? '⭐' : '📝',
        priority: isFeatured ? 'high' : 'normal',
        actionUrl: `/articles/${articleId}`,
        data: { 
          article_id: articleId,
          is_featured: isFeatured
        }
      });

      console.log(`Loyalty points added for article: ${articleId}`);
    } catch (error) {
      console.error('Error handling article published:', error);
    }
  }

  /**
   * معالج تسجيل الدخول اليومي
   */
  static async handleDailyLogin(userId: string) {
    try {
      // التحقق من آخر تسجيل دخول
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastLogin = await prisma.loyaltyPoint.findFirst({
        where: {
          user_id: userId,
          action_type: 'daily_login',
          created_at: { gte: today }
        }
      });

      // إذا لم يسجل دخول اليوم
      if (!lastLogin) {
        await addLoyaltyPoints(userId, 'daily_login', undefined, null, 'login');
        await updateDailyStreak(userId);

        // التحقق من إنجازات السلسلة
        const userStats = await prisma.userLoyaltyStats.findUnique({
          where: { user_id: userId }
        });

        if (userStats) {
          const streak = userStats.current_streak;
          
          // إشعارات السلاسل المميزة
          if ([7, 14, 30, 100].includes(streak)) {
            await sendRealTimeNotification(userId, {
              type: 'streak_milestone',
              title: 'إنجاز السلسلة!',
              message: `تهانينا! وصلت إلى ${streak} يوم متتالي`,
              icon: '🔥',
              priority: 'high',
              data: { streak_count: streak }
            });
          }
        }
      }

      console.log(`Daily login processed for user: ${userId}`);
    } catch (error) {
      console.error('Error handling daily login:', error);
    }
  }

  /**
   * معالج حفظ مقال
   */
  static async handleArticleBookmarked(bookmarkId: string, userId: string, articleId: string) {
    try {
      await addLoyaltyPoints(userId, 'bookmark_article', undefined, bookmarkId, 'bookmark');

      console.log(`Loyalty points added for bookmark: ${bookmarkId}`);
    } catch (error) {
      console.error('Error handling article bookmarked:', error);
    }
  }

  /**
   * معالج تبليغ محتوى مسيء
   */
  static async handleContentReported(reportId: string, userId: string, targetType: string, targetId: string) {
    try {
      // لا نعطي نقاط للتبليغ لمنع التلاعب
      // لكن نرسل إشعار للإدارة
      
      const reporter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      // إشعار الإدارة
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      });

      for (const admin of admins) {
        await sendRealTimeNotification(admin.id, {
          type: 'content_reported',
          title: 'تبليغ جديد',
          message: `تم تبليغ ${targetType} من قبل ${reporter?.name}`,
          icon: '🚨',
          priority: 'high',
          actionUrl: `/admin/reports/${reportId}`,
          data: { 
            report_id: reportId,
            target_type: targetType,
            target_id: targetId,
            reporter: reporter?.name
          }
        });
      }

      console.log(`Content reported: ${reportId}`);
    } catch (error) {
      console.error('Error handling content reported:', error);
    }
  }

  /**
   * معالج إزالة محتوى مسيء
   */
  static async handleContentRemoved(userId: string, reason: string) {
    try {
      // خصم نقاط للمحتوى المسيء
      await addLoyaltyPoints(userId, 'content_removed', -20, null, 'penalty', { reason });

      // إشعار المستخدم
      await sendRealTimeNotification(userId, {
        type: 'content_removed',
        title: 'تم إزالة المحتوى',
        message: `تم إزالة محتواك بسبب: ${reason}`,
        icon: '⚠️',
        priority: 'high',
        data: { reason }
      });

      console.log(`Content removed penalty applied for user: ${userId}`);
    } catch (error) {
      console.error('Error handling content removed:', error);
    }
  }

  /**
   * معالج قراءة مقال
   */
  static async handleArticleRead(userId: string, articleId: string, readTime: number) {
    try {
      // إضافة نقاط القراءة (مرة واحدة لكل مقال)
      const existingRead = await prisma.loyaltyPoint.findFirst({
        where: {
          user_id: userId,
          action_type: 'article_read',
          reference_id: articleId
        }
      });

      if (!existingRead && readTime > 30) { // قراءة لأكثر من 30 ثانية
        await addLoyaltyPoints(userId, 'daily_read', undefined, articleId, 'read');
      }

      console.log(`Article read processed: ${articleId}`);
    } catch (error) {
      console.error('Error handling article read:', error);
    }
  }

  /**
   * معالج إكمال الملف الشخصي
   */
  static async handleProfileCompleted(userId: string) {
    try {
      // التحقق من عدم وجود نقاط سابقة لإكمال الملف
      const existingPoints = await prisma.loyaltyPoint.findFirst({
        where: {
          user_id: userId,
          action_type: 'profile_complete'
        }
      });

      if (!existingPoints) {
        await addLoyaltyPoints(userId, 'profile_complete', undefined, null, 'profile');

        await sendRealTimeNotification(userId, {
          type: 'profile_completed',
          title: 'ملف شخصي مكتمل',
          message: 'تهانينا! أكملت ملفك الشخصي',
          icon: '✅',
          priority: 'normal',
          data: {}
        });
      }

      console.log(`Profile completion processed for user: ${userId}`);
    } catch (error) {
      console.error('Error handling profile completed:', error);
    }
  }

  /**
   * معالج أول تعليق
   */
  static async handleFirstComment(userId: string, commentId: string) {
    try {
      // التحقق من كونه أول تعليق
      const commentCount = await prisma.articleComment.count({
        where: { user_id: userId }
      });

      if (commentCount === 1) {
        await addLoyaltyPoints(userId, 'first_comment', undefined, commentId, 'milestone');

        await sendRealTimeNotification(userId, {
          type: 'first_comment',
          title: 'أول تعليق!',
          message: 'تهانينا! أضفت أول تعليق لك',
          icon: '🎉',
          priority: 'normal',
          data: { comment_id: commentId }
        });
      }

      console.log(`First comment processed for user: ${userId}`);
    } catch (error) {
      console.error('Error handling first comment:', error);
    }
  }

  /**
   * معالج أول مقال
   */
  static async handleFirstArticle(userId: string, articleId: string) {
    try {
      // التحقق من كونه أول مقال
      const articleCount = await prisma.article.count({
        where: { author_id: userId, status: 'published' }
      });

      if (articleCount === 1) {
        await addLoyaltyPoints(userId, 'first_article', undefined, articleId, 'milestone');

        await sendRealTimeNotification(userId, {
          type: 'first_article',
          title: 'أول مقال!',
          message: 'تهانينا! نشرت أول مقال لك',
          icon: '🎊',
          priority: 'high',
          data: { article_id: articleId }
        });
      }

      console.log(`First article processed for user: ${userId}`);
    } catch (error) {
      console.error('Error handling first article:', error);
    }
  }

  /**
   * معالج إشعارات الإنجازات الخاصة
   */
  static async handleSpecialAchievements(userId: string) {
    try {
      const userStats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: userId }
      });

      if (!userStats) return;

      // إنجازات النقاط
      const pointMilestones = [100, 500, 1000, 5000, 10000];
      for (const milestone of pointMilestones) {
        if (userStats.lifetime_points >= milestone) {
          const existing = await prisma.loyaltyPoint.findFirst({
            where: {
              user_id: userId,
              action_type: 'point_milestone',
              metadata: { path: ['milestone'], equals: milestone }
            }
          });

          if (!existing) {
            await addLoyaltyPoints(userId, 'point_milestone', milestone / 10, null, 'milestone', { milestone });
            
            await sendRealTimeNotification(userId, {
              type: 'point_milestone',
              title: 'إنجاز النقاط!',
              message: `تهانينا! وصلت إلى ${milestone} نقطة`,
              icon: '🏆',
              priority: 'high',
              data: { milestone }
            });
          }
        }
      }

      console.log(`Special achievements processed for user: ${userId}`);
    } catch (error) {
      console.error('Error handling special achievements:', error);
    }
  }
}

/**
 * دوال مساعدة للتكامل
 */
export const LoyaltyIntegration = {
  
  /**
   * تسجيل حدث التفاعل
   */
  async logInteractionEvent(
    userId: string,
    eventType: string,
    targetId?: string,
    targetType?: string,
    metadata?: any
  ) {
    try {
      const handler = LoyaltyIntegrationHandler;
      
      switch (eventType) {
        case 'comment_added':
          await handler.handleCommentAdded(targetId!, userId, metadata?.parentId);
          if (metadata?.isFirst) {
            await handler.handleFirstComment(userId, targetId!);
          }
          break;
          
        case 'like_added':
          await handler.handleLikeAdded(targetId!, userId, targetType as 'article' | 'comment', metadata?.targetId);
          break;
          
        case 'article_shared':
          await handler.handleArticleShared(targetId!, userId, metadata?.articleId, metadata?.platform);
          break;
          
        case 'article_published':
          await handler.handleArticlePublished(targetId!, userId, metadata?.isFeatured);
          if (metadata?.isFirst) {
            await handler.handleFirstArticle(userId, targetId!);
          }
          break;
          
        case 'daily_login':
          await handler.handleDailyLogin(userId);
          break;
          
        case 'article_bookmarked':
          await handler.handleArticleBookmarked(targetId!, userId, metadata?.articleId);
          break;
          
        case 'content_reported':
          await handler.handleContentReported(targetId!, userId, targetType!, metadata?.targetId);
          break;
          
        case 'content_removed':
          await handler.handleContentRemoved(userId, metadata?.reason);
          break;
          
        case 'article_read':
          await handler.handleArticleRead(userId, targetId!, metadata?.readTime);
          break;
          
        case 'profile_completed':
          await handler.handleProfileCompleted(userId);
          break;
          
        default:
          console.warn(`Unknown interaction event: ${eventType}`);
      }
      
      // معالجة الإنجازات الخاصة
      await handler.handleSpecialAchievements(userId);
      
    } catch (error) {
      console.error('Error logging interaction event:', error);
    }
  },

  /**
   * الحصول على ملخص نقاط المستخدم
   */
  async getUserLoyaltySummary(userId: string) {
    try {
      const stats = await prisma.userLoyaltyStats.findUnique({
        where: { user_id: userId }
      });

      const recentBadges = await prisma.userBadge.findMany({
        where: { user_id: userId },
        include: { badge: true },
        orderBy: { awarded_at: 'desc' },
        take: 3
      });

      const unreadNotifications = await prisma.realTimeNotification.count({
        where: { user_id: userId, read: false }
      });

      return {
        stats,
        recentBadges: recentBadges.map(ub => ub.badge),
        unreadNotifications
      };
    } catch (error) {
      console.error('Error getting user loyalty summary:', error);
      return null;
    }
  }
}; 