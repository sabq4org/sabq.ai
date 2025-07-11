import UserManagement from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'إدارة المستخدمين | Sabq AI CMS',
  description: 'إدارة المستخدمين والصلاحيات في نظام Sabq AI CMS',
}; 