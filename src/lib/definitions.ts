

export const ALL_PERMISSIONS = [
    { id: 'manage_users', label: 'Kelola Anggota & Verifikasi' },
    { id: 'manage_news', label: 'Kelola Berita (Buat/Edit)' },
    { id: 'delete_news', label: 'Hapus Berita' },
    { id: 'manage_events', label: 'Kelola Acara (Buat/Edit)' },
    { id: 'delete_events', label: 'Hapus Acara' },
    { id: 'manage_programs', label: 'Kelola Program (Buat/Edit)' },
    { id: 'delete_programs', label: 'Hapus Program' },
    { id: 'manage_partners', label: 'Kelola Mitra (Buat/Edit)' },
    { id: 'delete_partners', label: 'Hapus Mitra' },
    { id: 'manage_forms', label: 'Kelola Formulir (Buat/Edit/Hapus)' },
    { id: 'send_notifications', label: 'Kirim Notifikasi' },
    { id: 'manage_landing_page', label: 'Kelola Halaman Utama' },
    { id: 'manage_settings', label: 'Kelola Pengaturan Aplikasi' },
    { id: 'manage_positions', label: 'Kelola Jabatan & Hak Akses' },
    { id: 'manage_announcements', label: 'Kelola Pengumuman' },
    { id: 'manage_documents', label: 'Kelola Dokumen Penting' },
    { id: 'manage_letters', label: 'Kelola Surat (E-Office)'},
    { id: 'manage_recruitments', label: 'Kelola Rekrutmen' },
    { id: 'manage_achievements', label: 'Kelola Prestasi' },
    { id: 'manage_map_data', label: 'Kelola Data Peta' },
    { id: 'manage_evoting', label: 'Kelola E-Voting' },
    { id: 'manage_projects', label: 'Kelola Proyek' },
    { id: 'manage_whatsapp', label: 'Kelola WhatsApp Bot' },
    { id: 'manage_ideas', label: 'Kelola Bank Ide'},
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

export interface Position {
  id?: string;
  name: string;
  permissions: PermissionId[];
}

export type IdeaStatus = 'diajukan' | 'ditinjau' | 'disetujui' | 'diterapkan' | 'ditolak';

export const ideaStatusMap: Record<IdeaStatus, { label: string, color: string }> = {
    diajukan: { label: 'Diajukan', color: 'bg-gray-500' },
    ditinjau: { label: 'Ditinjau', color: 'bg-blue-500' },
    disetujui: { label: 'Disetujui', color: 'bg-green-500' },
    diterapkan: { label: 'Diterapkan', color: 'bg-purple-500' },
    ditolak: { label: 'Ditolak', color: 'bg-red-500' },
};

export type LetterStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
