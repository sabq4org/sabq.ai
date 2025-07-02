export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'system';
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // حساب ما إذا كان يجب تفعيل الوضع الليلي
        const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
        
        // تطبيق الكلاس على العنصر الجذر
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
        
        // تحديث meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', shouldBeDark ? '#111827' : '#1e40af');
        }
      } catch (e) {
        // فقط في حالة الخطأ
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
} 