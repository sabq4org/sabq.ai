import { NextRequest, NextResponse } from 'next/server';
import { buildReaderProfile } from '@/lib/services/readerProfileService';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 401 });
    }

    const profile = await buildReaderProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching reader profile:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب ملف القارئ' }, { status: 500 });
  }
} 