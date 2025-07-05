import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupOptions {
  tables?: string[];
  outputDir?: string;
  compress?: boolean;
}

export async function backupDatabase(options: BackupOptions = {}) {
  const {
    tables = [],
    outputDir = './backups',
    compress = true
  } = options;

  try {
    // إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجوداً
    await fs.mkdir(outputDir, { recursive: true });

    // الحصول على معلومات الاتصال من متغيرات البيئة
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL غير موجود في متغيرات البيئة');
    }

    // استخراج معلومات الاتصال من DATABASE_URL
    const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = databaseUrl.match(urlPattern);
    
    if (!match) {
      throw new Error('تنسيق DATABASE_URL غير صحيح');
    }

    const [, username, password, host, port, database] = match;

    // إنشاء اسم ملف النسخة الاحتياطية
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${database}_${timestamp}.sql`;
    const backupPath = path.join(outputDir, backupFileName);

    // بناء أمر mysqldump
    let dumpCommand = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database}`;
    
    // إضافة جداول محددة إذا تم تحديدها
    if (tables.length > 0) {
      dumpCommand += ` ${tables.join(' ')}`;
    }

    // إضافة خيارات إضافية لضمان نسخة احتياطية كاملة
    dumpCommand += ' --single-transaction --routines --triggers --add-drop-table';

    // تنفيذ النسخة الاحتياطية
    console.log('🔄 بدء النسخ الاحتياطي...');
    const { stdout, stderr } = await execAsync(`${dumpCommand} > ${backupPath}`);

    if (stderr) {
      console.warn('⚠️ تحذيرات:', stderr);
    }

    // ضغط النسخة الاحتياطية إذا طُلب ذلك
    if (compress) {
      console.log('📦 ضغط النسخة الاحتياطية...');
      await execAsync(`gzip ${backupPath}`);
      const compressedPath = `${backupPath}.gz`;
      
      // حساب حجم الملف المضغوط
      const stats = await fs.stat(compressedPath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`✅ تم إنشاء النسخة الاحتياطية: ${compressedPath}`);
      console.log(`📊 حجم الملف: ${fileSizeMB} MB`);
      
      return compressedPath;
    }

    // حساب حجم الملف
    const stats = await fs.stat(backupPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupPath}`);
    console.log(`📊 حجم الملف: ${fileSizeMB} MB`);
    
    return backupPath;
  } catch (error) {
    console.error('❌ فشل النسخ الاحتياطي:', error);
    throw error;
  }
}

// دالة لحذف النسخ الاحتياطية القديمة
export async function cleanOldBackups(outputDir: string = './backups', daysToKeep: number = 7) {
  try {
    const files = await fs.readdir(outputDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
        const filePath = path.join(outputDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️ تم حذف النسخة الاحتياطية القديمة: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ فشل تنظيف النسخ الاحتياطية القديمة:', error);
  }
}

// دالة لإنشاء نسخة احتياطية من جداول محددة
export async function backupCriticalTables() {
  const criticalTables = [
    'users',
    'articles',
    'categories',
    'comments',
    'loyalty_points',
    'activity_logs'
  ];

  return await backupDatabase({
    tables: criticalTables,
    compress: true
  });
}

// تشغيل النسخ الاحتياطي إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  (async () => {
    try {
      // إنشاء نسخة احتياطية كاملة
      await backupDatabase({ compress: true });
      
      // تنظيف النسخ القديمة (الاحتفاظ بآخر 7 أيام)
      await cleanOldBackups('./backups', 7);
    } catch (error) {
      console.error('فشل النسخ الاحتياطي:', error);
      process.exit(1);
    }
  })();
} 