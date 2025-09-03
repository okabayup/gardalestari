'use client';

import React, { useRef, useState } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = React.forwardRef<
  { updateHtml: (markdown: string) => void; editor: HTMLDivElement | null },
  RichTextEditorProps
>(({ value, onChange }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlValue, setHtmlValue] = useState(marked(value || ''));

  const handleInput = () => {
    if (editorRef.current) {
      // For simplicity, we are getting innerText.
      // A more robust solution might convert HTML back to markdown.
      onChange(editorRef.current.innerText);
    }
  };

  const updateHtml = (markdownText: string) => {
    if (editorRef.current) {
      const newHtml = marked(markdownText) as string;
      setHtmlValue(newHtml);
      editorRef.current.innerHTML = newHtml;
    }
  };

  React.useImperativeHandle(ref, () => ({
    updateHtml,
    editor: editorRef.current,
  }));

  return (
    <div
      ref={editorRef}
      onInput={handleInput}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'prose dark:prose-invert min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
      )}
      dangerouslySetInnerHTML={{ __html: htmlValue }}
    />
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
