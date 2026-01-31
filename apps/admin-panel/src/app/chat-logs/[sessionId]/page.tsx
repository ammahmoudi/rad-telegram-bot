import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { ChatSessionView } from '@/components/ChatSessionView';

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const session = await auth();
  const { sessionId } = await params;
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <ChatSessionView sessionId={sessionId} />
      </div>
    </AdminLayout>
  );
}
