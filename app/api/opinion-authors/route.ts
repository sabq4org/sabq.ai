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
    
    // بيانات وهمية لكتاب الرأي
    const mockAuthors = [
      {
        id: '1',
        name: 'د. محمد الأحمد',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        specialization: 'تقنية التعليم',
        club: 'gold',
        bio: 'خبير في التقنيات التعليمية ورؤية 2030',
        articleCount: 45,
        totalViews: 125000,
        isActive: true,
        isVerified: true,
        author_name: 'د. محمد الأحمد',
        author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        author_slug: 'dr-mohammed-ahmad'
      },
      {
        id: 'fatima-alnasr',
        name: 'أ. فاطمة النصر',
        specialization: 'ريادة الأعمال والاقتصاد',
        club: 'silver',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=150&q=80',
        yearsOfExperience: 6,
        totalArticles: 48,
        totalViews: 89500,
        isActive: true,
        isVerified: true,
        author_name: 'أ. فاطمة النصر',
        author_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=150&q=80',
        author_slug: 'fatima-alnasr'
      },
      {
        id: 'omar-alharbi',
        name: 'د. عمر الحربي',
        specialization: 'التحليل السياسي والعلاقات الدولية',
        club: 'platinum',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        yearsOfExperience: 12,
        totalArticles: 89,
        totalViews: 285000,
        isActive: true,
        isVerified: true,
        author_name: 'د. عمر الحربي',
        author_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        author_slug: 'omar-alharbi'
      },
      {
        id: '3',
        name: 'م. خالد العتيبي',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        specialization: 'التخطيط العمراني',
        club: 'silver',
        bio: 'مهندس ومخطط عمراني متخصص في المدن الذكية',
        articleCount: 32,
        totalViews: 87000,
        isActive: true,
        isVerified: true
      },
      {
        id: '4',
        name: 'د. نورا السديري',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        specialization: 'الدراسات الثقافية',
        club: 'gold',
        bio: 'أكاديمية ومؤلفة في الدراسات الثقافية المعاصرة',
        articleCount: 38,
        totalViews: 98000,
        isActive: true,
        isVerified: true
      }
    ];
    
    // تطبيق الفلتر إذا وُجد
    let filteredAuthors = mockAuthors;
    if (isActive !== null) {
      filteredAuthors = mockAuthors.filter(author => 
        author.isActive === (isActive === 'true')
      );
    }
    
    return NextResponse.json(filteredAuthors);
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
    
    const author = null; // DISABLED: opinionAuthor.create
    
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
    
    const author = null; // DISABLED: opinionAuthor.update
    
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
    
    // DISABLED: await prisma.opinionAuthor.delete
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opinion author:', error);
    return NextResponse.json(
      { error: 'Failed to delete opinion author' },
      { status: 500 }
    );
  }
} 