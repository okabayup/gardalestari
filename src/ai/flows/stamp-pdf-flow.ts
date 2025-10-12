

'use server';
/**
 * @fileOverview A flow to stamp a document with a QR code and document number.
 * This version receives precise coordinates for both elements from the client.
 */

import { z } from 'zod';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes } from 'firebase/storage';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { ai } from '@/ai/genkit';

const StampSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    rotation: z.number(),
});

const StampPdfInputSchema = z.object({
  documentId: z.string().describe('The ID of the document in Firestore to be stamped.'),
  documentNumber: z.string().describe('The official document number.'),
  fileUrl: z.string().describe('The current URL of the PDF file in Firebase Storage.'),
  qrStamp: StampSchema.describe('The position and size for the QR code stamp.'),
  numberStamp: StampSchema.describe('The position and size for the document number stamp.'),
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
  async ({ documentId, documentNumber, fileUrl, qrStamp, numberStamp }) => {
    // 1. Fetch the user-uploaded PDF from storage
    const pdfRef = ref(storage, fileUrl);
    const pdfBytes = await getBytes(pdfRef);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 2. Generate QR Code containing the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeImageBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', errorCorrectionLevel: 'H' });
    const qrImage = await pdfDoc.embedPng(qrCodeImageBuffer);
    
    // 3. Embed stamps on the first page
    const firstPage = pdfDoc.getPages()[0];
    const { height: pageHeight } = firstPage.getSize();
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed QR Code
    firstPage.drawImage(qrImage, {
        x: qrStamp.x,
        y: pageHeight - qrStamp.y - qrStamp.height, // Y is from bottom in pdf-lib
        width: qrStamp.width,
        height: qrStamp.height,
        rotate: degrees(qrStamp.rotation),
    });

    // Embed Document Number
    firstPage.drawText(documentNumber, {
        x: numberStamp.x,
        y: pageHeight - numberStamp.y - numberStamp.height, // Adjust for text baseline
        font: helveticaBoldFont,
        size: 8, // A small, official-looking font size
        color: rgb(0, 0, 0),
        rotate: degrees(numberStamp.rotation),
        lineHeight: 9,
    });
    
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
