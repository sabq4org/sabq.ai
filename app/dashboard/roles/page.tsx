'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Users, Lock, X, Save, Trash2, Edit3, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Role, SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } from '@/types/roles';

export default function RolesPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: '#4B82F2'
  });

  const colors = [
    { name: 'أحمر', value: '#DC2626' },
    { name: 'أزرق', value: '#4B82F2' },
    { name: 'أخضر', value: '#10B981' },
    { name: 'برتقالي', value: '#F59E0B' },
    { name: 'بنفسجي', value: '#8B5CF6' },
    { name: 'وردي', value: '#EC4899' },
    { name: 'سماوي', value: '#06B6D4' },
    { name: 'رمادي', value: '#6B7280' }
  ];

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    
    // جلب الأدوار
    fetchRoles();
  }, []);
  
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      
      if (data.success && data.data) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showSuccess('حدث خطأ في جلب الأدوار', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string, type: 'success' | 'error' = 'success') => {
    setSuccessMessageText(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleCreateRole = async () => {
    if (!formData.name || !formData.description) {
      showSuccess('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          color: formData.color
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchRoles(); // إعادة جلب البيانات
        setFormData({ name: '', description: '', permissions: [], color: '#4B82F2' });
        setShowCreateModal(false);
        showSuccess('تم إنشاء الدور بنجاح');
      } else {
        showSuccess(data.error || 'حدث خطأ في إنشاء الدور', 'error');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showSuccess('حدث خطأ في إنشاء الدور', 'error');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;
    
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          color: formData.color
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchRoles();
        setShowEditModal(false);
        showSuccess('تم تحديث الدور بنجاح');
      } else {
        showSuccess(data.error || 'حدث خطأ في تحديث الدور', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showSuccess('حدث خطأ في تحديث الدور', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      showSuccess('لا يمكن حذف أدوار النظام الأساسية', 'error');
      return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
    
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchRoles();
        showSuccess('تم حذف الدور بنجاح');
      } else {
        showSuccess(data.error || 'حدث خطأ في حذف الدور', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showSuccess('حدث خطأ في حذف الدور', 'error');
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      color: role.color
    });
    setShowEditModal(true);
  };

  const getPermissionName = (permissionId: string) => {
    const permission = SYSTEM_PERMISSIONS.find(p => p.id === permissionId);
    return permission?.name || permissionId;
  };

  const totalUsers = roles.reduce((sum, role) => sum + (role.users || 0), 0);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`} dir="rtl">
      {/* رسالة النجاح */}
      {showSuccessMessage && (
        <div className={`fixed top-4 right-4 ${successMessageText.includes('خطأ') ? 'bg-red-500' : 'bg-green-500'} text-white p-4 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-pulse`}>
          <CheckCircle className="w-5 h-5" />
          {successMessageText}
        </div>
      )}

      {/* العنوان والوصف */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>إدارة الأدوار والصلاحيات</h1>
        <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>إدارة أدوار المستخدمين وصلاحياتهم في النظام</p>
      </div>

      {/* قسم الإحصائيات */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className={`text-sm mb-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي الأدوار</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{roles.length}</span>
                <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>دور نشط</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className={`text-sm mb-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي المستخدمين</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{totalUsers}</span>
                <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>مستخدم</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className={`text-sm mb-1 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الصلاحيات المتاحة</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{SYSTEM_PERMISSIONS.length}</span>
                <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>صلاحية</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* زر إضافة دور جديد */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className={`text-xl font-semibold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>الأدوار المتاحة</h2>
        <button 
          onClick={() => {
            setFormData({ name: '', description: '', permissions: [], color: '#4B82F2' });
            setShowCreateModal(true);
          }}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة دور جديد
        </button>
      </div>

      {/* شبكة الأدوار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          return (
            <div key={role.id} className={`rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center`}
                    style={{ backgroundColor: `${role.color}20` }}
                  >
                    <Shield className="w-6 h-6" style={{ color: role.color }} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {role.name}
                      {role.isSystem && (
                        <span className="text-xs text-gray-500 mr-2">(نظام)</span>
                      )}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditModal(role)}
                    className={`p-2 rounded-lg transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                    title="تعديل الدور"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button 
                      onClick={() => handleDeleteRole(role.id)}
                      className={`p-2 rounded-lg transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                      title="حذف الدور"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>المستخدمين</span>
                  <span className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{role.users || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>الصلاحيات</span>
                  <span className={`text-lg font-semibold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{role.permissions.length}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <span 
                        key={index} 
                        className={`text-xs px-2 py-1 rounded-lg`}
                        style={{ backgroundColor: `${role.color}20`, color: role.color }}
                      >
                        {getPermissionName(permission)}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        +{role.permissions.length - 3} أخرى
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* نوافذ منبثقة للإنشاء والتعديل */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {showCreateModal ? 'إنشاء دور جديد' : `تعديل الدور: ${selectedRole?.name}`}
                </h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setExpandedCategories([]);
                  }}
                  className={`p-2 rounded-lg transition-colors duration-300 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>اسم الدور</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    placeholder="مثال: محرر أول"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>وصف الدور</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                    placeholder="وصف مختصر لمهام ومسؤوليات هذا الدور"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>اللون</label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({...formData, color: color.value})}
                        className={`w-10 h-10 rounded-lg border-2 transition-all duration-300 ${
                          formData.color === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الصلاحيات</label>
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
                      const categoryPermissions = SYSTEM_PERMISSIONS.filter(p => p.category === categoryKey);
                      const isExpanded = expandedCategories.includes(categoryKey);
                      
                      return (
                        <div key={categoryKey} className={`border rounded-xl overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryKey)}
                            className={`w-full px-4 py-3 flex items-center justify-between transition-colors duration-300 ${
                              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{category.icon}</span>
                              <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {category.name}
                              </span>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({categoryPermissions.filter(p => formData.permissions.includes(p.id)).length}/{categoryPermissions.length})
                              </span>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          
                          {isExpanded && (
                            <div className={`p-4 space-y-2 ${darkMode ? 'bg-gray-750' : 'bg-white'}`}>
                              {/* تحديد الكل للفئة */}
                              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors border-b pb-3 mb-2">
                                <input
                                  type="checkbox"
                                  checked={categoryPermissions.every(p => formData.permissions.includes(p.id))}
                                  onChange={(e) => {
                                    const categoryPermissionIds = categoryPermissions.map(p => p.id);
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        permissions: [...new Set([...prev.permissions, ...categoryPermissionIds])]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        permissions: prev.permissions.filter(p => !categoryPermissionIds.includes(p))
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  disabled={selectedRole?.isSystem}
                                />
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  تحديد الكل
                                </span>
                              </label>
                              
                              {categoryPermissions.map((permission) => (
                                <label key={permission.id} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission.id)}
                                    onChange={() => togglePermission(permission.id)}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className={`block font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {permission.name}
                                    </span>
                                    <span className={`block text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {permission.description}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button 
                  onClick={showCreateModal ? handleCreateRole : handleEditRole}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2 font-medium transition-all duration-300"
                >
                  <Save className="w-5 h-5" />
                  {showCreateModal ? 'إنشاء الدور' : 'حفظ التغييرات'}
                </button>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setExpandedCategories([]);
                  }}
                  className={`px-6 py-3 rounded-xl border transition-all duration-300 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
