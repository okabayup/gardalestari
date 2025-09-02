
'use client';

import { GripVertical } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { FormField } from '@/app/actions/forms';

export function FormFieldItem({ field }: { field: FormField }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
        <div className="flex-1">
          <p className="font-semibold">{field.label}</p>
          <p className="text-xs text-muted-foreground">Tipe: {field.type} {field.required && '(Wajib)'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
