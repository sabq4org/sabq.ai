import { PrismaClient } from '@prisma/client';
import { addLoyaltyPoints, checkAchievements } from './loyalty-integration';
import { sendNotificationToUser, sendNotificationToAdmins } from './real-time-notifications';
import { moderateCommentAI } from './ai-moderation';

const prisma = new PrismaClient();

/**
 * تكامل شامل لنظام التعليقات مع النقاط والإشعارات
 */
export class CommentsWorkflowIntegration {
  
  /**
   * معالجة تعليق جديد مع التكامل الكامل
   */
  static async processNewComment(params: {
    article_id: string;
    user_id: string;
    content: string;
    parent_id?: string;
  }) {
    const { article_id, user_id, content, parent_id } = params;

    try {
      // 1. إنشاء التعليق في حالة الانتظار
      const comment = await prisma.articleComment.create({
        data: {
          article_id,
          user_id,
          content: content.trim(),
          parent_id: parent_id || null,
          status: 'pending'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          article: {
            select: {
              id: true,
              title: true,
              author_id: true
            }
          }
        }
      });

      // 2. تطبيق الإشراف الذكي
      const moderationResult = await moderateCommentAI({
        comment: content.trim(),
        user_id,
        article_id,
        lang: 'ar'
      });

      // 3. تحديث التعليق بنتائج الإشراف
      const updatedComment = await prisma.articleComment.update({
        where: { id: comment.id },
        data: {
          status: moderationResult.status,
          ai_category: moderationResult.ai_response.category,
          ai_risk_score: moderationResult.ai_response.risk_score,
          ai_confidence: moderationResult.ai_response.confidence,
          ai_reasons: moderationResult.ai_response.reasons,
          ai_notes: moderationResult.ai_response.notes,
          ai_processed: true,
          ai_processed_at: new Date()
        }
      });

      // 4. معالجة النتائج حسب قرار الإشراف
      if (moderationResult.status === 'approved') {
        await this.handleApprovedComment(comment, updatedComment);
      } else if (moderationResult.status === 'rejected') {
        await this.handleRejectedComment(comment, moderationResult);
      } else if (moderationResult.status === 'needs_review') {
        await this.handleNeedsReviewComment(comment, moderationResult);
      }

      return {
        success: true,
        comment: updatedComment,
        moderation: moderationResult
      };

    } catch (error) {
      console.error('Error processing new comment:', error);
      throw error;
    }
  }

  /**
   * معالجة التعليق المعتمد
   */
  private static async handleApprovedComment(comment: any, updatedComment: any) {
    try {
      // إضافة نقاط الولاء
      await addLoyaltyPoints(comment.user_id, 'comment', {
        article_id: comment.article_id,
        comment_id: comment.id,
        points: 10 // نقاط أساسية للتعليق
      });

      // نقاط إضافية للتعليق الأول على المقال
      const firstComment = await prisma.articleComment.count({
        where: {
          article_id: comment.article_id,
          status: 'approved',
          user_id: comment.user_id
        }
      });

      if (firstComment === 1) {
        await addLoyaltyPoints(comment.user_id, 'first_comment', {
          article_id: comment.article_id,
          comment_id: comment.id,
          points: 20
        });
      }

      // نقاط إضافية للرد (تفاعل أكثر)
      if (comment.parent_id) {
        await addLoyaltyPoints(comment.user_id, 'reply', {
          article_id: comment.article_id,
          comment_id: comment.id,
          parent_id: comment.parent_id,
          points: 5
        });

        // إشعار صاحب التعليق الأصلي
        const parentComment = await prisma.articleComment.findUnique({
          where: { id: comment.parent_id },
          include: { user: true }
        });

        if (parentComment && parentComment.user_id !== comment.user_id) {
          await sendNotificationToUser(parentComment.user_id, {
            type: 'comment_reply',
            title: 'رد جديد على تعليقك',
            message: `رد ${comment.user.name} على تعليقك`,
            link: `/articles/${comment.article_id}#comment-${comment.id}`,
            data: {
              comment_id: comment.id,
              parent_id: comment.parent_id,
              article_id: comment.article_id,
              user_id: comment.user_id
            }
          });
        }
      }

      // إشعار كاتب المقال (إذا لم يكن هو المعلق)
      if (comment.article.author_id !== comment.user_id) {
        await sendNotificationToUser(comment.article.author_id, {
          type: 'comment_added',
          title: 'تعليق جديد على مقالك',
          message: `علق ${comment.user.name} على مقالك: ${comment.article.title}`,
          link: `/articles/${comment.article_id}#comment-${comment.id}`,
          data: {
            comment_id: comment.id,
            article_id: comment.article_id,
            user_id: comment.user_id
          }
        });

        // نقاط للكاتب عند تلقي تعليق
        await addLoyaltyPoints(comment.article.author_id, 'received_comment', {
          article_id: comment.article_id,
          comment_id: comment.id,
          commenter_id: comment.user_id,
          points: 5
        });
      }

      // تحديث إحصائيات المقال
      await prisma.article.update({
        where: { id: comment.article_id },
        data: {
          comment_count: { increment: 1 },
          last_activity_at: new Date()
        }
      });

      // تحديث عدد الردود في التعليق الأصلي
      if (comment.parent_id) {
        await prisma.articleComment.update({
          where: { id: comment.parent_id },
          data: {
            reply_count: { increment: 1 }
          }
        });
      }

      // فحص الإنجازات
      await checkAchievements(comment.user_id);

      // إحصائيات التفاعل
      await this.updateUserEngagementStats(comment.user_id, 'comment');

    } catch (error) {
      console.error('Error handling approved comment:', error);
    }
  }

  /**
   * معالجة التعليق المرفوض
   */
  private static async handleRejectedComment(comment: any, moderationResult: any) {
    try {
      // إشعار المستخدم برفض التعليق
      await sendNotificationToUser(comment.user_id, {
        type: 'comment_rejected',
        title: 'تم رفض تعليقك',
        message: `تم رفض تعليقك على مقال "${comment.article.title}" بسبب: ${moderationResult.reasons.join(', ')}`,
        link: `/articles/${comment.article_id}`,
        data: {
          comment_id: comment.id,
          article_id: comment.article_id,
          reasons: moderationResult.reasons,
          can_appeal: true
        }
      });

      // تسجيل إحصائيات الرفض
      await this.updateUserModerationStats(comment.user_id, 'rejected');

      // إنذار للمستخدم إذا كان لديه تعليقات مرفوضة كثيرة
      const rejectedCount = await prisma.articleComment.count({
        where: {
          user_id: comment.user_id,
          status: 'rejected',
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // آخر 30 يوم
          }
        }
      });

      if (rejectedCount >= 5) {
        await sendNotificationToUser(comment.user_id, {
          type: 'moderation_warning',
          title: 'تحذير من الإشراف',
          message: 'لديك عدد كبير من التعليقات المرفوضة. يرجى مراجعة قواعد المجتمع.',
          link: '/community-guidelines',
          data: {
            rejected_count: rejectedCount,
            period: '30 days'
          }
        });
      }

    } catch (error) {
      console.error('Error handling rejected comment:', error);
    }
  }

  /**
   * معالجة التعليق الذي يحتاج مراجعة
   */
  private static async handleNeedsReviewComment(comment: any, moderationResult: any) {
    try {
      // إشعار المشرفين
      await sendNotificationToAdmins({
        type: 'comment_needs_review',
        title: 'تعليق يحتاج مراجعة',
        message: `تعليق من ${comment.user.name} يحتاج مراجعة بشرية`,
        link: `/admin/moderation/comments/${comment.id}`,
        data: {
          comment_id: comment.id,
          user_id: comment.user_id,
          article_id: comment.article_id,
          ai_category: moderationResult.ai_response.category,
          risk_score: moderationResult.ai_response.risk_score,
          reasons: moderationResult.reasons
        }
      });

      // إشعار المستخدم بأن تعليقه قيد المراجعة
      await sendNotificationToUser(comment.user_id, {
        type: 'comment_under_review',
        title: 'تعليقك قيد المراجعة',
        message: `تعليقك على مقال "${comment.article.title}" قيد المراجعة من قبل فريق الإشراف`,
        link: `/articles/${comment.article_id}`,
        data: {
          comment_id: comment.id,
          article_id: comment.article_id,
          estimated_review_time: '24 hours'
        }
      });

    } catch (error) {
      console.error('Error handling needs review comment:', error);
    }
  }

  /**
   * معالجة الإعجاب بالتعليق
   */
  static async processCommentLike(params: {
    comment_id: string;
    user_id: string;
    is_like: boolean; // true للإعجاب، false لإلغاء الإعجاب
  }) {
    const { comment_id, user_id, is_like } = params;

    try {
      const comment = await prisma.articleComment.findUnique({
        where: { id: comment_id },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          article: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      if (is_like) {
        // إضافة الإعجاب
        await prisma.commentLike.create({
          data: {
            comment_id,
            user_id
          }
        });

        // تحديث عدد الإعجابات
        await prisma.articleComment.update({
          where: { id: comment_id },
          data: {
            like_count: { increment: 1 }
          }
        });

        // نقاط للمستخدم الذي أعجب
        await addLoyaltyPoints(user_id, 'like_comment', {
          comment_id,
          article_id: comment.article_id,
          points: 2
        });

        // نقاط لصاحب التعليق
        if (comment.user_id !== user_id) {
          await addLoyaltyPoints(comment.user_id, 'comment_liked', {
            comment_id,
            article_id: comment.article_id,
            liked_by: user_id,
            points: 5
          });

          // إشعار صاحب التعليق
          await sendNotificationToUser(comment.user_id, {
            type: 'comment_liked',
            title: 'أعجب أحدهم بتعليقك',
            message: `أعجب أحد المستخدمين بتعليقك على مقال "${comment.article.title}"`,
            link: `/articles/${comment.article_id}#comment-${comment_id}`,
            data: {
              comment_id,
              article_id: comment.article_id,
              liked_by: user_id
            }
          });
        }

      } else {
        // إلغاء الإعجاب
        await prisma.commentLike.deleteMany({
          where: {
            comment_id,
            user_id
          }
        });

        // تحديث عدد الإعجابات
        await prisma.articleComment.update({
          where: { id: comment_id },
          data: {
            like_count: { decrement: 1 }
          }
        });
      }

      // تحديث إحصائيات التفاعل
      await this.updateUserEngagementStats(user_id, 'like');

      return { success: true };

    } catch (error) {
      console.error('Error processing comment like:', error);
      throw error;
    }
  }

  /**
   * معالجة التبليغ عن التعليق
   */
  static async processCommentReport(params: {
    comment_id: string;
    user_id: string;
    reason: string;
    description?: string;
  }) {
    const { comment_id, user_id, reason, description } = params;

    try {
      const comment = await prisma.articleComment.findUnique({
        where: { id: comment_id },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // إنشاء التبليغ
      const report = await prisma.commentReport.create({
        data: {
          comment_id,
          user_id,
          reason,
          description: description || null,
          status: 'pending'
        }
      });

      // تحديث عدد التبليغات
      const updatedComment = await prisma.articleComment.update({
        where: { id: comment_id },
        data: {
          report_count: { increment: 1 },
          user_flagged: true
        }
      });

      // إخفاء التعليق تلقائياً إذا وصل لحد معين من التبليغات
      const REPORT_THRESHOLD = 5;
      if (updatedComment.report_count >= REPORT_THRESHOLD) {
        await prisma.articleComment.update({
          where: { id: comment_id },
          data: {
            status: 'hidden'
          }
        });
      }

      // إشعار المشرفين
      await sendNotificationToAdmins({
        type: 'comment_reported',
        title: 'تبليغ عن تعليق',
        message: `تم التبليغ عن تعليق من ${comment.user.name} بسبب: ${reason}`,
        link: `/admin/moderation/reports/${report.id}`,
        data: {
          comment_id,
          report_id: report.id,
          reporter_id: user_id,
          reason,
          report_count: updatedComment.report_count
        }
      });

      return { success: true, report };

    } catch (error) {
      console.error('Error processing comment report:', error);
      throw error;
    }
  }

  /**
   * تحديث إحصائيات تفاعل المستخدم
   */
  private static async updateUserEngagementStats(user_id: string, action: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      await prisma.userEngagementStats.upsert({
        where: {
          user_id_date: {
            user_id,
            date: startOfDay
          }
        },
        create: {
          user_id,
          date: startOfDay,
          comments_count: action === 'comment' ? 1 : 0,
          likes_given: action === 'like' ? 1 : 0,
          total_actions: 1
        },
        update: {
          comments_count: action === 'comment' ? { increment: 1 } : undefined,
          likes_given: action === 'like' ? { increment: 1 } : undefined,
          total_actions: { increment: 1 }
        }
      });
    } catch (error) {
      console.error('Error updating engagement stats:', error);
    }
  }

  /**
   * تحديث إحصائيات الإشراف للمستخدم
   */
  private static async updateUserModerationStats(user_id: string, action: string) {
    try {
      await prisma.userModerationStats.upsert({
        where: { user_id },
        create: {
          user_id,
          total_comments: 1,
          approved_comments: action === 'approved' ? 1 : 0,
          rejected_comments: action === 'rejected' ? 1 : 0,
          pending_comments: action === 'pending' ? 1 : 0
        },
        update: {
          total_comments: { increment: 1 },
          approved_comments: action === 'approved' ? { increment: 1 } : undefined,
          rejected_comments: action === 'rejected' ? { increment: 1 } : undefined,
          pending_comments: action === 'pending' ? { increment: 1 } : undefined
        }
      });
    } catch (error) {
      console.error('Error updating moderation stats:', error);
    }
  }

  /**
   * معالجة قرار المشرف
   */
  static async processAdminDecision(params: {
    comment_id: string;
    admin_id: string;
    decision: 'approve' | 'reject';
    notes?: string;
  }) {
    const { comment_id, admin_id, decision, notes } = params;

    try {
      const comment = await prisma.articleComment.findUnique({
        where: { id: comment_id },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          article: {
            select: {
              id: true,
              title: true,
              author_id: true
            }
          }
        }
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // تحديث التعليق
      await prisma.articleComment.update({
        where: { id: comment_id },
        data: {
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_by: admin_id,
          reviewed_at: new Date(),
          review_notes: notes || null
        }
      });

      if (decision === 'approve') {
        // معالجة الاعتماد
        await this.handleApprovedComment(comment, comment);
        
        // إشعار المستخدم
        await sendNotificationToUser(comment.user_id, {
          type: 'comment_approved',
          title: 'تم اعتماد تعليقك',
          message: `تم اعتماد تعليقك على مقال "${comment.article.title}"`,
          link: `/articles/${comment.article_id}#comment-${comment_id}`,
          data: {
            comment_id,
            article_id: comment.article_id,
            approved_by: admin_id
          }
        });
      } else {
        // معالجة الرفض
        await sendNotificationToUser(comment.user_id, {
          type: 'comment_rejected_admin',
          title: 'تم رفض تعليقك',
          message: `تم رفض تعليقك على مقال "${comment.article.title}" من قبل المشرف`,
          link: `/articles/${comment.article_id}`,
          data: {
            comment_id,
            article_id: comment.article_id,
            rejected_by: admin_id,
            can_appeal: true
          }
        });
      }

      // تحديث إحصائيات الإشراف
      await this.updateUserModerationStats(comment.user_id, decision === 'approve' ? 'approved' : 'rejected');

      return { success: true };

    } catch (error) {
      console.error('Error processing admin decision:', error);
      throw error;
    }
  }
}

// إضافة نماذج الإحصائيات المطلوبة إلى schema
export const ENGAGEMENT_STATS_SCHEMA = `
model UserEngagementStats {
  id             String   @id @default(uuid())
  user_id        String
  date           DateTime
  comments_count Int      @default(0)
  likes_given    Int      @default(0)
  likes_received Int      @default(0)
  replies_count  Int      @default(0)
  total_actions  Int      @default(0)
  created_at     DateTime @default(now())
  
  user           User     @relation(fields: [user_id], references: [id])
  
  @@unique([user_id, date])
  @@index([date])
  @@map("user_engagement_stats")
}

model UserModerationStats {
  id                String   @id @default(uuid())
  user_id           String   @unique
  total_comments    Int      @default(0)
  approved_comments Int      @default(0)
  rejected_comments Int      @default(0)
  pending_comments  Int      @default(0)
  appeals_count     Int      @default(0)
  warnings_count    Int      @default(0)
  last_warning_at   DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  user              User     @relation(fields: [user_id], references: [id])
  
  @@map("user_moderation_stats")
}
`;

export default CommentsWorkflowIntegration; 