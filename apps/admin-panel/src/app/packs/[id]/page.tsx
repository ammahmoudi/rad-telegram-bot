import { getPrisma } from '@rad/shared';
import { notFound } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { toggleDefault } from './actions';
import { PackDetailClient } from '@/components/PackDetailClient';

interface PackPageProps {
  params: Promise<{ id: string }>;
}

export default async function PackPage({ params }: PackPageProps) {
  const { id } = await params;
  const prisma = getPrisma();

  const pack = await prisma.characterPack.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: [{ language: 'asc' }, { messageType: 'asc' }],
      },
      userAssignments: true,
    },
  });

  if (!pack) {
    notFound();
  }

  // Get user details for assignments
  const userIds = pack.userAssignments.map((a) => a.telegramUserId);
  const users = await prisma.telegramUser.findMany({
    where: { id: { in: userIds } },
  });

  const usersMap = new Map(users.map((u) => [u.id, u]));

  const messagesByType = pack.messages.reduce((acc, msg) => {
    const key = `${msg.messageType}_${msg.language}`;
    acc[key] = msg;
    return acc;
  }, {} as Record<string, typeof pack.messages[0]>);

  // Fallback: Use English content if Persian is empty
  const getContent = (messageType: string, language: string) => {
    const msg = messagesByType[`${messageType}_${language}`];
    if (msg?.content) return msg.content;
    
    // Fallback to English if Persian is empty
    if (language === 'fa') {
      const enMsg = messagesByType[`${messageType}_en`];
      return enMsg?.content || '';
    }
    return '';
  };

  return (
    <AdminLayout>
      <PackDetailClient 
        pack={pack}
        users={users}
        usersMap={usersMap}
        messagesByType={messagesByType}
      />
    </AdminLayout>
  );
}
