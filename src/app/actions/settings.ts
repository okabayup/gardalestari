

'use server';

import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { AppSettings, NotificationType, WhatsAppTemplate } from '@/lib/definitions';

const settingsDocRef = doc(db, 'settings', 'global');
const whatsappTemplatesDocRef = doc(db, 'settings', 'whatsappTemplates');

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Provide defaults for all fields, including new dummy fields
      return {
        isRegistrationOpen: true,
        isWhatsappNotificationsEnabled: false,
        linkedin: '#',
        instagram: '#',
        twitter: '#',
        facebook: '#',
        heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
        aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
        orgChartImageUrl: 'https://picsum.photos/seed/org-chart/1200/1600',
        dummyMembers: 0,
        dummyPrograms: 0,
        dummyEvents: 0,
        dummyNews: 0,
        isTestimonialsEnabled: false,
        ...data,
      } as AppSettings;
    }
  } catch (error) {
    console.error("[getAppSettings Error]", error);
  }
  // Return default values if not set or on error
  return {
    linkedin: '#',
    instagram: '#',
    twitter: '#',
    facebook: '#',
    isRegistrationOpen: true,
    isWhatsappNotificationsEnabled: false,
    heroImageUrl: 'https://picsum.photos/seed/paddy-field/1920/1080',
    aboutImageUrl: 'https://picsum.photos/seed/youth-farmers/800/600',
    orgChartImageUrl: 'https://picsum.photos/seed/org-chart/1200/1600',
    dummyMembers: 0,
    dummyPrograms: 0,
    dummyEvents: 0,
    dummyNews: 0,
    isTestimonialsEnabled: false,
  };
}


export async function updateAppSettings(formData: FormData) {
  try {
    const dataToUpdate: { [key: string]: any } = {};
    
    // Handle simple string and boolean fields
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && !key.endsWith('File')) {
            if(key === 'isRegistrationOpen' || key === 'isWhatsappNotificationsEnabled' || key === 'isTestimonialsEnabled') {
                 dataToUpdate[key] = value === 'true';
            } else if (key.startsWith('dummy')) {
                dataToUpdate[key] = Number(value) || 0;
            }
             else {
                dataToUpdate[key] = value;
            }
        }
    }

    const imageFields: ('heroImageFile' | 'aboutImageFile' | 'orgChartImageFile')[] = ['heroImageFile', 'aboutImageFile', 'orgChartImageFile'];
    
    for(const fieldName of imageFields) {
        const file = formData.get(fieldName) as File | null;
        if (file && file.size > 0) {
            const correspondingUrlField = fieldName.replace('File', 'Url');
            const storagePath = `landing/${fieldName.replace('ImageFile', '-image.jpg')}`;
            const imageRef = ref(storage, storagePath);
            
            console.log(`[updateAppSettings] Uploading ${fieldName} to ${storagePath}`);
            await uploadBytes(imageRef, file);
            dataToUpdate[correspondingUrlField] = await getDownloadURL(imageRef);
            console.log(`[updateAppSettings] Upload successful for ${fieldName}:`, dataToUpdate[correspondingUrlField]);
        }
    }
    
    await setDoc(settingsDocRef, dataToUpdate, { merge: true });
    
    // Revalidate relevant pages
    revalidatePath('/');
    revalidatePath('/register');
    revalidatePath('/panel/settings');
    revalidatePath('/panel/landing');

  } catch (error) {
    console.error("[updateAppSettings Error]", error);
    throw new Error(`Gagal memperbarui pengaturan aplikasi: ${(error as Error).message}`);
  }
}

// --- WhatsApp Template Management ---

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
        message: 'Kabar baik, {namaPengguna}! Dokumen Anda *"{judulDokumen}"* telah *disetujui dan disahkan* secara digital. Anda dapat mengunduhnya di aplikasi. Nomor surat: {nomorDokumen}',
        isActive: true,
        placeholders: ['{namaPengguna}', '{judulDokumen}', '{nomorDokumen}']
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
        message: 'Selamat, {namaPengguna}! Kartu Tanda Anggota (KTA) digital Anda telah aktif. Untuk menjaga keamanan dan profesionalitas komunitas, pastikan Anda menggunakan foto profil asli. Akun dengan foto profil yang tidak sesuai dapat diblokir oleh admin.\n\nSilakan bergabung ke grup WhatsApp anggota melalui tautan berikut:\nhttps://chat.whatsapp.com/LD72HX9daPxD9CxknhTmFL?mode=ems_copy_t',
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

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
    try {
        const docSnap = await getDoc(whatsappTemplatesDocRef);
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
        await setDoc(whatsappTemplatesDocRef, defaultTemplates);
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
        await setDoc(whatsappTemplatesDocRef, docData, { merge: true });
        revalidatePath('/panel/whatsapp/templates');
    } catch (error) {
        console.error("[updateWhatsappTemplates Error]", error);
        throw new Error("Gagal memperbarui template.");
    }
}
