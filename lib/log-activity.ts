interface LogActivityParams {
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  action_type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'restore' | 'publish' | 'export' | 'role_change' | 'settings_update';
  details: string;
  target_id?: string;
  target_type?: string;
  old_value?: any;
  new_value?: any;
  severity?: 'info' | 'warning' | 'critical';
}

export async function logActivity(params: LogActivityParams) {
  try {
    const response = await fetch('/api/logs/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        severity: params.severity || 'info'
      })
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
    }

    return response.json();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// دالة مساعدة للحصول على معلومات المستخدم الحالي
export function getCurrentUser() {
  // في بيئة الإنتاج، يجب الحصول على هذه المعلومات من الجلسة
  // حالياً سنستخدم قيم افتراضية للتطوير
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  
  return {
    user_id: 'admin',
    user_name: 'علي الحازمي',
    email: 'Ali@alhazmi.org',
    role: 'مدير النظام'
  };
}

// دوال مساعدة لأنواع الأحداث الشائعة
export const logActions = {
  login: (userInfo: any) => logActivity({
    ...userInfo,
    action_type: 'login',
    details: `${userInfo.user_name} سجّل دخولاً إلى النظام`
  }),

  logout: (userInfo: any) => logActivity({
    ...userInfo,
    action_type: 'logout',
    details: `${userInfo.user_name} سجّل خروجاً من النظام`
  }),

  createArticle: (userInfo: any, articleId: string, title: string) => logActivity({
    ...userInfo,
    action_type: 'create',
    details: `تم إنشاء مقال جديد: "${title}"`,
    target_id: articleId,
    target_type: 'article'
  }),

  updateArticle: (userInfo: any, articleId: string, title: string) => logActivity({
    ...userInfo,
    action_type: 'update',
    details: `تم تحديث المقال: "${title}"`,
    target_id: articleId,
    target_type: 'article'
  }),

  deleteArticle: (userInfo: any, articleId: string, title: string) => logActivity({
    ...userInfo,
    action_type: 'delete',
    details: `تم حذف المقال: "${title}"`,
    target_id: articleId,
    target_type: 'article',
    severity: 'warning'
  }),

  publishArticle: (userInfo: any, articleId: string, title: string) => logActivity({
    ...userInfo,
    action_type: 'publish',
    details: `تم نشر المقال: "${title}"`,
    target_id: articleId,
    target_type: 'article'
  }),

  updateUserRole: (userInfo: any, targetUserId: string, targetUserName: string, oldRole: string, newRole: string) => logActivity({
    ...userInfo,
    action_type: 'role_change',
    details: `تم تغيير صلاحية ${targetUserName} من ${oldRole} إلى ${newRole}`,
    target_id: targetUserId,
    target_type: 'user',
    old_value: oldRole,
    new_value: newRole,
    severity: 'critical'
  }),

  exportData: (userInfo: any, dataType: string) => logActivity({
    ...userInfo,
    action_type: 'export',
    details: `تم تصدير ${dataType}`,
    severity: 'warning'
  }),

  updateSettings: (userInfo: any, settingName: string, oldValue: any, newValue: any) => logActivity({
    ...userInfo,
    action_type: 'settings_update',
    details: `تم تحديث الإعداد: ${settingName}`,
    old_value: oldValue,
    new_value: newValue,
    severity: 'warning'
  })
}; 