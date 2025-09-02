
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/app/actions/forms';
import { GripVertical, Trash2, Edit, PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface SortableFormFieldProps {
  id: string;
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
  onUpdateOption: (fieldId: string, optionId: string, newLabel: string) => void;
  onAddOption: (fieldId: string) => void;
  onRemoveOption: (fieldId: string, optionId: string) => void;
}

export function SortableFormField({ id, field, onUpdate, onRemove, ...optionProps }: SortableFormFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div {...listeners} className="cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{field.label}</p>
            <p className="text-xs text-muted-foreground">
              Tipe: {field.type} {field.required && '(Wajib)'}
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="left" align="start">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Edit Field</h4>
                        <p className="text-sm text-muted-foreground">Sesuaikan properti field ini.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input id="label" value={field.label} onChange={(e) => onUpdate(id, { label: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="placeholder">Placeholder</Label>
                        <Input id="placeholder" value={field.placeholder} onChange={(e) => onUpdate(id, { placeholder: e.target.value })} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="required" checked={field.required} onCheckedChange={(checked) => onUpdate(id, { required: checked })}/>
                        <Label htmlFor="required">Wajib diisi</Label>
                    </div>
                    {(field.type === 'select' || field.type === 'radio') && (
                        <div className="space-y-2">
                            <Label>Opsi</Label>
                            <div className="space-y-2">
                            {field.options?.map(opt => (
                                <div key={opt.id} className="flex items-center gap-2">
                                    <Input value={opt.label} onChange={(e) => optionProps.onUpdateOption(id, opt.id, e.target.value)} />
                                    <Button variant="ghost" size="icon" onClick={() => optionProps.onRemoveOption(id, opt.id)}>
                                        <MinusCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => optionProps.onAddOption(id)}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Tambah Opsi
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={() => onRemove(id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
