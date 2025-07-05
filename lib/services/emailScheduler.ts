import * as cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { emailService } from './emailService';

export class EmailScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private initialized = false;
  
  constructor() {
    // لا نبدأ المجدول تلقائياً
  }

  // بدء المجدول يدوياً عند الحاجة
  async start() {
    if (this.initialized) return;
    this.initialized = true;
    await this.init();
  }

  private async init() {
    console.log('🚀 Starting email scheduler...');
    
    // جدولة فحص المهام كل دقيقة
    cron.schedule('* * * * *', async () => {
      await this.processScheduledJobs();
    });

    // جدولة تنظيف السجلات القديمة كل يوم
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldLogs();
    });
  }

  // معالجة المهام المجدولة
  private async processScheduledJobs() {
    try {
      // جلب المهام المستحقة
      const dueJobs = await prisma.emailJob.findMany({
        where: {
          status: 'queued',
          scheduledAt: {
            lte: new Date()
          }
        },
        include: {
          template: true
        }
      });

      for (const job of dueJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Error processing scheduled jobs:', error);
    }
  }

  // معالجة مهمة واحدة
  private async processJob(job: any) {
    try {
      // تحديث حالة المهمة
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { 
          status: 'sending',
          startedAt: new Date()
        }
      });

      // جلب المشتركين المستهدفين
      const targetFilter = job.targetFilter || {};
      const subscribers = await prisma.subscriber.findMany({
        where: {
          status: 'active',
          ...targetFilter
        }
      });

      console.log(`📧 Processing job ${job.id}: ${subscribers.length} recipients`);

      // إرسال البريد لكل مشترك
      let sentCount = 0;
      let failedCount = 0;

      for (const subscriber of subscribers) {
        try {
          // إنشاء سجل بريد
          const emailLog = await prisma.emailLog.create({
            data: {
              jobId: job.id,
              subscriberId: subscriber.id,
              status: 'pending',
              eventAt: new Date()
            }
          });

          // إعداد محتوى البريد
          let html = job.template.htmlContent;
          let text = job.template.textContent || '';

          // إضافة رابط إلغاء الاشتراك وبكسل التتبع
          html = emailService.addUnsubscribeLink(html, subscriber.id);
          html = emailService.addTrackingPixel(html, emailLog.id);
          html = emailService.trackLinks(html, emailLog.id);

          // إرسال البريد
          const result = await emailService.sendTemplatedEmail(
            job.templateId,
            subscriber.email,
            {
              name: subscriber.name || 'عزيزي القارئ',
              email: subscriber.email,
              ...(subscriber.preferences as any || {})
            }
          );

          if (result.success) {
            await prisma.emailLog.update({
              where: { id: emailLog.id },
              data: { 
                status: 'sent',
                messageId: result.messageId
              }
            });
            sentCount++;
          } else {
            await prisma.emailLog.update({
              where: { id: emailLog.id },
              data: { 
                status: 'failed',
                error: result.error
              }
            });
            failedCount++;
          }
        } catch (error: any) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          failedCount++;
        }
      }

      // تحديث حالة المهمة
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            ...job.metadata,
            sentCount,
            failedCount,
            totalRecipients: subscribers.length
          }
        }
      });

      console.log(`✅ Job ${job.id} completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      
      // تحديث حالة المهمة إلى فاشلة
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          metadata: {
            ...job.metadata,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
    }
  }

  // جدولة مهمة جديدة
  async scheduleJob(
    templateId: string,
    scheduledAt: Date,
    targetFilter?: any,
    metadata?: any
  ): Promise<string> {
    const job = await prisma.emailJob.create({
      data: {
        templateId,
        scheduledAt,
        status: 'queued',
        targetFilter,
        metadata
      }
    });

    console.log(`📅 Scheduled job ${job.id} for ${scheduledAt}`);
    return job.id;
  }

  // إلغاء مهمة مجدولة
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await prisma.emailJob.findUnique({
        where: { id: jobId }
      });

      if (!job || job.status !== 'queued') {
        return false;
      }

      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: 'cancelled',
          completedAt: new Date()
        }
      });

      console.log(`❌ Cancelled job ${jobId}`);
      return true;
    } catch (error) {
      console.error(`Error cancelling job ${jobId}:`, error);
      return false;
    }
  }

  // تنظيف السجلات القديمة
  private async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.emailLog.deleteMany({
        where: {
          eventAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`🧹 Cleaned up ${deleted.count} old email logs`);
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }

  // إحصائيات المهمة
  async getJobStats(jobId: string) {
    const logs = await prisma.emailLog.findMany({
      where: { jobId }
    });

    const sent = logs.filter(l => l.status === 'sent').length;
    const opened = logs.filter(l => l.openedAt).length;
    const clicked = logs.filter(l => l.clickedAt).length;

    const stats = {
      total: logs.length,
      sent,
      failed: logs.filter(l => l.status === 'failed').length,
      opened,
      clicked,
      unsubscribed: logs.filter(l => l.unsubscribedAt).length,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicked / sent) * 100 : 0
    };

    return stats;
  }
}

// إنشاء مثيل واحد للاستخدام
export const emailScheduler = new EmailScheduler(); 