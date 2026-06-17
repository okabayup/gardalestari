
'use client';

import React, { useRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = React.forwardRef<
  { editor: HTMLDivElement | null },
  RichTextEditorProps
>(({ value, onChange, placeholder }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    editor: editorRef.current,
  }));

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    onChange(event.currentTarget.innerHTML);
  };
  
  const handleCommand = (command: string) => {
    document.execCommand(command, false);
    if(editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
        <div className="p-1 border-b">
             <ToggleGroup type="multiple" size="sm">
                <ToggleGroupItem value="bold" aria-label="Toggle bold" onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }}>
                    <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Toggle italic" onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }}>
                    <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                 <ToggleGroupItem value="ul" aria-label="Unordered List" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertUnorderedList'); }}>
                    <List className="h-4 w-4" />
                </ToggleGroupItem>
                 <ToggleGroupItem value="ol" aria-label="Ordered List" onMouseDown={(e) => { e.preventDefault(); handleCommand('insertOrderedList'); }}>
                    <ListOrdered className="h-4 w-4" />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div
            ref={editorRef}
            onInput={handleInput}
            contentEditable
            suppressContentEditableWarning
            className={cn(
              'min-h-[300px] w-full bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose dark:prose-invert max-w-none [&[contenteditable=true]]:focus:outline-none'
            )}
            dangerouslySetInnerHTML={{ __html: value }}
        />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
