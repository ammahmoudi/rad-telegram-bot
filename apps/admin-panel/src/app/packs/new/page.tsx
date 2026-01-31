import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { PackFormClient } from '@/components/PackFormClient';

export default async function NewPackPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎭 Create New Character Pack</h1>
          <p className="text-slate-300">Define custom system prompts and welcome messages for your AI assistant</p>
        </div>
        
        <PackFormClient />
      </div>
    </AdminLayout>
  );
}
