
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, runTransaction, where, getCountFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { stampDocxAndConvertToPdf } from '@/ai/flows/stamp-docx-flow';
import { sendNotification } from '@/app/actions/notifications';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from '@/app/actions/settings';
import type { LetterStatus, ImportantDocument, DocumentCategory, DocumentType } from '@/lib/definitions';
import { getUserByUid } from '@/app/actions/members';

const documentsCollection = collection(db, 'importantDocuments');
const categoriesCollection = collection(db, 'documentCategories');
const docTypesCollection = collection(db, 'documentTypes');

const ADMIN_NOTIFICATION_PHONE = '6285937010409';


// Helper function to convert Timestamps in a document to serializable Dates
const convertTimestamps = (docData: { [key: string]: any }): any => {
    const data = { ...docData };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        }
    }
    return data;
};


// --- Document Management ---

export async function getDocuments(): Promise<ImportantDocument[]> {
  try {
    const q = query(documentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const documents: ImportantDocument[] = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...convertTimestamps(doc.data()) } as ImportantDocument);
    });
    return documents;
  } catch(error) {
    console.error("[getDocuments Error]", error);
    throw new Error("Gagal mengambil daftar dokumen.");
  }
}

export async function getDocument(id: string): Promise<ImportantDocument | null> {
    try {
        const docRef = doc(db, 'importantDocuments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as ImportantDocument;
        }
        return null;
    } catch(error) {
        console.error(`[getDocument Error] for ID ${id}:`, error);
        throw new Error("Gagal mengambil detail dokumen.");
    }
}

export async function createDocument(
    data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status' | 'documentNumber'>, 
    file: File
) {
  try {
    const filePath = `documents/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const docData = {
        ...data,
        documentNumber: '', // Will be generated on approval
        fileUrl,
        filePath: filePath, // Store path for server-side access
        fileName: file.name,
        createdAt: Timestamp.now(),
        status: 'Draft' as LetterStatus,
    };
    await addDoc(documentsCollection, docData);
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[createDocument Error]", error);
    throw new Error(`Gagal membuat dokumen: ${(error as Error).message}`);
  }
}

export async function updateDocument(id: string, data: Partial<Omit<ImportantDocument, 'id'>>, newFile?: File) {
  try {
    const docRef = doc(db, 'importantDocuments', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (newFile) {
        const currentDoc = await getDocument(id);
        if (currentDoc?.filePath) {
            try {
                await deleteObject(ref(storage, currentDoc.filePath));
            } catch (storageError: any) {
                 if (storageError.code !== 'storage/object-not-found') {
                    console.warn("[updateDocument Warn] Could not delete old file", storageError);
                }
            }
        }
        const filePath = `documents/${Date.now()}_${newFile.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, newFile);
        dataToUpdate.fileUrl = await getDownloadURL(fileRef);
        dataToUpdate.filePath = filePath;
        dataToUpdate.fileName = newFile.name;
    }

    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/documents');
    revalidatePath(`/panel/documents/edit/${id}`);
  } catch (error) {
    console.error("[updateDocument Error]", error);
    throw new Error(`Gagal memperbarui dokumen: ${(error as Error).message}`);
  }
}

export async function deleteDocument(id: string) {
  try {
    const docToDelete = await getDocument(id);
    if (docToDelete?.filePath) {
        await deleteObject(ref(storage, docToDelete.filePath));
    }
    await deleteDoc(doc(db, 'importantDocuments', id));
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[deleteDocument Error]", error);
    throw new Error("Gagal menghapus dokumen.");
  }
}


export async function submitForApproval(documentId: string, authorId: string) {
  try {
    const docRef = doc(db, 'importantDocuments', documentId);
    const document = await getDocument(documentId);
    if (!document || document.authorId !== authorId) {
      throw new Error("Hanya pembuat dokumen yang bisa mengajukan persetujuan.");
    }
    if (document.status !== 'Draft' && document.status !== 'Ditolak') {
      throw new Error("Dokumen ini tidak dalam status yang bisa diajukan.");
    }

    const approver = await getUserByUid(document.approverId);
    
    await updateDoc(docRef, {
      status: 'Menunggu Persetujuan',
    });
    
    // Always send WA to admin number
    const template = await getWhatsappTemplate('document_submission');
    if (template.isActive) {
        const message = template.message
            .replace('{namaPenerima}', approver?.name || 'Ketua Umum')
            .replace('{judulDokumen}', document.title)
            .replace('{namaPengirim}', document.authorName);
        await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, message);
    }
    
    if (approver) {
        await sendNotification(
        {
            title: 'Permintaan Persetujuan Dokumen',
            body: `Dokumen "${document.title}" dari ${document.authorName} memerlukan persetujuan Anda.`,
            link: `/panel/documents`
        },
        { type: 'users', userIds: [document.approverId!] }
        );
    } else {
        console.warn(`[submitForApproval Warn] Approver with UID ${document.approverId} not found. Cannot send push notification.`);
    }

    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[submitForApproval Error]", error);
    throw new Error("Gagal mengajukan persetujuan.");
  }
}

export async function approveDocument(documentId: string, approverId: string) {
  try {
    const docRef = doc(db, 'importantDocuments', documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Dokumen tidak ditemukan.");
    const document = docSnap.data() as ImportantDocument;

    // Simplified authorization: let the UI handle who can click the button.
    // Server just checks if the document is in the correct state.
    if (document.status !== 'Menunggu Persetujuan') {
        throw new Error("Dokumen ini tidak sedang dalam status menunggu persetujuan.");
    }
    
    const docTypeQuery = query(docTypesCollection, where('name', '==', document.type));
    const docTypeSnapshot = await getDocs(docTypeQuery);
    if (docTypeSnapshot.empty) {
      throw new Error("Jenis dokumen tidak valid.");
    }
    const docTypeCode = docTypeSnapshot.docs[0].data().code;
    
    const documentNumber = await generateDocumentNumber(docTypeCode);
    
    // The core stamping logic is now in a separate flow
    const stampedFileResult = await stampDocxAndConvertToPdf({
      documentId,
      documentNumber,
      filePath: document.filePath!,
    });

    const approverUser = await getUserByUid(approverId);
    const approvedByName = approverUser?.name || "Admin";
    const approvedByPosition = approverUser?.position || "Admin";
    
    await updateDoc(docRef, {
      documentNumber: documentNumber,
      status: 'Disetujui',
      approvedById: approverId,
      approvedByName: approvedByName,
      approvedByPosition: approvedByPosition,
      approvedAt: Timestamp.now(),
      fileUrl: stampedFileResult.newFileUrl,
      filePath: stampedFileResult.newFilePath,
      fileName: stampedFileResult.newFileName,
    });

    const author = await getUserByUid(document.authorId);
    if (author) {
        const template = await getWhatsappTemplate('document_approved');
        if (template.isActive && author.waNumber) {
            const message = template.message
                .replace('{namaPengguna}', author.name)
                .replace('{judulDokumen}', document.title)
                .replace('{nomorDokumen}', documentNumber);
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
    }

    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[approveDocument Error]", error);
    throw new Error(`Gagal menyetujui dokumen: ${(error as Error).message}`);
  }
}

export async function rejectDocument(documentId: string, rejectorId: string, reason: string) {
  try {
    const docRef = doc(db, 'importantDocuments', documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Dokumen tidak ditemukan.");

    const document = docSnap.data() as ImportantDocument;
    
    if (document.status !== 'Menunggu Persetujuan') throw new Error("Dokumen ini tidak bisa ditolak.");

    const rejector = await getUserByUid(rejectorId);

    await updateDoc(docRef, {
      status: 'Ditolak',
      rejectionReason: reason,
      rejectedById: rejectorId,
      rejectedByName: rejector?.name || 'Admin',
    });

    const author = await getUserByUid(document.authorId);
    if (author) {
        const template = await getWhatsappTemplate('document_rejected');
        if (template.isActive && author.waNumber) {
            const message = template.message
                .replace('{namaPengguna}', author.name)
                .replace('{judulDokumen}', document.title)
                .replace('{namaPenolak}', rejector?.name || 'Admin')
                .replace('{alasanPenolakan}', reason);
            await sendWhatsAppMessage(author.waNumber, message);
        }

        await sendNotification(
        {
            title: 'Dokumen Ditolak',
            body: `Dokumen Anda "${document.title}" telah ditolak. Alasan: ${reason}`,
            link: `/panel/documents`
        },
        { type: 'users', userIds: [document.authorId] }
        );
    }


    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[rejectDocument Error]", error);
    throw new Error("Gagal menolak dokumen.");
  }
}


// --- Category & Type Management ---

export async function getDocumentCategories(): Promise<DocumentCategory[]> {
    try {
        const q = query(categoriesCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentCategory));
    } catch (error) {
        console.error("[getDocumentCategories Error]", error);
        throw new Error("Gagal memuat kategori dokumen.");
    }
}

export async function getDocumentTypes(): Promise<DocumentType[]> {
    try {
        const q = query(docTypesCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentType));
    } catch (error) {
        console.error("[getDocumentTypes Error]", error);
        throw new Error("Gagal memuat jenis dokumen.");
    }
}


export async function generateDocumentNumber(typeCode: string): Promise<string> {
  try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      
      const romanMonthMap: { [key: number]: string } = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
        7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
      };
      const romanMonth = romanMonthMap[month];

      const prefix = `${typeCode}/GL/DPP`;
      const queryPrefix = `/GL/${typeCode}/${romanMonth}/${year}`;
      
      const q = query(documentsCollection, 
        where('documentNumber', '>=', `001${queryPrefix}`), 
        where('documentNumber', '<=', `999${queryPrefix}`)
      );

      const countSnapshot = await getCountFromServer(q);
      const nextNumber = (countSnapshot.data().count + 1).toString().padStart(3, '0');
      
      return `${nextNumber}/${prefix}/${romanMonth}/${year}`;
  } catch (error) {
      console.error("[generateDocumentNumber Error]", error);
      throw new Error("Gagal membuat nomor dokumen.");
  }
}

    