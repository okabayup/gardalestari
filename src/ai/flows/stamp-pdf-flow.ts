
'use server';
/**
 * @fileOverview A flow to stamp a document with a QR code and document number.
 * This flow now uses a .docx template to dynamically place the stamps.
 *
 * - stampPdfWithQrCode - Stamps a document and saves it as PDF.
 */

import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { ai } from '@/ai/genkit';
import { Packer, Document as DocxDocument, Paragraph, TextRun, ImageRun } from 'docx';
import { generateDocxTemplateBuffer } from '@/app/api/templates/surat_resmi/route';

const StampPdfInputSchema = z.string().describe('The ID of the document in Firestore to be stamped.');
export type StampPdfInput = z.infer<typeof StampPdfInputSchema>;

export async function stampPdfWithQrCode(input: StampPdfInput): Promise<void> {
  return stampPdfFlow(input);
}

const stampPdfFlow = ai.defineFlow(
  {
    name: 'stampPdfFlow',
    inputSchema: StampPdfInputSchema,
    outputSchema: z.void(),
  },
  async (documentId) => {
    // 1. Get Document Data
    const document = await getDocument(documentId);
    if (!document || !document.documentNumber) {
      throw new Error(`Dokumen dengan ID ${documentId} tidak ditemukan atau belum memiliki nomor surat.`);
    }

    // 2. Generate QR Code
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeImageBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', errorCorrectionLevel: 'H' });

    // === NEW APPROACH: Fixed position stamping on the uploaded PDF ===
    // This is more reliable as parsing DOCX/PDF content on the server is complex.

    // 1. Fetch the user-uploaded PDF
    const pdfRef = ref(storage, document.fileUrl);
    const pdfBytes = await fetch(pdfRef.toString()).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    // 2. Add Document Number (Top Right)
    // We assume a standard A4 page and place it accordingly.
    // x: from left, y: from bottom
    firstPage.drawText(document.documentNumber, {
      x: width - 200,
      y: height - 100, // Positioned lower to avoid header conflicts
      size: 12,
      color: rgb(0, 0, 0),
    });

    // 3. Add QR Code Stamp (Bottom Left)
    const qrImage = await pdfDoc.embedPng(qrCodeImageBuffer);
    const qrDims = qrImage.scale(0.35); // Slightly larger QR
    firstPage.drawImage(qrImage, {
        x: 70,  // Standard left margin
        y: 70,  // Standard bottom margin
        width: qrDims.width,
        height: qrDims.height,
    });
    
    // 4. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 5. Upload the stamped version back to storage, overwriting the original file
    const stampedPdfRef = ref(storage, document.fileUrl); 
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);
