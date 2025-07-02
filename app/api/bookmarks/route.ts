import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// دالة مساعدة للتحقق من المستخدم
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, metadata } = body;

    // التحقق من المستخدم
    const userId = await getUserIdFromToken(request) || body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // التحقق من البيانات المطلوبة
    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // التحقق من وجود الإشارة المرجعية
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_itemId_itemType: {
          userId,
          itemId,
          itemType
        }
      }
    });

    if (existing) {
      // حذف الإشارة المرجعية إذا كانت موجودة (toggle)
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'removed',
        bookmarkId: existing.id 
      });
    } else {
      // إنشاء إشارة مرجعية جديدة
      const bookmark = await prisma.bookmark.create({
        data: {
          userId,
          itemId,
          itemType,
          metadata: metadata || null
        }
      });

      // تسجيل النشاط
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'bookmark_added',
          entityType: itemType,
          entityId: itemId,
          metadata: { bookmarkId: bookmark.id }
        }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'added',
        bookmark: {
          id: bookmark.id,
          createdAt: bookmark.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error managing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to manage bookmark' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await getUserIdFromToken(request) || searchParams.get('userId');
    const itemType = searchParams.get('itemType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (itemType) where.itemType = itemType;

    // جلب الإشارات المرجعية مع معلومات المحتوى
    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        itemId: true,
        itemType: true,
        createdAt: true,
        metadata: true
      }
    });

    // جلب تفاصيل المقالات المحفوظة
    const articleIds = bookmarks
      .filter((b: any) => b.itemType === 'article')
      .map((b: any) => b.itemId);

    const articles = articleIds.length > 0 ? await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    }) : [];

    // دمج البيانات
    const bookmarksWithContent = bookmarks.map((bookmark: any) => {
      if (bookmark.itemType === 'article') {
        const article = articles.find((a: any) => a.id === bookmark.itemId);
        return { ...bookmark, content: article };
      }
      return bookmark;
    });

    // حساب العدد الإجمالي
    const total = await prisma.bookmark.count({ where });

    return NextResponse.json({ 
      bookmarks: bookmarksWithContent,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');
    const userId = await getUserIdFromToken(request) || searchParams.get('userId');

    if (!bookmarkId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // التحقق من ملكية الإشارة المرجعية
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId
      }
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found or access denied' },
        { status: 404 }
      );
    }

    // حذف الإشارة المرجعية
    await prisma.bookmark.delete({
      where: { id: bookmarkId }
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'bookmark_removed',
        entityType: bookmark.itemType,
        entityId: bookmark.itemId,
        metadata: { bookmarkId }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Bookmark removed successfully' 
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 