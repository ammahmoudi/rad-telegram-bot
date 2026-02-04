import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { JobEditClient } from '@/components/JobEditClient';
import { JobFormHeader } from '@/components/JobFormHeader';

export const dynamic = 'force-dynamic';

interface JobPageProps {
  params: Promise<{ name: string }>;
}

export default async function JobEditPage({ params }: JobPageProps) {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  const { name } = await params;

  return (
    <AdminLayout>
      <div className="p-8">
        <JobFormHeader mode="edit" />
        <JobEditClient jobName={name} />
      </div>
    </AdminLayout>
  );
}
