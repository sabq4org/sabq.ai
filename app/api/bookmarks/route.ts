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

    // التحقق من وجود الإشارة المرجعية في جدول interactions
    const existing = await prisma.interaction.findFirst({
      where: {
        userId,
        articleId: itemId,
        type: 'save'
      }
    });

    if (existing) {
      // حذف الإشارة المرجعية إذا كانت موجودة (toggle)
      await prisma.interaction.delete({
        where: { id: existing.id }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'removed',
        bookmarkId: existing.id 
      });
    } else {
      // إنشاء إشارة مرجعية جديدة في جدول interactions
      const bookmark = await prisma.interaction.create({
        data: {
          userId,
          articleId: itemId,
          type: 'save'
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // جلب الإشارات المرجعية من جدول interactions
    const bookmarks = await prisma.interaction.findMany({
      where: {
        userId,
        type: 'save'
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        articleId: true,
        createdAt: true,
        article: {
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
        }
      }
    });

    // تحويل البيانات إلى التنسيق المطلوب
    const bookmarksWithContent = bookmarks.map((bookmark: any) => ({
      id: bookmark.id,
      itemId: bookmark.articleId,
      itemType: 'article',
      createdAt: bookmark.createdAt,
      content: bookmark.article
    }));

    // حساب العدد الإجمالي
    const total = await prisma.interaction.count({ 
      where: {
        userId,
        type: 'save'
      }
    });

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
    const userId = await getUserIdFromToken(request);

    if (!bookmarkId || !userId) {
      return NextResponse.json(
        { error: 'Bookmark ID and user authentication required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الإشارة المرجعية
    const bookmark = await prisma.interaction.findFirst({
      where: {
        id: bookmarkId,
        userId,
        type: 'save'
      }
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found or access denied' },
        { status: 404 }
      );
    }

    // حذف الإشارة المرجعية
    await prisma.interaction.delete({
      where: { id: bookmarkId }
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'bookmark_removed',
        entityType: 'article',
        entityId: bookmark.articleId,
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