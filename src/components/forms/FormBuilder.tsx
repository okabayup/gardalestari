
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { produce } from 'immer';
import { useToast } from '@/hooks/use-toast';
import { ProgramForm, FormField, createForm, updateForm } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { FormFieldPalette } from './FormFieldPalette';
import { SortableFormField } from './SortableFormField';
import { FormFieldItem } from './FormFieldItem';

interface FormBuilderProps {
  existingForm?: ProgramForm;
}

export default function FormBuilder({ existingForm }: FormBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(existingForm?.title || '');
  const [description, setDescription] = useState(existingForm?.description || '');
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields || []);
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const field = fields.find((f) => f.id === active.id);
    if(field) setActiveField(field);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveField(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `${type}-${Date.now()}`,
      type,
      label: `Label ${type}`,
      required: false,
      ...(type === 'select' || type === 'radio' ? { options: [{ id: 'opt-1', value: 'Option 1', label: 'Option 1' }] } : {})
    };
    setFields((prev) => [...prev, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      produce((draft) => {
        const field = draft.find((f) => f.id === id);
        if (field) {
          Object.assign(field, updates);
        }
      })
    );
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };
  
  const updateOption = (fieldId: string, optionId: string, newLabel: string) => {
    setFields(produce(draft => {
        const field = draft.find(f => f.id === fieldId);
        if (field && field.options) {
            const option = field.options.find(o => o.id === optionId);
            if (option) {
                option.label = newLabel;
                option.value = newLabel;
            }
        }
    }));
  };

  const addOption = (fieldId: string) => {
    setFields(produce(draft => {
        const field = draft.find(f => f.id === fieldId);
        if (field && field.options) {
            const newId = `opt-${Date.now()}`;
            field.options.push({id: newId, value: `Option ${field.options.length + 1}`, label: `Option ${field.options.length + 1}`});
        }
    }));
  };

  const removeOption = (fieldId: string, optionId: string) => {
    setFields(produce(draft => {
        const field = draft.find(f => f.id === fieldId);
        if (field && field.options) {
            field.options = field.options.filter(o => o.id !== optionId);
        }
    }));
  };

  const handleSubmit = async () => {
    if (!title) {
        toast({ variant: 'destructive', title: 'Judul formulir dibutuhkan' });
        return;
    }
    setLoading(true);

    const formPayload: Omit<ProgramForm, 'id'> = { title, description, fields };

    try {
        if(existingForm?.id) {
            await updateForm(existingForm.id, formPayload);
             toast({ title: 'Formulir diperbarui!', description: 'Perubahan telah disimpan.' });
        } else {
            await createForm(formPayload);
            toast({ title: 'Formulir dibuat!', description: 'Formulir baru telah berhasil disimpan.' });
        }
        router.push('/panel/forms');
    } catch(error) {
        toast({ variant: 'destructive', title: 'Gagal menyimpan', description: (error as Error).message });
        setLoading(false);
    }
  };


  return (
    <div className="p-6">
       <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => router.back()}>
            Kembali
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingForm ? 'Simpan Perubahan' : 'Simpan Formulir'}
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <FormFieldPalette onAddField={addField} />
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Form Builder</CardTitle>
                        <CardDescription>
                            Isi detail formulir dan seret & lepas field dari palet ke area di bawah ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="form-title">Judul Formulir</Label>
                            <Input id="form-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Formulir Pendaftaran Program Beasiswa" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="form-desc">Deskripsi</Label>
                            <Textarea id="form-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat tentang formulir ini."/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardContent className="p-6 min-h-[300px] border-dashed border-2 rounded-lg">
                        <DndContext
                            sensors={sensors}
                            collisionDetector={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                                <div className="space-y-4">
                                {fields.map((field) => (
                                    <SortableFormField key={field.id} id={field.id} field={field} onUpdate={updateField} onRemove={removeField} onUpdateOption={updateOption} onAddOption={addOption} onRemoveOption={removeOption} />
                                ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {activeField ? <FormFieldItem field={activeField} /> : null}
                            </DragOverlay>
                        </DndContext>
                        {fields.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                <p>Seret field dari palet ke sini</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
