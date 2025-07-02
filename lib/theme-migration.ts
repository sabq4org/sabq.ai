/**
 * ترحيل إعدادات الوضع الليلي القديمة إلى النظام الجديد
 */

export function migrateThemeSettings() {
  if (typeof window === 'undefined') return;

  try {
    // التحقق من وجود الإعداد القديم
    const oldDarkMode = localStorage.getItem('darkMode');
    const currentTheme = localStorage.getItem('theme');

    // إذا كان هناك إعداد قديم ولا يوجد إعداد جديد
    if (oldDarkMode !== null && !currentTheme) {
      const wasOldDarkMode = JSON.parse(oldDarkMode);
      const newTheme = wasOldDarkMode ? 'dark' : 'light';
      
      // حفظ الإعداد الجديد
      localStorage.setItem('theme', newTheme);
      
      // حذف الإعداد القديم
      localStorage.removeItem('darkMode');
      
      console.log(`تم ترحيل إعدادات الثيم: ${wasOldDarkMode ? 'داكن' : 'فاتح'}`);
    }

    // تنظيف أي إعدادات قديمة أخرى
    const oldKeys = ['dark-mode', 'dark_mode', 'darkmode'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

  } catch (error) {
    console.error('خطأ في ترحيل إعدادات الثيم:', error);
  }
}

/**
 * التأكد من تطبيق الثيم الصحيح فوراً
 */
export function applyThemeImmediately() {
  if (typeof window === 'undefined') return;

  try {
    const theme = localStorage.getItem('theme') || 'system';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // حساب ما إذا كان يجب تفعيل الوضع الليلي
    const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
    
    // تطبيق الكلاس على العنصر الجذر
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // تحديث meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', shouldBeDark ? '#111827' : '#1e40af');
    }

  } catch (error) {
    console.error('خطأ في تطبيق الثيم:', error);
  }
} 