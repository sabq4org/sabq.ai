"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  user_count: number;
  team_count: number;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface RoleListProps {
  onEditRole?: (role: Role) => void;
  onDeleteRole?: (roleId: string) => void;
  refreshTrigger?: number;
}

export default function RoleList({ onEditRole, onDeleteRole, refreshTrigger }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);

  // جلب الأدوار من API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles?include_permissions=true');
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data.roles);
      } else {
        toast.error('فشل في جلب الأدوار');
      }
    } catch (error) {
      console.error('خطأ في جلب الأدوار:', error);
      toast.error('حدث خطأ في جلب الأدوار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [refreshTrigger]);

  // تفعيل/إلغاء تفعيل دور
  const toggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: currentStatus ? 'bulk_deactivate' : 'bulk_activate',
          role_ids: [roleId]
        })
      });

      if (response.ok) {
        toast.success(currentStatus ? 'تم إلغاء تفعيل الدور' : 'تم تفعيل الدور');
        fetchRoles();
      } else {
        toast.error('فشل في تحديث حالة الدور');
      }
    } catch (error) {
      toast.error('حدث خطأ في تحديث الدور');
    }
  };

  // حذف دور
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

    try {
      const response = await fetch(`/api/admin/roles?ids=${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('تم حذف الدور بنجاح');
        setRoles(roles.filter(role => role.id !== roleId));
        if (onDeleteRole) onDeleteRole(roleId);
      } else {
        const data = await response.json();
        toast.error(data.error || 'فشل في حذف الدور');
      }
    } catch (error) {
      toast.error('حدث خطأ في حذف الدور');
    }
  };

  // حذف متعدد
  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) {
      toast.error('يرجى تحديد أدوار للحذف');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${selectedRoles.length} دور؟`)) return;

    try {
      const response = await fetch(`/api/admin/roles?ids=${selectedRoles.join(',')}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('تم حذف الأدوار بنجاح');
        setSelectedRoles([]);
        fetchRoles();
      } else {
        const data = await response.json();
        toast.error(data.error || 'فشل في حذف الأدوار');
      }
    } catch (error) {
      toast.error('حدث خطأ في حذف الأدوار');
    }
  };

  // اختيار/إلغاء اختيار دور
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // اختيار/إلغاء اختيار الكل
  const toggleSelectAll = () => {
    setSelectedRoles(
      selectedRoles.length === roles.length 
        ? [] 
        : roles.map(role => role.id)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* شريط الإجراءات */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            الأدوار ({roles.length})
          </h3>
          
          <div className="flex gap-2">
            {selectedRoles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                حذف المحدد ({selectedRoles.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={selectedRoles.length === roles.length && roles.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الدور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الوصف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                المستخدمون
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRoleSelection(role.id)}
                    disabled={role.is_system}
                    className="rounded border-gray-300 disabled:opacity-50"
                  />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: role.color }}
                    >
                      {role.icon}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {role.name_ar}
                      </div>
                      <div className="text-sm text-gray-500">
                        {role.name}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {role.description_ar || role.description || '-'}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    role.is_system 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {role.is_system ? 'نظامي' : 'مخصص'}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-4">
                    <span>👥 {role.user_count}</span>
                    <span>🏢 {role.team_count}</span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    role.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {role.is_active ? 'مفعل' : 'غير مفعل'}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPermissions(
                        showPermissions === role.id ? null : role.id
                      )}
                      className="text-blue-600 hover:text-blue-900"
                      title="عرض الصلاحيات"
                    >
                      🔑
                    </button>
                    
                    {onEditRole && (
                      <button
                        onClick={() => onEditRole(role)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="تعديل"
                      >
                        ✏️
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleRoleStatus(role.id, role.is_active)}
                      className={`${
                        role.is_active 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={role.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                    >
                      {role.is_active ? '⏸️' : '▶️'}
                    </button>
                    
                    {!role.is_system && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* عرض الصلاحيات */}
      {showPermissions && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {(() => {
            const role = roles.find(r => r.id === showPermissions);
            return role ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  صلاحيات دور "{role.name_ar}"
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <div 
                        key={permission.id}
                        className="bg-white p-2 rounded border text-sm"
                      >
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-xs text-gray-500">{permission.code}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 col-span-full">
                      لا توجد صلاحيات مرتبطة بهذا الدور
                    </div>
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* رسالة عدم وجود بيانات */}
      {roles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">📝</div>
          <h3 className="text-gray-900 font-medium">لا توجد أدوار</h3>
          <p className="text-gray-500 mt-1">ابدأ بإنشاء أول دور في النظام</p>
        </div>
      )}
    </div>
  );
} 