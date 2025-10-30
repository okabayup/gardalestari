

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, runTransaction, where, getCountFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { sendNotification } from '@/app/actions/notifications';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from '@/app/actions/settings';
import type { LetterStatus, ImportantDocument, DocumentCategory, DocumentType, PermissionId, Position, MemberWithStatus } from '@/lib/definitions';
import { getUserByUid } from '@/app/actions/user';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { readDocumentText } from '@/ai/flows/ocr-pdf-flow';


const documentsCollection = collection(db, 'importantDocuments');
const categoriesCollection = collection(db, 'documentCategories');
const docTypesCollection = collection(db, 'documentTypes');

const ADMIN_NOTIFICATION_PHONE = '6285937010409';

const toImportantDocument = (doc: any): ImportantDocument => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        approvedAt: data.approvedAt ? (data.approvedAt as Timestamp).toDate().toISOString() : undefined,
    } as ImportantDocument;
}


// --- Document Management ---

export async function getDocuments(): Promise<ImportantDocument[]> {
  try {
    const q = query(documentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const documents: ImportantDocument[] = [];
    snapshot.forEach(doc => {
      documents.push(toImportantDocument(doc));
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
            return toImportantDocument(docSnap);
        }
        return null;
    } catch(error) {
        console.error(`[getDocument Error] for ID ${id}:`, error);
        throw new Error("Gagal mengambil detail dokumen.");
    }
}

export async function createDocument(
    data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status' | 'documentNumber' | 'filePath'>, 
    file: File
) {
  try {
    if (file.type !== 'application/pdf') {
        throw new Error("File harus dalam format PDF.");
    }

    const docTypeQuery = query(docTypesCollection, where('name', '==', data.type));
    const docTypeSnapshot = await getDocs(docTypeQuery);
    if (docTypeSnapshot.empty) {
      throw new Error("Jenis dokumen tidak valid.");
    }
    const docTypeCode = docTypeSnapshot.docs[0].data().code;
    
    // Generate document number immediately
    const documentNumber = await generateDocumentNumber(docTypeCode);
    
    const filePath = `documents/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const docData = {
        ...data,
        documentNumber,
        fileUrl,
        filePath,
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
        if (newFile.type !== 'application/pdf') {
            throw new Error("File baru harus dalam format PDF.");
        }
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

    const approver = await getUserByUid(document.approverId!);
    
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

const handleFileToDataUri = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

export async function approveDocument(documentId: string, approverId: string) {
  try {
    const docRef = doc(db, 'importantDocuments', documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Dokumen tidak ditemukan.");
    const document = docSnap.data() as ImportantDocument;

    if (document.status !== 'Menunggu Persetujuan') {
        throw new Error("Dokumen ini tidak sedang dalam status menunggu persetujuan.");
    }
    
    if (document.fileName.split('.').pop()?.toLowerCase() !== 'pdf') {
        throw new Error("Hanya file PDF yang bisa disahkan. Mohon unggah ulang dalam format PDF.");
    }
    
    const documentNumber = document.documentNumber;
    if (!documentNumber) {
        throw new Error("Nomor surat tidak ditemukan pada dokumen. Proses tidak dapat dilanjutkan.");
    }

    const now = new Date();
    
    const fileResponse = await fetch(document.fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Gagal mengunduh file asli: ${fileResponse.statusText}`);
    }
    const originalFileBlob = await fileResponse.blob();
    
    // Extract text from the original document for later comparison
    const originalDataUri = await handleFileToDataUri(originalFileBlob);
    const ocrResult = await readDocumentText({ fileDataUri: originalDataUri });
    const originalContent = ocrResult.text.replace(/\s+/g, ' ').trim();
    
    const pdfDoc = await PDFDocument.load(await originalFileBlob.arrayBuffer());


    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeImageBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', width: 200, errorCorrectionLevel: 'H' });
    const qrImage = await pdfDoc.embedPng(qrCodeImageBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const jakartaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));

    const stampLines = [
        `Dokumen ini telah disahkan secara digital oleh:`,
        `L. Andri Saputro`,
        `Ketua Umum`,
        `Nomor: ${documentNumber}`,
        `Tanggal: ${format(jakartaTime, 'dd MMMM yyyy, HH:mm', { locale: idLocale })} WIB`,
        `Selalu verifikasi melalui scan dan pastikan dokumen sama dengan yang ada di web gardalestari.org`
    ];
    
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    firstPage.drawImage(qrImage, {
        x: 40,
        y: 40,
        width: 70,
        height: 70,
    });
    
    firstPage.drawText(stampLines[0], { x: 120, y: 100, font: helveticaFont, size: 8, color: rgb(0, 0, 0) });
    firstPage.drawText(stampLines[1], { x: 120, y: 90, font: helveticaBoldFont, size: 8, color: rgb(0, 0, 0) });
    firstPage.drawText(stampLines[2], { x: 120, y: 80, font: helveticaFont, size: 8, color: rgb(0, 0, 0) });
    firstPage.drawText(stampLines[3], { x: 120, y: 70, font: helveticaFont, size: 8, color: rgb(0, 0, 0) });
    firstPage.drawText(stampLines[4], { x: 120, y: 60, font: helveticaFont, size: 8, color: rgb(0, 0, 0) });
    firstPage.drawText(stampLines[5], { x: 120, y: 50, font: helveticaObliqueFont, size: 6, color: rgb(0.3, 0.3, 0.3) });

    const stampedPdfBytes = await pdfDoc.save();
    const newFileName = document.fileName.replace(/\.docx?$/, '.pdf');
    const newFilePath = `documents/signed/${Date.now()}_${newFileName}`;
    const newFileRef = ref(storage, newFilePath);
    
    await uploadBytes(newFileRef, stampedPdfBytes, { contentType: 'application/pdf' });
    const newFileUrl = await getDownloadURL(newFileRef);
    
    const approverUser = await getUserByUid(approverId);
    
    await updateDoc(docRef, {
      status: 'Disetujui',
      approvedById: approverId,
      approvedByName: approverUser?.name || "Admin",
      approvedByPosition: approverUser?.position || "Admin",
      approvedAt: Timestamp.fromDate(now),
      fileUrl: newFileUrl,
      filePath: newFilePath,
      fileName: newFileName,
      originalContent,
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
      const queryPrefix = `/GL/DPP/${romanMonth}/${year}`;
      
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

    