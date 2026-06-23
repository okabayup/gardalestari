'use server';

import { revalidatePath } from 'next/cache';
import type { AppSettings, NotificationType, WhatsAppTemplate } from '@/lib/definitions';
import { getOne, set, uploadFile } from '@/lib/db';

// ─── App Settings ─────────────────────────────────────────────────────────────
// Stored as a single document: table=settings, _id='global'

const DEFAULTS: AppSettings = {
  isRegistrationOpen: true,
  isWhatsappNotificationsEnabled: false,
  isInstallForced: false,
  linkedin: '#',
  instagram: 'https://instagram.com/garda.lestari',
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
  isReferralEnabled: true,
  isPointsEnabled: true,
  isAchievementsEnabled: true,
  isIdeasEnabled: true,
  isEvotingEnabled: true,
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const doc = await getOne<AppSettings>('settings', 'global');
    if (doc) return { ...DEFAULTS, ...doc };
  } catch (error) {
    console.error('[getAppSettings Error]', error);
  }
  return DEFAULTS;
}

export async function updateAppSettings(formData: FormData) {
  try {
    const booleanKeys = [
      'isRegistrationOpen', 'isWhatsappNotificationsEnabled', 'isInstallForced',
      'isTestimonialsEnabled', 'isReferralEnabled', 'isPointsEnabled',
      'isAchievementsEnabled', 'isIdeasEnabled', 'isEvotingEnabled',
    ];

    const dataToUpdate: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && !key.endsWith('File')) {
        if (booleanKeys.includes(key)) {
          dataToUpdate[key] = value === 'true';
        } else if (key.startsWith('dummy')) {
          dataToUpdate[key] = Number(value) || 0;
        } else {
          dataToUpdate[key] = value;
        }
      }
    }

    const imageFields = ['heroImageFile', 'aboutImageFile', 'orgChartImageFile'] as const;
    for (const fieldName of imageFields) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        const urlField = fieldName.replace('File', 'Url');
        const path = `landing/${fieldName.replace('ImageFile', '-image.jpg')}`;
        dataToUpdate[urlField] = await uploadFile(file, path);
      }
    }

    // Merge with existing settings
    const current = await getAppSettings();
    const { id: _ignored, ...currentData } = current as Record<string, unknown>;
    await set('settings', 'global', { ...currentData, ...dataToUpdate });

    revalidatePath('/', 'layout');
    revalidatePath('/panel/settings');
    revalidatePath('/panel/landing');
  } catch (error) {
    console.error('[updateAppSettings Error]', error);
    throw new Error(`Gagal memperbarui pengaturan aplikasi: ${(error as Error).message}`);
  }
}

// ─── WhatsApp Templates ───────────────────────────────────────────────────────
// Stored as a single document: table=settings, _id='whatsappTemplates'

const defaultTemplates: Record<NotificationType, WhatsAppTemplate> = {
  document_submission: {
    id: 'document_submission', label: 'Permintaan Persetujuan Dokumen',
    message: 'Halo {namaPenerima},\n\nDokumen *"{judulDokumen}"* dari *{namaPengirim}* memerlukan persetujuan Anda.',
    isActive: true, placeholders: ['{namaPenerima}', '{judulDokumen}', '{namaPengirim}'],
  },
  document_approved: {
    id: 'document_approved', label: 'Dokumen Disetujui',
    message: 'Kabar baik, {namaPengguna}! Dokumen Anda *"{judulDokumen}"* telah *disetujui*. Nomor surat: {nomorDokumen}',
    isActive: true, placeholders: ['{namaPengguna}', '{judulDokumen}', '{nomorDokumen}'],
  },
  document_rejected: {
    id: 'document_rejected', label: 'Dokumen Ditolak',
    message: 'Halo {namaPengguna}, dokumen *"{judulDokumen}"* ditolak oleh {namaPenolak}. Alasan: "{alasanPenolakan}".',
    isActive: true, placeholders: ['{namaPengguna}', '{judulDokumen}', '{namaPenolak}', '{alasanPenolakan}'],
  },
  new_task_assigned: {
    id: 'new_task_assigned', label: 'Tugas Proyek Baru',
    message: 'Halo {namaPengguna}, Anda ditugaskan: *"{namaTugas}"* di proyek *"{namaProyek}"*.',
    isActive: true, placeholders: ['{namaPengguna}', '{namaTugas}', '{namaProyek}'],
  },
  member_verified_permanent: {
    id: 'member_verified_permanent', label: 'Verifikasi Anggota Berhasil (deprecated)',
    message: '*Selamat, {namaPengguna}!* Akun Garda Lestari Anda telah diverifikasi.',
    isActive: false, placeholders: ['{namaPengguna}'],
  },
  kta_activated: {
    id: 'kta_activated', label: 'Aktivasi KTA Berhasil',
    message: 'Selamat, {namaPengguna}! Kartu Tanda Anggota (KTA) digital Anda telah aktif.\n\nSilakan bergabung ke grup WhatsApp anggota: https://chat.whatsapp.com/LD72HX9daPxD9CxknhTmFL?mode=ems_copy_t',
    isActive: true, placeholders: ['{namaPengguna}'],
  },
  member_verification_rejected: {
    id: 'member_verification_rejected', label: 'Verifikasi Anggota Ditolak',
    message: 'Halo {namaPengguna}. Mohon maaf, pengajuan verifikasi Anda *ditolak*. Silakan coba lagi.',
    isActive: true, placeholders: ['{namaPengguna}'],
  },
  member_position_updated: {
    id: 'member_position_updated', label: 'Jabatan Anggota Diperbarui',
    message: 'Halo {namaPengguna}, jabatan Anda telah diubah menjadi *{namaJabatan}*.',
    isActive: true, placeholders: ['{namaPengguna}', '{namaJabatan}'],
  },
  event_reminder: {
    id: 'event_reminder', label: 'Pengingat Acara',
    message: 'Pengingat: Acara *"{namaAcara}"* berlangsung besok pukul *{tanggalWaktu}* di *{lokasi}*.',
    isActive: false, placeholders: ['{namaAcara}', '{tanggalWaktu}', '{lokasi}'],
  },
  new_program_announcement: {
    id: 'new_program_announcement', label: 'Pengumuman Program Baru',
    message: 'Program baru: *{namaProgram}*. Batas pendaftaran: *{batasWaktu}*.',
    isActive: true, placeholders: ['{namaProgram}', '{batasWaktu}'],
  },
  app_tester_approved: {
    id: 'app_tester_approved', label: 'Persetujuan Penguji Aplikasi',
    message: 'Selamat, {namaPengguna}! Anda disetujui sebagai penguji *"{namaAplikasi}"*. Link: {linkPengujian}',
    isActive: true, placeholders: ['{namaPengguna}', '{namaAplikasi}', '{linkPengujian}'],
  },
  booking_payment_confirmed: {
    id: 'booking_payment_confirmed', label: 'Konfirmasi Pembayaran Eduwisata',
    message: 'Terima kasih, {namaPengguna}! Pembayaran paket *"{namaPaket}"* untuk tanggal *{tanggalKunjungan}* dikonfirmasi.',
    isActive: true, placeholders: ['{namaPengguna}', '{namaPaket}', '{tanggalKunjungan}'],
  },
};

export async function getWhatsappTemplates(): Promise<Record<NotificationType, WhatsAppTemplate>> {
  try {
    const doc = await getOne<Record<string, unknown>>('settings', 'whatsappTemplates');
    if (doc) {
      const merged: Record<string, WhatsAppTemplate> = {};
      for (const key in defaultTemplates) {
        const k = key as NotificationType;
        merged[k] = { ...defaultTemplates[k], ...((doc[k] as Partial<WhatsAppTemplate>) || {}) };
      }
      return merged as Record<NotificationType, WhatsAppTemplate>;
    }
    await set('settings', 'whatsappTemplates', defaultTemplates as unknown as Record<string, unknown>);
    return defaultTemplates;
  } catch (error) {
    console.error('[getWhatsappTemplates Error]', error);
    throw new Error('Gagal mengambil template WhatsApp.');
  }
}

export async function getWhatsappTemplate(id: NotificationType): Promise<WhatsAppTemplate> {
  try {
    const templates = await getWhatsappTemplates();
    return templates[id] || defaultTemplates[id];
  } catch (error) {
    console.error(`[getWhatsappTemplate Error] for ID ${id}:`, error);
    return defaultTemplates[id];
  }
}

export async function updateWhatsappTemplates(templates: Record<string, Partial<WhatsAppTemplate>>) {
  try {
    const current = await getWhatsappTemplates();
    const updated: Record<string, unknown> = { ...current };
    for (const key in templates) {
      updated[key] = { ...(current as Record<string, unknown>)[key], ...templates[key] };
    }
    await set('settings', 'whatsappTemplates', updated);
    revalidatePath('/panel/whatsapp/templates');
  } catch (error) {
    console.error('[updateWhatsappTemplates Error]', error);
    throw new Error('Gagal memperbarui template.');
  }
}
