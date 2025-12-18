import type { PlankaAuth, PlankaAttachment } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getAttachments(auth: PlankaAuth, cardId: string): Promise<PlankaAttachment[]> {
  const card = await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'GET',
  });
  return (card as any)?.included?.attachments ?? [];
}

export async function deleteAttachment(auth: PlankaAuth, attachmentId: string): Promise<any> {
  return await plankaFetch(auth, `/api/attachments/${encodeURIComponent(attachmentId)}`, {
    method: 'DELETE',
  });
}
