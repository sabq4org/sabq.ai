import { useEffect, useCallback, useState } from 'react';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

interface RealtimeSyncOptions {
  channel: string;
  userId: string;
  onUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRealtimeSync({ 
  channel, 
  userId, 
  onUpdate,
  onConnect,
  onDisconnect
}: RealtimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  
  const broadcast = useCallback(async (type: string, data: any) => {
    try {
      const response = await fetch('/api/sync/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          userId,
          channel,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Broadcast failed');
      }
    } catch (error) {
      console.error('Broadcast failed:', error);
      toast.error('فشل في مزامنة التحديثات');
    }
  }, [channel, userId]);

  useEffect(() => {
    // التحقق من وجود مفاتيح Pusher
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('Pusher keys not configured');
      return;
    }

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        enabledTransports: ['ws', 'wss']
      }
    );

    // مراقبة حالة الاتصال
    pusher.connection.bind('connected', () => {
      setIsConnected(true);
      onConnect?.();
      toast.success('تم الاتصال بخادم المزامنة', { icon: '🟢' });
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
      onDisconnect?.();
      toast.error('انقطع الاتصال بخادم المزامنة', { icon: '🔴' });
    });

    const channelInstance = pusher.subscribe(channel);
    
    // الاستماع لجميع أنواع التحديثات
    channelInstance.bind_global((eventName: string, data: any) => {
      // تجاهل التحديثات من نفس المستخدم
      if (data.userId === userId) return;
      
      // معالجة أنواع الأحداث المختلفة
      switch (eventName) {
        case 'content-update':
          toast.success('تم تحديث المحتوى', { icon: '📝' });
          break;
        case 'user-joined':
          setActiveUsers(prev => [...prev, data.userId]);
          toast(`${data.userName} انضم للصفحة`, { icon: '👋' });
          break;
        case 'user-left':
          setActiveUsers(prev => prev.filter(id => id !== data.userId));
          break;
        case 'interaction':
          if (data.type === 'like') {
            toast(`أعجب ${data.userName} بالمحتوى`, { icon: '❤️' });
          }
          break;
      }
      
      // تنفيذ callback التحديث
      if (onUpdate) {
        onUpdate({ type: eventName, ...data });
      }
    });

    // إرسال حدث الانضمام
    broadcast('user-joined', { 
      userName: localStorage.getItem('userName') || 'مستخدم' 
    });

    // تنظيف عند إلغاء التركيب
    return () => {
      broadcast('user-left', { 
        userName: localStorage.getItem('userName') || 'مستخدم' 
      });
      pusher.unsubscribe(channel);
      pusher.disconnect();
    };
  }, [channel, userId, onUpdate, onConnect, onDisconnect, broadcast]);

  return { 
    broadcast, 
    isConnected, 
    activeUsers 
  };
} 