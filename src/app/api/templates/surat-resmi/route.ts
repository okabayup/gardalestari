
import { generateDocxTemplateBuffer } from '@/ai/flows/stamp-pdf-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const buffer = await generateDocxTemplateBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="template_surat_resmi.docx"',
      },
    });
  } catch (error) {
    console.error('[Template Generation Error]', error);
    return new NextResponse('Gagal membuat template dokumen.', { status: 500 });
  }
}
