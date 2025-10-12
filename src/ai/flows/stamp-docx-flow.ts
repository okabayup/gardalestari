
'use server';
/**
 * @fileOverview A flow to stamp a DOCX document with a QR code and document number,
 * then convert it to a PDF and save it back to storage.
 */

import { z } from 'zod';
import { storage } from '@/lib/firebase';
import { ref, getBytes, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Document, Packer, ImageRun, TextRun, Paragraph } from 'docx';
import QRCode from 'qrcode';
import { ai } from '@/ai/genkit';
import { Readable } from 'stream';

const StampDocxInputSchema = z.object({
  documentId: z.string().describe('The ID of the document in Firestore to be stamped.'),
  documentNumber: z.string().describe('The official document number.'),
  filePath: z.string().describe('The path of the DOCX file in Firebase Storage.'),
});

export type StampDocxInput = z.infer<typeof StampDocxInputSchema>;

const StampDocxOutputSchema = z.object({
    newFileUrl: z.string(),
    newFilePath: z.string(),
    newFileName: z.string(),
});

export async function stampDocxAndConvertToPdf(input: StampDocxInput): Promise<z.infer<typeof StampDocxOutputSchema>> {
  return stampDocxFlow(input);
}

const stampDocxFlow = ai.defineFlow(
  {
    name: 'stampDocxAndConvertToPdfFlow',
    inputSchema: StampDocxInputSchema,
    outputSchema: StampDocxOutputSchema,
  },
  async ({ documentId, documentNumber, filePath }) => {
    // 1. Fetch the user-uploaded DOCX from storage
    const docxRef = ref(storage, filePath);
    const docxBytes = await getBytes(docxRef);

    // 2. Generate QR Code
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dokumen/verifikasi/${documentId}`;
    const qrCodeImageBuffer = await QRCode.toBuffer(verificationUrl, {
      type: 'png',
      errorCorrectionLevel: 'H',
      width: 200,
    });
    
    // 3. Load the DOCX, replace placeholders, and generate a new buffer
    const doc = new Document({
        sections: (await Packer.extractRawText(docxBytes)).sections.map(section => ({
            ...section,
            children: section.children.map(child => {
                if (child instanceof Paragraph) {
                    const newChildren = child.options.children?.flatMap(run => {
                        if (run instanceof TextRun && run.options.text?.includes('[NOMOR_SURAT]')) {
                            return new TextRun({ ...run.options, text: run.options.text.replace('[NOMOR_SURAT]', documentNumber) });
                        }
                        if (run instanceof TextRun && run.options.text?.includes('[TTD_QR]')) {
                            return new ImageRun({
                                data: qrCodeImageBuffer,
                                transformation: { width: 80, height: 80 },
                            });
                        }
                        return run;
                    });
                    return new Paragraph({ ...child.options, children: newChildren });
                }
                return child;
            })
        }))
    });

    const pdfBuffer = await Packer.toPdf(doc);

    // 4. Upload the new PDF to storage
    const newFileName = filePath.replace('.docx', '.pdf').split('/').pop() || `${documentId}.pdf`;
    const newFilePath = `documents/${newFileName}`;
    const pdfStorageRef = ref(storage, newFilePath);
    
    await uploadBytes(pdfStorageRef, pdfBuffer, {
        contentType: 'application/pdf',
    });
    
    const newFileUrl = await getDownloadURL(pdfStorageRef);
    
    console.log(`Successfully stamped, converted, and uploaded PDF for document ${documentId}`);

    return { newFileUrl, newFilePath, newFileName };
  }
);
