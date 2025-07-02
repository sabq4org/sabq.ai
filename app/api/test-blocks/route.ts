import { NextResponse } from 'next/server';

export async function GET() {
  // مثال على مقال يحتوي على البلوكات الثلاثة المطلوبة
  const testArticle = {
    id: 'test-blocks-demo',
    title: 'مثال توضيحي: البلوكات الثلاثة تعمل بنجاح',
    subtitle: 'عرض توضيحي لبلوكات التغريدة والجدول والرابط',
    content: JSON.stringify({
      blocks: [
        {
          id: '1',
          type: 'paragraph',
          data: {
            text: 'مرحباً بكم في العرض التوضيحي للبلوكات الثلاثة المطلوبة. كما ترون أدناه، جميع البلوكات تعمل بشكل ممتاز:'
          }
        },
        {
          id: '2',
          type: 'heading',
          data: {
            text: '1. بلوك التغريدة (Tweet Block)',
            level: 2
          }
        },
        {
          id: '3',
          type: 'paragraph',
          data: {
            text: 'يمكنكم مشاهدة التغريدة المضمنة أدناه:'
          }
        },
        {
          id: '4',
          type: 'tweet',
          data: {
            url: 'https://twitter.com/sabqorg/status/1234567890123456789'
          }
        },
        {
          id: '5',
          type: 'heading',
          data: {
            text: '2. بلوك الجدول (Table Block)',
            level: 2
          }
        },
        {
          id: '6',
          type: 'paragraph',
          data: {
            text: 'إليكم مثال على جدول بيانات:'
          }
        },
        {
          id: '7',
          type: 'table',
          data: {
            table: {
              headers: ['المدينة', 'درجة الحرارة', 'الرطوبة', 'سرعة الرياح'],
              rows: [
                ['الرياض', '35°C', '15%', '10 كم/س'],
                ['جدة', '32°C', '65%', '15 كم/س'],
                ['الدمام', '38°C', '70%', '20 كم/س'],
                ['أبها', '22°C', '40%', '5 كم/س']
              ]
            }
          }
        },
        {
          id: '8',
          type: 'heading',
          data: {
            text: '3. بلوك الرابط (Link Block)',
            level: 2
          }
        },
        {
          id: '9',
          type: 'paragraph',
          data: {
            text: 'يمكنكم النقر على الرابط التالي للمزيد من المعلومات:'
          }
        },
        {
          id: '10',
          type: 'link',
          data: {
            url: 'https://sabq.org',
            text: 'زيارة موقع صحيفة سبق الإلكترونية'
          }
        },
        {
          id: '11',
          type: 'paragraph',
          data: {
            text: 'كما ترون، جميع البلوكات الثلاثة (التغريدة، الجدول، والرابط) تعمل بشكل ممتاز في النظام. يمكن للمحررين استخدامها لإثراء المحتوى.'
          }
        }
      ]
    }),
    featured_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    category_name: 'تقنية',
    author_name: 'فريق التطوير',
    views_count: 1000,
    created_at: new Date().toISOString(),
    reading_time: 3
  };

  return NextResponse.json({
    success: true,
    message: 'البلوكات الثلاثة مُفعّلة وتعمل بنجاح!',
    article: testArticle,
    demo_url: '/article/test-blocks-demo'
  });
} 