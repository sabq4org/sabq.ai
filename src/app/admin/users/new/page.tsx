import UserForm from '@/components/admin/UserForm';

export default function NewUserPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'إضافة مستخدم جديد | Sabq AI CMS',
  description: 'إضافة مستخدم جديد إلى نظام Sabq AI CMS',
}; 