import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { JobCreateClient } from '@/components/JobCreateClient';
import { JobFormHeader } from '@/components/JobFormHeader';

export const dynamic = 'force-dynamic';

export default async function JobCreatePage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <JobFormHeader mode="create" />
        <JobCreateClient />
      </div>
    </AdminLayout>
  );
}
