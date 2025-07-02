const fs = require('fs');
const path = require('path');

// مسارات الملفات
const dataDir = path.join(__dirname, '../data');
const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const filesToReset = [
  { 
    path: path.join(dataDir, 'articles.json'), 
    defaultValue: [],
    name: 'المقالات'
  },
  { 
    path: path.join(dataDir, 'user_article_interactions.json'), 
    defaultValue: [],
    name: 'تفاعلات المقالات'
  },
  { 
    path: path.join(dataDir, 'user_preferences.json'), 
    defaultValue: {
      "user_id": "علي الحازمي",
      "interests": [],
      "reading_history": [],
      "preferred_categories": [],
      "language": "ar",
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString()
    },
    name: 'تفضيلات المستخدم'
  },
  { 
    path: path.join(dataDir, 'user_loyalty_points.json'), 
    defaultValue: {
      "user_id": "علي الحازمي", 
      "total_points": 0,
      "level": "برونزي",
      "transactions": [],
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString()
    },
    name: 'نقاط الولاء'
  }
];

async function resetAllData() {
  try {
    console.log('🔄 بدء عملية إعادة تعيين جميع البيانات...');

    // التأكد من وجود مجلد النسخ الاحتياطية
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد النسخ الاحتياطية');
    }

    const resetBackupDir = path.join(backupDir, `complete_reset_${timestamp}`);
    fs.mkdirSync(resetBackupDir, { recursive: true });

    let totalFilesProcessed = 0;
    let totalDataCleared = 0;

    for (const file of filesToReset) {
      if (fs.existsSync(file.path)) {
        // قراءة البيانات الحالية
        const currentData = fs.readFileSync(file.path, 'utf8');
        let parsedData;
        
        try {
          parsedData = JSON.parse(currentData);
        } catch (e) {
          console.log(`⚠️ تعذر قراءة ${file.name} - سيتم إنشاؤه من جديد`);
          parsedData = null;
        }

        // حفظ نسخة احتياطية
        const backupFileName = path.basename(file.path, '.json') + '_backup.json';
        const backupFilePath = path.join(resetBackupDir, backupFileName);
        fs.writeFileSync(backupFilePath, currentData, 'utf8');

        // حساب عدد العناصر المحذوفة
        let itemCount = 0;
        if (Array.isArray(parsedData)) {
          itemCount = parsedData.length;
        } else if (parsedData && typeof parsedData === 'object') {
          itemCount = Object.keys(parsedData).length;
        }

        totalDataCleared += itemCount;
        console.log(`💾 تم حفظ نسخة احتياطية من ${file.name} (${itemCount} عنصر)`);
      }

      // كتابة القيم الافتراضية
      fs.writeFileSync(file.path, JSON.stringify(file.defaultValue, null, 2), 'utf8');
      console.log(`✅ تم إعادة تعيين ${file.name}`);
      totalFilesProcessed++;
    }

    console.log('\n🎉 تم إعادة تعيين جميع البيانات بنجاح!');
    console.log(`📊 إحصائيات العملية:`);
    console.log(`   - الملفات المعالجة: ${totalFilesProcessed}`);
    console.log(`   - إجمالي البيانات المحذوفة: ${totalDataCleared} عنصر`);
    console.log(`   - مجلد النسخ الاحتياطية: ${resetBackupDir}`);
    
    console.log('\n🚀 النظام جاهز تماماً لإضافة محتوى جديد!');
    console.log('💡 يمكنك الآن:');
    console.log('   1. إضافة مقالات حقيقية جديدة');
    console.log('   2. تحديد اهتماماتك الشخصية');
    console.log('   3. اختبار نظام التخصيص الذكي');
    
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين البيانات:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
resetAllData(); 