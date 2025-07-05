const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 تغيير uuid() إلى cuid()...');

// تغيير جميع @default(uuid()) إلى @default(cuid())
schema = schema.replace(/@default\(uuid\(\)\)/g, '@default(cuid())');

// تغيير جميع @default(dbgenerated("(uuid())")) إلى @default(cuid())
schema = schema.replace(/@default\(dbgenerated\("\(uuid\(\)\)"\)\)/g, '@default(cuid())');

// حفظ النسخة المعدلة
fs.writeFileSync(schemaPath, schema);

console.log('✅ تم تغيير جميع uuid() إلى cuid()!'); 