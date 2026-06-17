
'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getForm, ProgramForm } from "@/app/actions/forms";
import FormBuilder from "@/components/forms/FormBuilder";
import { Loader2 } from "lucide-react";

export default function EditFormPage() {
    const params = useParams();
    const formId = params.id as string;
    const [form, setForm] = useState<ProgramForm | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (formId) {
            getForm(formId).then(data => {
                setForm(data);
                setLoading(false);
            });
        }
    }, [formId]);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

    if (!form) {
        return <div>Formulir tidak ditemukan.</div>
    }
    
    return <FormBuilder existingForm={form} />;
}
