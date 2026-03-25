'use client';

/**
 * Polyfill for Promise.withResolvers
 * This is required for compatibility with pdfjs-dist v4+ in environments
 * that do not yet support this newer JavaScript feature (Node.js < 22, older browsers).
 */
if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
  (Promise as any).withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader2, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { useElementSize } from '@/hooks/use-element-size';

// Inisialisasi worker menggunakan CDN stabil untuk menghindari masalah bundling worker lokal
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  file: string;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [containerRef, { width }] = useElementSize();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };
  
  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  const zoomIn = () => setScale(prev => prev + 0.2);
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-muted/30">
      <div className="flex-1 overflow-auto flex justify-center py-4">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          error={<div className="p-10 text-center text-destructive">Gagal memuat PDF.</div>}
          className="shadow-lg"
        >
          <Page 
            pageNumber={pageNumber} 
            width={width ? Math.floor(width * scale * 0.9) : undefined} 
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      </div>
      {numPages && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 p-2 bg-background border-t text-foreground">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}><ZoomOut className="h-4 w-4"/></Button>
            <Button variant="outline" size="icon" onClick={zoomIn}><ZoomIn className="h-4 w-4"/></Button>
            <span className="w-px h-6 bg-border mx-2"></span>
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}><ChevronUp className="h-4 w-4"/></Button>
            <span className="text-sm">Halaman {pageNumber} dari {numPages}</span>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}><ChevronDown className="h-4 w-4"/></Button>
        </div>
      )}
    </div>
  );
}