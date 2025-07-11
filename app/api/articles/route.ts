import { NextRequest, NextResponse } from 'next/server';

// بيانات المقالات التجريبية
const articles = [
  {
    id: '1',
    title: 'مقال تجريبي عن الذكاء الاصطناعي',
    content: 'محتوى المقال حول تطورات الذكاء الاصطناعي وتأثيرها على المجتمع...',
    author: 'علي الحازمي',
    status: 'published',
    category: 'تقنية',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: 'ai-article-demo',
    summary: 'نظرة شاملة على تطورات الذكاء الاصطناعي',
    featured_image: 'https://via.placeholder.com/800x400?text=AI+Article',
    view_count: 150,
    like_count: 25,
    reading_time: 5,
    tags: ['ذكاء اصطناعي', 'تقنية', 'مستقبل']
  },
  {
    id: '2',
    title: 'آخر أخبار التقنية في المملكة',
    content: 'تقرير شامل عن التطورات التقنية في المملكة العربية السعودية...',
    author: 'سارة أحمد',
    status: 'published',
    category: 'أخبار',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: 'tech-news-ksa',
    summary: 'أحدث التطورات التقنية في المملكة',
    featured_image: 'https://via.placeholder.com/800x400?text=Tech+News',
    view_count: 230,
    like_count: 45,
    reading_time: 3,
    tags: ['أخبار', 'تقنية', 'السعودية']
  },
  {
    id: '3',
    title: 'دليل البرمجة للمبتدئين',
    content: 'دليل شامل لتعلم البرمجة من الصفر للمبتدئين...',
    author: 'محمد العلي',
    status: 'published',
    category: 'تعليم',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: 'programming-guide',
    summary: 'تعلم البرمجة خطوة بخطوة',
    featured_image: 'https://via.placeholder.com/800x400?text=Programming',
    view_count: 520,
    like_count: 89,
    reading_time: 10,
    tags: ['برمجة', 'تعليم', 'مبتدئين']
  },
  {
    id: '4',
    title: 'مستقبل العمل عن بعد',
    content: 'كيف غيرت التقنية مفهوم العمل التقليدي...',
    author: 'فاطمة الزهراء',
    status: 'draft',
    category: 'مقالات',
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: 'remote-work-future',
    summary: 'نظرة على مستقبل العمل عن بعد',
    featured_image: 'https://via.placeholder.com/800x400?text=Remote+Work',
    view_count: 0,
    like_count: 0,
    reading_time: 7,
    tags: ['عمل عن بعد', 'مستقبل', 'تقنية']
  },
  {
    id: '5',
    title: 'أمن المعلومات في عصر الذكاء الاصطناعي',
    content: 'التحديات والحلول في مجال أمن المعلومات...',
    author: 'عبدالله السالم',
    status: 'published',
    category: 'أمن معلومات',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: 'cybersecurity-ai-era',
    summary: 'حماية البيانات في عصر الذكاء الاصطناعي',
    featured_image: 'https://via.placeholder.com/800x400?text=Cybersecurity',
    view_count: 340,
    like_count: 67,
    reading_time: 8,
    tags: ['أمن معلومات', 'ذكاء اصطناعي', 'حماية']
  }
];

// GET /api/articles - جلب المقالات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // معاملات التصفية
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // تصفية المقالات
    let filteredArticles = [...articles];
    
    if (category) {
      filteredArticles = filteredArticles.filter(a => a.category === category);
    }
    
    if (status) {
      filteredArticles = filteredArticles.filter(a => a.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower) ||
        a.author.toLowerCase().includes(searchLower)
      );
    }
    
    // حساب الصفحات
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
    
    // إضافة معلومات التصنيف والمؤلف
    const articlesWithDetails = paginatedArticles.map(article => ({
      ...article,
      category: {
        id: `cat-${article.category}`,
        name: article.category,
        slug: article.category.toLowerCase()
      },
      author: {
        id: `author-${article.author}`,
        name: article.author
      }
    }));
    
    return NextResponse.json({
      success: true,
      data: articlesWithDetails,
      articles: articlesWithDetails, // للتوافق مع الكود الموجود
      pagination: {
        current_page: page,
        total_pages: Math.ceil(filteredArticles.length / limit),
        total_items: filteredArticles.length,
        items_per_page: limit,
        has_next: endIndex < filteredArticles.length,
        has_previous: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المقالات' },
      { status: 500 }
    );
  }
}

// POST /api/articles - إنشاء مقال جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags } = body;
    
    // التحقق من البيانات المطلوبة
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى والتصنيف مطلوبة' },
        { status: 400 }
      );
    }
    
    // إنشاء مقال جديد
    const newArticle = {
      id: `${articles.length + 1}`,
      title,
      content,
      author: 'مستخدم جديد', // في الإنتاج يجب أخذه من الجلسة
      status: 'draft',
      category,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      summary: content.substring(0, 150) + '...',
      featured_image: 'https://via.placeholder.com/800x400?text=New+Article',
      view_count: 0,
      like_count: 0,
      reading_time: Math.ceil(content.split(' ').length / 200),
      tags: tags || []
    };
    
    articles.push(newArticle);
    
    return NextResponse.json({
      success: true,
      article: newArticle,
      message: 'تم إنشاء المقال بنجاح'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المقال' },
      { status: 500 }
    );
  }
} 