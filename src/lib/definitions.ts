

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
    { id: 'manage_documents', label: 'Kelola Dokumen' },
    { id: 'manage_jobs', label: 'Kelola Loker' },
    { id: 'manage_achievements', label: 'Kelola Prestasi' },
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

export interface Position {
  id?: string;
  name: string;
  permissions: PermissionId[];
}
