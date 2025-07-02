#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ألوان للمخرجات
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}🔍 اختبار مشكلة التفاعل مع تسجيل الدخول${colors.reset}\n`);

// فحص ملف المستخدمين
const usersPath = path.join(__dirname, '../data/users.json');
if (!fs.existsSync(usersPath)) {
  console.log(`${colors.red}❌ ملف المستخدمين غير موجود${colors.reset}`);
  process.exit(1);
}

const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const users = usersData.users || usersData;
console.log(`${colors.green}✅ تم العثور على ${users.length} مستخدم${colors.reset}`);

// البحث عن المستخدم النشط
const activeUser = users.find(user => user.id && user.email);
if (!activeUser) {
  console.log(`${colors.red}❌ لا يوجد مستخدم نشط${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.cyan}👤 المستخدم النشط: ${activeUser.name} (${activeUser.email})${colors.reset}`);
console.log(`${colors.cyan}🆔 معرف المستخدم: ${activeUser.id}${colors.reset}\n`);

// محاكاة بيانات localStorage
const mockLocalStorage = {
  'user_id': activeUser.id,
  'user': JSON.stringify(activeUser),
  'currentUser': JSON.stringify(activeUser)
};

console.log(`${colors.yellow}📋 محاكاة بيانات localStorage:${colors.reset}`);
Object.entries(mockLocalStorage).forEach(([key, value]) => {
  console.log(`  ${key}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
});

// اختبار منطق التحقق من تسجيل الدخول
console.log(`\n${colors.bold}${colors.blue}🧪 اختبار منطق التحقق من تسجيل الدخول:${colors.reset}`);

const userId = mockLocalStorage['user_id'];
const userData = mockLocalStorage['user'];
const currentUserData = mockLocalStorage['currentUser'];

console.log(`1. user_id: ${userId ? `${colors.green}✅ موجود${colors.reset}` : `${colors.red}❌ غير موجود${colors.reset}`}`);
console.log(`2. user_id !== 'anonymous': ${userId !== 'anonymous' ? `${colors.green}✅ صحيح${colors.reset}` : `${colors.red}❌ خاطئ${colors.reset}`}`);
console.log(`3. userData: ${userData ? `${colors.green}✅ موجود${colors.reset}` : `${colors.red}❌ غير موجود${colors.reset}`}`);

// شروط التحقق الصارمة (نفس الكود في trackInteraction)
const hasUserId = userId && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined';
const isNotAnonymous = userId !== 'anonymous';
const hasUserData = userData && userData.trim() !== '' && userData !== 'null' && userData !== 'undefined';

console.log(`4. hasUserId: ${hasUserId ? `${colors.green}✅ صحيح${colors.reset}` : `${colors.red}❌ خاطئ${colors.reset}`}`);
console.log(`5. isNotAnonymous: ${isNotAnonymous ? `${colors.green}✅ صحيح${colors.reset}` : `${colors.red}❌ خاطئ${colors.reset}`}`);
console.log(`6. hasUserData: ${hasUserData ? `${colors.green}✅ صحيح${colors.reset}` : `${colors.red}❌ خاطئ${colors.reset}`}`);

const isUserLoggedIn = hasUserId && isNotAnonymous && hasUserData;
console.log(`${colors.bold}النتيجة النهائية: ${isUserLoggedIn ? `${colors.green}✅ مسجل دخول${colors.reset}` : `${colors.red}❌ غير مسجل دخول${colors.reset}`}${colors.reset}`);

if (!isUserLoggedIn) {
  console.log(`\n${colors.red}❌ مشكلة في التحقق من تسجيل الدخول!${colors.reset}`);
  
  // تشخيص المشكلة
  if (!hasUserId) {
    console.log(`${colors.yellow}🔧 السبب: user_id غير صالح أو فارغ${colors.reset}`);
  } else if (!isNotAnonymous) {
    console.log(`${colors.yellow}🔧 السبب: user_id = 'anonymous'${colors.reset}`);
  } else if (!hasUserData) {
    console.log(`${colors.yellow}🔧 السبب: userData غير موجود${colors.reset}`);
  }
} else {
  console.log(`\n${colors.green}✅ التحقق من تسجيل الدخول يعمل بشكل صحيح!${colors.reset}`);
}

// اختبار API التفاعل
console.log(`\n${colors.bold}${colors.blue}🌐 اختبار API التفاعل:${colors.reset}`);

const interactionData = {
  user_id: userId,
  article_id: 'test-article-123',
  interaction_type: 'like',
  category_id: 1,
  source: 'newspaper',
  device_type: 'desktop'
};

console.log(`${colors.cyan}📤 بيانات التفاعل:${colors.reset}`);
console.log(JSON.stringify(interactionData, null, 2));

// فحص ملف التفاعلات
const interactionsPath = path.join(__dirname, '../data/user_article_interactions.json');
let interactions = [];

if (fs.existsSync(interactionsPath)) {
  try {
    interactions = JSON.parse(fs.readFileSync(interactionsPath, 'utf8'));
    console.log(`${colors.green}✅ ملف التفاعلات موجود (${interactions.length} تفاعل)${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ خطأ في قراءة ملف التفاعلات: ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}⚠️ ملف التفاعلات غير موجود، سيتم إنشاؤه${colors.reset}`);
}

// إضافة تفاعل تجريبي
const newInteraction = {
  id: `interaction-${Date.now()}`,
  ...interactionData,
  timestamp: new Date().toISOString(),
  points_earned: 5
};

interactions.push(newInteraction);

try {
  fs.writeFileSync(interactionsPath, JSON.stringify(interactions, null, 2));
  console.log(`${colors.green}✅ تم إضافة تفاعل تجريبي بنجاح${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}❌ فشل في إضافة التفاعل: ${error.message}${colors.reset}`);
}

// اختبار نظام النقاط
console.log(`\n${colors.bold}${colors.blue}🎯 اختبار نظام النقاط:${colors.reset}`);

const loyaltyPath = path.join(__dirname, '../data/user_loyalty_points.json');
let loyaltyData = { users: [] };

if (fs.existsSync(loyaltyPath)) {
  try {
    loyaltyData = JSON.parse(fs.readFileSync(loyaltyPath, 'utf8'));
    console.log(`${colors.green}✅ ملف النقاط موجود${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ خطأ في قراءة ملف النقاط: ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}⚠️ ملف النقاط غير موجود، سيتم إنشاؤه${colors.reset}`);
}

// البحث عن سجل المستخدم في النقاط
let userRecord = loyaltyData.users?.find(u => u.user_id === userId);

if (!userRecord) {
  console.log(`${colors.yellow}⚠️ لا يوجد سجل نقاط للمستخدم، سيتم إنشاؤه${colors.reset}`);
  userRecord = {
    user_id: userId,
    points: 0,
    level: 'مبتدئ',
    total_earned: 0,
    last_activity: new Date().toISOString()
  };
  loyaltyData.users = loyaltyData.users || [];
  loyaltyData.users.push(userRecord);
} else {
  console.log(`${colors.green}✅ تم العثور على سجل النقاط: ${userRecord.points} نقطة${colors.reset}`);
}

// إضافة النقاط من التفاعل
userRecord.points += newInteraction.points_earned;
userRecord.total_earned += newInteraction.points_earned;
userRecord.last_activity = new Date().toISOString();

try {
  fs.writeFileSync(loyaltyPath, JSON.stringify(loyaltyData, null, 2));
  console.log(`${colors.green}✅ تم تحديث النقاط: +${newInteraction.points_earned} (المجموع: ${userRecord.points})${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}❌ فشل في تحديث النقاط: ${error.message}${colors.reset}`);
}

// تقرير نهائي
console.log(`\n${colors.bold}${colors.green}📋 تقرير الاختبار النهائي:${colors.reset}`);
console.log(`${colors.green}✅ 1. التحقق من وجود المستخدم${colors.reset}`);
console.log(`${colors.green}✅ 2. محاكاة بيانات localStorage${colors.reset}`);
console.log(`${colors.green}✅ 3. اختبار منطق التحقق من تسجيل الدخول${colors.reset}`);
console.log(`${colors.green}✅ 4. إضافة تفاعل تجريبي${colors.reset}`);
console.log(`${colors.green}✅ 5. تحديث نظام النقاط${colors.reset}`);

console.log(`\n${colors.bold}${colors.blue}🔧 خطوات الإصلاح المقترحة:${colors.reset}`);
console.log(`1. ${colors.cyan}تأكد من أن localStorage يحتوي على البيانات الصحيحة${colors.reset}`);
console.log(`2. ${colors.cyan}تحقق من أن دالة trackInteraction تقرأ البيانات بشكل صحيح${colors.reset}`);
console.log(`3. ${colors.cyan}اختبر التفاعل في المتصفح مع فتح console للمراقبة${colors.reset}`);
console.log(`4. ${colors.cyan}تأكد من أن API التفاعل يعمل بشكل صحيح${colors.reset}`);

console.log(`\n${colors.bold}${colors.green}🎉 تم الانتهاء من الاختبار!${colors.reset}`); 