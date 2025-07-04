import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { quickLocalAnalysis } from '@/lib/comment-moderation';
import { classifyCommentWithAI } from '@/lib/services/ai-comment-classifier';

const prisma = new PrismaClient();

// دالة مساعدة للتحقق من دور المستخدم
async function getUserRole(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role || 'user';
}

// جلب التعليقات لمقال معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('article_id');
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const includeAiAnalysis = searchParams.get('include')?.includes('aiAnalysis');
    
    // التحقق من حالة التعليقات في الإعدادات
    const checkCommentsEnabled = searchParams.get('check_enabled');
    if (checkCommentsEnabled === 'true') {
      // هنا يمكن إضافة منطق للتحقق من إعدادات قاعدة البيانات
      // حالياً سنعتمد على localStorage في الواجهة الأمامية
      return NextResponse.json({
        success: true,
        enabled: true // يمكن تغييرها لاحقاً للقراءة من قاعدة البيانات
      });
    }

    // إذا لم يكن هناك article_id، فهذا يعني أننا في لوحة التحكم
    if (!articleId) {
      // جلب جميع التعليقات للوحة التحكم
      const where: any = {};
      
      // فلترة حسب نسبة الأمان للذكاء الاصطناعي
      const aiScoreLt = searchParams.get('aiScore[lt]');
      if (aiScoreLt) {
        where.aiScore = { lt: parseInt(aiScoreLt) };
      } else if (status !== 'all') {
        where.status = status;
      }
      // إذا كان status === 'all'، لا نضيف أي فلتر للحالة

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            article: {
              select: {
                id: true,
                title: true
              }
            },
            aiAnalyses: includeAiAnalysis ? true : false
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.comment.count({ where })
      ]);

      return NextResponse.json({
        success: true,
        comments: comments.map(comment => ({
          ...comment,
          aiAnalysis: comment.aiAnalyses?.[0] || null
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // جلب التعليقات الرئيسية مع الردود
    const where: any = {
      articleId,
      parentId: null // فقط التعليقات الرئيسية
    };

    // إضافة فلتر الحالة للمستخدمين العاديين
    const user = await getCurrentUser();
    let userRole = 'user';
    if (user) {
      userRole = await getUserRole(user.id);
    }
    
    if (!user || !['admin', 'moderator'].includes(userRole)) {
      where.status = 'approved';
    } else if (status !== 'all') {
      where.status = status;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          replies: {
            where: user && ['admin', 'moderator'].includes(userRole) 
              ? {} 
              : { status: 'approved' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
              reactions: true,
              replies: {
                where: user && ['admin', 'moderator'].includes(userRole) 
                  ? {} 
                  : { status: 'approved' },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true
                    }
                  },
                  reactions: true
                }
              }
            }
          },
          _count: {
            select: {
              reports: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    // تنسيق البيانات
    const formattedComments = comments.map(formatComment);

    return NextResponse.json({
      success: true,
      comments: formattedComments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
}

// إنشاء تعليق جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, content, parentId } = body;

    if (!articleId || !content) {
      return NextResponse.json(
        { success: false, error: 'معرف المقال والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من المستخدم أولاً
    const user = await getCurrentUser();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // التحقق من إعدادات التعليقات للمقال
    const [article, bannedWords, aiSettings] = await Promise.all([
      prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          allowComments: true,
          commentSettings: true
        }
      }),
      // جلب الكلمات المحظورة مرة واحدة
      prisma.bannedWord.findMany({
        where: { isActive: true },
        select: {
          word: true,
          action: true,
          replacement: true
        }
      }),
      // جلب إعدادات الذكاء الاصطناعي مرة واحدة
      prisma.aIModerationSettings.findFirst({
        select: {
          enabled: true,
          autoApproveThreshold: true,
          autoRejectThreshold: true
        }
      })
    ]);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'المقال غير موجود' },
        { status: 404 }
      );
    }

    if (!article.allowComments) {
      return NextResponse.json(
        { success: false, error: 'التعليقات مغلقة على هذا المقال' },
        { status: 403 }
      );
    }

    // تحديد دور المستخدم
    let userRole = 'user';
    if (user) {
      userRole = await getUserRole(user.id);
    }

    // تحديد حالة التعليق الافتراضية
    let commentStatus = 'pending';
    let aiScore = 100;
    let aiClassification = 'safe';
    let aiAnalysis = null;
    let processedContent = content;
    let requiresModeration = false;

    // إذا كان المستخدم مشرف أو كاتب، وافق مباشرة بدون تحليل
    if (user && ['admin', 'moderator', 'author'].includes(userRole)) {
      commentStatus = 'approved';
    } else {
      // تحديد نوع التحليل المطلوب
      const useOpenAI = process.env.OPENAI_API_KEY && aiSettings?.enabled;
      
      let analysisResult;
      const startTime = Date.now();
      
      if (useOpenAI) {
        // استخدام OpenAI للتحليل المتقدم
        try {
          const aiResult = await classifyCommentWithAI(content);
          aiScore = aiResult.score;
          aiClassification = aiResult.classification;
          
          analysisResult = {
            score: aiResult.score,
            classification: aiResult.classification,
            suggestedAction: aiResult.suggestedAction,
            confidence: aiResult.confidence,
            flaggedWords: [],
            reason: aiResult.reason
          };
          
          aiAnalysis = {
            score: aiResult.score,
            classification: aiResult.classification,
            suggested_action: aiResult.suggestedAction,
            ai_provider: aiResult.aiProvider,
            confidence: aiResult.confidence,
            flagged_words: [],
            categories: {},
            processing_time: aiResult.processingTime,
            reason: aiResult.reason
          };
        } catch (error) {
          console.error('OpenAI classification failed, falling back to local:', error);
          // في حالة فشل OpenAI، نستخدم التحليل المحلي
          analysisResult = quickLocalAnalysis(content);
          aiScore = analysisResult.score;
          aiClassification = analysisResult.classification;
        }
      } else {
        // تحليل التعليق محلياً بسرعة فائقة
        analysisResult = quickLocalAnalysis(content);
        aiScore = analysisResult.score;
        aiClassification = analysisResult.classification;
      }
      
      const processingTime = Date.now() - startTime;
      
      // رفض التعليقات المسيئة جداً
      if (aiScore < 20) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'التعليق يحتوي على محتوى غير مناسب',
            aiAnalysis: {
              score: aiScore,
              classification: aiClassification,
              reason: analysisResult.reason
            }
          },
          { status: 400 }
        );
      }
      
      // إذا لم يكن aiAnalysis محدداً بعد (في حالة التحليل المحلي)
      if (!aiAnalysis) {
        aiAnalysis = {
          score: analysisResult.score,
          classification: analysisResult.classification,
          suggested_action: analysisResult.suggestedAction,
          ai_provider: 'local',
          confidence: analysisResult.confidence,
          flagged_words: analysisResult.flaggedWords,
          categories: analysisResult.categories || {},
          processing_time: processingTime,
          reason: analysisResult.reason
        };
      }

      // التحقق من الكلمات المحظورة
      for (const bannedWord of bannedWords) {
        const regex = new RegExp(bannedWord.word, 'gi');
        if (regex.test(content)) {
          switch (bannedWord.action) {
            case 'reject':
              return NextResponse.json(
                { success: false, error: 'التعليق يحتوي على كلمات غير مسموحة' },
                { status: 400 }
              );
            case 'replace':
              processedContent = processedContent.replace(regex, bannedWord.replacement || '***');
              break;
            case 'flag':
              requiresModeration = true;
              break;
          }
        }
      }

      // جلب إعدادات الذكاء الاصطناعي
      if (aiSettings?.enabled) {
        if (aiScore >= (aiSettings.autoApproveThreshold || 80)) {
          commentStatus = 'approved';
        } else if (aiScore <= (aiSettings.autoRejectThreshold || 20)) {
          commentStatus = 'rejected';
        } else {
          commentStatus = 'pending';
        }
      }
      
      if (commentStatus === 'pending' && !requiresModeration && (article.commentSettings as any)?.requiresApproval === false) {
        commentStatus = 'approved'; // الموافقة التلقائية إذا كانت الإعدادات تسمح
      }
    }

    console.log('Comment status:', commentStatus, 'User role:', userRole);

    // إنشاء التعليق
    const comment = await prisma.comment.create({
      data: {
        articleId,
        userId: user?.id || null,
        parentId,
        content: processedContent,
        status: commentStatus,
        aiScore,
        aiClassification,
        aiAnalyzedAt: aiAnalysis ? new Date() : null,
        metadata: {
          guestName: !user ? body.guestName : null,
          requiresModeration,
          ipAddress,
          userAgent,
          aiAnalysis: aiAnalysis || null
        }
      },
      select: {
        id: true,
        content: true,
        status: true,
        aiScore: true,
        aiClassification: true,
        aiAnalyzedAt: true,
        createdAt: true,
        metadata: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // حفظ تحليل الذكاء الاصطناعي إذا كان متاحاً (في الخلفية)
    if (aiAnalysis && !['admin', 'moderator', 'author'].includes(userRole)) {
      // حفظ التحليل بشكل غير متزامن لتسريع الاستجابة
      prisma.aICommentAnalysis.create({
        data: {
          commentId: comment.id,
          score: aiAnalysis.score,
          classification: aiAnalysis.classification,
          suggestedAction: aiAnalysis.suggested_action,
          aiProvider: aiAnalysis.ai_provider || 'local',
          confidence: aiAnalysis.confidence || 0.7,
          analysisDetails: aiAnalysis,
          flaggedWords: aiAnalysis.flagged_words || [],
          categories: aiAnalysis.categories || {},
          processingTime: aiAnalysis.processing_time || 0
        }
      }).catch(error => {
        console.error('Error saving AI analysis:', error);
      });
    }

    // تحديث عدد التعليقات في المقال (في الخلفية)
    if (commentStatus === 'approved') {
      prisma.$executeRaw`
        UPDATE articles 
        SET comments_count = comments_count + 1,
            last_comment_at = NOW()
        WHERE id = ${articleId}
      `.catch(error => {
        console.error('Error updating article comment count:', error);
      });
    }

    // إضافة نقاط الولاء للمستخدم (في الخلفية)
    if (user && commentStatus === 'approved') {
      prisma.loyaltyPoint.create({
        data: {
          userId: user.id,
          points: 5,
          action: 'comment_posted',
          referenceId: comment.id,
          referenceType: 'comment'
        }
      }).catch(error => {
        console.error('Error adding loyalty points:', error);
      });
    }

    return NextResponse.json({
      success: true,
      comment: formatComment(comment),
      message: commentStatus === 'pending' 
        ? 'تم إرسال تعليقك وسيتم نشره بعد المراجعة' 
        : 'تم نشر تعليقك بنجاح',
      // إضافة معلومات التحليل إذا كان التعليق مشبوهاً
      ...(aiScore < 80 && {
        aiWarning: {
          score: aiScore,
          classification: aiClassification,
          message: aiScore < 50 
            ? 'تحذير: قد يحتوي تعليقك على محتوى مشبوه وسيتم مراجعته قبل النشر'
            : 'ملاحظة: سيتم مراجعة تعليقك قبل النشر',
          flaggedWords: aiAnalysis?.flagged_words || []
        }
      })
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التعليق' },
      { status: 500 }
    );
  }
}

// دالة مساعدة لتنسيق التعليق
function formatComment(comment: any) {
  return {
    id: comment.id,
    content: comment.content,
    status: comment.status,
    aiScore: comment.aiScore,
    aiClassification: comment.aiClassification,
    aiAnalyzedAt: comment.aiAnalyzedAt,
    createdAt: comment.createdAt,
    user: comment.user || {
      name: comment.metadata?.guestName || 'زائر',
      avatar: null
    },
    reactions: {
      likes: comment.reactions?.filter((r: any) => r.reactionType === 'like').length || 0,
      dislikes: comment.reactions?.filter((r: any) => r.reactionType === 'dislike').length || 0,
      userReaction: comment.reactions?.find((r: any) => r.userId === comment.userId)?.reactionType || null
    },
    replies: comment.replies?.map(formatComment) || [],
    reportsCount: comment._count?.reports || 0,
    metadata: comment.metadata,
    aiAnalysis: comment.aiAnalyses?.[0] || comment.aiAnalysis || null
  };
} 