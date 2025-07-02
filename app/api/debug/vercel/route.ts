import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  console.log('--- Vercel Debug Endpoint Triggered ---');

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      DATABASE_URL_IS_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : null,
      NEXTAUTH_URL_IS_SET: !!process.env.NEXTAUTH_URL,
    },
    connection: {
      status: 'pending',
      error: null,
      errorCode: null,
      data: null,
    },
  };

  try {
    console.log('Attempting to create Prisma Client...');
    const prisma = new PrismaClient({
      log: ['warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    console.log('Prisma Client created. Attempting to connect...');

    await prisma.$connect();
    console.log('Prisma connection successful.');
    diagnostics.connection.status = '✅ SUCCESS';

    console.log('Attempting a query...');
    const userCount = await prisma.user.count();
    diagnostics.connection.data = { userCount };
    console.log(`Query successful. User count: ${userCount}`);

    await prisma.$disconnect();
    console.log('Prisma disconnected.');
    
  } catch (e: any) {
    console.error('--- PRISMA CONNECTION FAILED ---');
    console.error(e);
    console.error('---------------------------------');
    diagnostics.connection.status = '❌ FAILURE';
    diagnostics.connection.error = e.message;
    diagnostics.connection.errorCode = e.code; // Pxxxx codes are important
    diagnostics.connection.errorStack = e.stack;
  }

  console.log('--- Vercel Debug Endpoint Finished ---');
  return NextResponse.json(diagnostics);
} 