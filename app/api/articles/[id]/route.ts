import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - جلب مقال واحد
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const dbArticle = await prisma.articles.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });
    if (!dbArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(dbArticle);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - تحديث مقال
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const updates = await request.json();
    const updatedArticle = await prisma.articles.update({
      where: { id },
      data: updates
    });
    return NextResponse.json(updatedArticle);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

// DELETE - حذف مقال
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    await prisma.articles.delete({ where: { id } });
    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
} 