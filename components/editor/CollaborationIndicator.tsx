"use client";

import React from 'react';
import { Users, Wifi, WifiOff, Save, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    position: number;
    selection?: { from: number; to: number };
  };
}

interface CollaborationIndicatorProps {
  collaborators: CollaborationUser[];
  isConnected: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
}

export function CollaborationIndicator({
  collaborators,
  isConnected,
  lastSaved,
  autoSaveEnabled,
  onToggleAutoSave
}: CollaborationIndicatorProps) {
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `منذ ${minutes} دقيقة`;
    } else if (seconds > 30) {
      return `منذ ${seconds} ثانية`;
    } else {
      return 'الآن';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b text-sm">
      {/* حالة الاتصال والمتعاونين */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        {/* حالة الاتصال */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-green-700">متصل</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-red-700">غير متصل</span>
            </>
          )}
        </div>

        {/* المتعاونون */}
        {collaborators.length > 0 && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">
              {collaborators.length} مستخدم يحرر الآن
            </span>
            
            {/* أيقونات المتعاونين */}
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {collaborators.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-medium text-white border-2 border-white">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* إعدادات الحفظ */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        {/* آخر حفظ */}
        {lastSaved && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600">
            <Clock className="w-4 h-4" />
            <span>آخر حفظ: {formatLastSaved(lastSaved)}</span>
          </div>
        )}

        {/* تبديل الحفظ التلقائي */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-gray-700">حفظ تلقائي:</span>
          <button
            onClick={() => onToggleAutoSave(!autoSaveEnabled)}
            className="flex items-center space-x-1 rtl:space-x-reverse"
            title={autoSaveEnabled ? 'إيقاف الحفظ التلقائي' : 'تفعيل الحفظ التلقائي'}
          >
            {autoSaveEnabled ? (
              <ToggleRight className="w-5 h-5 text-green-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
            <span className={autoSaveEnabled ? 'text-green-700' : 'text-gray-500'}>
              {autoSaveEnabled ? 'مفعل' : 'معطل'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
} 