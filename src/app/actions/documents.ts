'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { sendNotification } from './notifications';
import { stampPdfWithQrCode } from '@/ai/flows/stamp-pdf-flow';

export type DocumentStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

export interface ImportantDocument {
  id?: string;
  title: string;
  documentNumber?: string;
  description: string;
  category: string;
  createdAt: Timestamp;
  fileUrl: string;
  fileName: string;
  
  // Workflow fields
  status: DocumentStatus;
  authorId: string;
  authorName: string;
  approverId?: string;
  approvedById?: string;
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
    data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status' | 'rejectionReason'>, 
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
        status: 'Draft' as DocumentStatus,
    };
    await addDoc(documentsCollection, docData);
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("Error creating document:", error);
    throw new Error("Gagal membuat dokumen.");
  }
}

export async function updateDocument(id: string, data: Partial<Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName'>>, newFile?: File) {
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

// --- Workflow Actions ---

export async function submitForApproval(documentId: string, submitterId: string, approverId: string) {
    const docRef = doc(db, 'importantDocuments', documentId);
    const document = await getDocument(documentId);

    if (!document) throw new Error('Dokumen tidak ditemukan.');
    if (document.authorId !== submitterId) throw new Error('Anda bukan pembuat dokumen ini.');

    await updateDoc(docRef, {
        status: 'Menunggu Persetujuan',
        approverId: approverId,
    });
    
    // Send notification to approver
    await sendNotification(
        {
            title: 'Permintaan Persetujuan Dokumen',
            body: `Dokumen "${document.title}" membutuhkan persetujuan Anda.`,
            link: `/panel/documents`,
        },
        {
            type: 'users',
            userIds: [approverId],
        }
    );

    revalidatePath('/panel/documents');
}

export async function approveDocument(documentId: string, approverId: string) {
    const docRef = doc(db, 'importantDocuments', documentId);
    const document = await getDocument(documentId);

    if (!document) throw new Error('Dokumen tidak ditemukan.');
    if (document.approverId !== approverId) throw new Error('Anda tidak memiliki wewenang untuk menyetujui dokumen ini.');
    if (document.status !== 'Menunggu Persetujuan') throw new Error('Dokumen ini tidak dalam status menunggu persetujuan.');

    await updateDoc(docRef, {
        status: 'Disetujui',
        approvedById: approverId,
        approvedAt: Timestamp.now(),
    });
    
    // Trigger PDF stamping flow
    try {
      await stampPdfWithQrCode(documentId);
    } catch (e) {
      console.error("Failed to stamp PDF:", e);
      // Optionally revert status or notify admin
      throw new Error('Dokumen disetujui, namun gagal menempelkan QR Code. Hubungi admin.');
    }


     await sendNotification(
        {
            title: 'Dokumen Disetujui & Disahkan',
            body: `Dokumen Anda yang berjudul "${document.title}" telah disetujui dan ditandatangani secara digital.`,
            link: `/panel/documents`,
        },
        {
            type: 'users',
            userIds: [document.authorId],
        }
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
