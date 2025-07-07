import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await context.params;

    // بيانات وهمية شاملة للكاتب
    const mockAuthors: { [key: string]: any } = {
      'dr-mohammed-ahmad': {
        id: 'dr-mohammed-ahmad',
        name: 'د. محمد الأحمد',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'خبير في التقنيات التعليمية والذكاء الاصطناعي، حاصل على دكتوراه في علوم الحاسب من جامعة الملك سعود. يركز في كتاباته على تطبيقات الذكاء الاصطناعي في التعليم ومستقبل التكنولوجيا في المملكة العربية السعودية.',
        specialization: 'تقنية التعليم والذكاء الاصطناعي',
        club: 'gold',
        yearsOfExperience: 8,
        totalArticles: 67,
        totalViews: 2450000,
        totalLikes: 89500,
        joinDate: '2016-03-15',
        achievements: [
          'أفضل كاتب تقني لعام 2023',
          'جائزة التميز في الكتابة الصحفية من الجمعية السعودية للإعلام',
          'محاضر في 15 مؤتمر دولي حول الذكاء الاصطناعي',
          'مؤلف كتابين: "الذكاء الاصطناعي في التعليم" و "مستقبل التكنولوجيا"',
          'عضو اللجنة الاستشارية لوزارة التعليم السعودية'
        ],
        isVerified: true,
        backgroundImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        // إحصائيات النشاط
        activityData: {
          mostActiveHours: [
            { hour: 9, count: 15 },
            { hour: 14, count: 12 },
            { hour: 21, count: 8 },
            { hour: 16, count: 6 },
            { hour: 11, count: 5 }
          ],
          topicsDistribution: [
            { topic: 'الذكاء الاصطناعي', count: 25, color: '#3B82F6' },
            { topic: 'التعليم الرقمي', count: 18, color: '#10B981' },
            { topic: 'التكنولوجيا المتقدمة', count: 12, color: '#F59E0B' },
            { topic: 'الأمن السيبراني', count: 8, color: '#EF4444' },
            { topic: 'الابتكار والريادة', count: 4, color: '#8B5CF6' }
          ],
          engagementTrend: [
            { month: 'يناير', engagement: 85 },
            { month: 'فبراير', engagement: 78 },
            { month: 'مارس', engagement: 92 },
            { month: 'أبريل', engagement: 88 },
            { month: 'مايو', engagement: 95 },
            { month: 'يونيو', engagement: 90 }
          ],
          averageEngagement: 88
        },
        // مقالات الكاتب
        articles: [
          {
            id: '1',
            title: 'مستقبل الذكاء الاصطناعي في التعليم السعودي: رؤية 2030',
            excerpt: 'نظرة شاملة على كيفية تغيير الذكاء الاصطناعي لمشهد التعليم في المملكة وتحقيق أهداف رؤية 2030',
            featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
            published_at: '2025-01-05T10:00:00Z',
            reading_time: 8,
            views_count: 12500,
            likes_count: 850,
            comments_count: 145,
            plays_count: 3200,
            category_name: 'تقنية',
            is_trending: true
          },
          {
            id: '2',
            title: 'تطبيقات الواقع المعزز في الفصول الدراسية: ثورة تعليمية حقيقية',
            excerpt: 'كيف يمكن للواقع المعزز أن يحول تجربة التعلم إلى مغامرة تفاعلية تحفز الطلاب على الإبداع',
            featured_image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc696?auto=format&fit=crop&w=800&q=80',
            published_at: '2025-01-02T14:30:00Z',
            reading_time: 6,
            views_count: 8900,
            likes_count: 620,
            comments_count: 89,
            plays_count: 2100,
            category_name: 'تعليم'
          },
          {
            id: '3',
            title: 'أمن البيانات في عصر التعليم الرقمي: تحديات وحلول',
            excerpt: 'التحديات الأمنية والحلول المبتكرة لحماية بيانات الطلاب في البيئة التعليمية الرقمية',
            featured_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
            published_at: '2024-12-28T09:15:00Z',
            reading_time: 10,
            views_count: 15600,
            likes_count: 1200,
            comments_count: 203,
            plays_count: 4500,
            category_name: 'أمن المعلومات'
          },
          {
            id: '4',
            title: 'البلوك تشين في التعليم: مستقبل الشهادات الرقمية',
            excerpt: 'كيف ستغير تقنية البلوك تشين طريقة إصدار وتوثيق الشهادات التعليمية في المستقبل',
            featured_image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
            published_at: '2024-12-20T16:45:00Z',
            reading_time: 7,
            views_count: 9800,
            likes_count: 720,
            comments_count: 98,
            plays_count: 2800,
            category_name: 'تقنية'
          },
          {
            id: '5',
            title: 'التعلم الآلي في خدمة التعليم الشخصي',
            excerpt: 'استخدام خوارزميات التعلم الآلي لتخصيص تجربة التعلم حسب احتياجات كل طالب',
            featured_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
            published_at: '2024-12-15T11:20:00Z',
            reading_time: 9,
            views_count: 11200,
            likes_count: 980,
            comments_count: 156,
            plays_count: 3500,
            category_name: 'تقنية'
          }
        ],
        // اقتباسات مختارة
        quotes: [
          {
            id: '1',
            text: 'الذكاء الاصطناعي ليس مجرد تقنية، بل هو ثورة حقيقية في طريقة تفكيرنا وتعلمنا واكتشاف المعرفة',
            articleTitle: 'مستقبل الذكاء الاصطناعي في التعليم السعودي',
            articleId: '1',
            timestamp: '2025-01-05T10:30:00Z',
            likes: 234
          },
          {
            id: '2',
            text: 'التعليم الرقمي لا يعني استبدال المعلم، بل تمكينه بأدوات أكثر فعالية وإبداعاً',
            articleTitle: 'تطبيقات الواقع المعزز في الفصول الدراسية',
            articleId: '2',
            timestamp: '2025-01-02T15:00:00Z',
            likes: 189
          },
          {
            id: '3',
            text: 'في عالم رقمي، الأمان ليس خياراً بل ضرورة حتمية لحماية مستقبل أطفالنا ومعرفتهم',
            articleTitle: 'أمن البيانات في عصر التعليم الرقمي',
            articleId: '3',
            timestamp: '2024-12-28T10:00:00Z',
            likes: 156
          },
          {
            id: '4',
            text: 'البلوك تشين ستجعل الشهادات التعليمية أكثر موثوقية وأقل عرضة للتزوير',
            articleTitle: 'البلوك تشين في التعليم: مستقبل الشهادات الرقمية',
            articleId: '4',
            timestamp: '2024-12-20T17:00:00Z',
            likes: 142
          }
        ]
      },
      'fatima-alnasr': {
        id: 'fatima-alnasr',
        name: 'أ. فاطمة النصر',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=300&q=80',
        bio: 'كاتبة ومحللة اقتصادية متخصصة في ريادة الأعمال وتمكين المرأة. حاصلة على ماجستير في إدارة الأعمال من جامعة الملك عبدالعزيز، وتركز في كتاباتها على التطورات الاقتصادية في المملكة ودور المرأة في رؤية 2030.',
        specialization: 'ريادة الأعمال والاقتصاد',
        club: 'silver',
        yearsOfExperience: 6,
        totalArticles: 48,
        totalViews: 1850000,
        totalLikes: 65000,
        joinDate: '2018-09-20',
        achievements: [
          'جائزة أفضل مقال اقتصادي لعام 2022',
          'عضو في مجلس الأعمال السعودي النسائي',
          'محاضرة في 8 مؤتمرات حول ريادة الأعمال',
          'مؤسسة مشاركة لمنصة "رائدات" لدعم المشاريع النسائية'
        ],
        isVerified: true,
        backgroundImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        activityData: {
          mostActiveHours: [
            { hour: 8, count: 12 },
            { hour: 13, count: 10 },
            { hour: 20, count: 8 },
            { hour: 15, count: 6 },
            { hour: 10, count: 4 }
          ],
          topicsDistribution: [
            { topic: 'ريادة الأعمال', count: 20, color: '#10B981' },
            { topic: 'تمكين المرأة', count: 15, color: '#F59E0B' },
            { topic: 'الاقتصاد السعودي', count: 8, color: '#3B82F6' },
            { topic: 'المشاريع الناشئة', count: 5, color: '#8B5CF6' }
          ],
          engagementTrend: [
            { month: 'يناير', engagement: 78 },
            { month: 'فبراير', engagement: 82 },
            { month: 'مارس', engagement: 85 },
            { month: 'أبريل', engagement: 80 },
            { month: 'مايو', engagement: 88 },
            { month: 'يونيو', engagement: 83 }
          ],
          averageEngagement: 82
        },
        articles: [
          {
            id: '6',
            title: 'تمكين المرأة السعودية في ريادة الأعمال ورؤية 2030',
            excerpt: 'رؤية تحليلية للنقلة النوعية في تمكين المرأة السعودية وريادة الأعمال في ضوء رؤية 2030',
            featured_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
            published_at: '2025-01-03T08:00:00Z',
            reading_time: 7,
            views_count: 9500,
            likes_count: 720,
            comments_count: 98,
            plays_count: 2400,
            category_name: 'اقتصاد',
            is_trending: true
          }
        ],
        quotes: [
          {
            id: '5',
            text: 'تمكين المرأة ليس مجرد شعار، بل استثمار حقيقي في مستقبل اقتصادي أكثر ازدهاراً',
            articleTitle: 'تمكين المرأة السعودية في ريادة الأعمال',
            articleId: '6',
            timestamp: '2025-01-03T09:00:00Z',
            likes: 198
          }
        ]
      }
    };

    // البحث عن الكاتب أو إرجاع كاتب افتراضي
    const author = mockAuthors[authorId] || mockAuthors['dr-mohammed-ahmad'];

    return NextResponse.json({
      success: true,
      author: {
        ...author,
        // إضافة إحصائيات محسوبة
        averageViewsPerArticle: Math.round(author.totalViews / author.totalArticles),
        averageLikesPerArticle: Math.round(author.totalLikes / author.totalArticles),
        engagementRate: ((author.totalLikes / author.totalViews) * 100).toFixed(2)
      },
      articles: author.articles,
      activityData: author.activityData,
      quotes: author.quotes
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات الكاتب:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في جلب بيانات الكاتب' 
      },
      { status: 500 }
    );
  }
} 