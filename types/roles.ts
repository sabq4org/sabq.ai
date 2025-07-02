// أنواع البيانات للأدوار والصلاحيات

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string; // مثل: articles, ai, analytics, etc.
  action: string; // مثل: create, read, update, delete
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string; // hex color
  permissions: string[]; // array of permission IDs
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean; // للأدوار الأساسية التي لا يمكن حذفها
  users?: number; // عدد المستخدمين المرتبطين بهذا الدور
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}

// قائمة الصلاحيات المتاحة في النظام
export const SYSTEM_PERMISSIONS: Permission[] = [
  // إدارة المقالات
  { id: 'articles.create', name: 'إنشاء المقالات', description: 'إضافة مقالات جديدة', category: 'articles', action: 'create' },
  { id: 'articles.edit', name: 'تعديل المقالات', description: 'تحرير المقالات الموجودة', category: 'articles', action: 'update' },
  { id: 'articles.delete', name: 'حذف المقالات', description: 'حذف المقالات نهائياً', category: 'articles', action: 'delete' },
  { id: 'articles.publish', name: 'نشر المقالات', description: 'نشر المقالات مباشرة', category: 'articles', action: 'publish' },
  { id: 'articles.schedule', name: 'جدولة النشر', description: 'جدولة نشر المقالات', category: 'articles', action: 'schedule' },
  { id: 'articles.review', name: 'مراجعة المقالات', description: 'عرض المقالات تحت المراجعة', category: 'articles', action: 'review' },
  
  // استلام من المراسلين
  { id: 'submissions.view', name: 'عرض مقالات المراسلين', description: 'عرض المقالات المرسلة من المراسلين', category: 'submissions', action: 'read' },
  { id: 'submissions.approve', name: 'قبول/رفض المقالات', description: 'الموافقة أو رفض مقالات المراسلين', category: 'submissions', action: 'approve' },
  { id: 'submissions.comment', name: 'إضافة ملاحظات', description: 'إضافة ملاحظات على مقالات المراسلين', category: 'submissions', action: 'comment' },
  
  // الذكاء الاصطناعي
  { id: 'ai.generate', name: 'توليد محتوى بالذكاء الاصطناعي', description: 'استخدام AI لإنشاء محتوى جديد', category: 'ai', action: 'generate' },
  { id: 'ai.enhance', name: 'تحسين المحتوى بالذكاء الاصطناعي', description: 'استخدام AI لتحسين المحتوى', category: 'ai', action: 'enhance' },
  { id: 'ai.analyze', name: 'تحليل عميق بالذكاء الاصطناعي', description: 'إجراء تحليلات عميقة باستخدام AI', category: 'ai', action: 'analyze' },
  
  // التحليلات والتقارير
  { id: 'analytics.view_own', name: 'عرض إحصائياتي', description: 'عرض الإحصائيات الخاصة بالمستخدم فقط', category: 'analytics', action: 'view_own' },
  { id: 'analytics.view_all', name: 'عرض جميع الإحصائيات', description: 'عرض إحصائيات جميع المستخدمين', category: 'analytics', action: 'view_all' },
  { id: 'analytics.export', name: 'تصدير التقارير', description: 'تصدير التقارير والإحصائيات', category: 'analytics', action: 'export' },
  
  // تقويم سبق
  { id: 'calendar.view', name: 'عرض التقويم', description: 'عرض مهام التقويم', category: 'calendar', action: 'read' },
  { id: 'calendar.edit', name: 'تعديل المهام', description: 'تعديل مهام التقويم', category: 'calendar', action: 'update' },
  { id: 'calendar.assign', name: 'تخصيص المهام', description: 'تخصيص المهام للمستخدمين', category: 'calendar', action: 'assign' },
  
  // البلوكات الذكية
  { id: 'blocks.create', name: 'إنشاء بلوك', description: 'إنشاء بلوكات ذكية جديدة', category: 'blocks', action: 'create' },
  { id: 'blocks.edit', name: 'تعديل البلوكات', description: 'تعديل البلوكات الموجودة', category: 'blocks', action: 'update' },
  { id: 'blocks.delete', name: 'حذف البلوكات', description: 'حذف البلوكات الذكية', category: 'blocks', action: 'delete' },
  { id: 'blocks.reorder', name: 'ترتيب البلوكات', description: 'تغيير ترتيب البلوكات', category: 'blocks', action: 'reorder' },
  
  // إدارة الفريق
  { id: 'team.view', name: 'عرض الفريق', description: 'عرض أعضاء الفريق', category: 'team', action: 'read' },
  { id: 'team.add', name: 'إضافة عضو', description: 'إضافة أعضاء جدد للفريق', category: 'team', action: 'create' },
  { id: 'team.edit', name: 'تعديل صلاحيات', description: 'تعديل صلاحيات أعضاء الفريق', category: 'team', action: 'update' },
  { id: 'team.remove', name: 'حذف عضو', description: 'إزالة أعضاء من الفريق', category: 'team', action: 'delete' },
  
  // سجلات النظام
  { id: 'logs.view', name: 'عرض السجلات', description: 'عرض سجلات النظام', category: 'logs', action: 'read' },
  { id: 'logs.export', name: 'تصدير السجلات', description: 'تصدير سجلات النظام', category: 'logs', action: 'export' },
  { id: 'logs.filter', name: 'فلترة السجلات', description: 'البحث وفلترة السجلات', category: 'logs', action: 'filter' },
  
  // إعدادات النظام
  { id: 'settings.view', name: 'عرض الإعدادات', description: 'عرض إعدادات النظام', category: 'settings', action: 'read' },
  { id: 'settings.edit', name: 'تعديل الإعدادات', description: 'تغيير إعدادات النظام', category: 'settings', action: 'update' },
  
  // التعليقات
  { id: 'comments.moderate', name: 'إدارة التعليقات', description: 'الموافقة على التعليقات أو حذفها', category: 'comments', action: 'moderate' },
  { id: 'comments.reply', name: 'الرد على التعليقات', description: 'الرد على تعليقات المستخدمين', category: 'comments', action: 'reply' },
  
  // الوسائط
  { id: 'media.upload', name: 'رفع الوسائط', description: 'رفع الصور والفيديوهات', category: 'media', action: 'upload' },
  { id: 'media.manage', name: 'إدارة الوسائط', description: 'تنظيم وحذف الوسائط', category: 'media', action: 'manage' },
  
  // القوالب
  { id: 'templates.edit', name: 'تعديل القوالب', description: 'تعديل قوالب الموقع', category: 'templates', action: 'update' },
  { id: 'templates.create', name: 'إنشاء قوالب', description: 'إنشاء قوالب جديدة', category: 'templates', action: 'create' },
];

// دور مدير المحتوى الافتراضي
export const CONTENT_MANAGER_ROLE: Role = {
  id: 'content-manager',
  name: 'مدير محتوى',
  description: 'مدير المحتوى مسؤول عن استقبال الأخبار من المراسلين، مراجعتها، تعديلها، ومن ثم نشرها رسميًا في الصحيفة. بإمكانه أيضًا حذف المحتوى غير المناسب، والتفاعل مع فرق التحرير الأخرى لتنسيق العمل.',
  color: '#4B82F2',
  permissions: [
    'articles.create',
    'articles.edit',
    'articles.delete',
    'articles.publish',
    'articles.schedule',
    'articles.review',
    'submissions.view',
    'submissions.approve',
    'submissions.comment',
    'ai.generate',
    'ai.enhance',
    'analytics.view_own',
    'media.upload',
    'media.manage',
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isSystem: true,
};

// تصنيفات الصلاحيات للعرض في الواجهة
export const PERMISSION_CATEGORIES = {
  articles: { name: 'إدارة المقالات', icon: '📰' },
  submissions: { name: 'استلام من المراسلين', icon: '📥' },
  ai: { name: 'الذكاء الاصطناعي', icon: '🧠' },
  analytics: { name: 'التحليلات والتقارير', icon: '📊' },
  calendar: { name: 'تقويم سبق', icon: '📅' },
  blocks: { name: 'البلوكات الذكية', icon: '🧩' },
  team: { name: 'إدارة الفريق', icon: '👥' },
  logs: { name: 'سجلات النظام', icon: '📋' },
  settings: { name: 'إعدادات النظام', icon: '⚙️' },
  comments: { name: 'التعليقات', icon: '💬' },
  media: { name: 'الوسائط', icon: '🖼️' },
  templates: { name: 'القوالب', icon: '🎨' },
}; 