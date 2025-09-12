
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect } from '@/services/whatsapp';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'document_submission' | 'document_approved' | 'new_task_assigned';

export interface WhatsAppTemplate {
    id: NotificationType;
    label: string;
    message: string;
    isActive: boolean;
    placeholders: string[];
}

const defaultTemplates: Record<NotificationType, WhatsAppTemplate> = {
    document_submission: {
        id: 'document_submission',
        label: 'Permintaan Persetujuan Dokumen',
        message: 'Halo {namaPenerima},\n\nDokumen "{judulDokumen}" dari {namaPengirim} memerlukan persetujuan Anda. Silakan tinjau di panel admin Garda Lestari.',
        isActive: true,
        placeholders: ['{namaPenerima}', '{judulDokumen}', '{namaPengirim}']
    },
    document_approved: {
        id: 'document_approved',
        label: 'Dokumen Disetujui',
        message: 'Kabar baik, {namaPengguna}! Dokumen Anda "{judulDokumen}" telah disetujui dan disahkan secara digital. Anda dapat mengunduhnya di aplikasi.',
        isActive: true,
        placeholders: ['{namaPengguna}', '{judulDokumen}']
    },
    new_task_assigned: {
        id: 'new_task_assigned',
        label: 'Tugas Proyek Baru',
        message: 'Halo {namaPengguna}, Anda telah ditugaskan untuk mengerjakan tugas baru: "{namaTugas}" di proyek "{namaProyek}". Silakan periksa detailnya di papan proyek.',
        isActive: true,
        placeholders: ['{namaPengguna}', '{namaTugas}', '{namaProyek}']
    }
};

const settingsDocRef = doc(db, 'settings', 'whatsappTemplates');

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        // Merge with defaults to ensure all templates are present
        return { ...defaultTemplates, ...docSnap.data() };
    }
    // If no settings exist in firestore, initialize with defaults
    await setDoc(settingsDocRef, defaultTemplates);
    return defaultTemplates;
}

export async function getWhatsappTemplate(id: NotificationType): Promise<WhatsAppTemplate> {
    const templates = await getWhatsappTemplates();
    return templates[id] || defaultTemplates[id];
}

export async function updateWhatsappTemplates(templates: Record<NotificationType, WhatsAppTemplate>) {
    await setDoc(settingsDocRef, templates, { merge: true });
    revalidatePath('/panel/whatsapp/templates');
}


export async function sendTestMessage(phoneNumber: string, message: string) {
    try {
        await sendWhatsAppMessageSatuConnect(phoneNumber, message);
        return { success: true };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("Error in sendTestMessage action:", errorMessage);
        throw new Error(errorMessage);
    }
}
