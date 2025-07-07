import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
import { interactions_type, interactions } from '@/lib/generated/prisma';
import jwt from 'jsonwebtoken';

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

// POST: Toggle (add/remove) a bookmark/save
export async function POST(request: NextRequest) {
  try {
    const { userId, itemId, itemType } = await request.json();

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const existingInteraction = await prisma.interactions.findFirst({
      where: {
        user_id: userId,
        article_id: itemId,
        type: interactions_type.save
      }
    });

    if (existingInteraction) {
      // It exists, so remove it
      await prisma.interactions.delete({
        where: { id: existingInteraction.id }
      });
      
      // await prisma.activity_logs.create({ ... }); // معطل مؤقتاً

      return NextResponse.json({ success: true, status: 'removed', message: 'Save removed' });
    } else {
      // It doesn't exist, so create it
      const newInteraction = await prisma.interactions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          article_id: itemId,
          type: interactions_type.save
        }
      });

      // await prisma.activity_logs.create({ ... }); // معطل مؤقتاً

      return NextResponse.json({ success: true, status: 'created', message: 'Article saved', data: newInteraction });
    }
  } catch (error) {
    console.error('Save toggle error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle save' }, { status: 500 });
  }
}

// GET all user saved items with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const savedItems = await prisma.interactions.findMany({
      where: {
        user_id: userId,
        type: interactions_type.save
      },
      orderBy: { created_at: 'desc' },
      // include: { article: { ... } }, // معطل مؤقتاً
      skip,
      take: limit
    });
    
    const total = await prisma.interactions.count({
      where: { user_id: userId, type: interactions_type.save }
    });

    const formattedItems = savedItems.map((item: any) => ({
      ...item,
      item_id: item.article_id,
      item_type: 'article'
    }));

    return NextResponse.json({
      success: true,
      data: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching saved items:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch saved items' }, { status: 500 });
  }
}

// DELETE a specific saved item by its interaction ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interactionId = searchParams.get('interactionId');
    const userId = searchParams.get('userId');

    if (!interactionId || !userId) {
      return NextResponse.json({ success: false, error: 'Interaction ID and User ID are required' }, { status: 400 });
    }

    const savedItem = await prisma.interactions.findFirst({
      where: {
        id: interactionId,
        user_id: userId,
        type: interactions_type.save
      }
    });

    if (!savedItem) {
      return NextResponse.json({ success: false, error: 'Saved item not found or permission denied' }, { status: 404 });
    }

    await prisma.interactions.delete({
      where: { id: interactionId }
    });
    
    // await prisma.activity_logs.create({ ... }); // معطل مؤقتاً

    return NextResponse.json({ success: true, message: 'Saved item deleted successfully' });
  } catch (error) {
    console.error('Error deleting saved item:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete saved item' }, { status: 500 });
  }
} 