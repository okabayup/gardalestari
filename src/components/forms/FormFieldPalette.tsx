
'use client';

import {
  Type,
  List,
  CheckSquare,
  MousePointerSquare,
  File,
  Heading1,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormFieldType } from '@/app/actions/forms';

const fieldTypes = [
  { type: 'text' as FormFieldType, label: 'Input Teks', icon: Type },
  { type: 'textarea' as FormFieldType, label: 'Text Area', icon: List },
  { type: 'select' as FormFieldType, label: 'Pilihan (Dropdown)', icon: MousePointerSquare },
  { type: 'checkbox' as FormFieldType, label: 'Kotak Centang', icon: CheckSquare },
  { type: 'radio' as FormFieldType, label: 'Pilihan Ganda', icon: List },
  { type: 'file' as FormFieldType, label: 'Unggah File', icon: File },
];

interface FormFieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

export function FormFieldPalette({ onAddField }: FormFieldPaletteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Palet Field</CardTitle>
        <CardDescription>Klik untuk menambahkan field baru ke formulir Anda.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {fieldTypes.map((fieldType) => (
          <Button
            key={fieldType.type}
            variant="outline"
            className="h-auto p-2 flex flex-col items-center justify-center gap-1"
            onClick={() => onAddField(fieldType.type)}
          >
            <fieldType.icon className="h-6 w-6" />
            <span className="text-xs text-center">{fieldType.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
