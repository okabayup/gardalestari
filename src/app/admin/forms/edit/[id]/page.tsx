
'use client';
import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import FormBuilder from '@/components/forms/FormBuilder';
import { getForm, ProgramForm } from '@/app/actions/forms';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function EditFormPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();
    const [form, setForm] = useState<ProgramForm | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchForm = async () => {
            try {
                setLoading(true);
                const fetchedForm = await getForm(id as string);
                if (!fetchedForm) {
                    notFound();
                    return;
                }
                setForm(fetchedForm);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Gagal memuat formulir' });
                router.push('/admin/forms');
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [id, router, toast]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!form) return null;

    return (
        <MainLayout>
            <FormBuilder existingForm={form} />
        </MainLayout>
    );
}
