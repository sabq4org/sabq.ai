import UserForm from '@/components/admin/UserForm';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default function EditUserPage({ params }: EditUserPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserForm userId={params.id} isEdit={true} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'تعديل المستخدم | Sabq AI CMS',
  description: 'تعديل بيانات المستخدم في نظام Sabq AI CMS',
}; 