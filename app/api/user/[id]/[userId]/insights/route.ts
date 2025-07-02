import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // جلب اهتمامات المستخدم
    const savedPreference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'selected_categories'
        }
      }
    });

    let categoryIds: string[] = [];
    if (savedPreference && savedPreference.value) {
      const value = savedPreference.value;
      if (Array.isArray(value)) {
        categoryIds = value.filter(id => typeof id === 'string') as string[];
      }
    }

    // جلب التصنيفات
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true }
    });

    // إنشاء بيانات تجريبية للتحليلات
    const mockData = {
      readingProfile: {
        type: 'balanced',
        description: 'قارئ متوازن',
        level: 'متوسط'
      },
      categoryDistribution: {
        distribution: categories.map((cat, index) => ({
          name: cat.name,
          count: Math.floor(Math.random() * 20) + 5,
          percentage: Math.floor(100 / categories.length) + (index < 100 % categories.length ? 1 : 0),
          color: cat.color,
          icon: cat.icon
        })),
        topCategory: categories[0]?.name || 'عام',
        diversity: Math.floor(Math.random() * 40) + 60,
        recommendations: [
          'جرب قراءة مقالات من تصنيفات مختلفة لتوسيع آفاقك المعرفية',
          'اقرأ في أوقات مختلفة من اليوم لتحسين تركيزك',
          'شارك المقالات التي أعجبتك مع أصدقائك'
        ]
      },
      timePatterns: {
        bestTime: 'الصباح',
        bestDay: 'الأحد',
        hourlyDistribution: {
          6: 15, 7: 25, 8: 30, 9: 20, 10: 15, 11: 10,
          12: 8, 13: 5, 14: 12, 15: 18, 16: 22, 17: 15,
          18: 10, 19: 8, 20: 12, 21: 15, 22: 8, 23: 5
        },
        dailyDistribution: {
          'الأحد': 25,
          'الاثنين': 20,
          'الثلاثاء': 18,
          'الأربعاء': 22,
          'الخميس': 15,
          'الجمعة': 10,
          'السبت': 12
        }
      },
      stats: {
        totalArticlesRead: Math.floor(Math.random() * 50) + 15,
        totalLikes: Math.floor(Math.random() * 30) + 8,
        totalShares: Math.floor(Math.random() * 15) + 3,
        totalSaves: Math.floor(Math.random() * 20) + 5,
        totalComments: Math.floor(Math.random() * 10) + 2,
        averageReadingTime: Math.floor(Math.random() * 10) + 5,
        streakDays: Math.floor(Math.random() * 10) + 3
      },
      achievements: [
        {
          id: 'first_reader',
          name: 'قارئ مبتدئ',
          description: 'اقرأ أول مقال',
          icon: '🎯',
          color: '#10B981'
        },
        {
          id: 'liker',
          name: 'محب للقراءة',
          description: 'أعجب بـ 5 مقالات',
          icon: '❤️',
          color: '#3B82F6'
        },
        {
          id: 'active_reader',
          name: 'قارئ نشط',
          description: 'اقرأ 10 مقالات',
          icon: '📚',
          color: '#8B5CF6'
        }
      ],
      timeline: [
        {
          date: new Date().toLocaleDateString('ar-SA'),
          articlesCount: 3,
          totalReadingTime: 25,
          articles: [
            {
              time: '09:30',
              title: 'تطورات الذكاء الاصطناعي في 2024',
              category: 'تقنية',
              readingTime: 8
            },
            {
              time: '14:15',
              title: 'أحدث الأخبار الرياضية',
              category: 'رياضة',
              readingTime: 6
            },
            {
              time: '19:45',
              title: 'تحليل اقتصادي للسوق المحلي',
              category: 'اقتصاد',
              readingTime: 11
            }
          ]
        },
        {
          date: new Date(Date.now() - 86400000).toLocaleDateString('ar-SA'),
          articlesCount: 2,
          totalReadingTime: 18,
          articles: [
            {
              time: '08:20',
              title: 'أخبار محلية جديدة',
              category: 'محليات',
              readingTime: 7
            },
            {
              time: '16:30',
              title: 'مقال رأي: مستقبل التعليم',
              category: 'مقالات رأي',
              readingTime: 11
            }
          ]
        },
        {
          date: new Date(Date.now() - 172800000).toLocaleDateString('ar-SA'),
          articlesCount: 1,
          totalReadingTime: 12,
          articles: [
            {
              time: '10:00',
              title: 'فعاليات ثقافية في المدينة',
              category: 'ثقافة ومجتمع',
              readingTime: 12
            }
          ]
        }
      ],
      savedArticles: [
        {
          id: '1',
          title: 'دليل شامل للذكاء الاصطناعي',
          category: 'تقنية',
          savedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          title: 'أفضل استراتيجيات الاستثمار',
          category: 'اقتصاد',
          savedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          title: 'تاريخ الرياضة السعودية',
          category: 'رياضة',
          savedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      unfinishedArticles: [
        {
          id: '4',
          title: 'تحليل عميق للسياسة الخارجية',
          category: 'سياسة',
          readingTime: 5,
          excerpt: 'في هذا التحليل الشامل، نستكشف...'
        },
        {
          id: '5',
          title: 'تأثير التكنولوجيا على التعليم',
          category: 'تقنية',
          readingTime: 3,
          excerpt: 'تشهد العملية التعليمية تحولات جذرية...'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('Error fetching user insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user insights' },
      { status: 500 }
    );
  }
} 