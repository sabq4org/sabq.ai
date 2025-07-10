import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { validateRequest } from '@/lib/validation';

// Schema للتحقق من صحة البيانات
const XTweetSchema = z.object({
  text: z.string().min(1, 'نص التغريدة مطلوب').max(280, 'نص التغريدة يجب أن يكون أقل من 280 حرف'),
  media_ids: z.array(z.string()).optional(),
  poll: z.object({
    options: z.array(z.string()).min(2).max(4),
    duration_minutes: z.number().min(5).max(10080)
  }).optional(),
  reply_to: z.string().optional(),
  quote_tweet_id: z.string().optional(),
  geo: z.object({
    place_id: z.string()
  }).optional(),
  tagged_user_ids: z.array(z.string()).optional(),
  for_super_followers_only: z.boolean().optional(),
  reply_settings: z.enum(['everyone', 'mentionedUsers', 'following']).optional()
});

const XMediaUploadSchema = z.object({
  media_data: z.string().min(1, 'بيانات الوسائط مطلوبة'),
  media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']),
  alt_text: z.string().optional()
});

const XScheduleTweetSchema = z.object({
  text: z.string().min(1, 'نص التغريدة مطلوب').max(280, 'نص التغريدة يجب أن يكون أقل من 280 حرف'),
  media_ids: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime('تاريخ الجدولة يجب أن يكون صالح'),
  article_id: z.string().optional()
});

/**
 * POST /api/social/x/tweet
 * نشر تغريدة جديدة
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(XTweetSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      // الحصول على إعدادات X
      const xProvider = await prisma.socialMediaProvider.findFirst({
        where: { 
          name: 'X (Twitter)',
          type: 'TWITTER',
          status: 'ACTIVE'
        }
      });

      if (!xProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل X غير متوفر' },
          { status: 503 }
        );
      }

      // نشر التغريدة عبر X API
      const tweetResponse = await createTweet(validation.data, xProvider.config);

      // حفظ المنشور في قاعدة البيانات
      const socialPost = await prisma.socialMediaPost.create({
        data: {
          providerId: xProvider.id,
          externalId: tweetResponse.data.id,
          content: validation.data.text,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          metadata: {
            tweet_id: tweetResponse.data.id,
            tweet_text: tweetResponse.data.text,
            author_id: tweetResponse.data.author_id,
            public_metrics: tweetResponse.data.public_metrics,
            created_at: tweetResponse.data.created_at,
            conversation_id: tweetResponse.data.conversation_id,
            context_annotations: tweetResponse.data.context_annotations,
            entities: tweetResponse.data.entities,
            geo: tweetResponse.data.geo,
            in_reply_to_user_id: tweetResponse.data.in_reply_to_user_id,
            lang: tweetResponse.data.lang,
            possibly_sensitive: tweetResponse.data.possibly_sensitive,
            referenced_tweets: tweetResponse.data.referenced_tweets,
            reply_settings: tweetResponse.data.reply_settings,
            source: tweetResponse.data.source,
            sent_by: user.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          post_id: socialPost.id,
          tweet_id: tweetResponse.data.id,
          text: tweetResponse.data.text,
          created_at: tweetResponse.data.created_at,
          public_metrics: tweetResponse.data.public_metrics,
          url: `https://twitter.com/i/web/status/${tweetResponse.data.id}`
        }
      });

    } catch (error) {
      console.error('خطأ في نشر التغريدة:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في نشر التغريدة' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/social/x/tweets
 * جلب التغريدات المنشورة
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status');
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;

      const [posts, total] = await Promise.all([
        prisma.socialMediaPost.findMany({
          where: {
            ...where,
            provider: {
              type: 'TWITTER'
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            provider: {
              select: {
                name: true,
                type: true
              }
            },
            article: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }),
        prisma.socialMediaPost.count({ 
          where: {
            ...where,
            provider: {
              type: 'TWITTER'
            }
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        data: {
          posts: posts.map(post => ({
            id: post.id,
            content: post.content,
            status: post.status,
            external_id: post.externalId,
            published_at: post.publishedAt,
            scheduled_at: post.scheduledAt,
            provider: post.provider.name,
            article: post.article,
            url: post.externalId ? `https://twitter.com/i/web/status/${post.externalId}` : null,
            metrics: post.metadata?.public_metrics
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('خطأ في جلب التغريدات:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في جلب التغريدات' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * POST /api/social/x/media
 * رفع وسائط لـ X
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(XMediaUploadSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      // الحصول على إعدادات X
      const xProvider = await prisma.socialMediaProvider.findFirst({
        where: { 
          name: 'X (Twitter)',
          type: 'TWITTER',
          status: 'ACTIVE'
        }
      });

      if (!xProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل X غير متوفر' },
          { status: 503 }
        );
      }

      // رفع الوسائط عبر X API
      const mediaResponse = await uploadMedia(validation.data, xProvider.config);

      return NextResponse.json({
        success: true,
        data: {
          media_id: mediaResponse.media_id_string,
          media_key: mediaResponse.media_key,
          size: mediaResponse.size,
          expires_after_secs: mediaResponse.expires_after_secs,
          processing_info: mediaResponse.processing_info
        }
      });

    } catch (error) {
      console.error('خطأ في رفع الوسائط:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في رفع الوسائط' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * POST /api/social/x/schedule
 * جدولة تغريدة
 */
export async function PATCH(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(XScheduleTweetSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      const { text, media_ids, scheduled_at, article_id } = validation.data;

      // التحقق من أن التاريخ في المستقبل
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'تاريخ الجدولة يجب أن يكون في المستقبل' },
          { status: 400 }
        );
      }

      // الحصول على إعدادات X
      const xProvider = await prisma.socialMediaProvider.findFirst({
        where: { 
          name: 'X (Twitter)',
          type: 'TWITTER',
          status: 'ACTIVE'
        }
      });

      if (!xProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل X غير متوفر' },
          { status: 503 }
        );
      }

      // حفظ التغريدة المجدولة في قاعدة البيانات
      const scheduledPost = await prisma.socialMediaPost.create({
        data: {
          providerId: xProvider.id,
          articleId: article_id || null,
          content: text,
          status: 'SCHEDULED',
          scheduledAt: scheduledDate,
          metadata: {
            media_ids: media_ids || [],
            scheduled_by: user.id,
            original_request: validation.data
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          post_id: scheduledPost.id,
          content: scheduledPost.content,
          status: scheduledPost.status,
          scheduled_at: scheduledPost.scheduledAt,
          article_id: scheduledPost.articleId
        }
      });

    } catch (error) {
      console.error('خطأ في جدولة التغريدة:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في جدولة التغريدة' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * DELETE /api/social/x/tweets/[id]
 * حذف تغريدة
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { pathname } = new URL(request.url);
      const tweetId = pathname.split('/').pop();
      
      if (!tweetId) {
        return NextResponse.json(
          { success: false, error: 'معرف التغريدة مطلوب' },
          { status: 400 }
        );
      }

      // البحث عن المنشور
      const socialPost = await prisma.socialMediaPost.findFirst({
        where: { 
          externalId: tweetId,
          provider: {
            type: 'TWITTER'
          }
        },
        include: { provider: true }
      });

      if (!socialPost) {
        return NextResponse.json(
          { success: false, error: 'التغريدة غير موجودة' },
          { status: 404 }
        );
      }

      // حذف التغريدة من X
      await deleteTweet(tweetId, socialPost.provider.config);

      // تحديث حالة المنشور
      await prisma.socialMediaPost.update({
        where: { id: socialPost.id },
        data: { 
          status: 'DELETED',
          metadata: {
            ...socialPost.metadata,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'تم حذف التغريدة بنجاح'
      });

    } catch (error) {
      console.error('خطأ في حذف التغريدة:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في حذف التغريدة' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * نشر تغريدة عبر X API v2
 */
async function createTweet(data: any, config: any) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.bearerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: data.text,
      media: data.media_ids ? { media_ids: data.media_ids } : undefined,
      poll: data.poll,
      reply: data.reply_to ? { in_reply_to_tweet_id: data.reply_to } : undefined,
      quote_tweet_id: data.quote_tweet_id,
      geo: data.geo,
      tagged_user_ids: data.tagged_user_ids,
      for_super_followers_only: data.for_super_followers_only,
      reply_settings: data.reply_settings
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`X API Error: ${error.detail || error.title || 'فشل في نشر التغريدة'}`);
  }

  return await response.json();
}

/**
 * رفع وسائط عبر X API
 */
async function uploadMedia(data: any, config: any) {
  // تحويل البيانات من base64 إلى buffer
  const mediaBuffer = Buffer.from(data.media_data, 'base64');
  
  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.bearerToken}`,
      'Content-Type': 'multipart/form-data'
    },
    body: new FormData([
      ['media', mediaBuffer, {
        contentType: data.media_type,
        filename: `media.${data.media_type.split('/')[1]}`
      }]
    ])
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`X API Error: ${error.errors?.[0]?.message || 'فشل في رفع الوسائط'}`);
  }

  const result = await response.json();
  
  // إضافة نص بديل إذا كان متوفراً
  if (data.alt_text && result.media_id_string) {
    await fetch('https://upload.twitter.com/1.1/media/metadata/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        media_id: result.media_id_string,
        alt_text: {
          text: data.alt_text
        }
      })
    });
  }

  return result;
}

/**
 * حذف تغريدة عبر X API
 */
async function deleteTweet(tweetId: string, config: any) {
  const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.bearerToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`X API Error: ${error.detail || error.title || 'فشل في حذف التغريدة'}`);
  }

  return await response.json();
} 