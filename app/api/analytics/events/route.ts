import { NextRequest, NextResponse } from 'next/server'

// Mock analytics data
const mockEvents = [
  {
    id: '1',
    type: 'page_view',
    page: '/dashboard',
    userId: '1',
    timestamp: new Date().toISOString(),
    metadata: { referrer: 'direct' }
  },
  {
    id: '2',
    type: 'article_view',
    articleId: '1',
    userId: '2',
    timestamp: new Date().toISOString(),
    metadata: { readTime: 120 }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    let filteredEvents = [...mockEvents]

    // Filter by event type
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type)
    }

    // Filter by date range
    if (startDate || endDate) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.timestamp)
        if (startDate && eventDate < new Date(startDate)) return false
        if (endDate && eventDate > new Date(endDate)) return false
        return true
      })
    }

    // Limit results
    const limitedEvents = filteredEvents.slice(0, limit)

    // Generate summary statistics
    const summary = {
      totalEvents: filteredEvents.length,
      eventTypes: [...new Set(filteredEvents.map(e => e.type))],
      uniqueUsers: [...new Set(filteredEvents.map(e => e.userId))].length,
      dateRange: {
        start: startDate || filteredEvents[0]?.timestamp,
        end: endDate || filteredEvents[filteredEvents.length - 1]?.timestamp
      }
    }

    return NextResponse.json({
      success: true,
      data: limitedEvents,
      summary
    })

  } catch (error) {
    console.error('Get analytics events error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات التحليلات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, page, articleId, userId, metadata = {} } = body

    // Validation
    if (!type) {
      return NextResponse.json(
        { error: 'نوع الحدث مطلوب' },
        { status: 400 }
      )
    }

    // Create new event
    const newEvent = {
      id: (mockEvents.length + 1).toString(),
      type,
      page,
      articleId,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      metadata
    }

    mockEvents.push(newEvent)

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الحدث بنجاح',
      data: newEvent
    }, { status: 201 })

  } catch (error) {
    console.error('Create analytics event error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الحدث' },
      { status: 500 }
    )
  }
} 