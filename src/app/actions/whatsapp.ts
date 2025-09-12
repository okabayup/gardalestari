
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect } from '@/services/whatsapp';
import { revalidatePath } from 'next/cache';
import { getPrograms } from './programs';

export type NotificationType = 
    | 'document_submission' 
    | 'document_approved'
    | 'document_rejected'
    | 'new_task_assigned'
    | 'member_verified_permanent'
    | 'member_verification_rejected'
    | 'event_reminder'
    | 'new_program_announcement';

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
    document_rejected: {
        id: 'document_rejected',
        label: 'Dokumen Ditolak',
        message: 'Halo {namaPengguna}, dokumen Anda "{judulDokumen}" ditolak oleh {namaPenolak} dengan alasan: "{alasanPenolakan}".',
        isActive: true,
        placeholders: ['{namaPengguna}', '{judulDokumen}', '{namaPenolak}', '{alasanPenolakan}']
    },
    new_task_assigned: {
        id: 'new_task_assigned',
        label: 'Tugas Proyek Baru',
        message: 'Halo {namaPengguna}, Anda telah ditugaskan untuk mengerjakan tugas baru: "{namaTugas}" di proyek "{namaProyek}". Silakan periksa detailnya di papan proyek.',
        isActive: true,
        placeholders: ['{namaPengguna}', '{namaTugas}', '{namaProyek}']
    },
    member_verified_permanent: {
        id: 'member_verified_permanent',
        label: 'Verifikasi Anggota Berhasil',
        message: 'Selamat {namaPengguna}! Akun Garda Lestari Anda telah diverifikasi secara permanen. Anda sekarang dapat mengakses Kartu Tanda Anggota (KTA) digital Anda.',
        isActive: true,
        placeholders: ['{namaPengguna}']
    },
    member_verification_rejected: {
        id: 'member_verification_rejected',
        label: 'Verifikasi Anggota Ditolak',
        message: 'Halo {namaPengguna}. Mohon maaf, pengajuan verifikasi akun Garda Lestari Anda ditolak. Silakan periksa kembali data Anda dan coba lagi.',
        isActive: true,
        placeholders: ['{namaPengguna}']
    },
    event_reminder: {
        id: 'event_reminder',
        label: 'Pengingat Acara',
        message: 'Pengingat: Acara "{namaAcara}" akan berlangsung besok pada {tanggalWaktu} di {lokasi}. Jangan sampai ketinggalan!',
        isActive: false, // Default off as it may need manual trigger
        placeholders: ['{namaAcara}', '{tanggalWaktu}', '{lokasi}']
    },
    new_program_announcement: {
        id: 'new_program_announcement',
        label: 'Pengumuman Program Baru',
        message: 'Program baru telah dibuka! "{namaProgram}". Batas waktu pendaftaran: {batasWaktu}. Cek selengkapnya di aplikasi!',
        isActive: true,
        placeholders: ['{namaProgram}', '{batasWaktu}']
    }
};

const settingsDocRef = doc(db, 'settings', 'whatsappTemplates');

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        // Merge with defaults to ensure all templates are present, even if new ones are added to code
        const firestoreData = docSnap.data();
        const mergedTemplates: any = {};
        for (const key in defaultTemplates) {
            const templateKey = key as NotificationType;
            mergedTemplates[templateKey] = {
                ...defaultTemplates[templateKey],
                ...(firestoreData[templateKey] || {}),
            };
        }
        return mergedTemplates;
    }
    // If no settings exist in firestore, initialize with defaults
    await setDoc(settingsDocRef, defaultTemplates);
    return defaultTemplates;
}

export async function getWhatsappTemplate(id: NotificationType): Promise<WhatsAppTemplate> {
    const templates = await getWhatsappTemplates();
    return templates[id] || defaultTemplates[id];
}

export async function updateWhatsappTemplates(templates: Record<string, Partial<WhatsAppTemplate>>) {
    const docData: { [key: string]: any } = {};
    for (const key in templates) {
        // Ensure we only save the fields that can be modified by the user
        docData[key] = {
            message: templates[key].message,
            isActive: templates[key].isActive,
        };
    }
    await setDoc(settingsDocRef, docData, { merge: true });
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

export async function getLatestProgramsText(): Promise<string> {
    const programs = await getPrograms();
    const activePrograms = programs
        .filter(p => p.endDate.toDate() > new Date())
        .slice(0, 3);

    if (activePrograms.length === 0) {
        return "Saat ini belum ada program yang sedang dibuka. Pantau terus aplikasi kami untuk informasi terbaru!";
    }

    let message = "Berikut adalah program yang sedang dibuka:\n\n";
    activePrograms.forEach(p => {
        message += `*${p.title}*\nBatas Pendaftaran: ${p.endDate.toDate().toLocaleDateString('id-ID')}\nInfo: ${process.env.NEXT_PUBLIC_BASE_URL}/programs/${p.id}\n\n`;
    });

    return message;
}
