
'use server';
/**
 * @fileOverview A flow to stamp a PDF document with a QR code.
 *
 * - stampPdfWithQrCode - A function that takes a document ID, generates a QR code for its verification URL,
 *   and embeds it into the PDF document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const StampPdfInputSchema = z.string().describe('The ID of the document in Firestore to be stamped.');
export type StampPdfInput = z.infer<typeof StampPdfInputSchema>;

export async function stampPdfWithQrCode(input: StampPdfInput): Promise<void> {
  return stampPdfFlow(input);
}

// Helper function to read the logo file
async function getLogoImage(): Promise<Buffer> {
    const logoPath = path.resolve('./public', 'logo.png');
    return fs.promises.readFile(logoPath);
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

    // 4. Load PDF and Embed QR Code
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const qrImage = await pdfDoc.embedPng(qrCodeImageBytes);
    
    // Check if logo file exists before embedding
    let logoImage;
    try {
        const logoBytes = await getLogoImage();
        logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (error) {
        console.warn("Logo file not found, skipping logo embedding in QR code.");
    }


    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    const qrSize = 60; // size of QR code in points
    const padding = 20; // padding from corner

    // Embed QR Code
    firstPage.drawImage(qrImage, {
      x: width - qrSize - padding,
      y: padding,
      width: qrSize,
      height: qrSize,
    });
    
    // Embed Logo in the center of QR code if it exists
    if (logoImage) {
        const logoSize = qrSize / 3.5;
        firstPage.drawImage(logoImage, {
            x: width - qrSize - padding + (qrSize - logoSize) / 2,
            y: padding + (qrSize - logoSize) / 2,
            width: logoSize,
            height: logoSize,
        });
    }

    // 5. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 6. Upload a new version to storage
    const stampedPdfRef = ref(storage, document.fileUrl); // Overwrite the original file
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
    
    // The getDownloadURL is not strictly needed here if we overwrite, but good practice
    // in case the URL format changes. We are not updating firestore URL as it should be stable.
    await getDownloadURL(stampedPdfRef);
  }
);
