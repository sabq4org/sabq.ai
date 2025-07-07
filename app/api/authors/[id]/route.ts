import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const dbAuthor = await prisma.users.findUnique({ where: { id } });
    if (!dbAuthor) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }
    return NextResponse.json(dbAuthor);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 