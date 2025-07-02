'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, Send, Eye, Globe, MapPin, Clock, User, RefreshCw, CheckCircle, AlertTriangle,
  Sparkles
} from 'lucide-react';

interface FormData {
  title: string;
  subtitle?: string;
  description: string;
  category_id: number;
  subcategory_id?: number;
  is_breaking: boolean;
  is_featured: boolean;
  is_smart_newsletter?: boolean;
  publish_time: string;
  author_id: string;
  scope: 'local' | 'international';
  status: 'draft' | 'review' | 'published';
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface PublishPanelProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  onSave: (status: 'draft' | 'review' | 'published') => void;
  saving: boolean;
}

interface Author {
  id: string;
  name: string;
  role: string;
}

export default function PublishPanel({ 
  formData, 
  setFormData, 
  onSave, 
  saving 
}: PublishPanelProps) {
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [customTime, setCustomTime] = useState('');
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);

  // إصلاح مشكلة Hydration للتوقيت
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTimeDisplay(new Date(formData.publish_time).toLocaleString('ar-SA'));
    };
    updateTime();
    
    // تحديث التوقيت كل ثانية إذا كان في وضع النشر الفوري
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [formData.publish_time]);

  // تحميل أعضاء الفريق من API
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await fetch('/api/team-members');
        const result = await res.json();
        if (res.ok && result.success && Array.isArray(result.data)) {
          const eligibleAuthors = result.data
            .filter((member: any) => member.isActive && ['admin', 'editor', 'media', 'correspondent', 'content-manager'].includes(member.roleId))
            .map((member: any) => ({
              id: member.id,
              name: member.name,
              role: getRoleDisplayName(member.roleId)
            }));
          setAuthors(eligibleAuthors);
        }
      } catch (err) {
        console.error('خطأ في تحميل أعضاء الفريق:', err);
        // استخدام قائمة افتراضية في حالة الخطأ
        setAuthors([
          { id: 'current_user', name: 'المحرر الحالي', role: 'محرر' }
        ]);
      }
    };

    fetchAuthors();
  }, []);

  const getRoleDisplayName = (roleId: string): string => {
    const roleNames: { [key: string]: string } = {
      'admin': 'مدير',
      'editor': 'محرر',
      'media': 'إعلامي',
      'correspondent': 'مراسل',
      'content-manager': 'مدير محتوى'
    };
    return roleNames[roleId] || roleId;
  };

  const handleScheduleTime = (mode: 'now' | 'schedule') => {
    setScheduleMode(mode);
    if (mode === 'now') {
      setFormData(prev => ({ ...prev, publish_time: new Date().toISOString() }));
    } else if (customTime) {
      setFormData(prev => ({ ...prev, publish_time: new Date(customTime).toISOString() }));
    }
  };

  const canPublish = formData.title.trim() && formData.category_id > 0;

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl p-6 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">🚀 إعدادات النشر</h3>
          <p className="text-gray-600 text-sm">خيارات متقدمة للنشر والتوزيع</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* الكاتب/المراسل */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <User className="inline w-4 h-4 mr-2" />
            الكاتب أو المراسل
          </label>
          <select
            value={formData.author_id}
            onChange={(e) => setFormData(prev => ({ ...prev, author_id: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {authors.map(author => (
              <option key={author.id} value={author.id}>
                {author.name} ({author.role})
              </option>
            ))}
          </select>
        </div>

        {/* النطاق الجغرافي */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Globe className="inline w-4 h-4 mr-2" />
            النطاق الجغرافي
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="local"
                checked={formData.scope === 'local'}
                onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as 'local' | 'international' }))}
                className="text-blue-600"
              />
              <span className="text-sm">🇸🇦 محلي (السعودية)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="international"
                checked={formData.scope === 'international'}
                onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as 'local' | 'international' }))}
                className="text-blue-600"
              />
              <span className="text-sm">🌍 دولي</span>
            </label>
          </div>
        </div>

        {/* مرشح للنشرة الذكية */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Sparkles className="inline w-4 h-4 mr-2 text-purple-600" />
            خيارات الذكاء الاصطناعي
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl cursor-pointer hover:from-purple-100 hover:to-indigo-100 transition-colors border border-purple-200">
              <input
                type="checkbox"
                checked={formData.is_smart_newsletter || false}
                onChange={(e) => setFormData(prev => ({ ...prev, is_smart_newsletter: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">✨ مرشح للنشرة الذكية</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">AI</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  سيتم تضمين هذا المقال في النشرة الذكية المخصصة للمستخدمين بناءً على اهتماماتهم
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* الموقع الجغرافي */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="inline w-4 h-4 mr-2" />
            الموقع الجغرافي (اختياري)
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={formData.location?.address || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { 
                  ...prev.location, 
                  address: e.target.value,
                  lat: prev.location?.lat || 0,
                  lng: prev.location?.lng || 0
                } 
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="الرياض، الدمام، جدة، أو موقع آخر..."
            />
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <MapPin className="w-4 h-4" />
              تحديد الموقع بالخريطة
            </button>
          </div>
        </div>

        {/* توقيت النشر */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Clock className="inline w-4 h-4 mr-2" />
            توقيت النشر
          </label>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === 'now'}
                  onChange={() => handleScheduleTime('now')}
                  className="text-blue-600"
                />
                <span className="text-sm">⚡ نشر فوري</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === 'schedule'}
                  onChange={() => handleScheduleTime('schedule')}
                  className="text-blue-600"
                />
                <span className="text-sm">📅 جدولة النشر</span>
              </label>
            </div>
            
            {scheduleMode === 'schedule' && (
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  if (e.target.value) {
                    setFormData(prev => ({ ...prev, publish_time: new Date(e.target.value).toISOString() }));
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
            
            <div className="text-xs text-gray-500">
              {mounted ? (
                <>توقيت النشر الحالي: {currentTimeDisplay}</>
              ) : (
                <>توقيت النشر الحالي: جارٍ التحميل...</>
              )}
            </div>
          </div>
        </div>

        {/* حالة المقال */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">حالة المقال</h4>
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            formData.status === 'draft' ? 'bg-gray-100 text-gray-700' :
            formData.status === 'review' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {formData.status === 'draft' && (
              <>
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">مسودة</span>
              </>
            )}
            {formData.status === 'review' && (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">قيد المراجعة</span>
              </>
            )}
            {formData.status === 'published' && (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">منشور</span>
              </>
            )}
          </div>
        </div>

        {/* أزرار الحفظ */}
        <div className="space-y-3 border-t pt-6">
          <button
            onClick={() => onSave('draft')}
            disabled={saving || !formData.title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ كمسودة
          </button>
          
          <button
            onClick={() => onSave('review')}
            disabled={saving || !canPublish}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            إرسال للمراجعة
          </button>
          
          <button
            onClick={() => onSave('published')}
            disabled={saving || !canPublish}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {scheduleMode === 'schedule' ? 'جدولة النشر' : 'نشر فوري'}
          </button>
        </div>

        {/* تحذيرات */}
        {!canPublish && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">مطلوب قبل النشر:</p>
              <ul className="mt-1 text-xs space-y-1">
                {!formData.title.trim() && <li>• العنوان الرئيسي</li>}
                {formData.category_id === 0 && <li>• اختيار التصنيف</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 