

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect, sendBulkWhatsAppMessage as sendBulkWhatsAppMessageSatuConnect } from '@/services/whatsapp';
import { revalidatePath } from 'next/cache';
import { getPrograms } from './programs';
import type { NotificationType, WhatsAppTemplate } from '@/lib/definitions';

const defaultTemplates: Record<NotificationType, WhatsAppTemplate> = {
    document_submission: {
        id: 'document_submission',
        label: 'Permintaan Persetujuan Dokumen',
        message: 'Halo {namaPenerima},\n\nDokumen *"{judulDokumen}"* dari *{namaPengirim}* memerlukan persetujuan Anda. Silakan tinjau di panel admin Garda Lestari.',
        isActive: true,
        placeholders: ['{namaPenerima}', '{judulDokumen}', '{namaPengirim}']
    },
    document_approved: {
        id: 'document_approved',
        label: 'Dokumen Disetujui',
        message: 'Kabar baik, {namaPengguna}! Dokumen Anda *"{judulDokumen}"* telah *disetujui dan disahkan* secara digital. Anda dapat mengunduhnya di aplikasi.',
        isActive: true,
        placeholders: ['{namaPengguna}', '{judulDokumen}']
    },
    document_rejected: {
        id: 'document_rejected',
        label: 'Dokumen Ditolak',
        message: 'Halo {namaPengguna}, dokumen Anda *"{judulDokumen}"* telah *ditolak* oleh {namaPenolak} dengan alasan: "{alasanPenolakan}".',
        isActive: true,
        placeholders: ['{namaPengguna}', '{judulDokumen}', '{namaPenolak}', '{alasanPenolakan}']
    },
    new_task_assigned: {
        id: 'new_task_assigned',
        label: 'Tugas Proyek Baru',
        message: 'Halo {namaPengguna}, Anda telah ditugaskan untuk mengerjakan tugas baru: *"{namaTugas}"* di proyek *"{namaProyek}"*. Silakan periksa detailnya di papan proyek.',
        isActive: true,
        placeholders: ['{namaPengguna}', '{namaTugas}', '{namaProyek}']
    },
    member_verified_permanent: {
        id: 'member_verified_permanent',
        label: 'Verifikasi Anggota Berhasil (deprecated)',
        message: '*Selamat, {namaPengguna}!* Akun Garda Lestari Anda telah diverifikasi secara permanen. Anda sekarang dapat mengakses Kartu Tanda Anggota (KTA) digital Anda.',
        isActive: false,
        placeholders: ['{namaPengguna}']
    },
    kta_activated: {
        id: 'kta_activated',
        label: 'Aktivasi KTA Berhasil',
        message: 'Selamat, {namaPengguna}! Kartu Tanda Anggota (KTA) digital Anda telah aktif. Untuk menjaga keamanan dan profesionalitas komunitas, pastikan Anda menggunakan foto profil asli. Akun dengan foto profil yang tidak sesuai dapat diblokir oleh admin. Terima kasih atas kerja samanya!',
        isActive: true,
        placeholders: ['{namaPengguna}']
    },
    member_verification_rejected: {
        id: 'member_verification_rejected',
        label: 'Verifikasi Anggota Ditolak',
        message: 'Halo {namaPengguna}. Mohon maaf, pengajuan verifikasi akun Garda Lestari Anda *ditolak*. Silakan periksa kembali data Anda dan coba lagi.',
        isActive: true,
        placeholders: ['{namaPengguna}']
    },
    member_position_updated: {
        id: 'member_position_updated',
        label: 'Jabatan Anggota Diperbarui',
        message: 'Halo {namaPengguna}, ada pembaruan pada akun Anda. Jabatan Anda telah diubah menjadi *{namaJabatan}*. Terima kasih atas kontribusi Anda!',
        isActive: true,
        placeholders: ['{namaPengguna}', '{namaJabatan}']
    },
    event_reminder: {
        id: 'event_reminder',
        label: 'Pengingat Acara',
        message: 'Pengingat: Acara *"{namaAcara}"* akan berlangsung besok pada *{tanggalWaktu}* di *{lokasi}*. Jangan sampai ketinggalan!',
        isActive: false, // Default off as it may need manual trigger
        placeholders: ['{namaAcara}', '{tanggalWaktu}', '{lokasi}']
    },
    new_program_announcement: {
        id: 'new_program_announcement',
        label: 'Pengumuman Program Baru',
        message: 'Program baru telah dibuka!\n\n*{namaProgram}*\n\nBatas waktu pendaftaran: *{batasWaktu}*. Cek selengkapnya di aplikasi!',
        isActive: true,
        placeholders: ['{namaProgram}', '{batasWaktu}']
    }
};

const settingsDocRef = doc(db, 'settings', 'whatsappTemplates');

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
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
        await setDoc(settingsDocRef, defaultTemplates);
        return defaultTemplates;
    } catch (error) {
        console.error("[getWhatsappTemplates Error]", error);
        throw new Error("Gagal mengambil template WhatsApp.");
    }
}

export async function getWhatsappTemplate(id: NotificationType): Promise<WhatsAppTemplate> {
    try {
        const templates = await getWhatsappTemplates();
        return templates[id] || defaultTemplates[id];
    } catch (error) {
        console.error(`[getWhatsappTemplate Error] for ID ${id}:`, error);
        // Fallback to default in case of error
        return defaultTemplates[id];
    }
}

export async function updateWhatsappTemplates(templates: Record<string, Partial<WhatsAppTemplate>>) {
    try {
        const docData: { [key: string]: any } = {};
        for (const key in templates) {
            docData[key] = {
                message: templates[key].message,
                isActive: templates[key].isActive,
            };
        }
        await setDoc(settingsDocRef, docData, { merge: true });
        revalidatePath('/panel/whatsapp/templates');
    } catch (error) {
        console.error("[updateWhatsappTemplates Error]", error);
        throw new Error("Gagal memperbarui template.");
    }
}


export async function sendTestMessage(phoneNumber: string, message: string) {
    try {
        const result = await sendWhatsAppMessageSatuConnect(phoneNumber, message);
        if (!result.success) {
            throw new Error(result.error || 'Unknown error from SatuConnect');
        }
        return { success: true };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("[sendTestMessage Error]", errorMessage);
        throw new Error(errorMessage);
    }
}

export async function sendBulkTestMessage(phoneNumbers: string, message: string) {
    try {
        const numbersArray = phoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
        if (numbersArray.length === 0) {
            throw new Error('Tidak ada nomor telepon yang valid.');
        }
        await sendBulkWhatsAppMessageSatuConnect(numbersArray, message);
        return { success: true, count: numbersArray.length };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("[sendBulkTestMessage Error]", errorMessage);
        throw new Error(errorMessage);
    }
}


export async function getLatestProgramsText(): Promise<string> {
    try {
        const programs = await getPrograms();
        const activePrograms = programs
            .filter(p => new Date(p.endDate) > new Date())
            .slice(0, 3);

        if (activePrograms.length === 0) {
            return "Saat ini belum ada program yang sedang dibuka. Pantau terus aplikasi kami untuk informasi terbaru!";
        }

        let message = "Berikut adalah program yang sedang dibuka:\n\n";
        activePrograms.forEach(p => {
            message += `*${p.title}*\nBatas Pendaftaran: ${new Date(p.endDate).toLocaleDateString('id-ID')}\nInfo: ${process.env.NEXT_PUBLIC_BASE_URL}/programs/${p.id}\n\n`;
        });

        return message;
    } catch (error) {
        console.error("[getLatestProgramsText Error]", error);
        return "Mohon maaf, terjadi kesalahan saat mengambil data program terbaru.";
    }
}

async function getUnverifiedUsers(): Promise<{ phoneNumber: string }[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('verificationStatus', '==', 'unverified'));
    const querySnapshot = await getDocs(q);
    const users: { phoneNumber: string }[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.phoneNumber) {
            users.push({ phoneNumber: data.phoneNumber });
        }
    });
    return users;
}

export async function getUnverifiedUserCount(): Promise<number> {
    const users = await getUnverifiedUsers();
    return users.length;
}

export async function sendVerificationReminders(): Promise<{ success: boolean, count: number }> {
    const users = await getUnverifiedUsers();
    if (users.length === 0) {
        return { success: true, count: 0 };
    }

    const phoneNumbers = users.map(u => u.phoneNumber.replace(/^\+/, ''));
    const message = "Halo! Kami dari Garda Lestari mengingatkan Anda untuk menyelesaikan proses verifikasi akun Anda. Buka aplikasi dan klik menu verifikasi di halaman profil untuk melanjutkan.";
    
    const result = await sendBulkWhatsAppMessageSatuConnect(phoneNumbers, message);

    if (result.success) {
        return { success: true, count: result.data?.sentCount || phoneNumbers.length };
    } else {
        throw new Error(result.error || 'Gagal mengirim pesan pengingat massal.');
    }
}


