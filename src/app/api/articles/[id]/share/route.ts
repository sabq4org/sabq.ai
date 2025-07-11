import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/security';

const prisma = new PrismaClient();

const shareSchema = z.object({
  platform: z.enum(['facebook', 'twitter', 'whatsapp', 'linkedin', 'telegram', 'copy', 'email', 'other']),
  referrer: z.string().optional()
});

/**
 * POST /api/articles/[id]/share
 * تسجيل مشاركة المقال
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: articleId } = params;
    
    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        slug: true,
        author_id: true,
        status: true,
        author: {
          select: { id: true, name: true }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot share unpublished article' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = shareSchema.parse(body);

    // الحصول على معلومات المستخدم والشبكة
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // التحقق من المستخدم (اختياري)
    let user = null;
    const authResult = await authMiddleware(request);
    if (authResult.success) {
      user = authResult.user;
      
      // التحقق من Rate Limiting للمستخدمين المسجلين
      if (!checkRateLimit(`share_${user.id}`, 30, 60000)) { // 30 مشاركة في الدقيقة
        return NextResponse.json(
          { error: 'Too many shares. Please wait before sharing again.' },
          { status: 429 }
        );
      }
    } else {
      // التحقق من Rate Limiting للمستخدمين غير المسجلين
      if (!checkRateLimit(`share_ip_${clientIp}`, 10, 60000)) { // 10 مشاركات في الدقيقة
        return NextResponse.json(
          { error: 'Too many shares from this IP. Please wait.' },
          { status: 429 }
        );
      }
    }

    // إنشاء رابط المشاركة مع معرف التتبع
    const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sabq.ai';
    const shareUrl = `${baseUrl}/articles/${article.slug}?share=${shareId}`;

    // تسجيل المشاركة
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء سجل المشاركة
      const share = await tx.articleShare.create({
        data: {
          article_id: articleId,
          user_id: user?.id || null,
          platform: validatedData.platform,
          share_url: shareUrl,
          ip_address: clientIp,
          user_agent: userAgent,
          referrer: validatedData.referrer
        }
      });

      // تحديث عداد المشاركات
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
        data: {
          share_count: { increment: 1 }
        },
        select: {
          id: true,
          share_count: true
        }
      });

      // تسجيل الحدث في التحليلات
      await tx.analyticsEvent.create({
        data: {
          event_type: 'article_share',
          article_id: articleId,
          user_id: user?.id || null,
          ip_address: clientIp,
          user_agent: userAgent,
          event_data: {
            platform: validatedData.platform,
            article_title: article.title,
            share_url: shareUrl,
            referrer: validatedData.referrer
          }
        }
      });

      // إنشاء إشعار للكاتب (إذا لم يكن هو من يشارك)
      if (user && article.author_id !== user.id) {
        await tx.notification.create({
          data: {
            user_id: article.author_id,
            sender_id: user.id,
            type: 'article_share',
            title: 'مشاركة جديدة',
            message: `شارك ${user.name} مقالك "${article.title}" عبر ${getPlatformNameInArabic(validatedData.platform)}`,
            action_url: `/articles/${article.slug}`,
            data: {
              article_id: articleId,
              article_title: article.title,
              platform: validatedData.platform
            }
          }
        });
      }

      return { share, updatedArticle };
    });

    // إنشاء روابط المشاركة حسب المنصة
    const shareLinks = generateShareLinks(article, shareUrl);

    return NextResponse.json({
      success: true,
      data: {
        share: result.share,
        article: result.updatedArticle,
        share_url: shareUrl,
        platform_url: shareLinks[validatedData.platform] || shareUrl
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error sharing article:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/[id]/share
 * جلب إحصائيات المشاركة وروابط المشاركة
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: articleId } = params;

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        featured_image: true,
        share_count: true,
        status: true
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // جلب إحصائيات المشاركة حسب المنصة
    const shareStats = await prisma.articleShare.groupBy({
      by: ['platform'],
      where: { article_id: articleId },
      _count: { platform: true }
    });

    // تحويل إحصائيات المشاركة إلى كائن
    const sharesByPlatform = shareStats.reduce((acc, stat) => {
      acc[stat.platform] = stat._count.platform;
      return acc;
    }, {} as Record<string, number>);

    // إنشاء روابط المشاركة
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sabq.ai';
    const articleUrl = `${baseUrl}/articles/${article.slug}`;
    const shareLinks = generateShareLinks(article, articleUrl);

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug
        },
        total_shares: article.share_count,
        shares_by_platform: sharesByPlatform,
        share_links: shareLinks
      }
    });

  } catch (error) {
    console.error('Error fetching share stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * إنشاء روابط المشاركة لمختلف المنصات
 */
function generateShareLinks(article: any, url: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(article.title);
  const encodedSummary = encodeURIComponent(article.summary || '');

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedSummary}%0A%0A${encodedUrl}`,
    copy: url
  };
}

/**
 * تحويل اسم المنصة إلى العربية
 */
function getPlatformNameInArabic(platform: string): string {
  const platformNames: Record<string, string> = {
    facebook: 'فيسبوك',
    twitter: 'تويتر',
    whatsapp: 'واتساب',
    linkedin: 'لينكدإن',
    telegram: 'تلغرام',
    email: 'البريد الإلكتروني',
    copy: 'نسخ الرابط',
    other: 'منصة أخرى'
  };

  return platformNames[platform] || platform;
} 