
'use client';

import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { Loader2 } from 'lucide-react';

interface DocxViewerProps {
  fileUrl: string;
}

export default function DocxViewer({ fileUrl }: DocxViewerProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRenderDocx = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Gagal mengambil file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch (err) {
        console.error('Error rendering DOCX:', err);
        setError('Gagal menampilkan pratinjau dokumen.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderDocx();
  }, [fileUrl]);

  return (
    <div className="w-full h-full bg-white p-6 overflow-auto">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
