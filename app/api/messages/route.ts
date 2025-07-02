import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

interface Message {
  id: string;
  type: 'suggestion' | 'complaint' | 'feedback' | 'appreciation' | 'inquiry' | 'other';
  subject: string;
  message: string;
  email: string;
  file_url?: string;
  status: 'new' | 'read' | 'processed' | 'archived';
  created_at: string;
  updated_at?: string;
  response?: string;
  responded_at?: string;
  responded_by?: string;
}

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

// التأكد من وجود مجلد البيانات
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// قراءة الرسائل
async function getMessages(): Promise<Message[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // إذا لم يكن الملف موجوداً، نرجع مصفوفة فارغة
    return [];
  }
}

// حفظ الرسائل
async function saveMessages(messages: Message[]) {
  await ensureDataDir();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// GET - جلب الرسائل
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let messages = await getMessages();
    
    // تصفية حسب الحالة
    if (status) {
      messages = messages.filter(msg => msg.status === status);
    }
    
    // تصفية حسب النوع
    if (type) {
      messages = messages.filter(msg => msg.type === type);
    }
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // التصفح
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = messages.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - إرسال رسالة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!body.type || !body.subject || !body.message || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // إنشاء رسالة جديدة
    const newMessage: Message = {
      id: uuidv4(),
      type: body.type,
      subject: body.subject.substring(0, 100), // تحديد الطول الأقصى
      message: body.message,
      email: body.email,
      file_url: body.file_url,
      status: 'new',
      created_at: body.created_at || new Date().toISOString()
    };
    
    // قراءة الرسائل الحالية وإضافة الرسالة الجديدة
    const messages = await getMessages();
    messages.push(newMessage);
    
    // حفظ الرسائل
    await saveMessages(messages);
    
    // إرسال إشعار (يمكن إضافة منطق إرسال بريد إلكتروني هنا)
    
    return NextResponse.json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح',
      data: newMessage
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT - تحديث رسالة (للإدارة)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, response, responded_by } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    const messages = await getMessages();
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // تحديث الرسالة
    messages[messageIndex] = {
      ...messages[messageIndex],
      status: status || messages[messageIndex].status,
      response: response || messages[messageIndex].response,
      responded_by: responded_by || messages[messageIndex].responded_by,
      responded_at: response ? new Date().toISOString() : messages[messageIndex].responded_at,
      updated_at: new Date().toISOString()
    };
    
    await saveMessages(messages);
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث الرسالة بنجاح',
      data: messages[messageIndex]
    });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE - حذف رسالة
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    const messages = await getMessages();
    const filteredMessages = messages.filter(msg => msg.id !== id);
    
    if (messages.length === filteredMessages.length) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }
    
    await saveMessages(filteredMessages);
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
} 