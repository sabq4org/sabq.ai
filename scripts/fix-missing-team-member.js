const fs = require('fs');
const path = require('path');

console.log('🔍 البحث عن عضو الفريق المفقود وإصلاح المشكلة...\n');

// قراءة الملفات
const articlesPath = path.join(__dirname, '..', 'data', 'articles.json');
const teamMembersPath = path.join(__dirname, '..', 'data', 'team_members.json');
const usersPath = path.join(__dirname, '..', 'data', 'users.json');

const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const teamMembersData = JSON.parse(fs.readFileSync(teamMembersPath, 'utf8'));
const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

// المعرف المفقود
const missingTeamMemberId = 'tm-1750618269861-zhxswwcg3';

// البحث عن المستخدم "علي عبده" (المراسل)
const aliAbduhUser = usersData.users.find(u => u.email === 'sabq@icloud.com');
console.log('✅ تم العثور على المستخدم "علي عبده":', {
  id: aliAbduhUser.id,
  name: aliAbduhUser.name,
  email: aliAbduhUser.email
});

// إضافة عضو الفريق المفقود
const newTeamMember = {
  id: missingTeamMemberId,
  userId: aliAbduhUser.id,
  name: "علي عبده",
  email: "sabq@icloud.com",
  phone: "",
  roleId: "role-correspondent",
  role: "مراسل",
  department: "قسم الأخبار",
  joinDate: "2025-06-22T18:51:09.861Z",
  lastActive: new Date().toISOString(),
  status: "active",
  avatar: null,
  permissions: [
    "create_articles",
    "edit_articles",
    "manage_media",
    "view_analytics"
  ]
};

// إضافة العضو إلى القائمة
if (!teamMembersData.teamMembers) {
  teamMembersData.teamMembers = [];
}

// التحقق من عدم وجود العضو مسبقاً
const existingMember = teamMembersData.teamMembers.find(m => m.id === missingTeamMemberId);
if (!existingMember) {
  teamMembersData.teamMembers.push(newTeamMember);
  console.log('✅ تم إضافة عضو الفريق المفقود');
} else {
  console.log('⚠️ عضو الفريق موجود بالفعل');
}

// تحديث تاريخ التحديث
teamMembersData.updated_at = new Date().toISOString();

// حفظ التغييرات
fs.writeFileSync(teamMembersPath, JSON.stringify(teamMembersData, null, 2));
console.log('✅ تم حفظ ملف أعضاء الفريق\n');

// عرض ملخص
console.log('📊 ملخص الإصلاح:');
console.log(`- تم إضافة عضو الفريق: ${newTeamMember.name} (${newTeamMember.role})`);
console.log(`- المعرف: ${newTeamMember.id}`);
console.log(`- البريد الإلكتروني: ${newTeamMember.email}`);
console.log(`- القسم: ${newTeamMember.department}`);

// عد المقالات المتأثرة
const affectedArticles = articlesData.articles.filter(a => a.author_id === missingTeamMemberId);
console.log(`\n📝 عدد المقالات المرتبطة بهذا العضو: ${affectedArticles.length}`);

console.log('\n✅ تم إصلاح المشكلة بنجاح!'); 