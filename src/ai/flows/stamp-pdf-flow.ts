
'use server';
/**
 * @fileOverview A flow to stamp a PDF document with a QR code and document number.
 *
 * - stampPdfWithQrCode - Stamps a PDF with QR code and number.
 */

import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes } from 'firebase/storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { ai } from '@/ai/genkit';
import { promises as fs } from 'fs';
import path from 'path';

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
    const qrCodeImageBytes = await QRCode.toBuffer(verificationUrl, { type: 'png', errorCorrectionLevel: 'H' });

    // 3. Load the user-uploaded PDF from Storage
    const pdfRef = ref(storage, document.fileUrl);
    const pdfBytes = await getBytes(pdfRef);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 4. Get the form from the PDF
    const form = pdfDoc.getForm();

    // 5. Fill the "nomor_surat" text field
    try {
        const nomorSuratField = form.getTextField('nomor_surat');
        nomorSuratField.setText(document.documentNumber);
        nomorSuratField.updateAppearances(await pdfDoc.embedFont(StandardFonts.TimesRoman));
    } catch (e) {
        console.warn("[stampPdfFlow] Warning: 'nomor_surat' field not found in PDF. Skipping numbering.");
    }
    
    // 6. Fill the "ttd_qr" image button field
    try {
        const qrImage = await pdfDoc.embedPng(qrCodeImageBytes);
        const ttdQrField = form.getButton('ttd_qr');
        ttdQrField.setImage(qrImage);
    } catch (e) {
        console.warn("[stampPdfFlow] Warning: 'ttd_qr' field not found in PDF. Skipping QR code stamp.");
    }

    // 7. Flatten the form to make the fields non-editable
    form.flatten();

    // 8. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 9. Upload the stamped version back to storage, overwriting the original file
    const stampedPdfRef = ref(storage, document.fileUrl); 
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);
