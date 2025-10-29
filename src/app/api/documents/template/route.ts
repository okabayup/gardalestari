'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function GET(req: NextRequest) {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "KOP SURAT ANDA DI SINI", bold: true })],
            heading: HeadingLevel.HEADING_1,
            alignment: 'center' as any,
          }),
          new Paragraph({ text: "\n" }), // Line break
          new Paragraph({
            children: [
              new TextRun({
                text: "Nomor: ...",
                break: 1, // Starts on a new line
              }),
              new TextRun({
                text: "Lampiran: ...",
                break: 1,
              }),
              new TextRun({
                text: "Perihal: ...",
                break: 1,
              }),
            ],
          }),
          new Paragraph({ text: "\n" }),
           new Paragraph({
            children: [
              new TextRun({
                text: "Yth. ...",
                break: 1,
              }),
               new TextRun({
                text: "di Tempat",
                break: 2, // double line break
              }),
            ],
          }),
           new Paragraph({ text: "\n" }),
          new Paragraph({
            text: "Dengan hormat,",
          }),
           new Paragraph({ text: "\n" }),
          new Paragraph({
            text: "Isi konten surat Anda di sini. Jelaskan maksud dan tujuan dari surat ini secara jelas dan ringkas.",
          }),
           new Paragraph({ text: "\n" }),
          new Paragraph({
            text: "Demikian surat ini kami sampaikan. Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.",
          }),
           new Paragraph({ text: "\n\n\n" }),
            new Paragraph({
            children: [
              new TextRun({
                text: "Hormat kami,",
                break: 1,
              }),
               new TextRun({
                text: "[Nama Anda/Jabatan]",
                 break: 4, // More space for signature
              }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="template_surat_resmi.docx"',
      },
    });

  } catch (error) {
    console.error("Error generating document template:", error);
    return new NextResponse("Failed to generate document", { status: 500 });
  }
}
