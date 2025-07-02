#!/usr/bin/env node
// سكريبت توليد المفاتيح السرية

const crypto = require('crypto');

console.log('🔐 توليد مفاتيح سرية جديدة...\n');

// توليد مفاتيح عشوائية
const jwtSecret = crypto.randomBytes(32).toString('hex');
const nextAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 انسخ هذه القيم إلى Vercel:\n');

console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

console.log('NEXTAUTH_SECRET:');
console.log(nextAuthSecret);
console.log('');

console.log('---');
console.log('💡 نصيحة: احفظ هذه المفاتيح في مكان آمن!');
console.log('⚠️  لا تشارك هذه المفاتيح مع أي شخص!'); 