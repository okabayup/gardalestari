

'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Report, ReportReason, ReportType, ReportStatus } from '@/lib/definitions';
import { getUserByUid } from './user';
import { suspendUser } from './user';
import { updatePostStatus } from './posts';
import { sendDevAlert } from '@/services/whatsapp';


const reportsCollection = collection(db, 'reports');

export async function createReport(
    reporterId: string,
    reportedItemId: string,
    reportedItemType: ReportType,
    reason: ReportReason,
    details?: string,
    reportedItemContent?: string
): Promise<void> {
  if (!reporterId) {
    throw new Error('Hanya pengguna yang masuk yang dapat membuat laporan.');
  }

  const reporter = await getUserByUid(reporterId);
  const reporterName = reporter?.name || 'Pengguna Anonim';

  const reportData: Omit<Report, 'id' | 'createdAt'> = {
    reporterId,
    reporterName,
    reportedItemId,
    reportedItemType,
    reportedItemContent,
    reason,
    details: details || '',
    status: 'baru',
    createdAt: serverTimestamp() as any, // Let server set the timestamp
  };

  await addDoc(reportsCollection, reportData);

  // If the reason is critical (CSAE), send an immediate high-priority alert.
  if (reason === 'csae') {
    const alertMessage = `‼️ LAPORAN DARURAT (CSAE) ‼️\n\nPengguna: ${reporterName} (UID: ${reporterId})\nMelaporkan item tipe: ${reportedItemType}\nID Item: ${reportedItemId}\nKonten: "${reportedItemContent || 'N/A'}"\n\nMohon segera ditindaklanjuti di panel admin.`;
    await sendDevAlert(alertMessage);
  }
}


export async function getReports(): Promise<Report[]> {
  try {
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
             id: doc.id, 
             ...data,
             createdAt: data.createdAt as Timestamp,
        } as Report
    });
  } catch (error) {
    console.error("Error getting reports:", error);
    throw new Error("Gagal mengambil data laporan.");
  }
}

export async function updateReportStatus(id: string, status: ReportStatus) {
  try {
    const docRef = doc(db, 'reports', id);
    await updateDoc(docRef, { status });
    revalidatePath('/panel/reports');
  } catch (error) {
    console.error("Error updating report status:", error);
    throw new Error("Gagal memperbarui status laporan.");
  }
}

export async function takeModerationAction(action: 'suspend_user' | 'hide_post', reportId: string) {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    if (!reportSnap.exists()) {
      throw new Error("Laporan tidak ditemukan.");
    }
    const report = reportSnap.data() as Report;

    if (action === 'suspend_user' && report.reportedItemType === 'user') {
      await suspendUser(report.reportedItemId, `Akun ditangguhkan karena laporan: ${report.reason}.`);
    } else if (action === 'hide_post' && report.reportedItemType === 'post') {
      await updatePostStatus(report.reportedItemId, 'hidden_by_moderator');
    } else {
      throw new Error("Aksi tidak valid atau tipe laporan tidak cocok.");
    }

    await updateDoc(reportRef, { status: 'selesai' });
    revalidatePath('/panel/reports');
  } catch (error) {
    console.error("Error taking moderation action:", error);
    throw new Error(`Gagal mengambil tindakan moderasi: ${(error as Error).message}`);
  }
}



