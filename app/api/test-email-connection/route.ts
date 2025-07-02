import { NextRequest, NextResponse } from 'next/server';
import { testSMTPConnection } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const result = await testSMTPConnection();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing SMTP connection:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null
    }, { status: 500 });
  }
} 