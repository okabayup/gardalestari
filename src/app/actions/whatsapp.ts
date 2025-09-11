
'use server';

import { getWhatsAppBot, startWhatsAppBot, stopWhatsAppBot, logoutWhatsAppBot } from '@/services/whatsapp-bot';
import { revalidatePath } from 'next/cache';

export async function getBotStatus() {
  const bot = await getWhatsAppBot();
  return {
    status: bot.status,
    qr: bot.qr,
  };
}

export async function startBot() {
  await startWhatsAppBot();
  revalidatePath('/panel/whatsapp');
  return { success: true };
}

export async function stopBot() {
  await stopWhatsAppBot();
  revalidatePath('/panel/whatsapp');
  return { success: true };
}

export async function logoutBot() {
  await logoutWhatsAppBot();
  revalidatePath('/panel/whatsapp');
  return { success: true };
}
