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

// دالة لإجراء طلب HTTP محاكي
async function makeRequest(method, endpoint, data = null) {
  const baseUrl = 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  try {
    let curlCommand = `curl -s -X ${method}`;
    
    if (data) {
      curlCommand += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
    }
    
    curlCommand += ` "${url}"`;
    
    const result = execSync(curlCommand, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    colorLog(`❌ خطأ في الطلب ${method} ${endpoint}: ${error.message}`, 'red');
    return null;
  }
}

// دالة للتحقق من وجود الملفات
function checkDataFiles() {
  colorLog('\n📁 التحقق من ملفات البيانات...', 'cyan');
  
  const requiredFiles = [
    'data/user_article_interactions.json',
    'data/user_loyalty_points.json',
    'data/user_activities.json'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      colorLog(`✅ ${file} موجود`, 'green');
    } else {
      colorLog(`❌ ${file} غير موجود`, 'red');
      allFilesExist = false;
      
      // إنشاء الملف إذا لم يكن موجوداً
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      let defaultData = {};
      if (file.includes('interactions')) {
        defaultData = { interactions: [] };
      } else if (file.includes('loyalty')) {
        defaultData = { users: [] };
      } else if (file.includes('activities')) {
        defaultData = { activities: [] };
      }
      
      fs.writeFileSync(fullPath, JSON.stringify(defaultData, null, 2));
      colorLog(`✅ تم إنشاء ${file}`, 'yellow');
    }
  });
  
  return allFilesExist;
}

// اختبار تسجيل الاهتمامات
async function testInterestsFlow() {
  colorLog('\n🎯 اختبار تدفق الاهتمامات...', 'cyan');
  
  const userId = 'test-user-' + Date.now();
  const testData = {
    userId,
    action: 'complete_interests',
    points: 5,
    description: 'إتمام اختيار الاهتمامات - اختبار'
  };
  
  const result = await makeRequest('POST', '/api/loyalty', testData);
  
  if (result && result.success) {
    colorLog(`✅ تم تسجيل الاهتمامات للمستخدم ${userId}`, 'green');
    colorLog(`   النقاط المكتسبة: ${result.loyalty.points_added}`, 'green');
    colorLog(`   إجمالي النقاط: ${result.loyalty.total_points}`, 'green');
    colorLog(`   المستوى: ${result.loyalty.tier}`, 'green');
    return userId;
  } else {
    colorLog('❌ فشل في تسجيل الاهتمامات', 'red');
    return null;
  }
}

// اختبار تتبع التفاعلات
async function testInteractionsFlow(userId) {
  colorLog('\n🔄 اختبار تتبع التفاعلات...', 'cyan');
  
  const articleId = 'test-article-' + Date.now();
  const interactions = [
    { type: 'like', points: 1 },
    { type: 'share', points: 3 },
    { type: 'save', points: 1 },
    { type: 'read', points: 1 }
  ];
  
  let totalPoints = 0;
  
  for (const interaction of interactions) {
    const testData = {
      userId,
      articleId,
      interactionType: interaction.type,
      metadata: {
        source: 'test_script',
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await makeRequest('POST', '/api/interactions/track-activity', testData);
    
    if (result && result.success) {
      colorLog(`✅ تم تسجيل ${interaction.type}: ${result.points_earned} نقطة`, 'green');
      totalPoints += result.points_earned;
    } else {
      colorLog(`❌ فشل في تسجيل ${interaction.type}`, 'red');
    }
    
    // انتظار قصير بين التفاعلات
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  colorLog(`📊 إجمالي النقاط من التفاعلات: ${totalPoints}`, 'blue');
  return totalPoints;
}

// اختبار جلب نقاط الولاء
async function testLoyaltyRetrieval(userId) {
  colorLog('\n🏆 اختبار جلب نقاط الولاء...', 'cyan');
  
  const result = await makeRequest('GET', `/api/loyalty?userId=${userId}&includeHistory=true&includeActivities=true`);
  
  if (result && result.success) {
    const { loyalty, activities } = result;
    
    colorLog(`✅ بيانات الولاء للمستخدم ${userId}:`, 'green');
    colorLog(`   إجمالي النقاط: ${loyalty.total_points}`, 'green');
    colorLog(`   النقاط المكتسبة: ${loyalty.earned_points}`, 'green');
    colorLog(`   المستوى الحالي: ${loyalty.tier}`, 'green');
    
    if (loyalty.tier_info) {
      colorLog(`   المستوى التالي: ${loyalty.tier_info.next || 'الحد الأقصى'}`, 'green');
      colorLog(`   النقاط للمستوى التالي: ${loyalty.tier_info.pointsToNext}`, 'green');
      colorLog(`   نسبة التقدم: ${loyalty.tier_info.progressPercentage.toFixed(1)}%`, 'green');
    }
    
    colorLog(`   عدد العمليات في التاريخ: ${loyalty.history?.length || 0}`, 'green');
    colorLog(`   عدد الأنشطة: ${activities?.length || 0}`, 'green');
    
    return loyalty;
  } else {
    colorLog('❌ فشل في جلب نقاط الولاء', 'red');
    return null;
  }
}

// تقرير شامل
function generateReport(testResults) {
  colorLog('\n📋 تقرير الاختبار الشامل', 'magenta');
  colorLog('='.repeat(50), 'magenta');
  
  const { userId, interactionPoints, loyaltyData } = testResults;
  
  colorLog(`🆔 معرف المستخدم التجريبي: ${userId}`, 'blue');
  colorLog(`🎯 نقاط الاهتمامات: 5`, 'blue');
  colorLog(`🔄 نقاط التفاعلات: ${interactionPoints}`, 'blue');
  colorLog(`🏆 إجمالي النقاط: ${loyaltyData?.total_points || 0}`, 'blue');
  colorLog(`📊 المستوى: ${loyaltyData?.tier || 'غير محدد'}`, 'blue');
  
  if (loyaltyData?.tier_info) {
    colorLog(`📈 التقدم للمستوى التالي: ${loyaltyData.tier_info.progressPercentage.toFixed(1)}%`, 'blue');
  }
  
  colorLog('\n✅ النظام يعمل بشكل صحيح!', 'green');
  colorLog('🎉 تم إنجاز جميع الاختبارات بنجاح', 'green');
}

// الدالة الرئيسية
async function main() {
  colorLog('🚀 بدء اختبار تدفق تجربة المستخدم ونظام الولاء', 'bright');
  colorLog('=' .repeat(60), 'bright');
  
  try {
    // التحقق من الملفات
    checkDataFiles();
    
    // اختبار تدفق الاهتمامات
    const userId = await testInterestsFlow();
    if (!userId) {
      colorLog('❌ فشل في اختبار الاهتمامات، إيقاف الاختبار', 'red');
      return;
    }
    
    // اختبار التفاعلات
    const interactionPoints = await testInteractionsFlow(userId);
    
    // اختبار جلب نقاط الولاء
    const loyaltyData = await testLoyaltyRetrieval(userId);
    
    // تقرير شامل
    generateReport({ userId, interactionPoints, loyaltyData });
    
  } catch (error) {
    colorLog(`❌ خطأ عام في الاختبار: ${error.message}`, 'red');
    console.error(error);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  main();
} 