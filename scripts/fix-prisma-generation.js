#!/usr/bin/env node

console.log('🔧 إصلاح مشاكل توليد Prisma...');

const fs = require('fs');
const path = require('path');

// إنشاء مجلد lib/generated إذا لم يكن موجوداً
const generatedDir = path.join(process.cwd(), 'lib', 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
  console.log('📁 تم إنشاء مجلد lib/generated');
}

// إنشاء ملف prisma client مؤقت
const prismaClientPath = path.join(generatedDir, 'prisma');
if (!fs.existsSync(prismaClientPath)) {
  fs.mkdirSync(prismaClientPath, { recursive: true });
  console.log('📁 تم إنشاء مجلد prisma client');
}

// إنشاء ملف index.js مؤقت
const indexPath = path.join(prismaClientPath, 'index.js');
if (!fs.existsSync(indexPath)) {
  const fallbackClient = `
// Fallback Prisma Client للبناء
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = { PrismaClient, prisma };
`;
  
  fs.writeFileSync(indexPath, fallbackClient);
  console.log('✅ تم إنشاء Prisma Client مؤقت');
}

// إنشاء ملف package.json للمولد
const packagePath = path.join(prismaClientPath, 'package.json');
if (!fs.existsSync(packagePath)) {
  const packageJson = {
    name: "@prisma/client",
    version: "6.11.1",
    main: "index.js",
    types: "index.d.ts"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ تم إنشاء package.json للمولد');
}

// إنشاء ملف types
const typesPath = path.join(prismaClientPath, 'index.d.ts');
if (!fs.existsSync(typesPath)) {
  const types = `
export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient;
export { prisma };
`;
  
  fs.writeFileSync(typesPath, types);
  console.log('✅ تم إنشاء ملف الأنواع');
}

console.log('✅ تم إصلاح مشاكل توليد Prisma'); 