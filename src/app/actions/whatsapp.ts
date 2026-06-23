'use server';

import {
  sendWhatsAppMessage as sendWhatsAppMessageSatuConnect,
  sendBulkWhatsAppMessage as sendBulkWhatsAppMessageSatuConnect,
} from '@/services/whatsapp';
import { getAll, count } from '@/lib/db';
import { getPrograms } from '@/app/actions/programs';
import type { NotificationType, WhatsAppTemplate } from '@/lib/definitions';

const COL_USERS = 'users';

export async function sendTestMessage(phoneNumber: string, message: string) {
  try {
    const result = await sendWhatsAppMessageSatuConnect(phoneNumber, message);
    if (!result.success) throw new Error(result.error || 'Unknown error from SatuConnect');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[sendTestMessage Error]', msg);
    throw new Error(msg);
  }
}

export async function sendBulkTestMessage(phoneNumbers: string, message: string) {
  try {
    const arr = phoneNumbers.split(',').map(n => n.trim()).filter(Boolean);
    if (arr.length === 0) throw new Error('Tidak ada nomor telepon yang valid.');
    await sendBulkWhatsAppMessageSatuConnect(arr, message);
    return { success: true, count: arr.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[sendBulkTestMessage Error]', msg);
    throw new Error(msg);
  }
}

export async function getLatestProgramsText(): Promise<string> {
  try {
    const programs = await getPrograms();
    const active = programs
      .filter(p => p.endDate && new Date(p.endDate as any) > new Date())
      .slice(0, 3);

    if (active.length === 0) {
      return 'Saat ini belum ada program yang sedang dibuka. Pantau terus aplikasi kami!';
    }

    let message = 'Berikut adalah program yang sedang dibuka:\n\n';
    active.forEach(p => {
      message += `*${p.title}*\nBatas Pendaftaran: ${p.endDate ? new Date(p.endDate as any).toLocaleDateString('id-ID') : 'N/A'}\nInfo: ${process.env.NEXT_PUBLIC_BASE_URL}/programs/${p.id}\n\n`;
    });
    return message;
  } catch (error) {
    console.error('[getLatestProgramsText Error]', error);
    return 'Mohon maaf, terjadi kesalahan saat mengambil data program terbaru.';
  }
}

async function getVerifiedMembers(limitCount?: number): Promise<{ phoneNumber: string }[]> {
  const users = await getAll<Record<string, unknown>>(COL_USERS, {
    where: [
      { field: 'verificationStatus', op: '==', value: 'permanent' },
      { field: 'waVerified', op: '==', value: true },
    ],
    orderBy: { field: 'createdAt', direction: 'desc' },
    ...(limitCount ? { limit: limitCount } : {}),
  });
  return users
    .filter(u => u.waNumber)
    .map(u => ({ phoneNumber: u.waNumber as string }));
}

export async function getVerifiedMemberCount(): Promise<number> {
  return await count(COL_USERS, {
    where: [
      { field: 'verificationStatus', op: '==', value: 'permanent' },
      { field: 'waVerified', op: '==', value: true },
    ],
  });
}

export async function sendGroupJoinReminders(): Promise<{ success: boolean; count: number }> {
  const users = await getVerifiedMembers(100);
  if (users.length === 0) return { success: true, count: 0 };

  const phoneNumbers = users.map(u => u.phoneNumber.replace(/^\+/, ''));
  const message =
    'Halo Anggota Garda Lestari!\n\nKami mengundang Anda untuk bergabung ke dalam grup WhatsApp resmi kami.\n\nSilakan klik tautan di bawah ini:\nhttps://chat.whatsapp.com/LD72HX9daPxD9CxknhTmFL?mode=ems_copy_t\n\nTerima kasih!';

  const result = await sendBulkWhatsAppMessageSatuConnect(phoneNumbers, message);
  if (result.success) return { success: true, count: result.data?.sentCount || phoneNumbers.length };
  throw new Error(result.error || 'Gagal mengirim pesan pengingat massal.');
}

export async function sendVerificationReminders(): Promise<{ success: boolean; count: number }> {
  const users = await getAll<Record<string, unknown>>(COL_USERS, {
    where: [{ field: 'verificationStatus', op: '==', value: 'unverified' }],
  });
  const withPhone = users.filter(u => u.waNumber);

  if (withPhone.length === 0) return { success: true, count: 0 };

  const phoneNumbers = withPhone.map(u => (u.waNumber as string).replace(/^\+/, ''));
  const message =
    'Halo! Kami dari Garda Lestari mengingatkan Anda untuk menyelesaikan proses verifikasi akun Anda. Buka aplikasi dan klik menu verifikasi di halaman profil.';

  const result = await sendBulkWhatsAppMessageSatuConnect(phoneNumbers, message);
  if (result.success) return { success: true, count: result.data?.sentCount || phoneNumbers.length };
  throw new Error(result.error || 'Gagal mengirim pesan pengingat massal.');
}

export async function getUnverifiedUserCount(): Promise<number> {
  return await count(COL_USERS, {
    where: { field: 'verificationStatus', op: '==', value: 'unverified' },
  });
}

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
  const { getWhatsappTemplates: getTemplates } = await import('@/app/actions/settings');
  return getTemplates();
}

export async function updateWhatsappTemplates(
  templates: Record<string, Partial<WhatsAppTemplate>>
): Promise<void> {
  const { updateWhatsappTemplates: updateTemplates } = await import('@/app/actions/settings');
  return updateTemplates(templates);
}
