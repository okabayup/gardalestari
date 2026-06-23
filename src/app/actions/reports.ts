'use server';

import { revalidatePath } from 'next/cache';
import type { Report, ReportReason, ReportType, ReportStatus } from '@/lib/definitions';
import { getAll, getOne, create, update, now } from '@/lib/db';
import { getUserByUid, suspendUser } from './user';
import { updatePostStatus } from './posts';
import { sendDevAlert } from '@/services/whatsapp';

const COL = 'reports';

export async function createReport(
  reporterId: string,
  reportedItemId: string,
  reportedItemType: ReportType,
  reason: ReportReason,
  details?: string,
  reportedItemContent?: string
): Promise<void> {
  if (!reporterId) throw new Error('Hanya pengguna yang masuk yang dapat membuat laporan.');

  const reporter = await getUserByUid(reporterId);
  const reporterName = (reporter as any)?.name || 'Pengguna Anonim';

  await create(COL, {
    reporterId,
    reporterName,
    reportedItemId,
    reportedItemType,
    reportedItemContent,
    reason,
    details: details || '',
    status: 'baru',
    createdAt: now(),
  });

  if (reason === 'csae') {
    const alertMessage = `‼️ LAPORAN DARURAT (CSAE) ‼️\n\nPengguna: ${reporterName} (UID: ${reporterId})\nMelaporkan item tipe: ${reportedItemType}\nID Item: ${reportedItemId}\nKonten: "${reportedItemContent || 'N/A'}"\n\nMohon segera ditindaklanjuti di panel admin.`;
    await sendDevAlert(alertMessage);
  }
}

export async function getReports(): Promise<Report[]> {
  try {
    return await getAll<Report>(COL, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    throw new Error('Gagal mengambil data laporan.');
  }
}

export async function updateReportStatus(id: string, status: ReportStatus) {
  try {
    await update(COL, id, { status });
    revalidatePath('/panel/reports');
  } catch (error) {
    console.error('Error updating report status:', error);
    throw new Error('Gagal memperbarui status laporan.');
  }
}

export async function takeModerationAction(
  action: 'suspend_user' | 'hide_post',
  reportId: string
) {
  try {
    const report = await getOne<Report>(COL, reportId);
    if (!report) throw new Error('Laporan tidak ditemukan.');

    if (action === 'suspend_user' && report.reportedItemType === 'user') {
      await suspendUser(report.reportedItemId, `Akun ditangguhkan karena laporan: ${report.reason}.`);
    } else if (action === 'hide_post' && report.reportedItemType === 'post') {
      await updatePostStatus(report.reportedItemId, 'hidden_by_moderator');
    } else {
      throw new Error('Aksi tidak valid atau tipe laporan tidak cocok.');
    }

    await update(COL, reportId, { status: 'selesai' });
    revalidatePath('/panel/reports');
  } catch (error) {
    console.error('Error taking moderation action:', error);
    throw new Error(`Gagal mengambil tindakan moderasi: ${(error as Error).message}`);
  }
}
