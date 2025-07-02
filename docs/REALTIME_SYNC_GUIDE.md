# دليل التزامن الفوري لمشروع Sabq AI CMS

## 📅 التاريخ: 2025-01-30

## 🎯 الهدف
ضمان تزامن البيانات الفوري بين جميع المتصفحات (Chrome, Safari, Firefox) أثناء التطوير والإنتاج.

## 🛠️ الحلول المتاحة

### 1. Pusher (الحل الموصى به)
**المميزات:**
- سهل التطبيق
- يدعم WebSocket
- خطة مجانية سخية (200k رسالة/يوم)
- يعمل مع Next.js 15

**التطبيق:**
```bash
npm install pusher pusher-js
```

### 2. Supabase Realtime
**المميزات:**
- مدمج مع قاعدة البيانات
- يدعم PostgreSQL (يمكن استخدامه مع MySQL)
- مجاني للمشاريع الصغيرة

### 3. Socket.io (للتحكم الكامل)
**المميزات:**
- تحكم كامل
- يعمل محلياً
- مناسب للتطوير

## 📝 مثال تطبيقي: محرر المقالات الذكي

### 1. إعداد Pusher

#### أ) متغيرات البيئة (.env.local)
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

#### ب) API Route للبث
```typescript
// app/api/sync/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import prisma from '@/lib/prisma';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export async function POST(request: NextRequest) {
  try {
    const { type, data, userId, articleId } = await request.json();
    
    // حفظ في قاعدة البيانات أولاً
    if (type === 'content-update' && articleId) {
      await prisma.article.update({
        where: { id: articleId },
        data: {
          content: data.content,
          updated_at: new Date()
        }
      });
    }
    
    // بث التحديث لجميع المستخدمين
    await pusher.trigger(
      `article-${articleId}`, // قناة خاصة بكل مقال
      type,
      {
        ...data,
        userId,
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast' },
      { status: 500 }
    );
  }
}
```

### 2. Hook للتزامن في React

```typescript
// hooks/useRealtimeSync.ts
import { useEffect, useCallback } from 'react';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

interface RealtimeSyncOptions {
  channel: string;
  userId: string;
  onUpdate?: (data: any) => void;
}

export function useRealtimeSync({ 
  channel, 
  userId, 
  onUpdate 
}: RealtimeSyncOptions) {
  
  const broadcast = useCallback(async (type: string, data: any) => {
    try {
      await fetch('/api/sync/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          userId,
          articleId: channel.split('-')[1] // استخراج ID المقال
        })
      });
    } catch (error) {
      console.error('Broadcast failed:', error);
      toast.error('فشل في مزامنة التحديثات');
    }
  }, [channel, userId]);

  useEffect(() => {
    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
      }
    );

    const channelInstance = pusher.subscribe(channel);
    
    // الاستماع لجميع أنواع التحديثات
    channelInstance.bind_global((eventName: string, data: any) => {
      // تجاهل التحديثات من نفس المستخدم
      if (data.userId === userId) return;
      
      // إشعار المستخدم
      toast.success(`تم تحديث المحتوى من مستخدم آخر`, {
        icon: '🔄'
      });
      
      // تنفيذ callback التحديث
      if (onUpdate) {
        onUpdate({ type: eventName, ...data });
      }
    });

    return () => {
      pusher.unsubscribe(channel);
      pusher.disconnect();
    };
  }, [channel, userId, onUpdate]);

  return { broadcast };
}
```

### 3. استخدام Hook في محرر TipTap

```typescript
// components/ArticleEditor/SmartEditor.tsx
import { useEditor } from '@tiptap/react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useDebounce } from '@/hooks/useDebounce';

export function SmartEditor({ articleId, userId }: Props) {
  const [content, setContent] = useState('');
  const debouncedContent = useDebounce(content, 1000); // انتظار ثانية
  
  // إعداد التزامن الفوري
  const { broadcast } = useRealtimeSync({
    channel: `article-${articleId}`,
    userId,
    onUpdate: (data) => {
      if (data.type === 'content-update') {
        // تحديث المحرر بالمحتوى الجديد
        editor?.commands.setContent(data.content);
      }
    }
  });
  
  // إعداد محرر TipTap
  const editor = useEditor({
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
    }
  });
  
  // بث التحديثات عند تغيير المحتوى
  useEffect(() => {
    if (debouncedContent) {
      broadcast('content-update', { 
        content: debouncedContent 
      });
    }
  }, [debouncedContent, broadcast]);
  
  return (
    <div className="editor-container">
      {/* واجهة المحرر */}
    </div>
  );
}
```

## 🔄 تزامن البيانات الأخرى

### 1. تزامن التفاعلات (Likes, Views, Shares)
```typescript
// عند الإعجاب بمقال
const handleLike = async () => {
  await fetch('/api/interactions', {
    method: 'POST',
    body: JSON.stringify({ 
      articleId, 
      type: 'like' 
    })
  });
  
  // بث التحديث فوراً
  broadcast('interaction', { 
    type: 'like', 
    articleId 
  });
};
```

### 2. تزامن التعليقات
```typescript
// استقبال تعليق جديد
channelInstance.bind('new-comment', (data: any) => {
  setComments(prev => [...prev, data.comment]);
  toast('تعليق جديد من ' + data.userName);
});
```

## 🎨 واجهة المستخدم للتزامن

### مؤشر الاتصال
```typescript
function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  
  return (
    <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-sm ${
      isConnected ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {isConnected ? '🟢 متصل' : '🔴 غير متصل'}
    </div>
  );
}
```

### مؤشر المستخدمين النشطين
```typescript
function ActiveUsers({ users }: { users: User[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        {users.length} مستخدم نشط
      </span>
      <div className="flex -space-x-2">
        {users.map(user => (
          <img
            key={user.id}
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
        ))}
      </div>
    </div>
  );
}
```

## 🚀 نصائح للأداء

1. **استخدام Debounce**: لتقليل عدد الرسائل
2. **تجميع التحديثات**: إرسال دفعة واحدة بدلاً من رسائل متعددة
3. **التخزين المؤقت**: حفظ البيانات محلياً وتحديثها تدريجياً
4. **الأولويات**: تحديد أولوية للرسائل المهمة

## 📊 مراقبة الأداء

```typescript
// تتبع عدد الرسائل
let messageCount = 0;
const MAX_MESSAGES_PER_MINUTE = 100;

function trackMessage() {
  messageCount++;
  if (messageCount > MAX_MESSAGES_PER_MINUTE) {
    console.warn('تجاوز حد الرسائل المسموح');
  }
}

// إعادة تعيين العداد كل دقيقة
setInterval(() => {
  messageCount = 0;
}, 60000);
```

## 🔐 الأمان

1. **التحقق من الهوية**: التأكد من أن المستخدم مصرح له
2. **تشفير البيانات**: خاصة للمحتوى الحساس
3. **حد المعدل**: منع إرسال رسائل كثيرة
4. **التحقق من المحتوى**: فلترة المحتوى الضار

## 📱 دعم الأجهزة المحمولة

- استخدام Service Workers للعمل offline
- تزامن البيانات عند استعادة الاتصال
- تحسين استهلاك البطارية

## 🎉 الخلاصة

بتطبيق هذا النظام، ستحصل على:
- ✅ تزامن فوري بين جميع المتصفحات
- ✅ تجربة مستخدم سلسة
- ✅ حفظ تلقائي للبيانات
- ✅ إشعارات فورية بالتحديثات
- ✅ دعم العمل التعاوني 