"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Permission {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  category: string;
  is_dangerous: boolean;
}

interface Role {
  id?: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  color: string;
  icon: string;
  permission_ids?: string[];
}

interface RoleFormProps {
  role?: Role;
  onSave: (role: Role) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const colorOptions = [
  { value: '#DC2626', label: '🔴 أحمر', name: 'أحمر' },
  { value: '#7C3AED', label: '🟣 بنفسجي', name: 'بنفسجي' },
  { value: '#059669', label: '🟢 أخضر', name: 'أخضر' },
  { value: '#0D9488', label: '🟡 أزرق مخضر', name: 'أزرق مخضر' },
  { value: '#0891B2', label: '🔵 أزرق', name: 'أزرق' },
  { value: '#EA580C', label: '🟠 برتقالي', name: 'برتقالي' },
  { value: '#9333EA', label: '🟣 بنفسجي داكن', name: 'بنفسجي داكن' },
  { value: '#6B7280', label: '⚫ رمادي', name: 'رمادي' }
];

const iconOptions = [
  '👑', '⚙️', '📝', '✏️', '✍️', '🛡️', '📊', '👤', 
  '🔑', '💼', '🎯', '⭐', '🚀', '💎', '🏆', '🎨'
];

export default function RoleForm({ role, onSave, onCancel, isOpen }: RoleFormProps) {
  const [formData, setFormData] = useState<Role>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    color: '#6B7280',
    icon: '🔑',
    permission_ids: []
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // تحميل الصلاحيات
  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      if (role) {
        setFormData({
          ...role,
          permission_ids: role.permission_ids || []
        });
      } else {
        setFormData({
          name: '',
          name_ar: '',
          description: '',
          description_ar: '',
          color: '#6B7280',
          icon: '🔑',
          permission_ids: []
        });
      }
    }
  }, [isOpen, role]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.data.permissions);
      }
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الدور مطلوب';
    }

    if (!formData.name_ar.trim()) {
      newErrors.name_ar = 'الاسم العربي مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const method = role ? 'PUT' : 'POST';
      const url = role ? `/api/admin/roles/${role.id}` : '/api/admin/roles';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(role ? 'تم تحديث الدور بنجاح' : 'تم إنشاء الدور بنجاح');
        onSave(data.data.role);
      } else {
        const data = await response.json();
        toast.error(data.error || 'حدث خطأ في حفظ الدور');
      }
    } catch (error) {
      toast.error('حدث خطأ في حفظ الدور');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Role, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePermission = (permissionId: string) => {
    const currentPermissions = formData.permission_ids || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(id => id !== permissionId)
      : [...currentPermissions, permissionId];
    
    handleInputChange('permission_ids', newPermissions);
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = permissions
      .filter(p => p.category === category)
      .map(p => p.id);
    
    const currentPermissions = formData.permission_ids || [];
    const allSelected = categoryPermissions.every(id => currentPermissions.includes(id));
    
    let newPermissions;
    if (allSelected) {
      // إلغاء تحديد جميع صلاحيات الفئة
      newPermissions = currentPermissions.filter(id => !categoryPermissions.includes(id));
    } else {
      // تحديد جميع صلاحيات الفئة
      newPermissions = [...new Set([...currentPermissions, ...categoryPermissions])];
    }
    
    handleInputChange('permission_ids', newPermissions);
  };

  // تجميع الصلاحيات حسب الفئة
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      'users': 'إدارة المستخدمين',
      'content': 'إدارة المحتوى',
      'moderation': 'الإشراف والمراقبة',
      'analytics': 'التحليلات والتقارير',
      'system': 'إدارة النظام',
      'teams': 'إدارة الفرق',
      'media': 'إدارة الوسائط'
    };
    return names[category] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {role ? 'تعديل الدور' : 'إنشاء دور جديد'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* معلومات الدور الأساسية */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">معلومات الدور</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الدور (بالإنجليزية)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="مثال: content_manager"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الدور (بالعربية)
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => handleInputChange('name_ar', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name_ar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="مثال: مدير المحتوى"
                />
                {errors.name_ar && (
                  <p className="text-red-500 text-sm mt-1">{errors.name_ar}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (بالإنجليزية)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف الدور والمسؤوليات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (بالعربية)
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => handleInputChange('description_ar', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف الدور والمسؤوليات بالعربية"
                />
              </div>

              {/* اللون والأيقونة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اللون
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('color', option.value)}
                        className={`w-10 h-10 rounded-lg border-2 ${
                          formData.color === option.value 
                            ? 'border-gray-900' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الأيقونة
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleInputChange('icon', icon)}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                          formData.icon === icon 
                            ? 'border-gray-900 bg-gray-100' 
                            : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* معاينة الدور */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">معاينة</h4>
                <div className="flex items-center">
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-3"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formData.name_ar || 'اسم الدور'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formData.name || 'role_name'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* الصلاحيات */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">الصلاحيات</h3>
              
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="border-b border-gray-200 last:border-b-0">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getCategoryDisplayName(category)}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleCategoryPermissions(category)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {categoryPermissions.every(p => formData.permission_ids?.includes(p.id))
                            ? 'إلغاء الكل'
                            : 'تحديد الكل'
                          }
                        </button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {categoryPermissions.map((permission) => (
                        <label key={permission.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permission_ids?.includes(permission.id) || false}
                            onChange={() => togglePermission(permission.id)}
                            className="rounded border-gray-300 mr-2"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.name_ar}
                              {permission.is_dangerous && (
                                <span className="mr-1 text-red-500" title="صلاحية خطيرة">
                                  ⚠️
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {permission.code}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                محدد: {formData.permission_ids?.length || 0} من {permissions.length} صلاحية
              </div>
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : (role ? 'تحديث الدور' : 'إنشاء الدور')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 