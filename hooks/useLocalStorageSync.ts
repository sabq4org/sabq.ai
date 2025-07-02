import { useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';

interface LocalStorageSyncOptions {
  key: string;
  userId: string;
  onUpdate?: (data: any) => void;
}

/**
 * Hook للتزامن بين المتصفحات على نفس الجهاز باستخدام localStorage
 * يعمل بدون أي مكتبات خارجية - مناسب للتطوير المحلي
 */
export function useLocalStorageSync({ 
  key, 
  userId, 
  onUpdate 
}: LocalStorageSyncOptions) {
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  
  const broadcast = useCallback((type: string, data: any) => {
    const event = {
      type,
      data,
      userId,
      timestamp: Date.now(),
      tabId: window.name || Math.random().toString(36)
    };
    
    // حفظ في localStorage
    const storageKey = `sync_${key}_${type}`;
    localStorage.setItem(storageKey, JSON.stringify(event));
    
    // إطلاق حدث مخصص للتبويبات في نفس النافذة
    window.dispatchEvent(new CustomEvent('localSync', { 
      detail: event 
    }));
    
    console.log('📡 Broadcasting:', type, data);
  }, [key, userId]);

  useEffect(() => {
    // الاستماع لتغييرات localStorage من تبويبات أخرى
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key?.startsWith(`sync_${key}_`)) return;
      if (!e.newValue) return;
      
      try {
        const event = JSON.parse(e.newValue);
        
        // تجاهل الأحداث من نفس المستخدم والتبويب
        if (event.userId === userId && event.tabId === (window.name || Math.random().toString(36))) {
          return;
        }
        
        console.log('📥 Received update:', event.type, event.data);
        
        // إشعار المستخدم
        switch (event.type) {
          case 'content-update':
            toast.success('تم تحديث المحتوى من تبويب آخر', { 
              icon: '🔄',
              duration: 2000 
            });
            break;
          case 'interaction':
            if (event.data.type === 'like') {
              toast('تم الإعجاب من تبويب آخر', { icon: '❤️' });
            }
            break;
        }
        
        setLastUpdate(event);
        onUpdate?.(event);
      } catch (error) {
        console.error('Error parsing storage event:', error);
      }
    };
    
    // الاستماع للأحداث المخصصة في نفس النافذة
    const handleLocalSync = (e: CustomEvent) => {
      const event = e.detail;
      if (event.userId === userId && event.tabId === (window.name || Math.random().toString(36))) {
        return;
      }
      
      console.log('📥 Received local sync:', event.type, event.data);
      setLastUpdate(event);
      onUpdate?.(event);
    };
    
    // إضافة المستمعين
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localSync' as any, handleLocalSync);
    
    // تنظيف المستمعين
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localSync' as any, handleLocalSync);
    };
  }, [key, userId, onUpdate]);
  
  // تنظيف البيانات القديمة (أكثر من 5 دقائق)
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 دقائق
      
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('sync_')) return;
        
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    };
    
    // تنظيف عند التحميل وكل دقيقة
    cleanup();
    const interval = setInterval(cleanup, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    broadcast, 
    lastUpdate 
  };
}

/**
 * مثال على الاستخدام:
 * 
 * const { broadcast } = useLocalStorageSync({
 *   key: 'article-123',
 *   userId: 'user-456',
 *   onUpdate: (event) => {
 *     if (event.type === 'content-update') {
 *       setContent(event.data.content);
 *     }
 *   }
 * });
 * 
 * // عند تحديث المحتوى
 * broadcast('content-update', { content: newContent });
 */ 