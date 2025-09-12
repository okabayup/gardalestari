
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, runTransaction, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { stampPdfWithQrCode } from '@/ai/flows/stamp-pdf-flow';
import { sendNotification } from './notifications';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getUserByUid } from './user';
import { getWhatsappTemplate } from './whatsapp';

export type LetterStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

export interface ImportantDocument {
  id?: string;
  title: string;
  description?: string;
  documentNumber: string;
  category: string;
  createdAt: Timestamp;
  fileUrl: string;
  fileName: string;
  authorId: string;
  authorName: string; // denormalized
  status: LetterStatus;
  approverId?: string; // UID of the user who needs to approve
  approvedById?: string; // UID of the user who approved
  approvedByName?: string; // denormalized
  approvedAt?: Timestamp;
  rejectionReason?: string;
}

const documentsCollection = collection(db, 'importantDocuments');
const categoriesCollection = collection(db, 'documentCategories');

// --- Document Management ---

export async function getDocuments(): Promise<ImportantDocument[]> {
  const q = query(documentsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const documents: ImportantDocument[] = [];
  snapshot.forEach(doc => {
    documents.push({ id: doc.id, ...doc.data() } as ImportantDocument);
  });
  return documents;
}

export async function getDocument(id: string): Promise<ImportantDocument | null> {
    const docRef = doc(db, 'importantDocuments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ImportantDocument;
    }
    return null;
}

export async function createDocument(
    data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status'>, 
    file: File
) {
  try {
    const fileRef = ref(storage, `documents/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const docData = {
        ...data,
        fileUrl,
        fileName: file.name,
        createdAt: Timestamp.now(),
        status: 'Draft' as LetterStatus,
    };
    await addDoc(documentsCollection, docData);
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("Error creating document:", error);
    throw new Error("Gagal membuat dokumen.");
  }
}

export async function updateDocument(id: string, data: Partial<Omit<ImportantDocument, 'id'>>, newFile?: File) {
  try {
    const docRef = doc(db, 'importantDocuments', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (newFile) {
        const currentDoc = await getDocument(id);
        if (currentDoc?.fileUrl) {
            try {
                await deleteObject(ref(storage, currentDoc.fileUrl));
            } catch (storageError: any) {
                 if (storageError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old file", storageError);
                }
            }
        }
        const fileRef = ref(storage, `documents/${Date.now()}_${newFile.name}`);
        await uploadBytes(fileRef, newFile);
        dataToUpdate.fileUrl = await getDownloadURL(fileRef);
        dataToUpdate.fileName = newFile.name;
    }

    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/documents');
    revalidatePath(`/panel/e-office/edit/${id}`);
  } catch (error) {
    console.error("Error updating document:", error);
    throw new Error("Gagal memperbarui dokumen.");
  }
}

export async function deleteDocument(id: string) {
  try {
    const docToDelete = await getDocument(id);
    if (docToDelete?.fileUrl) {
        await deleteObject(ref(storage, docToDelete.fileUrl));
    }
    await deleteDoc(doc(db, 'importantDocuments', id));
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Gagal menghapus dokumen.");
  }
}


export async function submitForApproval(documentId: string, authorId: string, approverId: string) {
  const docRef = doc(db, 'importantDocuments', documentId);
  const document = await getDocument(documentId);
  if (!document || document.authorId !== authorId) {
    throw new Error("Hanya pembuat dokumen yang bisa mengajukan persetujuan.");
  }

  await updateDoc(docRef, {
    status: 'Menunggu Persetujuan',
    approverId: approverId,
  });
  
  // Send notifications
  const approver = await getUserByUid(approverId);
  const template = await getWhatsappTemplate('document_submission');
  if (template.isActive && approver?.waNumber) {
    const message = template.message
      .replace('{namaPenerima}', approver.name)
      .replace('{judulDokumen}', document.title)
      .replace('{namaPengirim}', document.authorName);
    await sendWhatsAppMessage(approver.waNumber, message);
  }

  await sendNotification(
    {
      title: 'Permintaan Persetujuan Dokumen',
      body: `Dokumen "${document.title}" dari ${document.authorName} memerlukan persetujuan Anda.`,
      link: `/panel/documents`
    },
    { type: 'users', userIds: [approverId] }
  );

  revalidatePath('/panel/documents');
}

export async function approveDocument(documentId: string, approverId: string) {
  const docRef = doc(db, 'importantDocuments', documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error("Dokumen tidak ditemukan.");

  const document = docSnap.data() as ImportantDocument;
  if (document.approverId !== approverId) throw new Error("Anda tidak memiliki izin untuk menyetujui dokumen ini.");
  if (document.status !== 'Menunggu Persetujuan') throw new Error("Dokumen ini tidak sedang dalam status menunggu persetujuan.");

  // Get approver's name
  const approver = await getUserByUid(approverId);

  // Run transaction to stamp PDF and update status
  await runTransaction(db, async (transaction) => {
    // 1. Stamp the PDF with a QR code
    await stampPdfWithQrCode(documentId);

    // 2. Update document status in Firestore
    transaction.update(docRef, {
      status: 'Disetujui',
      approvedById: approverId,
      approvedByName: approver?.name || 'Admin',
      approvedAt: Timestamp.now(),
    });
  });

  // 3. Send notification to the author
  const author = await getUserByUid(document.authorId);
  const template = await getWhatsappTemplate('document_approved');
  if (template.isActive && author?.waNumber) {
    const message = template.message
        .replace('{namaPengguna}', author.name)
        .replace('{judulDokumen}', document.title);
    await sendWhatsAppMessage(author.waNumber, message);
  }
  await sendNotification(
    {
      title: 'Dokumen Disetujui',
      body: `Dokumen Anda "${document.title}" telah disetujui dan disahkan.`,
      link: `/panel/documents`
    },
    { type: 'users', userIds: [document.authorId] }
  );

  revalidatePath('/panel/documents');
}


// --- Category Management ---

export interface DocumentCategory {
    id?: string;
    name: string;
}

export async function getDocumentCategories(): Promise<DocumentCategory[]> {
    const q = query(categoriesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentCategory));
}

export async function addDocumentCategory(name: string) {
    await addDoc(categoriesCollection, { name });
    revalidatePath('/panel/documents');
}

export async function deleteDocumentCategory(id: string) {
    await deleteDoc(doc(db, 'documentCategories', id));
    revalidatePath('/panel/documents');
}

export async function generateDocumentNumber(category: string): Promise<string> {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const romanMonth = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][month - 1];

  const prefix = `GL/S-${category.toUpperCase()}/${romanMonth}/${year}`;

  const q = query(documentsCollection, where('documentNumber', '>=', prefix), where('documentNumber', '<', `${prefix}-Z`));
  const snapshot = await getDocs(q);
  
  let maxNumber = 0;
  snapshot.forEach(doc => {
    const num = doc.data().documentNumber;
    const parts = num.split('/');
    const lastPart = parts[0];
    const numericPart = parseInt(lastPart.split('-')[0], 10);
    if (!isNaN(numericPart) && numericPart > maxNumber) {
      maxNumber = numericPart;
    }
  });

  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${nextNumber}/${prefix}`;
}

