
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
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import admin from 'firebase-admin';
import { ai } from '@/ai/genkit';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const StampPdfInputSchema = z.string().describe('The ID of the document in Firestore to be stamped.');
export type StampPdfInput = z.infer<typeof StampPdfInputSchema>;

export async function stampPdfWithQrCode(input: StampPdfInput): Promise<void> {
  return stampPdfFlow(input);
}

// Helper function to find a placeholder and replace it.
async function findAndReplacePlaceholder(page: PDFPage, placeholder: string, replacement: { type: 'qr', data: Buffer } | { type: 'text', text: string, font: any, size: number }) {
    const textContent = await (page as any).getTextContent();
    const { width, height } = page.getSize();
    
    // Find placeholder bounds by looking for the start and end markers
    let startMarker, endMarker;
    if (placeholder === '[TTD_QR]') {
        startMarker = textContent.items.find((item: any) => item.str.includes('--'));
        endMarker = textContent.items.reverse().find((item: any) => item.str.includes('--'));
        textContent.items.reverse(); // reverse back
    } else {
        startMarker = textContent.items.find((item: any) => item.str.includes(placeholder));
    }
    
    if (!startMarker) {
        console.warn(`Placeholder "${placeholder}" not found in PDF.`);
        return;
    }

    const placeholderX = startMarker.transform[4];
    const placeholderY = height - startMarker.transform[5];

    page.drawRectangle({
        x: placeholderX - 5,
        y: placeholderY - 15,
        width: 150, 
        height: 20, 
        color: rgb(1, 1, 1),
    });

    if (replacement.type === 'text') {
        page.drawText(replacement.text, { x: placeholderX, y: placeholderY, font: replacement.font, size: replacement.size, color: rgb(0, 0, 0) });
    } else if (replacement.type === 'qr' && startMarker && endMarker) {
        // Calculate size and position based on markers
        const topY = height - startMarker.transform[5];
        const bottomY = height - endMarker.transform[5];
        const qrSize = 80;
        
        const qrX = startMarker.transform[4];
        const qrY = bottomY;

        const qrImage = await page.doc.embedPng(replacement.data);

        // Clear the area of the markers
        page.drawRectangle({
            x: qrX, y: qrY - 5, width: 50, height: qrSize + 10, color: rgb(1,1,1)
        });

        page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    } else if (replacement.type === 'qr') {
        // Fallback if markers are not found
        const qrImage = await page.doc.embedPng(replacement.data);
        const qrSize = 80;
        page.drawImage(qrImage, { x: placeholderX, y: placeholderY - qrSize, width: qrSize, height: qrSize });
    }
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

    // 4. Load PDF and Font
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const standardFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 5. Replace Placeholders on the first page
    const firstPage = pdfDoc.getPages()[0];
    
    if (document.documentNumber) {
        await findAndReplacePlaceholder(firstPage, '[NOMOR_SURAT]', { type: 'text', text: document.documentNumber, font: standardFont, size: 12 });
    }
    await findAndReplacePlaceholder(firstPage, '[TTD_QR]', { type: 'qr', data: qrCodeImageBytes });


    // 6. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 7. Upload a new version to storage (overwrite the original file)
    const stampedPdfRef = ref(storage, document.fileUrl); 
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);
