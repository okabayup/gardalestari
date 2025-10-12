
'use server';
/**
 * @fileOverview A flow to stamp a PDF document with a QR code and document number.
 *
 * - stampPdfWithQrCode - Stamps a PDF with QR code and number.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes } from 'firebase/storage';
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';

const StampPdfInputSchema = z.string().describe('The ID of the document in Firestore to be stamped.');
export type StampPdfInput = z.infer<typeof StampPdfInputSchema>;

export async function stampPdfWithQrCode(input: StampPdfInput): Promise<void> {
  return stampPdfFlow(input);
}

// Helper function to find a placeholder and replace it.
// This is very basic and relies on the placeholder being on its own line.
async function findAndReplacePlaceholder(page: PDFPage, placeholder: string, replacement: { type: 'qr', data: Buffer, size: number } | { type: 'text', text: string, font: any, size: number }) {
    const textContent = await page.getTextContent();
    const { width, height } = page.getSize();
    
    for (const item of textContent.items) {
        if ('str' in item && item.str.includes(placeholder)) {
            const x = item.transform[4];
            let y = height - item.transform[5]; // pdf-lib y is from bottom, textContent y is from top

            page.drawRectangle({
                x: x - 5,
                y: y - 5,
                width: 100, // Assume placeholder is not wider than this
                height: 20,
                color: rgb(1, 1, 1), // Cover with white
            });
            
            if (replacement.type === 'qr') {
                const qrImage = await page.doc.embedPng(replacement.data);
                const qrX = width - replacement.size - 50;
                const qrY = 80;
                page.drawImage(qrImage, { x: qrX, y: qrY, width: replacement.size, height: replacement.size });
                 
                // Also add signature text below the QR
                const signatureTextLine1 = "a.n. Ketua Umum";
                const signatureTextLine2 = "L. Andri Saputro, S.I.Kom";
                const signatureFont = await page.doc.embedFont(StandardFonts.Helvetica);
                const textWidth1 = signatureFont.widthOfTextAtSize(signatureTextLine1, 8);
                const textWidth2 = signatureFont.widthOfTextAtSize(signatureTextLine2, 8);

                page.drawText(signatureTextLine1, { x: qrX + (replacement.size - textWidth1) / 2, y: qrY - 10, font: signatureFont, size: 8, color: rgb(0, 0, 0) });
                page.drawText(signatureTextLine2, { x: qrX + (replacement.size - textWidth2) / 2, y: qrY - 20, font: signatureFont, size: 8, color: rgb(0, 0, 0) });


            } else if (replacement.type === 'text') {
                page.drawText(replacement.text, { x, y: y-3, font: replacement.font, size: replacement.size, color: rgb(0, 0, 0) });
            }
            return;
        }
    }
     console.warn(`Placeholder "${placeholder}" not found in PDF.`);
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
    if (!document || !document.fileUrl) {
      throw new Error(`Dokumen dengan ID ${documentId} tidak ditemukan atau tidak memiliki file.`);
    }

    // 2. Generate QR Code
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });
    const qrCodeImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    
    // 3. Download Original PDF from Storage
    const pdfRef = ref(storage, document.fileUrl);
    const pdfBytes = await getBytes(pdfRef);

    // 4. Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const firstPage = pdfDoc.getPages()[0];
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 5. Replace Placeholders
    // Replace TTD placeholder with QR Code
    await findAndReplacePlaceholder(firstPage, '[TTD_QR]', { type: 'qr', data: qrCodeImageBytes, size: 80 });
    
    // Replace Nomor Surat placeholder with actual number
    await findAndReplacePlaceholder(firstPage, '[NOMOR_SURAT]', { type: 'text', text: document.documentNumber, font: helveticaFont, size: 12 });


    // 6. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 7. Upload a new version to storage
    const stampedPdfRef = ref(storage, document.fileUrl); // Overwrite the original file
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);
