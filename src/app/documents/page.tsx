
'use server';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDocuments, ImportantDocument } from '@/app/actions/documents';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const DocumentItem = ({ document }: { document: ImportantDocument }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{document.title}</CardTitle>
        <CardDescription>
          Nomor: {document.documentNumber} | Disahkan pada {document.approvedAt ? format(new Date(document.approvedAt as unknown as Date), 'dd MMMM yyyy', { locale: id }) : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Disahkan oleh: <span className="font-medium">{document.approvedByName}</span>
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={document.fileUrl} target="_blank">
            <Download className="mr-2 h-4 w-4" />
            Unduh
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default async function PublicDocumentsPage() {
  const allDocuments = await getDocuments();
  // Only show approved documents on the public page
  const approvedDocuments = allDocuments.filter(doc => doc.status === 'Disetujui' && doc.approvedAt);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-3xl font-bold">Arsip Dokumen</h1>
          <p className="text-muted-foreground">Dokumen resmi yang telah disahkan dan dipublikasikan.</p>
        </div>
          <div className="space-y-4">
            {approvedDocuments.length > 0 ? (
              approvedDocuments.map((item) => (
                <DocumentItem key={item.id!} document={item} />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10" />
                  <span>Belum ada dokumen yang dipublikasikan.</span>
                </div>
              </div>
            )}
          </div>
      </div>
    </MainLayout>
  );
}

    