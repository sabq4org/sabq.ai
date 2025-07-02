const fs = require('fs').promises;
const path = require('path');

(async () => {
  const file = path.join(__dirname, '../app/page.tsx');
  let content = await fs.readFile(file, 'utf-8');

  // حفظ نسخة احتياطية مرة واحدة فقط
  await fs.writeFile(file + '.backup_buggy', content);

  // Regex: className="...${...}..."
  const regex = /className="([^"]*\$\{[^}]+\}[^"]*)"/g;
  content = content.replace(regex, (match, inner) => {
    // استبدال الاقتباسات المزدوجة بالتيمبل سترنغ
    return `className={\`${inner}\`}`;
  });

  // إصلاح تكرار ${"bg-white ..."} بدون backtick
  const extraRegex = /\$\{\s*'([^']+)'\s*\}/g;
  content = content.replace(extraRegex, '$1');

  await fs.writeFile(file, content);
  console.log('✅ تم إصلاح className المكسورة');
})(); 