#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ألوان للعرض في الطرفية
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, description) {
  colorLog(`\n🔄 ${description}...`, 'cyan');
  try {
    const output = execSync(`node ${scriptName}`, { encoding: 'utf8', cwd: __dirname });
    console.log(output);
    colorLog(`✅ تم الانتهاء من ${description}`, 'green');
    return true;
  } catch (error) {
    colorLog(`❌ خطأ في ${description}: ${error.message}`, 'red');
    return false;
  }
}

function showHeader() {
  colorLog('\n' + '='.repeat(60), 'blue');
  colorLog('🖼️  نظام إدارة صور المقالات - صحيفة سبق', 'bright');
  colorLog('='.repeat(60), 'blue');
}

function showSummary() {
  colorLog('\n' + '='.repeat(60), 'blue');
  colorLog('📋 ملخص العمليات المنجزة', 'bright');
  colorLog('='.repeat(60), 'blue');
  
  // قراءة التقارير وعرض الملخص
  try {
    const reportsDir = path.join(__dirname, '../reports');
    
    if (fs.existsSync(path.join(reportsDir, 'images-summary.txt'))) {
      const summary = fs.readFileSync(path.join(reportsDir, 'images-summary.txt'), 'utf8');
      colorLog('\n📄 الملخص السريع:', 'yellow');
      console.log(summary);
    }
    
    colorLog('\n📁 التقارير المتاحة:', 'yellow');
    const reports = [
      'default-images-report.json',
      'missing-images-report.json', 
      'images-management-report.json',
      'images-summary.txt'
    ];
    
    reports.forEach(report => {
      const reportPath = path.join(reportsDir, report);
      if (fs.existsSync(reportPath)) {
        colorLog(`   ✅ ${report}`, 'green');
      } else {
        colorLog(`   ❌ ${report}`, 'red');
      }
    });
    
  } catch (error) {
    colorLog(`❌ خطأ في قراءة التقارير: ${error.message}`, 'red');
  }
}

function showUsage() {
  colorLog('\n📖 كيفية الاستخدام:', 'yellow');
  colorLog('  node scripts/setup-images.js [command]', 'cyan');
  colorLog('\nالأوامر المتاحة:', 'yellow');
  colorLog('  all       - تشغيل جميع العمليات (افتراضي)', 'cyan');
  colorLog('  create    - إنشاء الصور الافتراضية فقط', 'cyan');
  colorLog('  add       - إضافة الصور للمقالات فقط', 'cyan');
  colorLog('  manage    - تحليل وإدارة الصور فقط', 'cyan');
  colorLog('  help      - عرض هذه المساعدة', 'cyan');
}

function main() {
  const command = process.argv[2] || 'all';
  
  showHeader();
  
  if (command === 'help') {
    showUsage();
    return;
  }
  
  let success = true;
  
  switch (command) {
    case 'create':
      success = runScript('create-default-images.js', 'إنشاء الصور الافتراضية');
      break;
      
    case 'add':
      success = runScript('add-missing-images.js', 'إضافة الصور للمقالات');
      break;
      
    case 'manage':
      success = runScript('manage-images.js', 'تحليل وإدارة الصور');
      break;
      
    case 'all':
    default:
      colorLog('\n🚀 بدء تشغيل نظام إدارة الصور الشامل...', 'bright');
      
      // 1. إنشاء الصور الافتراضية
      success &= runScript('create-default-images.js', 'إنشاء الصور الافتراضية');
      
      // 2. إضافة الصور للمقالات
      if (success) {
        success &= runScript('add-missing-images.js', 'إضافة الصور للمقالات');
      }
      
      // 3. تحليل وإدارة الصور
      if (success) {
        success &= runScript('manage-images.js', 'تحليل وإدارة الصور');
      }
      break;
  }
  
  // عرض النتائج النهائية
  if (success) {
    colorLog('\n🎉 تم إنجاز جميع العمليات بنجاح!', 'green');
    showSummary();
  } else {
    colorLog('\n⚠️ تم إنجاز بعض العمليات مع وجود أخطاء', 'yellow');
  }
  
  colorLog('\n📚 للمزيد من المعلومات، راجع:', 'cyan');
  colorLog('   docs/IMAGES_MANAGEMENT_GUIDE.md', 'cyan');
  colorLog('\n' + '='.repeat(60), 'blue');
}

// تشغيل البرنامج
if (require.main === module) {
  main();
}

module.exports = { runScript, showHeader, showSummary }; 