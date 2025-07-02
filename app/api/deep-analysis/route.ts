import { NextRequest, NextResponse } from 'next/server';

// بيانات تجريبية
const deepAnalyses = [
  {
    id: '1',
    title: 'تحليل تأثير الذكاء الاصطناعي على سوق العمل السعودي',
    summary: 'دراسة معمقة حول كيفية تأثير تقنيات الذكاء الاصطناعي على فرص العمل والمهارات المطلوبة في السوق السعودي.',
    content: '<h2>المقدمة</h2><p>يشهد العالم ثورة تقنية غير مسبوقة...</p>',
    status: 'published',
    source: 'gpt',
    rating: 4.8,
    author: 'محمد الأحمد',
    authorId: 'user-1',
    categories: ['تقنية', 'اقتصاد'],
    articleId: 'article-123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    publishedAt: '2024-01-15T15:00:00Z',
    views: 1250,
    shares: 45,
    comments: 23
  },
  {
    id: '2',
    title: 'الآثار الاقتصادية لرؤية 2030 على القطاع الخاص',
    summary: 'تحليل شامل للتحولات الاقتصادية وتأثيرها على الشركات والاستثمارات.',
    content: '<h2>نظرة عامة</h2><p>تهدف رؤية 2030 إلى تنويع الاقتصاد...</p>',
    status: 'analyzing',
    source: 'hybrid',
    rating: 0,
    author: 'سارة العتيبي',
    authorId: 'user-2',
    categories: ['اقتصاد', 'سياسة'],
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    views: 0,
    shares: 0,
    comments: 0
  },
  {
    id: '3',
    title: 'دراسة معمقة: تحول الطاقة في المملكة',
    summary: 'كيف تتحول المملكة نحو الطاقة المتجددة وما هي التحديات والفرص.',
    content: '<h2>التحول نحو الطاقة النظيفة</h2><p>في إطار جهود المملكة...</p>',
    status: 'draft',
    source: 'manual',
    rating: 4.2,
    author: 'عبدالله الشمري',
    authorId: 'user-3',
    categories: ['بيئة', 'اقتصاد'],
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-14T11:20:00Z',
    views: 320,
    shares: 12,
    comments: 8
  }
];

export async function GET(request: NextRequest) {
  try {
    // فلترة حسب المعايير
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');

    let filteredAnalyses = [...deepAnalyses];

    if (status) {
      filteredAnalyses = filteredAnalyses.filter(a => a.status === status);
    }

    if (source) {
      filteredAnalyses = filteredAnalyses.filter(a => a.source === source);
    }

    if (category) {
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (authorId) {
      filteredAnalyses = filteredAnalyses.filter(a => a.authorId === authorId);
    }

    // ترتيب حسب التاريخ
    filteredAnalyses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(filteredAnalyses);
  } catch (error) {
    console.error('Error fetching deep analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deep analyses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من المدخلات
    if (!body.title || !body.content || !body.categories || body.categories.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // إنشاء تحليل جديد
    const newAnalysis = {
      id: `analysis-${Date.now()}`,
      title: body.title,
      summary: body.summary || '',
      content: body.content,
      status: body.status || 'draft',
      source: body.source || 'manual',
      rating: 0,
      author: 'المستخدم الحالي', // في الإنتاج، سيتم أخذ هذا من الجلسة
      authorId: 'current-user',
      categories: body.categories,
      articleId: body.articleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: body.status === 'published' ? new Date().toISOString() : undefined,
      views: 0,
      shares: 0,
      comments: 0,
      analysisMetadata: body.analysisMetadata
    };

    // في الإنتاج، سيتم حفظ التحليل في قاعدة البيانات
    deepAnalyses.push(newAnalysis);

    return NextResponse.json(newAnalysis, { status: 201 });
  } catch (error) {
    console.error('Error creating deep analysis:', error);
    return NextResponse.json(
      { error: 'Failed to create deep analysis' },
      { status: 500 }
    );
  }
} 