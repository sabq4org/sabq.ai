"use strict";
// lib/debug.ts
// أدوات تصحيح البيئة والاتصال

// تصدير الدوال بطريقة متوافقة مع ES6
export { logEnvironment, logDatabaseConnection, isProduction, isDevelopment, getEnvironmentConfig };
function logEnvironment() {
    console.log('=== معلومات البيئة ===');
    console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
    console.log('[ENV] VERCEL:', process.env.VERCEL);
    console.log('[ENV] VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('[DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('[DB] DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    console.log('=====================');
}
function logDatabaseConnection(success, error) {
    if (success) {
        console.log('✅ اتصال قاعدة البيانات ناجح');
    }
    else {
        console.error('❌ فشل اتصال قاعدة البيانات:', error?.message || 'خطأ غير معروف');
        console.error('Error code:', error?.code);
    }
}
function isProduction() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}
function isDevelopment() {
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}
function getEnvironmentConfig() {
    return {
        isProduction: isProduction(),
        isDevelopment: isDevelopment(),
        isVercel: process.env.VERCEL === '1',
        databaseUrl: process.env.DATABASE_URL,
        apiUrl: process.env.NEXT_PUBLIC_API_URL ||
            (isProduction() ? 'https://sabq-ai-cms.vercel.app' : 'http://localhost:3000'),
        debug: process.env.DEBUG_MODE === 'true'
    };
}
