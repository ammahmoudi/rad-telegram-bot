import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { ChatLogsSessionsList } from '@/components/ChatLogsSessionsList';

export default async function ChatLogsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Chat Logs</h1>
            <p className="text-slate-400">View chat sessions and all interaction logs</p>
          </div>
        </div>
        
        <ChatLogsSessionsList />
      </div>
    </AdminLayout>
  );
}
