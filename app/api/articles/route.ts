import { NextRequest, NextResponse } from 'next/server'

// Mock data for articles
const mockArticles = [
  {
    id: '1',
    title: 'مقال تجريبي عن الذكاء الاصطناعي',
    content: 'محتوى المقال حول تطورات الذكاء الاصطناعي...',
    author: 'علي الحازمي',
    status: 'published',
    category: 'تقنية',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'آخر أخبار التقنية في المملكة',
    content: 'تقرير شامل عن التطورات التقنية...',
    author: 'سارة أحمد',
    status: 'draft',
    category: 'محليات',
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredArticles = [...mockArticles]

    // Filter by status
    if (status) {
      filteredArticles = filteredArticles.filter(article => article.status === status)
    }

    // Filter by category
    if (category) {
      filteredArticles = filteredArticles.filter(article => article.category === category)
    }

    // Pagination
    const paginatedArticles = filteredArticles.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedArticles,
      total: filteredArticles.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المقالات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category, status = 'draft' } = body

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      )
    }

    // Create new article
    const newArticle = {
      id: (mockArticles.length + 1).toString(),
      title,
      content,
      category: category || 'عام',
      status,
      author: 'المستخدم الحالي', // TODO: Get from authenticated user
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockArticles.push(newArticle)

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المقال بنجاح',
      data: newArticle
    }, { status: 201 })

  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المقال' },
      { status: 500 }
    )
  }
} 