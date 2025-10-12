
'use server';
/**
 * @fileOverview A flow to stamp a document with a QR code and document number.
 * This version receives precise coordinates from the client for stamping.
 */

import { z } from 'zod';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import { ai } from '@/ai/genkit';

const StampPdfInputSchema = z.object({
  documentId: z.string().describe('The ID of the document in Firestore to be stamped.'),
  documentNumber: z.string().describe('The official document number.'),
  fileUrl: z.string().describe('The current URL of the PDF file in Firebase Storage.'),
  stamp: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
  }).describe('The position and size of the stamp.')
});

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
  async ({ documentId, documentNumber, fileUrl, stamp }) => {
    // 1. Fetch the user-uploaded PDF from storage
    const pdfRef = ref(storage, fileUrl);
    const pdfBytes = await getBytes(pdfRef);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 2. Generate QR Code containing the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeImageBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', errorCorrectionLevel: 'H' });
    const qrImage = await pdfDoc.embedPng(qrCodeImageBuffer);

    // 3. Add Document Number and QR Code Stamp on the first page
    const firstPage = pdfDoc.getPages()[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();
    
    // Embed the QR code image at the precise location from the client
    firstPage.drawImage(qrImage, {
        x: stamp.x,
        y: pageHeight - stamp.y - stamp.height, // Y is from bottom in pdf-lib
        width: stamp.width,
        height: stamp.height,
        rotate: degrees(stamp.rotation),
    });
    
    // Optionally, add the document number near the stamp or at a fixed position
    // For now, we assume the document number is part of the document body itself.
    // If we need to add it, we would use firstPage.drawText(...) here.

    // 4. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 5. Upload the stamped version back to storage, overwriting the original file
    const stampedPdfRef = ref(storage, fileUrl); 
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);
