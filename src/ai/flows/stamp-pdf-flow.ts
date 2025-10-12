
'use server';
/**
 * @fileOverview A flow to stamp a PDF document with a QR code and document number.
 *
 * - stampPdfWithQrCode - Stamps a PDF with QR code and number.
 * - generateDocxTemplateBuffer - Generates a DOCX template file in memory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDocument } from '@/app/actions/documents';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { Packer, Document as DocxDocument, Paragraph, TextRun, AlignmentType } from 'docx';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fromBuffer } from 'pdf2pic';
import { Readable } from 'stream';

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

// Helper function to find a placeholder and replace it with an image
async function findAndReplaceImage(page: PDFPage, placeholder: string, imageBytes: Buffer, qrSize: number) {
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
        if ('str' in item && item.str.includes(placeholder)) {
            // Simple approximation of position. This is not very accurate.
            // A more robust solution would involve parsing PDF content streams.
            const x = item.transform[4];
            const y = item.transform[5] - qrSize; // Adjust Y to place below the placeholder text line

            // Draw a white rectangle to cover the placeholder text
             page.drawRectangle({
                x: x - 5,
                y: y + qrSize,
                width: 100,
                height: 20,
                color: rgb(1, 1, 1),
            });

            const image = await page.doc.embedPng(imageBytes);
            page.drawImage(image, { x, y, width: qrSize, height: qrSize });
            return true;
        }
    }
    return false;
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

    // 4. Load PDF and Embed QR Code & Signature
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    const qrSize = 60;
    const qrX = width - qrSize - 50; // Position from right
    const qrY = 80; // Position from bottom

    // Embed QR Code
    const qrImage = await pdfDoc.embedPng(qrCodeImageBytes);
    firstPage.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    
    // Embed Text for Signature
    const textOptions = { font, size: 8, color: rgb(0, 0, 0) };
    const signatureTextLine1 = "a.n. Ketua Umum";
    const signatureTextLine2 = "L. Andri Saputro, S.I.Kom";

    const textWidth1 = font.widthOfTextAtSize(signatureTextLine1, 8);
    const textWidth2 = font.widthOfTextAtSize(signatureTextLine2, 8);

    firstPage.drawText(signatureTextLine1, { x: qrX + (qrSize - textWidth1) / 2, y: qrY - 10, ...textOptions });
    firstPage.drawText(signatureTextLine2, { x: qrX + (qrSize - textWidth2) / 2, y: qrY - 20, ...textOptions });

    // 5. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 6. Upload a new version to storage
    const stampedPdfRef = ref(storage, document.fileUrl); // Overwrite the original file
    await uploadBytes(stampedPdfRef, modifiedPdfBytes, {
        contentType: 'application/pdf',
    });

    console.log(`Successfully stamped and re-uploaded PDF for document ${documentId}`);
  }
);


export async function generateDocxTemplateBuffer(): Promise<Buffer> {
    const doc = new DocxDocument({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun("KOP SURAT ANDA DI SINI")],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                 new Paragraph({
                    children: [new TextRun({ text: "Nomor: [NOMOR_SURAT]", bold: true })],
                    alignment: AlignmentType.LEFT,
                }),
                new Paragraph({
                    text: "Isi surat Anda di sini...",
                    spacing: { after: 800 },
                }),
                new Paragraph({
                    text: "Hormat kami,",
                    spacing: { after: 200 },
                }),
                 new Paragraph({
                    children: [new TextRun("[TTD_QR]")],
                     spacing: { top: 1200 },
                }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
}
