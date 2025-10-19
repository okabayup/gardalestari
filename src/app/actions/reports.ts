
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
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Report, ReportReason, ReportType, ReportStatus } from '@/lib/definitions';
import { getUserByUid } from './user';

const reportsCollection = collection(db, 'reports');

export async function createReport(
    reporterId: string,
    reportedItemId: string,
    reportedItemType: ReportType,
    reason: ReportReason,
    details?: string
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
    reason,
    details: details || '',
    status: 'baru',
    createdAt: serverTimestamp() as any, // Let server set the timestamp
  };

  await addDoc(reportsCollection, reportData);

  // Potentially send a notification to admins here
}


export async function getReports(): Promise<Report[]> {
  try {
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
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
