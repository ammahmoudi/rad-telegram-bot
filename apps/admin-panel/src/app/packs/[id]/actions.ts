'use server';

import { getPrisma } from '@rad/shared';
import { redirect } from 'next/navigation';

export async function updateMessage(formData: FormData) {
  const prisma = getPrisma();
  const packId = formData.get('packId') as string;
  const language = formData.get('language') as string;
  const messageType = formData.get('messageType') as string;
  const content = formData.get('content') as string;

  await prisma.packMessage.upsert({
    where: {
      packId_language_messageType: {
        packId,
        language: language as 'en' | 'fa',
        messageType: messageType as 'system_prompt' | 'welcome',
      },
    },
    update: {
      content,
      updatedAt: Date.now(),
    },
    create: {
      packId,
      language: language as 'en' | 'fa',
      messageType: messageType as 'system_prompt' | 'welcome',
      content,
      updatedAt: Date.now(),
    },
  });

  redirect(`/packs/${packId}`);
}

export async function updatePackInfo(formData: FormData) {
  const prisma = getPrisma();
  const packId = formData.get('packId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  await prisma.characterPack.update({
    where: { id: packId },
    data: {
      name,
      description,
      updatedAt: Date.now(),
    },
  });

  redirect(`/packs/${packId}`);
}

export async function toggleDefault(formData: FormData) {
  const prisma = getPrisma();
  const packId = formData.get('packId') as string;

  // If setting this as default, unset all others first
  await prisma.characterPack.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  await prisma.characterPack.update({
    where: { id: packId },
    data: { isDefault: true },
  });

  redirect(`/packs/${packId}`);
}
