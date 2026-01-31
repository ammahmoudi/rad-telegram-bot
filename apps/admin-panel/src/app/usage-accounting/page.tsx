import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { UsageAccountingClient } from '@/components/UsageAccountingClient';

export default async function UsageAccountingPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <UsageAccountingClient />
      </div>
    </AdminLayout>
  );
}
