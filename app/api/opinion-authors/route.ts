import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getCurrentUser } from '@/app/lib/auth';

const prisma = new PrismaClient();

// GET - جلب جميع كتّاب الرأي
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    const authors = await prisma.opinionAuthor.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error fetching opinion authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opinion authors' },
      { status: 500 }
    );
  }
}

// POST - إنشاء كاتب رأي جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    const author = await prisma.opinionAuthor.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        avatar: data.avatar,
        email: data.email,
        title: data.title,
        socialLinks: {
          twitter: data.twitter,
          linkedin: data.linkedin
        },
        metadata: {
          specialties: data.specialties || []
        },
        isActive: data.isActive ?? true
      }
    });
    
    return NextResponse.json(author);
  } catch (error) {
    console.error('Error creating opinion author:', error);
    return NextResponse.json(
      { error: 'Failed to create opinion author' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    const author = await prisma.opinionAuthor.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        avatar: data.avatar,
        email: data.email,
        title: data.title,
        socialLinks: {
          twitter: data.twitter,
          linkedin: data.linkedin
        },
        metadata: {
          specialties: data.specialties
        },
        isActive: data.isActive
      }
    });
    
    return NextResponse.json(author);
  } catch (error) {
    console.error('Error updating opinion author:', error);
    return NextResponse.json(
      { error: 'Failed to update opinion author' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.opinionAuthor.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opinion author:', error);
    return NextResponse.json(
      { error: 'Failed to delete opinion author' },
      { status: 500 }
    );
  }
} 