'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  icon?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  read: boolean;
  created_at: string;
  time_ago: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface NotificationBellProps {
  userId: string;
  className?: string;
}

export default function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'loyalty' | 'interaction'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchNotifications();
    initializeWebSocket();
    
    // إغلاق القائمة عند النقر خارجها
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const initializeWebSocket = () => {
    try {
      // تهيئة WebSocket للإشعارات الفورية
      const socket = new WebSocket(`ws://localhost:3001/socket.io/?userId=${userId}`);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        // الانضمام إلى غرفة المستخدم
        socket.send(JSON.stringify({
          type: 'join_user_room',
          userId: userId
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_notification') {
          handleNewNotification(data.notification);
        } else if (data.type === 'notification_updated') {
          handleNotificationUpdate(data.notificationId, data.updates);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        // إعادة الاتصال بعد 5 ثوان
        setTimeout(initializeWebSocket, 5000);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      // استخدام polling كبديل
      startPolling();
    }
  };

  const startPolling = () => {
    // تحديث الإشعارات كل 30 ثانية
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/notifications?limit=20`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب الإشعارات');
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.stats.unread);
      } else {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // إشعار المتصفح
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/favicon.ico'
      });
    }
  };

  const handleNotificationUpdate = (notificationId: string, updates: any) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, ...updates }
          : notif
      )
    );
    
    if (updates.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
          action: 'read'
        })
      });

      if (response.ok) {
        handleNotificationUpdate(notificationId, { read: true });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'read',
          all: true
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          return notification && !notification.read ? prev - 1 : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'loyalty':
        return notifications.filter(n => n.category === 'loyalty');
      case 'interaction':
        return notifications.filter(n => n.category === 'interaction');
      default:
        return notifications;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200';
      case 'high':
        return 'bg-orange-100 border-orange-200';
      case 'normal':
        return 'bg-blue-100 border-blue-200';
      case 'low':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon) return icon;
    
    const typeIcons: Record<string, string> = {
      comment_reply: '💬',
      like_received: '❤️',
      badge_earned: '🏆',
      achievement_unlocked: '🎯',
      level_up: '⬆️',
      article_shared: '🔗',
      content_reported: '🚨',
      streak_milestone: '🔥',
      point_milestone: '🏅'
    };
    
    return typeIcons[type] || '📢';
  };

  // طلب إذن الإشعارات
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* زر الجرس */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* عداد الإشعارات غير المقروءة */}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* رأس القائمة */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            
            {/* فلاتر */}
            <div className="flex space-x-2 text-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full ${
                  filter === 'unread' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                غير مقروء ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('loyalty')}
                className={`px-3 py-1 rounded-full ${
                  filter === 'loyalty' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                النقاط
              </button>
              <button
                onClick={() => setFilter('interaction')}
                className={`px-3 py-1 rounded-full ${
                  filter === 'interaction' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                التفاعل
              </button>
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                جاري التحميل...
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            )}

            {!loading && !error && getFilteredNotifications().length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>لا توجد إشعارات</p>
              </div>
            )}

            {!loading && !error && getFilteredNotifications().map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                } ${getPriorityColor(notification.priority)}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.action_url) {
                    window.location.href = notification.action_url;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* أيقونة الإشعار */}
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.icon)}
                  </div>
                  
                  {/* محتوى الإشعار */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {notification.time_ago}
                      </span>
                      
                      {notification.sender && (
                        <span className="text-xs text-gray-500">
                          من {notification.sender.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* أزرار الإجراءات */}
                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="تحديد كمقروء"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* تذييل القائمة */}
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                // الانتقال إلى صفحة جميع الإشعارات
                window.location.href = `/notifications`;
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800"
            >
              عرض جميع الإشعارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 