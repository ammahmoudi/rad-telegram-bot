import { getPrisma } from '@rad/shared';
import { notFound } from 'next/navigation';
import AdminLayout from '../../AdminLayout';
import { UserDetailClient } from '@/components/UserDetailClient';

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  const prisma = getPrisma();

  // Fetch user with pack assignment
  const user = await prisma.telegramUser.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  // Get pack assignment
  const assignment = await prisma.userPackAssignment.findUnique({
    where: { telegramUserId: id },
    include: {
      pack: true,
    },
  });

  // Get all available packs
  const packs = await prisma.characterPack.findMany({
    orderBy: { name: 'asc' },
  });

  // Get connection statuses
  const plankaToken = await prisma.plankaToken.findUnique({
    where: { telegramUserId: id },
  });

  const rastarToken = await prisma.rastarToken.findUnique({
    where: { telegramUserId: id },
  });

  return (
    <AdminLayout>
      <UserDetailClient
        user={{
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          role: user.role,
          lastSeenAt: user.lastSeenAt,
          createdAt: user.createdAt,
        }}
        currentPack={assignment?.pack}
        availablePacks={packs}
        hasPlankaConnection={!!plankaToken}
        hasRastarConnection={!!rastarToken}
      />
    </AdminLayout>
  );
}
