import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// قائمة بالعمليات المحظورة
const PROTECTED_OPERATIONS = [
  'delete',
  'deleteMany',
  'drop',
  'truncate'
];

// قائمة بالجداول المحمية بشكل كامل (لا يمكن حذف أي شيء منها)
const FULLY_PROTECTED_TABLES = [
  'users',
  'articles',
  'categories',
  'comments',
  'loyalty_points',
  'activity_logs'
];

// قائمة بالجداول المسموح بالحذف منها (مع قيود)
const PARTIALLY_PROTECTED_TABLES = [
  'interactions', // يمكن حذف التفاعلات القديمة
  'analytics_data', // يمكن حذف البيانات التحليلية القديمة
  'email_logs' // يمكن حذف سجلات البريد القديمة
];

export class DatabaseProtection {
  // التحقق من العملية المطلوبة
  static isDeleteOperation(operation: string): boolean {
    return PROTECTED_OPERATIONS.includes(operation.toLowerCase());
  }

  // التحقق من الجدول المحمي
  static isProtectedTable(tableName: string): boolean {
    return FULLY_PROTECTED_TABLES.includes(tableName.toLowerCase());
  }

  // التحقق من إمكانية الحذف
  static canDelete(tableName: string, operation: string): boolean {
    // منع جميع عمليات الحذف على الجداول المحمية بالكامل
    if (this.isProtectedTable(tableName)) {
      return false;
    }

    // السماح بالحذف المحدود على الجداول المحمية جزئياً
    if (PARTIALLY_PROTECTED_TABLES.includes(tableName.toLowerCase())) {
      // يمكن إضافة شروط إضافية هنا (مثل التحقق من عمر البيانات)
      return true;
    }

    // منع الحذف على أي جدول آخر غير مدرج
    return false;
  }

  // تسجيل محاولة الحذف
  static async logDeleteAttempt(
    userId: string | null,
    tableName: string,
    operation: string,
    metadata?: any
  ) {
    try {
      // يمكن استخدام Prisma هنا لتسجيل المحاولة في activity_logs
      console.error('⚠️ محاولة حذف محظورة:', {
        userId,
        tableName,
        operation,
        timestamp: new Date().toISOString(),
        metadata
      });
      
      // يمكن إرسال تنبيه بالبريد الإلكتروني أو Slack هنا
    } catch (error) {
      console.error('خطأ في تسجيل محاولة الحذف:', error);
    }
  }

  // إنشاء رسالة خطأ واضحة
  static getErrorMessage(tableName: string, operation: string): string {
    if (this.isProtectedTable(tableName)) {
      return `عملية ${operation} محظورة على جدول ${tableName}. هذا الجدول محمي بالكامل من الحذف.`;
    }
    return `عملية ${operation} غير مسموح بها. يرجى الاتصال بمسؤول النظام.`;
  }
}

// Middleware لحماية API Routes
export function protectDatabaseMiddleware(handler: any) {
  return async (req: NextRequest, res: any) => {
    const { method, url } = req;
    
    // التحقق من عمليات DELETE
    if (method === 'DELETE') {
      // استخراج اسم الجدول من URL
      const urlParts = url?.split('/') || [];
      const tableName = urlParts[urlParts.indexOf('api') + 1];
      
      if (DatabaseProtection.isProtectedTable(tableName)) {
        // تسجيل المحاولة
        await DatabaseProtection.logDeleteAttempt(
          null, // يمكن الحصول على userId من الجلسة
          tableName,
          'DELETE',
          { url, method }
        );
        
        return NextResponse.json(
          { 
            error: DatabaseProtection.getErrorMessage(tableName, 'DELETE'),
            code: 'DELETE_NOT_ALLOWED'
          },
          { status: 403 }
        );
      }
    }
    
    // السماح بالعمليات الأخرى
    return handler(req, res);
  };
}

// Hook لـ Prisma لمنع عمليات الحذف
export function setupPrismaProtection(prisma: any) {
  // اعتراض جميع عمليات الحذف
  prisma.$use(async (params: any, next: any) => {
    // قائمة العمليات المحظورة
    const deleteOperations = ['delete', 'deleteMany'];
    
    if (deleteOperations.includes(params.action)) {
      const tableName = params.model?.toLowerCase();
      
      if (DatabaseProtection.isProtectedTable(tableName)) {
        // تسجيل المحاولة
        await DatabaseProtection.logDeleteAttempt(
          null,
          tableName,
          params.action,
          params.args
        );
        
        throw new Error(
          DatabaseProtection.getErrorMessage(tableName, params.action)
        );
      }
    }
    
    return next(params);
  });
}

// دالة للتحقق من الصلاحيات قبل الحذف
export async function checkDeletePermission(
  userId: string,
  tableName: string,
  recordId?: string
): Promise<boolean> {
  // يمكن إضافة منطق معقد للتحقق من الصلاحيات
  // مثلاً: التحقق من دور المستخدم، أو ملكية السجل
  
  // حالياً: منع جميع عمليات الحذف على الجداول المحمية
  if (DatabaseProtection.isProtectedTable(tableName)) {
    return false;
  }
  
  // يمكن إضافة استثناءات للمسؤولين
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // if (user?.role === 'super_admin') return true;
  
  return false;
}

// دالة لإنشاء نسخة احتياطية قبل أي عملية حرجة
export async function createBackupBeforeOperation(
  tableName: string,
  operation: string,
  data?: any
) {
  const backup = {
    tableName,
    operation,
    data,
    timestamp: new Date().toISOString(),
    backupId: `backup_${tableName}_${Date.now()}`
  };
  
  // يمكن حفظ النسخة الاحتياطية في ملف JSON أو جدول منفصل
  console.log('📦 تم إنشاء نسخة احتياطية:', backup);
  
  return backup;
} 