import { NextResponse } from 'next/server'; export async function GET() { return NextResponse.json({ permissions: [], message: 'قائمة الصلاحيات' }) }
