'use server';

import { revalidatePath } from 'next/cache';
import { AppTester, AppTesterApp } from '@/lib/definitions';
import { getAll, getOne, getFirst, create, update, remove, now } from '@/lib/db';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { createShortLink } from '@/app/actions/shortlinks';
import { sendEmail } from '@/services/email';

const COL_TESTERS = 'appTesters';
const COL_APPS = 'appTesterApps';

export async function submitTesterApplication(
  data: Omit<AppTester, 'id' | 'status' | 'submittedAt'>
): Promise<void> {
  try {
    await create(COL_TESTERS, { ...data, status: 'pending', submittedAt: now() });
  } catch (error) {
    console.error('Error submitting tester application:', error);
    throw new Error('Gagal mengirimkan aplikasi Anda.');
  }
}

export async function getTesterApplications(): Promise<AppTester[]> {
  return await getAll<AppTester>(COL_TESTERS, {
    orderBy: { field: 'submittedAt', direction: 'desc' },
  });
}

export async function approveTesterApplication(id: string): Promise<void> {
  try {
    const application = await getOne<AppTester>(COL_TESTERS, id);
    if (!application) throw new Error('Aplikasi tidak ditemukan.');

    const appToTest = await getAppTesterApp(application.appId);
    if (!appToTest) throw new Error('Aplikasi yang diuji tidak ditemukan.');

    const template = await getWhatsappTemplate('app_tester_approved');
    if (template.isActive && (application as any).waNumber) {
      const message = template.message
        .replace('{namaPengguna}', application.name)
        .replace('{namaAplikasi}', appToTest.name)
        .replace('{linkPengujian}', (appToTest as any).testingLink);
      await sendWhatsAppMessage((application as any).waNumber, message);
    }

    await sendEmail({
      to: application.email,
      subject: `Persetujuan Penguji Aplikasi: ${appToTest.name}`,
      text: `Selamat, ${application.name}! Anda telah disetujui sebagai penguji untuk "${appToTest.name}". Link: ${(appToTest as any).testingLink}`,
    });

    await update(COL_TESTERS, id, { status: 'approved', processedAt: now() });
    revalidatePath('/panel/app-testers');
  } catch (error) {
    console.error('Error approving tester:', error);
    throw new Error(`Gagal menyetujui tester: ${(error as Error).message}`);
  }
}

export async function rejectTesterApplication(id: string): Promise<void> {
  try {
    await update(COL_TESTERS, id, { status: 'rejected', processedAt: now() });
    revalidatePath('/panel/app-testers');
  } catch (error) {
    console.error('Error rejecting tester:', error);
    throw new Error('Gagal menolak tester.');
  }
}

// ─── App Management ───────────────────────────────────────────────────────────

export async function createAppTesterApp(
  data: Omit<AppTesterApp, 'id' | 'createdAt' | 'shortlinkSlug'>
) {
  const slug = `uji-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;
  const existing = await getFirst(COL_APPS, {
    where: { field: 'shortlinkSlug', op: '==', value: slug },
  });
  if (existing) throw new Error(`Aplikasi dengan nama serupa sudah ada (slug: ${slug}).`);

  const id = await create(COL_APPS, { ...data, shortlinkSlug: slug, createdAt: now() });

  await createShortLink({
    title: `Pendaftaran Uji Aplikasi: ${data.name}`,
    slug,
    longUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/uji-aplikasi/${slug}`,
    type: 'app_tester',
    relatedId: id,
  });

  revalidatePath('/panel/app-testers/apps');
}

export async function getAppTesterApps(): Promise<AppTesterApp[]> {
  return await getAll<AppTesterApp>(COL_APPS, {
    orderBy: { field: 'createdAt', direction: 'desc' },
  });
}

export async function getAppTesterApp(id: string): Promise<AppTesterApp | null> {
  return await getOne<AppTesterApp>(COL_APPS, id);
}

export async function getAppTesterAppBySlug(slug: string): Promise<AppTesterApp | null> {
  return await getFirst<AppTesterApp>(COL_APPS, {
    where: { field: 'shortlinkSlug', op: '==', value: slug },
  });
}

export async function deleteAppTesterApp(id: string) {
  // TODO: Also delete the shortlink
  await remove(COL_APPS, id);
  revalidatePath('/panel/app-testers/apps');
}
