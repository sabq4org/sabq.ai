import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET: جلب قائمة المواضيع
export async function GET(request: NextRequest) {
  try {
    console.log('Starting GET /api/forum/topics');
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'latest';

    const offset = (page - 1) * limit;

    // بناء الاستعلام الأساسي
    let whereClause = "WHERE t.status = 'active'";
    const params: any[] = [];

    // فلترة حسب الفئة
    if (category) {
      whereClause += " AND c.slug = ?";
      params.push(category);
    }

    // الترتيب
    let orderBy = "";
    switch (sort) {
      case 'popular':
        orderBy = "ORDER BY like_count DESC, t.created_at DESC";
        break;
      case 'views':
        orderBy = "ORDER BY t.views DESC, t.created_at DESC";
        break;
      default:
        orderBy = "ORDER BY t.is_pinned DESC, COALESCE(t.last_reply_at, t.created_at) DESC";
    }

    console.log('Executing query with params:', params);

    // جلب المواضيع من قاعدة البيانات - استعلام مبسط
    const topics = await prisma.$queryRawUnsafe(`
      SELECT 
        t.id,
        t.title,
        t.content,
        t.views,
        t.is_pinned,
        t.is_locked,
        t.is_featured,
        t.created_at,
        t.last_reply_at,
        t.category_id,
        t.author_id,
        c.name_ar as category_name,
        c.slug as category_slug,
        c.color as category_color
      FROM forum_topics t
      JOIN forum_categories c ON t.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `, ...params, limit, offset);

    console.log('Found topics:', (topics as any[]).length);

    // جلب معلومات المؤلفين بشكل منفصل
    const authorIds = [...new Set((topics as any[]).map(t => t.author_id))];
    const authors = authorIds.length > 0 ? await prisma.$queryRawUnsafe(`
      SELECT id, name, email FROM users WHERE id IN (${authorIds.map(() => '?').join(',')})
    `, ...authorIds) : [];

    const authorsMap = new Map((authors as any[]).map(a => [a.id, a]));

    // جلب عدد الردود بشكل منفصل
    const topicIds = (topics as any[]).map(t => t.id);
    const replyCounts = topicIds.length > 0 ? await prisma.$queryRawUnsafe(`
      SELECT topic_id, COUNT(*) as count 
      FROM forum_replies 
      WHERE topic_id IN (${topicIds.map(() => '?').join(',')}) AND status = 'active'
      GROUP BY topic_id
    `, ...topicIds) : [];

    const replyCountsMap = new Map((replyCounts as any[]).map(r => [r.topic_id, Number(r.count)]));

    // جلب عدد الإعجابات بشكل منفصل
    const likeCounts = topicIds.length > 0 ? await prisma.$queryRawUnsafe(`
      SELECT target_id, COUNT(*) as count 
      FROM forum_votes 
      WHERE target_id IN (${topicIds.map(() => '?').join(',')}) AND target_type = 'topic' AND vote_type = 'like'
      GROUP BY target_id
    `, ...topicIds) : [];

    const likeCountsMap = new Map((likeCounts as any[]).map(l => [l.target_id, Number(l.count)]));

    // جلب العدد الإجمالي
    const countResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM forum_topics t
      ${whereClause.replace('c.', '')}
    `, ...params.filter((_, i) => i === 0 ? category : false));
    
    const total = Number((countResult as any)[0]?.total || 0);
    console.log('Total topics:', total);

    // تنسيق البيانات
    const formattedTopics = (topics as any[]).map(topic => {
      const author = authorsMap.get(topic.author_id) || { id: topic.author_id, name: 'مستخدم مجهول', email: '' };
      
      return {
        id: topic.id,
        title: topic.title,
        content: topic.content,
        views: Number(topic.views),
        is_pinned: Boolean(topic.is_pinned),
        is_locked: Boolean(topic.is_locked),
        is_featured: Boolean(topic.is_featured),
        created_at: topic.created_at,
        last_reply_at: topic.last_reply_at,
        category: {
          id: topic.category_id,
          name: topic.category_name,
          slug: topic.category_slug,
          color: topic.category_color
        },
        author: {
          id: author.id,
          name: author.name,
          avatar: `/images/authors/default-avatar.jpg`
        },
        replies: replyCountsMap.get(topic.id) || 0,
        likes: likeCountsMap.get(topic.id) || 0,
        lastReply: topic.last_reply_at 
          ? getRelativeTime(new Date(topic.last_reply_at))
          : getRelativeTime(new Date(topic.created_at))
      };
    });

    return NextResponse.json({
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { 
        error: 'حدث خطأ في جلب المواضيع',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST: إنشاء موضوع جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من تسجيل الدخول (مؤقتاً)
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لإنشاء موضوع' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category_id } = body;

    // التحقق من البيانات
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // إنشاء الموضوع في قاعدة البيانات
    const topicId = crypto.randomUUID();
    const userId = 'user1'; // مؤقتاً حتى يتم تنفيذ نظام المصادقة
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO forum_topics (id, title, content, category_id, author_id)
      VALUES (?, ?, ?, ?, ?)
    `, topicId, title, content, category_id, userId);

    // إضافة نقاط السمعة
    await prisma.$executeRawUnsafe(`
      INSERT INTO forum_reputation (id, user_id, points, action_type, target_type, target_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, crypto.randomUUID(), userId, 10, 'topic_created', 'topic', topicId, 'إنشاء موضوع جديد');

    return NextResponse.json({
      id: topicId,
      message: 'تم إنشاء الموضوع بنجاح'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الموضوع' },
      { status: 500 }
    );
  }
}

// دالة مساعدة لحساب الوقت النسبي
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 30) return `قبل ${diffDays} يوم`;
  
  return date.toLocaleDateString('ar-SA');
} 