'use server';

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
import { getAll, getOne, getFirst, create, update, remove, uploadFile, deleteFile, now } from '@/lib/db';

const COL_DOCUMENTS = 'importantDocuments';
const COL_CATEGORIES = 'documentCategories';
const COL_TYPES = 'documentTypes';

const ADMIN_NOTIFICATION_PHONE = '6285144904161';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';

const SIGNATORY_NAMES: Record<SignatoryRole, string> = {
  'Ketua Umum': 'L. Andri Saputro',
  'Sekretaris': 'Oka Bayu Pratama',
  'Bendahara Umum': 'Hj. Siti Rohmah',
};

const safeDateToIso = (val: any): string | undefined => {
  if (!val) return undefined;
  try {
    if (typeof val.toDate === 'function') return val.toDate().toISOString();
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000).toISOString();
    if (typeof val === 'string') {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
  } catch (e) {
    console.error("[safeDateToIso Error]", e);
  }
  return undefined;
};

const toImportantDocument = (data: any): ImportantDocument => ({
  id: data.id,
  title: data.title || '',
  description: data.description || '',
  documentNumber: data.documentNumber || '',
  category: data.category || '',
  type: data.type || '',
  attachments: data.attachments || '',
  canvaUrl: data.canvaUrl || '',
  createdAt: safeDateToIso(data.createdAt) || new Date().toISOString(),
  fileUrl: data.fileUrl || '',
  fileName: data.fileName || '',
  filePath: data.filePath || '',
  authorId: data.authorId || '',
  authorName: data.authorName || '',
  status: data.status || 'Draft',
  approverId: data.approverId || '',
  signers: data.signers || [],
  originalFileUrl: data.originalFileUrl || '',
  approvedById: data.approvedById || '',
  approvedByName: data.approvedByName || '',
  approvedByPosition: data.approvedByPosition || '',
  approvedAt: safeDateToIso(data.approvedAt),
  rejectionReason: data.rejectionReason || '',
  rejectedById: data.rejectedById || '',
  rejectedByName: data.rejectedByName || '',
  originalContent: data.originalContent || '',
});

// --- Document Management ---

export async function getDocuments(): Promise<ImportantDocument[]> {
  try {
    const rows = await getAll<any>(COL_DOCUMENTS, { orderBy: { field: 'createdAt', direction: 'desc' } });
    return rows.map(row => {
      try { return toImportantDocument(row); }
      catch (err) { console.error(`[getDocuments] Error processing doc ${row.id}:`, err); return null; }
    }).filter(Boolean) as ImportantDocument[];
  } catch (error) {
    console.error("[getDocuments Error]", error);
    throw new Error("Gagal mengambil daftar dokumen.");
  }
}

export async function getDocument(id: string): Promise<ImportantDocument | null> {
  try {
    const row = await getOne<any>(COL_DOCUMENTS, id);
    return row ? toImportantDocument(row) : null;
  } catch (error) {
    console.error(`[getDocument Error] for ID ${id}:`, error);
    throw new Error("Gagal mengambil detail dokumen.");
  }
}

export async function createDocument(
  data: Omit<ImportantDocument, 'id' | 'createdAt' | 'fileUrl' | 'fileName' | 'status' | 'documentNumber' | 'filePath' | 'originalFileUrl'>,
  file: File
) {
  try {
    if (file.type !== 'application/pdf') throw new Error("File harus dalam format PDF.");

    const docType = await getFirst<any>(COL_TYPES, {
      where: { field: 'name', op: '==', value: data.type },
    });
    if (!docType) throw new Error(`Jenis dokumen '${data.type}' tidak ditemukan di sistem.`);
    const docTypeCode = docType.code;

    const filePath = `documents/${Date.now()}_${file.name}`;
    const fileUrl = await uploadFile(file, filePath);

    const documentNumber = await generateDocumentNumber(docTypeCode);

    const docData = {
      ...data,
      documentNumber,
      fileUrl,
      originalFileUrl: fileUrl,
      filePath,
      fileName: file.name,
      createdAt: now(),
      status: 'Draft' as LetterStatus,
      signers: [],
    };
    await create(COL_DOCUMENTS, docData as Record<string, unknown>);
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[createDocument Error]", error);
    throw new Error(`Gagal membuat dokumen: ${(error as Error).message}`);
  }
}

export async function updateDocument(id: string, data: Partial<Omit<ImportantDocument, 'id'>>, newFile?: File) {
  try {
    // Strip non-updatable fields
    const { createdAt, authorId, id: _id, documentNumber, signers, ...updatableData } = data as any;
    const dataToUpdate: Record<string, any> = { ...updatableData };

    if (newFile) {
      if (newFile.type !== 'application/pdf') throw new Error("File baru harus dalam format PDF.");

      const currentDoc = await getDocument(id);
      if (currentDoc?.filePath) {
        try { await deleteFile(currentDoc.filePath); }
        catch (e) { console.warn("[updateDocument Warn] Could not delete old file", e); }
      }

      const filePath = `documents/${Date.now()}_${newFile.name}`;
      const fileUrl = await uploadFile(newFile, filePath);

      dataToUpdate.fileUrl = fileUrl;
      dataToUpdate.originalFileUrl = fileUrl;
      dataToUpdate.filePath = filePath;
      dataToUpdate.fileName = newFile.name;
      dataToUpdate.status = 'Draft';
      dataToUpdate.signers = [];
      // Null out fields that deleteField() would remove
      dataToUpdate.originalContent = null;
      dataToUpdate.approvedAt = null;
      dataToUpdate.approvedById = null;
      dataToUpdate.approvedByName = null;
      dataToUpdate.approvedByPosition = null;
      dataToUpdate.rejectionReason = null;
      dataToUpdate.rejectedById = null;
      dataToUpdate.rejectedByName = null;
    }

    await update(COL_DOCUMENTS, id, dataToUpdate);
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
      try { await deleteFile(docToDelete.filePath); } catch {}
    }
    await remove(COL_DOCUMENTS, id);
    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[deleteDocument Error]", error);
    throw new Error("Gagal menghapus dokumen.");
  }
}

export async function submitForApproval(documentId: string, authorId: string) {
  try {
    const document = await getDocument(documentId);
    if (!document || document.authorId !== authorId) {
      throw new Error("Hanya pembuat dokumen yang bisa mengajukan persetujuan.");
    }
    if (document.status !== 'Draft' && document.status !== 'Ditolak') {
      throw new Error("Dokumen ini tidak dalam status yang bisa diajukan.");
    }

    const approver = await getUserByUid(document.approverId!);
    await update(COL_DOCUMENTS, documentId, { status: 'Menunggu Persetujuan' });

    const template = await getWhatsappTemplate('document_submission');
    const message = template.message
      .replace('{namaPenerima}', approver?.name || 'Ketua Umum')
      .replace('{judulDokumen}', document.title)
      .replace('{namaPengirim}', document.authorName);

    if (template.isActive) await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, message);
    await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: `Permintaan Persetujuan Dokumen: ${document.title}`, text: message });

    if (approver) {
      await sendNotification(
        { title: 'Permintaan Persetujuan Dokumen', body: `Dokumen "${document.title}" dari ${document.authorName} memerlukan persetujuan Anda.`, link: `/panel/documents` },
        { type: 'users', userIds: [document.approverId!] }
      );
    }

    revalidatePath('/panel/documents');
  } catch (error) {
    console.error("[submitForApproval Error]", error);
    throw new Error("Gagal mengajukan persetujuan.");
  }
}

export async function approveDocument(documentId: string, approverId: string, role: SignatoryRole, isFinal: boolean, customDate?: string) {
  try {
    const documentData = await getDocument(documentId);
    if (!documentData) throw new Error("Dokumen tidak ditemukan.");
    if (documentData.status !== 'Menunggu Persetujuan') throw new Error("Dokumen ini tidak sedang dalam status menunggu persetujuan.");

    const signerName = SIGNATORY_NAMES[role];
    const nowDate = customDate ? new Date(customDate) : new Date();

    const newSigner: DigitalSigner = {
      name: signerName,
      role,
      signedAt: nowDate.toISOString(),
    };

    const updatedSigners = [...(documentData.signers || []), newSigner];

    // Load original PDF
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

    const margin = 40;
    const availableWidth = pageWidth - (2 * margin);
    const sigCount = updatedSigners.length;
    const blockWidth = Math.min(160, availableWidth / sigCount);
    const boxHeight = 85;
    const startY = 40;
    const fontSize = sigCount > 2 ? 7 : 8;
    const qrSize = sigCount > 2 ? 35 : 45;

    for (let i = 0; i < sigCount; i++) {
      const signer = updatedSigners[i];
      const startX = margin + (i * (availableWidth / sigCount)) + ((availableWidth / sigCount - blockWidth) / 2);

      firstPage.drawRectangle({
        x: startX, y: startY, width: blockWidth, height: boxHeight,
        borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
      });

      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
      const qrBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', width: 100 });
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      firstPage.drawImage(qrImage, {
        x: startX + (blockWidth - qrSize) / 2,
        y: startY + boxHeight - qrSize - 5,
        width: qrSize, height: qrSize,
      });

      const jakartaTime = new Date(signer.signedAt).toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
      const formattedDate = format(new Date(jakartaTime), 'dd/MM/yy HH:mm', { locale: idLocale });
      const lines = [`Disahkan Digital oleh:`, signer.name, signer.role, `${formattedDate} WIB`];

      let currentY = startY + (sigCount > 2 ? 25 : 30);
      firstPage.drawText(lines[0], { x: startX + 5, y: currentY, font: helveticaFont, size: fontSize - 1 });
      currentY -= fontSize + 2;
      firstPage.drawText(lines[1], { x: startX + 5, y: currentY, font: helveticaBoldFont, size: fontSize });
      currentY -= fontSize + 2;
      firstPage.drawText(lines[2], { x: startX + 5, y: currentY, font: helveticaFont, size: fontSize });
      currentY -= fontSize + 2;
      firstPage.drawText(lines[3], { x: startX + 5, y: currentY, font: helveticaObliqueFont, size: fontSize - 1 });
    }

    const stampedPdfBytes = await pdfDoc.save();
    const newFileName = documentData.fileName.replace(/\.docx?$/, '.pdf');
    const newFilePath = `documents/signed/${Date.now()}_${newFileName}`;
    const newFileUrl = await uploadFile(Buffer.from(stampedPdfBytes), newFilePath);

    let originalContent = documentData.originalContent;
    if (!originalContent) {
      const originalDataUri = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
      const ocrResult = await readDocumentText({ fileDataUri: originalDataUri });
      originalContent = ocrResult.text.replace(/\s+/g, ' ').trim();
    }

    const updatePayload: Record<string, any> = {
      signers: updatedSigners,
      fileUrl: newFileUrl,
      filePath: newFilePath,
      fileName: newFileName,
      originalContent,
      originalFileUrl: sourceUrl,
    };

    if (isFinal) {
      updatePayload.status = 'Disetujui';
      updatePayload.approvedAt = nowDate.toISOString();
      updatePayload.approvedById = approverId;
      const approverUser = await getUserByUid(approverId);
      updatePayload.approvedByName = approverUser?.name || "Admin";
    }

    await update(COL_DOCUMENTS, documentId, updatePayload);

    if (isFinal) {
      const author = await getUserByUid(documentData.authorId);
      if (author) {
        const template = await getWhatsappTemplate('document_approved');
        const waMessage = template.message
          .replace('{namaPengguna}', author.name)
          .replace('{judulDokumen}', documentData.title)
          .replace('{nomorDokumen}', documentData.documentNumber);

        if (template.isActive && author.waNumber) await sendWhatsAppMessage(author.waNumber, waMessage);
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
    const document = await getDocument(documentId);
    if (!document) throw new Error("Dokumen tidak ditemukan.");
    if (document.status !== 'Menunggu Persetujuan') throw new Error("Dokumen ini tidak bisa ditolak.");

    const rejector = await getUserByUid(rejectorId);

    await update(COL_DOCUMENTS, documentId, {
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

      if (template.isActive && author.waNumber) await sendWhatsAppMessage(author.waNumber, message);
      if (author.email) await sendEmail({ to: author.email, subject: `Dokumen Ditolak: ${document.title}`, text: message });
      await sendNotification(
        { title: 'Dokumen Ditolak', body: `Dokumen Anda "${document.title}" telah ditolak. Alasan: ${reason}`, link: `/panel/documents` },
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
    const cats = await getAll<DocumentCategory>(COL_CATEGORIES, { orderBy: { field: 'name', direction: 'asc' } });
    console.log(`[getDocumentCategories] Fetched ${cats.length} categories.`);
    return cats;
  } catch (error) {
    console.error("[getDocumentCategories Error]", error);
    throw new Error("Gagal memuat kategori dokumen.");
  }
}

export async function getDocumentTypes(): Promise<DocumentType[]> {
  try {
    const types = await getAll<DocumentType>(COL_TYPES, { orderBy: { field: 'name', direction: 'asc' } });
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

    const romanMonthMap: Record<number, string> = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
      7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
    };
    const romanMonth = romanMonthMap[month];

    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    const recentDoc = await getFirst<any>(COL_DOCUMENTS, {
      where: [
        { field: 'createdAt', op: '>=', value: startOfYear },
        { field: 'createdAt', op: '<=', value: endOfYear },
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
    });

    let nextNumberInt = 1;
    if (recentDoc?.documentNumber) {
      const parts = recentDoc.documentNumber.split('/');
      const lastSeq = parseInt(parts[0], 10);
      if (!isNaN(lastSeq)) nextNumberInt = lastSeq + 1;
    }

    const nextNumber = nextNumberInt.toString().padStart(3, '0');
    return `${nextNumber}/${typeCode}/GL/DPP/${romanMonth}/${year}`;
  } catch (error) {
    console.error("[generateDocumentNumber Error]", error);
    throw new Error("Gagal membuat nomor dokumen.");
  }
}
