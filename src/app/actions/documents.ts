
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, runTransaction, where, getCountFromServer, setDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { sendNotification } from '@/app/actions/notifications';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from '@/app/actions/settings';
import type { LetterStatus, ImportantDocument, DocumentCategory, DocumentType, DigitalSigner, SignatoryRole } from '@/lib/definitions';
import { getUserByUid } from '@/app/actions/user';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { readDocumentText } from '@/ai/flows/ocr-pdf-flow';
import { sendEmail } from '@/services/email';


const documentsCollection = collection(db, 'importantDocuments');
const categoriesCollection = collection(db, 'documentCategories');
const docTypesCollection = collection(db, 'documentTypes');

const ADMIN_NOTIFICATION_PHONE = '6285937010409';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';

const SIGNATORY_NAMES: Record<SignatoryRole, string> = {
    'Ketua Umum': 'L. Andri Saputro',
    'Sekretaris': 'Oka Bayu Pratama',
    'Bendahara Umum': 'Hj. Siti Rohmah'
};

/**
 * Safely converts a Firestore value to an ISO string date.
 * Handles Timestamps, Strings, and Dates.
 */
const safeDateToIso = (val: any): string | undefined => {
    if (!val) return undefined;
    try {
        if (typeof val.toDate === 'function') return val.toDate().toISOString();
        if (val instanceof Timestamp) return val.toDate().toISOString();
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'string') {
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
        }
    } catch (e) {
        console.error("[safeDateToIso Error]", e);
    }
    return undefined;
};

const toImportantDocument = (doc: any): ImportantDocument => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: safeDateToIso(data.createdAt) || new Date().toISOString(),
        approvedAt: safeDateToIso(data.approvedAt),
    } as ImportantDocument;
}


// --- Document Management ---

export async function getDocuments(): Promise<ImportantDocument[]> {
  try {
    const q = query(documentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const documents: ImportantDocument[] = [];
    snapshot.forEach(doc => {
      try {
        documents.push(toImportantDocument(doc));
      } catch (err) {
        console.error(`[getDocuments] Error processing doc ${doc.id}:`, err);
      }
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
    data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status' | 'documentNumber' | 'filePath' | 'originalFileUrl'>, 
    file: File
) {
  try {
    if (file.type !== 'application/pdf') {
        throw new Error("File harus dalam format PDF.");
    }

    const docTypeQuery = query(docTypesCollection, where('name', '==', data.type));
    const docTypeSnapshot = await getDocs(docTypeQuery);
    if (docTypeSnapshot.empty) {
      throw new Error(`Jenis dokumen '${data.type}' tidak ditemukan di sistem. Mohon hubungi admin.`);
    }
    const docTypeCode = docTypeSnapshot.docs[0].data().code;
    
    const documentNumber = await generateDocumentNumber(docTypeCode);
    
    const filePath = `documents/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    const fileUrl = await getDownloadURL(fileRef);

    const docData = {
        ...data,
        documentNumber,
        fileUrl,
        originalFileUrl: fileUrl, 
        filePath,
        fileName: file.name,
        createdAt: Timestamp.now(),
        status: 'Draft' as LetterStatus,
        signers: [],
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
    
    // Explicitly filter out fields that should not be overwritten by string values from the client
    const { createdAt, authorId, id: _id, documentNumber, ...updatableData } = data as any;
    const dataToUpdate: { [key: string]: any } = { ...updatableData };

    if (newFile) {
        if (newFile.type !== 'application/pdf') {
            throw new Error("File baru harus dalam format PDF.");
        }
        const currentDoc = await getDocument(id);
        
        // Hapus file lama dari storage
        if (currentDoc?.filePath) {
            try {
                await deleteObject(ref(storage, currentDoc.filePath));
            } catch (storageError: any) {
                 if (storageError.code !== 'storage/object-not-found') {
                    console.warn("[updateDocument Warn] Could not delete old file", storageError);
                }
            }
        }

        // Upload file baru
        const filePath = `documents/${Date.now()}_${newFile.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, newFile);
        const fileUrl = await getDownloadURL(fileRef);

        // Reset metadata karena file berubah
        dataToUpdate.fileUrl = fileUrl;
        dataToUpdate.originalFileUrl = fileUrl;
        dataToUpdate.filePath = filePath;
        dataToUpdate.fileName = newFile.name;
        dataToUpdate.status = 'Draft'; // Reset ke draf
        dataToUpdate.signers = []; 
        dataToUpdate.originalContent = deleteField(); // Hapus cache OCR lama
        dataToUpdate.approvedAt = deleteField();
        dataToUpdate.approvedById = deleteField();
        dataToUpdate.approvedByName = deleteField();
        dataToUpdate.approvedByPosition = deleteField();
        dataToUpdate.rejectionReason = deleteField();
        dataToUpdate.rejectedById = deleteField();
        dataToUpdate.rejectedByName = deleteField();
    }

    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/documents');
    revalidatePath(`/panel/documents/edit/${id}`);
    revalidatePath('/documents');
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
    
    const template = await getWhatsappTemplate('document_submission');
    const message = template.message
        .replace('{namaPenerima}', approver?.name || 'Ketua Umum')
        .replace('{judulDokumen}', document.title)
        .replace('{namaPengirim}', document.authorName);

    if (template.isActive) {
        await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, message);
    }
    await sendEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `Permintaan Persetujuan Dokumen: ${document.title}`,
        text: message,
    });
    
    if (approver) {
        await sendNotification(
        {
            title: 'Permintaan Persetujuan Dokumen',
            body: `Dokumen "${document.title}" dari ${document.authorName} memerlukan persetujuan Anda.`,
            link: `/panel/documents`
        },
        { type: 'users', userIds: [document.approverId!] }
        );
    }

    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[submitForApproval Error]", error);
    throw new Error("Gagal mengajukan persetujuan.");
  }
}

export async function approveDocument(documentId: string, approverId: string, role: SignatoryRole, isFinal: boolean) {
  try {
    const docRef = doc(db, 'importantDocuments', documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Dokumen tidak ditemukan.");
    const documentData = docSnap.data() as ImportantDocument;

    if (documentData.status !== 'Menunggu Persetujuan') {
        throw new Error("Dokumen ini tidak sedang dalam status menunggu persetujuan.");
    }
    
    const signerName = SIGNATORY_NAMES[role];
    const now = new Date();
    
    const newSigner: DigitalSigner = {
        name: signerName,
        role: role,
        signedAt: now.toISOString(),
    };
    
    const updatedSigners = [...(documentData.signers || []), newSigner];
    
    // 2. Load Original PDF to avoid cumulative stamps
    const sourceUrl = documentData.originalFileUrl || documentData.fileUrl;
    const fileResponse = await fetch(sourceUrl);
    if (!fileResponse.ok) throw new Error("Gagal mengunduh file asli.");
    const pdfBytes = await fileResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const firstPage = pdfDoc.getPages()[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // 3. Layout constants
    const margin = 40;
    const availableWidth = pageWidth - (2 * margin);
    const sigCount = updatedSigners.length;
    const blockWidth = Math.min(160, availableWidth / sigCount);
    const boxHeight = 85;
    const startY = 40;
    
    // Adjust size based on number of signers
    const fontSize = sigCount > 2 ? 7 : 8;
    const qrSize = sigCount > 2 ? 35 : 45;

    // 4. Draw all signers
    for (let i = 0; i < sigCount; i++) {
        const signer = updatedSigners[i];
        const startX = margin + (i * (availableWidth / sigCount)) + ((availableWidth / sigCount - blockWidth) / 2);
        
        // Draw Border
        firstPage.drawRectangle({
            x: startX,
            y: startY,
            width: blockWidth,
            height: boxHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
        });

        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
        const qrBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', width: 100 });
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        
        firstPage.drawImage(qrImage, {
            x: startX + (blockWidth - qrSize) / 2,
            y: startY + boxHeight - qrSize - 5,
            width: qrSize,
            height: qrSize,
        });

        const jakartaTime = new Date(signer.signedAt).toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
        const formattedDate = format(new Date(jakartaTime), 'dd/MM/yy HH:mm', { locale: idLocale });

        const lines = [
            `Disahkan Digital oleh:`,
            signer.name,
            signer.role,
            `${formattedDate} WIB`
        ];

        let currentY = startY + (sigCount > 2 ? 25 : 30);
        firstPage.drawText(lines[0], { x: startX + 5, y: currentY, font: helveticaFont, size: fontSize - 1 });
        currentY -= fontSize + 2;
        firstPage.drawText(lines[1], { x: startX + 5, y: currentY, font: helveticaBoldFont, size: fontSize });
        currentY -= fontSize + 2;
        firstPage.drawText(lines[2], { x: startX + 5, y: currentY, font: helveticaFont, size: fontSize });
        currentY -= fontSize + 2;
        firstPage.drawText(lines[3], { x: startX + 5, y: currentY, font: helveticaObliqueFont, size: fontSize - 1 });
    }

    // 5. Save and Upload
    const stampedPdfBytes = await pdfDoc.save();
    const newFileName = documentData.fileName.replace(/\.docx?$/, '.pdf');
    const newFilePath = `documents/signed/${Date.now()}_${newFileName}`;
    const newFileRef = ref(storage, newFilePath);
    await uploadBytes(newFileRef, stampedPdfBytes, { contentType: 'application/pdf' });
    const newFileUrl = await getDownloadURL(newFileRef);

    // OCR for original content if first time
    let originalContent = documentData.originalContent;
    if (!originalContent) {
        const originalDataUri = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
        const ocrResult = await readDocumentText({ fileDataUri: originalDataUri });
        originalContent = ocrResult.text.replace(/\s+/g, ' ').trim();
    }

    const updatePayload: any = {
        signers: updatedSigners,
        fileUrl: newFileUrl,
        filePath: newFilePath,
        fileName: newFileName,
        originalContent,
        originalFileUrl: sourceUrl,
    };

    if (isFinal) {
        updatePayload.status = 'Disetujui';
        updatePayload.approvedAt = Timestamp.fromDate(now);
        updatePayload.approvedById = approverId;
        const approverUser = await getUserByUid(approverId);
        updatePayload.approvedByName = approverUser?.name || "Admin";
    }

    await updateDoc(docRef, updatePayload);

    if (isFinal) {
        const author = await getUserByUid(documentData.authorId);
        if (author) {
            const template = await getWhatsappTemplate('document_approved');
            const waMessage = template.message
                .replace('{namaPengguna}', author.name)
                .replace('{judulDokumen}', documentData.title)
                .replace('{nomorDokumen}', documentData.documentNumber);

            if (template.isActive && author.waNumber) {
                await sendWhatsAppMessage(author.waNumber, waMessage);
            }
            await sendNotification(
                { title: 'Dokumen Disahkan', body: `Dokumen "${documentData.title}" telah selesai disahkan.`, link: `/panel/documents` },
                { type: 'users', userIds: [documentData.authorId] }
            );
        }
    }

    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[approveDocument Error]", error);
    throw new Error(`Gagal mengesahkan dokumen: ${(error as Error).message}`);
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
        const message = template.message
            .replace('{namaPengguna}', author.name)
            .replace('{judulDokumen}', document.title)
            .replace('{namaPenolak}', rejector?.name || 'Admin')
            .replace('{alasanPenolakan}', reason);

        if (template.isActive && author.waNumber) {
            await sendWhatsAppMessage(author.waNumber, message);
        }
        
        if (author.email) {
            await sendEmail({
                to: author.email,
                subject: `Dokumen Ditolak: ${document.title}`,
                text: message,
            });
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
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentCategory));
        console.log(`[getDocumentCategories] Fetched ${cats.length} categories.`);
        return cats;
    } catch (error) {
        console.error("[getDocumentCategories Error]", error);
        throw new Error("Gagal memuat kategori dokumen.");
    }
}

export async function getDocumentTypes(): Promise<DocumentType[]> {
    try {
        const q = query(docTypesCollection, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentType));
        console.log(`[getDocumentTypes] Fetched ${types.length} types.`);
        return types;
    } catch (error) {
        console.error("[getDocumentTypes Error]", error);
        throw new Error("Gagal memuat jenis dokumen.");
    }
}


export async function generateDocumentNumber(typeCode: string): Promise<string> {
  try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const romanMonthMap: { [key: number]: string } = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
        7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
      };
      const romanMonth = romanMonthMap[month];

      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const q = query(
        documentsCollection, 
        where('createdAt', '>=', Timestamp.fromDate(startOfYear)), 
        where('createdAt', '<=', Timestamp.fromDate(endOfYear))
      );

      const countSnapshot = await getCountFromServer(q);
      const nextNumber = (countSnapshot.data().count + 1).toString().padStart(3, '0');
      
      return `${nextNumber}/${typeCode}/GL/DPP/${romanMonth}/${year}`;
  } catch (error) {
      console.error("[generateDocumentNumber Error]", error);
      throw new Error("Gagal membuat nomor dokumen.");
  }
}
