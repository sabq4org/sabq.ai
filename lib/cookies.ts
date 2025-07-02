// Helper functions for handling cookies in the browser with Safari support

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  try {
    // طريقة محسنة لقراءة الكوكيز تدعم Safari
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        try {
          return decodeURIComponent(value);
        } catch (e) {
          // في حالة فشل فك التشفير، نعيد القيمة كما هي
          return value;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Safari Debug] Error reading cookie:', error);
    return null;
  }
}

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    // إعدادات محسنة للكوكيز لدعم Safari
    const isProduction = window.location.protocol === 'https:';
    const sameSite = isProduction ? 'None' : 'Lax';
    const secure = isProduction ? '; Secure' : '';
    
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=${sameSite}${secure}`;
  } catch (error) {
    console.error('[Safari Debug] Error setting cookie:', error);
  }
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  try {
    // حذف الكوكيز بطريقة متوافقة مع Safari
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    // محاولة ثانية بدون SameSite
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  } catch (error) {
    console.error('[Safari Debug] Error deleting cookie:', error);
  }
}

// وظيفة إضافية للتحقق من دعم الكوكيز
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    // اختبار بسيط لمعرفة إذا كانت الكوكيز مفعلة
    const testKey = 'cookietest';
    setCookie(testKey, '1', 1);
    const result = getCookie(testKey) !== null;
    deleteCookie(testKey);
    return result;
  } catch (error) {
    console.error('[Safari Debug] Error checking cookies:', error);
    return false;
  }
} 