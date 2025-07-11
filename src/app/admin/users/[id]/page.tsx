import UserDetails from '@/components/admin/UserDetails';

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserDetails userId={params.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'تفاصيل المستخدم | Sabq AI CMS',
  description: 'عرض تفاصيل المستخدم والنشاط في نظام Sabq AI CMS',
}; 