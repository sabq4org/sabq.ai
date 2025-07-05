const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 إصلاح مشاكل التوافق مع PostgreSQL...');

// 1. إزالة @db.DateTime(0) - غير مدعوم في PostgreSQL
schema = schema.replace(/@db\.DateTime\(0\)/g, '');

// 2. تغيير @db.LongText إلى @db.Text
schema = schema.replace(/@db\.LongText/g, '@db.Text');

// 3. إصلاح أسماء الفهارس المكررة
const indexReplacements = [
  // forum_follows
  { from: '@@index([target_type, target_id], map: "idx_target")', to: '@@index([target_type, target_id], map: "idx_forum_follows_target")' },
  { from: '@@index([user_id], map: "idx_user")', to: '@@index([user_id], map: "idx_forum_follows_user")' },
  
  // forum_notifications
  { from: '@@index([created_at], map: "idx_created")', to: '@@index([created_at], map: "idx_forum_notifications_created")' },
  
  // forum_replies
  { from: '@@index([author_id], map: "idx_author")', to: '@@index([author_id], map: "idx_forum_replies_author")' },
  { from: '@@index([created_at], map: "idx_created")', to: '@@index([created_at], map: "idx_forum_replies_created")' },
  
  // forum_reports
  { from: '@@index([target_type, target_id], map: "idx_target")', to: '@@index([target_type, target_id], map: "idx_forum_reports_target")' },
  
  // forum_reputation
  { from: '@@index([created_at], map: "idx_created")', to: '@@index([created_at], map: "idx_forum_reputation_created")' },
  { from: '@@index([user_id], map: "idx_user")', to: '@@index([user_id], map: "idx_forum_reputation_user")' },
  
  // forum_topics
  { from: '@@index([author_id], map: "idx_author")', to: '@@index([author_id], map: "idx_forum_topics_author")' },
  
  // forum_user_badges
  { from: '@@index([user_id], map: "idx_user")', to: '@@index([user_id], map: "idx_forum_user_badges_user")' },
  
  // forum_votes
  { from: '@@index([target_type, target_id], map: "idx_target")', to: '@@index([target_type, target_id], map: "idx_forum_votes_target")' },
  { from: '@@index([user_id], map: "idx_user")', to: '@@index([user_id], map: "idx_forum_votes_user")' }
];

// تطبيق إصلاحات الفهارس
indexReplacements.forEach(replacement => {
  schema = schema.replace(replacement.from, replacement.to);
});

// حفظ النسخة المعدلة
fs.writeFileSync(schemaPath, schema);

console.log('✅ تم إصلاح مشاكل التوافق!');
console.log('📋 التغييرات:');
console.log('  - إزالة @db.DateTime(0)');
console.log('  - تغيير @db.LongText إلى @db.Text');
console.log('  - إصلاح أسماء الفهارس المكررة'); 