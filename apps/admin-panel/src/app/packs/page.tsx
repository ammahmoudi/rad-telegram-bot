import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPrisma } from '@rad/shared';
import AdminLayout from '../AdminLayout';
import Link from 'next/link';
import { PacksPageHeader } from '@/components/PacksPageHeader';
import { PacksClient } from '@/components/PacksClient';

export default async function PacksPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  const prisma = getPrisma();
  
  // Get all character packs
  const packs = await prisma.characterPack.findMany({
    include: {
      _count: {
        select: {
          messages: true,
          userAssignments: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <PacksPageHeader />
          <Link
            href="/packs/new"
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <span>➕</span>
            <span>New Pack</span>
          </Link>
        </div>
        
        <PacksClient packs={packs} />
      </div>
    </AdminLayout>
  );
}
