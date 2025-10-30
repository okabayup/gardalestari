

import { Timestamp } from "firebase/firestore";
import {z} from 'zod';
import { Briefcase, Calendar, Award, Newspaper, Video, Handshake, Megaphone, FileText, Map, Vote, Lightbulb, LucideIcon, FilePlus, Coins, Flag, TestTube2, Shield, Users, Home, Presentation, MessageCircle, KanbanSquare, Building2, UserCheck, Layers, Database, Target, Gift, BookCopy, TrendingUp, Bug, Settings, Wallet, AreaChart, BookOpen, Notebook, PiggyBank, Contact, LayoutDashboard, Package, Landmark, Plane, Bell, Link, Mail } from 'lucide-react';

export const SHORTLINK_DOMAIN = 'https://gamules.io';

export const ALL_PERMISSIONS = [
    { id: 'manage_users', label: 'Kelola Anggota & Verifikasi' },
    { id: 'manage_news', label: 'Kelola Konten (Buat/Edit)' },
    { id: 'delete_news', label: 'Hapus Konten' },
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
    { id: 'manage_badges', label: 'Kelola Lencana (Badges)' },
    { id: 'manage_map_data', label: 'Kelola Data Peta' },
    { id: 'manage_map_datasets', label: 'Kelola Dataset Peta' },
    { id: 'manage_evoting', label: 'Kelola E-Voting' },
    { id: 'manage_projects', label: 'Kelola Proyek' },
    { id: 'manage_whatsapp', label: 'Kelola WhatsApp Bot' },
    { id: 'manage_ideas', label: 'Kelola Bank Ide'},
    { id: 'manage_data_bank', label: 'Kelola Bank Data'},
    { id: 'manage_reports', label: 'Kelola Laporan Pengguna'},
    { id: 'manage_shortlinks', label: 'Kelola Shortlink' },
    { id: 'manage_finance', label: 'Kelola Keuangan' },
    { id: 'manage_edutourism', label: 'Kelola Eduwisata' },
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

export const directoryItems = [
    { href: '/ideas', label: 'Lab Ide & Aksi', icon: Lightbulb },
    { href: '/events', label: 'Acara', icon: Calendar },
    { href: '/berita', label: 'Berita', icon: Newspaper },
    { href: '/video', label: 'Video', icon: Video },
    { href: '/recruitments', label: 'Rekrutmen', icon: Briefcase },
    { href: '/achievements', label: 'Prestasi', icon: Award },
    { href: '/panel/partners', label: 'Mitra', icon: Handshake },
    { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
    { href: '/documents', label: 'Dokumen', icon: FileText },
    { href: '/map', label: 'Peta', icon: Map },
    { href: '/evoting', label: 'E-Voting', icon: Vote },
    { href: '/points', label: 'Poin Hijau', icon: Coins },
    { href: '/content/new', label: 'Kirim Konten', icon: FilePlus },
    { href: '/uji-aplikasi', label: 'Uji Aplikasi', icon: TestTube2 },
    { href: '/booking/meeting', label: 'Jadwalkan Meeting', icon: Handshake },
];

export const panelDirectoryItems: {
  group: string;
  icon: LucideIcon;
  items: { href: string; icon: LucideIcon; label: string; permission?: PermissionId }[]
}[] = [
  {
    group: 'Manajemen Keuangan',
    icon: Wallet,
    items: [
      { href: '/panel/finance/dashboard', icon: LayoutDashboard, label: 'Dasbor', permission: 'manage_finance' },
      { href: '/panel/finance/transactions/new', icon: FilePlus, label: 'Catat Transaksi', permission: 'manage_finance' },
      { href: '/panel/finance/invoices', icon: FileText, label: 'Faktur Penjualan', permission: 'manage_finance' },
      { href: '/panel/finance/journal', icon: BookOpen, label: 'Buku Jurnal', permission: 'manage_finance' },
      { href: '/panel/finance/accounts', icon: Notebook, label: 'Daftar Akun', permission: 'manage_finance' },
      { href: '/panel/finance/contacts', icon: Contact, label: 'Kontak', permission: 'manage_finance' },
      { href: '/panel/finance/assets', icon: Package, label: 'Aset Tetap', permission: 'manage_finance' },
      { href: '/panel/finance/budgets', icon: PiggyBank, label: 'Anggaran', permission: 'manage_finance' },
      { href: '/panel/finance/reports', icon: AreaChart, label: 'Laporan', permission: 'manage_finance' },
    ]
  },
  {
    group: 'Publikasi',
    icon: Presentation,
    items: [
      { href: '/panel/berita', icon: Newspaper, label: 'Konten', permission: 'manage_news' },
      { href: '/panel/events', icon: Calendar, label: 'Acara', permission: 'manage_events' },
      { href: '/panel/landing', icon: Home, label: 'Halaman Utama', permission: 'manage_landing_page' },
    ],
  },
  {
    group: 'Keterlibatan Anggota',
    icon: Users,
    items: [
      { href: '/panel/ideas', icon: Lightbulb, label: 'Lab Ide & Aksi', permission: 'manage_ideas'},
      { href: '/panel/announcements', icon: Megaphone, label: 'Pengumuman', permission: 'manage_announcements'},
      { href: '/panel/notifications', icon: Bell, label: 'Notifikasi', permission: 'send_notifications' },
      { href: '/panel/evoting', icon: Vote, label: 'E-Voting', permission: 'manage_evoting' },
      { href: '/panel/achievements', icon: Award, label: 'Prestasi', permission: 'manage_achievements' },
      { href: '/panel/badges', icon: Award, label: 'Lencana', permission: 'manage_badges' },
      { href: '/panel/redeem', icon: Gift, label: 'Item Hadiah', permission: 'manage_settings' },
      { href: '/panel/missions', icon: Target, label: 'Misi', permission: 'manage_settings' },
    ],
  },
  {
    group: 'Manajemen Internal',
    icon: Building2,
    items: [
      { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
      { href: '/panel/positions', icon: UserCheck, label: 'Jabatan', permission: 'manage_positions' },
      { href: '/panel/projects', icon: KanbanSquare, label: 'Proyek', permission: 'manage_projects' },
      { href: '/panel/documents', icon: BookCopy, label: 'Persuratan', permission: 'manage_documents'},
      { href: '/panel/meetings', icon: Handshake, label: 'Booking Meeting', permission: 'manage_documents' },
      { href: '/panel/reports', icon: Flag, label: 'Laporan Pengguna', permission: 'manage_reports' },
    ],
  },
  {
    group: 'Infrastruktur & Data',
    icon: Database,
    items: [
      { href: '/panel/partners', icon: Handshake, label: 'Mitra', permission: 'manage_partners' },
      { href: '/panel/edutourism', icon: Plane, label: 'Eduwisata', permission: 'manage_edutourism' },
      { href: '/panel/forms', icon: FileText, label: 'Formulir', permission: 'manage_forms' },
      { href: '/panel/data-bank', icon: Database, label: 'Bank Data', permission: 'manage_data_bank'},
      { href: '/panel/map-data', icon: Map, label: 'Data Peta', permission: 'manage_map_data' },
      { href: '/panel/map-datasets', icon: Layers, label: 'Dataset Peta', permission: 'manage_map_datasets' },
    ]
  },
  {
    group: 'Lainnya',
    icon: Settings,
    items: [
      { href: '/panel/whatsapp', icon: MessageCircle, label: 'Manajemen WhatsApp', permission: 'manage_whatsapp' },
      { href: '/panel/email', icon: Mail, label: 'Manajemen Email', permission: 'manage_settings' },
      { href: '/panel/recruitments', icon: Briefcase, label: 'Rekrutmen', permission: 'manage_recruitments' },
      { href: '/panel/app-testers', icon: TestTube2, label: 'Penguji Aplikasi', permission: 'manage_settings'},
      { href: '/panel/shortlinks', icon: Link, label: 'Shortlinks', permission: 'manage_shortlinks' },
      { href: '/panel/settings', icon: Settings, label: 'Pengaturan Aplikasi', permission: 'manage_settings' },
      { href: '/panel/performance', icon: TrendingUp, label: 'Performa', permission: 'manage_settings' },
      { href: '/panel/analytics/errors', icon: Bug, label: 'Log Error', permission: 'manage_settings' },
    ]
  }
];

export const initialAccounts = [
  // Aset Lancar
  { code: '1-1110', name: 'Kas di Tangan', category: 'Aset' as const, normalBalance: 'Debit' as const },
  { code: '1-1120', name: 'Bank Mandiri', category: 'Aset' as const, normalBalance: 'Debit' as const },
  { code: '1-1130', name: 'Bank BCA', category: 'Aset' as const, normalBalance: 'Debit' as const },
  { code: '1-1200', name: 'Piutang Usaha', category: 'Aset' as const, normalBalance: 'Debit' as const },
  { code: '1-1300', name: 'Investasi Jangka Pendek', category: 'Aset' as const, normalBalance: 'Debit' as const },
  // Aset Tidak Lancar
  { code: '1-2100', name: 'Peralatan Kantor', category: 'Aset' as const, normalBalance: 'Debit' as const },
  { code: '1-2199', name: 'Akumulasi Penyusutan Aset', category: 'Aset' as const, normalBalance: 'Kredit' as const },
  { code: '1-2200', name: 'Investasi Jangka Panjang', category: 'Aset' as const, normalBalance: 'Debit' as const },
  
  // Liabilitas
  { code: '2-1100', name: 'Utang Usaha', category: 'Liabilitas' as const, normalBalance: 'Kredit' as const },
  { code: '2-1200', name: 'Utang Gaji', category: 'Liabilitas' as const, normalBalance: 'Kredit' as const },
  { code: '2-1300', name: 'Utang PPN', category: 'Liabilitas' as const, normalBalance: 'Kredit' as const },
  { code: '2-2100', name: 'Utang Jangka Panjang', category: 'Liabilitas' as const, normalBalance: 'Kredit' as const },

  // Ekuitas
  { code: '3-1100', name: 'Modal Disetor', category: 'Ekuitas' as const, normalBalance: 'Kredit' as const },
  { code: '3-1200', name: 'Laba Ditahan', category: 'Ekuitas' as const, normalBalance: 'Kredit' as const },
  
  // Pendapatan
  { code: '4-1100', name: 'Pendapatan Jasa', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1200', name: 'Pendapatan Donasi', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1300', name: 'Pendapatan Sponsor', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1400', name: 'Pendapatan Iuran Anggota', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1500', name: 'Pendapatan Penjualan Merchandise', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1600', name: 'Pendapatan Hibah', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-1700', name: 'Pendapatan dari Program/Acara', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },
  { code: '4-8000', name: 'Pendapatan Lain-lain', category: 'Pendapatan' as const, normalBalance: 'Kredit' as const },

  // Beban
  { code: '5-1100', name: 'Beban Gaji & Tunjangan', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1200', name: 'Beban Sewa', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1300', name: 'Beban Utilitas', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1400', name: 'Beban Operasional Program', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1500', name: 'Beban Pemasaran & Promosi', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1600', name: 'Beban Perjalanan & Akomodasi', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1700', name: 'Beban Perlengkapan Kantor', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1800', name: 'Beban Teknologi & Perangkat Lunak', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-1900', name: 'Beban Program Hibah', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-2100', name: 'Beban Penyusutan', category: 'Beban' as const, normalBalance: 'Debit' as const },
  { code: '5-8000', name: 'Beban Lain-lain', category: 'Beban' as const, normalBalance: 'Debit' as const },
];


export const initialDocumentTypes = [
    { name: 'Surat Permohonan', code: 'SPm' },
    { name: 'Surat Keputusan', code: 'SKep' },
    { name: 'Surat Kuasa', code: 'SK' },
    { name: 'Surat Perintah', code: 'SP' },
    { name: 'Surat Pengantar', code: 'SPeng' },
    { name: 'Surat Edaran', code: 'SE' },
    { name: 'Surat Undangan', code: 'SU' },
    { name: 'Laporan', code: 'Lap' },
    { name: 'Nota Kesepahaman', code: 'MoU' },
    { name: 'Lainnya', code: 'Lain' },
];

export const initialPositions = [
  'Dewan Pembina',
  'Dewan Pengawas',
  'Dewan Penasehat',
  'Ketua Umum',
  'Sekretaris Jenderal',
  'Bendahara Umum',
  'Ketua Bidang',
  'Sekretaris Bidang',
  'Anggota Bidang',
  'Ketua DPD',
  'Sekretaris DPD',
  'Bendahara DPD',
  'Ketua DPC',
  'Sekretaris DPC',
  'Bendahara DPC',
  'Anggota',
];


// --- Booking & Eduwisata ---
export interface Addon {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number; // Use -1 for unlimited stock
}

export interface EduwisataPackage {
    id: string;
    title: string;
    description: string;
    price: number;
    minParticipants: number;
    duration: string; // e.g., "3 Jam", "1 Hari"
    imageUrl: string; // Aspect ratio 4:5
    images?: string[]; // Gallery images
    availableAddonIds: string[];
    shortlinkSlug?: string;
}

export interface Booking {
    id: string;
    packageId: string;
    packageName: string; // Denormalized for easy display
    userId?: string; // Optional if booked by guest
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate: Timestamp;
    participants: number;
    selectedAddons: { addonId: string; addonName: string; quantity: number; price: number }[];
    totalPrice: number;
    uniqueCode: number;
    status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: Timestamp;
    
    // For manual bank transfer
    paymentSenderName?: string;
    paymentSenderBank?: string;
    paymentProofUrl?: string; // URL to uploaded payment proof

    // For meeting booking
    meetingTopic?: string;
    meetingDuration?: '30min' | '60min' | 'custom';
    meetingCustomDuration?: number; // in hours
}


// --- Finance ---
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  contactId: string;
  contactName: string;
  date: Timestamp;
  dueDate: Timestamp;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  createdAt: Timestamp;
  createdBy: string;
}

export type AccountCategory = 'Aset' | 'Liabilitas' | 'Ekuitas' | 'Pendapatan' | 'Beban';
export type AccountNormalBalance = 'Debit' | 'Kredit';

export interface Account {
    id?: string;
    code: string;
    name: string;
    category: AccountCategory;
    normalBalance: AccountNormalBalance;
    balance: number;
    createdAt: Timestamp;
}

export interface JournalEntry {
    id?: string;
    date: Timestamp;
    description: string;
    transactions: JournalTransaction[];
    createdBy: string; // userId
    createdAt: Timestamp;
    relatedInvoiceId?: string;
}

export interface JournalTransaction {
  accountId: string;
  debit: number;
  credit: number;
}

export interface FinancialReportData {
    incomeStatement: {
        revenues: { name: string; total: number; budget?: number }[];
        expenses: { name: string; total: number; budget?: number }[];
        netIncome: number;
        revenueTrend: { date: string; Pendapatan: number }[];
        expenseTrend: { date: string; Beban: number }[];
        expenseComposition: { name: string; value: number }[];
    };
    balanceSheet: {
        assets: { name: string; balance: number }[];
        liabilities: { name: string; balance: number }[];
        equity: { name: string; balance: number }[];
        totalAssets: number;
        totalLiabilitiesAndEquity: number;
    };
    cashPosition: number;
}

export interface FixedAsset {
  id?: string;
  name: string;
  description?: string;
  acquisitionDate: Timestamp;
  acquisitionCost: number;
  depreciationMethod: 'straight-line';
  usefulLife: number; // in years
  salvageValue: number;
  status: 'active' | 'disposed';
  lastDepreciationDate?: Timestamp;
  createdAt: Timestamp;
}

export interface Budget {
    id?: string;
    accountId: string;
    accountName: string;
    period: string; // YYYY-MM
    amount: number;
    createdAt: Timestamp;
}

export interface Contact {
  id?: string;
  name: string;
  type: 'customer' | 'vendor' | 'other';
  email?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Timestamp;
}


export interface IdeaStatus {
  // ... (previous definitions)
}

export type IdeaStatus = 'diajukan' | 'ditinjau' | 'disetujui' | 'diterapkan' | 'ditolak';
export type IdeaType = 'INNOVATIVE' | 'SOLUTION';

export const ideaStatusMap: Record<IdeaStatus, { label: string; color: string }> = {
    diajukan: { label: 'Diajukan', color: 'bg-gray-500' },
    ditinjau: { label: 'Ditinjau', color: 'bg-blue-500' },
    disetujui: { label: 'Disetujui', color: 'bg-green-500' },
    diterapkan: { label: 'Diterapkan', color: 'bg-purple-500' },
    ditolak: { label: 'Ditolak', color: 'bg-red-500' },
};

export type LetterStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

// --- Reports ---
export type ReportType = 'user' | 'post';
export type ReportStatus = 'baru' | 'ditinjau' | 'selesai';
export type ReportReason = 'spam' | 'scam' | 'ujaran_kebencian' | 'pelecehan' | 'konten_ilegal' | 'lainnya' | 'csae';

export interface Report {
    id?: string;
    reporterId: string;
    reporterName: string;
    reportedItemId: string; // User ID or Post ID
    reportedItemContent?: string; // e.g., username, post caption
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    createdAt: Timestamp;
}

// --- Achievements ---
export interface Achievement {
  id?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  date: string; // ISO string
  imageUrl?: string;
}

// --- Analytics ---
export interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    context: string;
    userId?: string;
    timestamp: Timestamp;
    resolved: boolean;
}

// --- Announcements ---
export interface Announcement {
  id?: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  attachmentUrl?: string;
  attachmentName?: string;
}

// --- App Tester ---
export interface AppTester {
    id?: string;
    name: string;
    email: string;
    waNumber: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    appId: string;
    appName: string;
    submittedAt: Timestamp;
    processedAt?: Timestamp;
}

export interface AppTesterApp {
    id?: string;
    name: string;
    testingLink: string; // e.g., Play Store testing link
    shortlinkSlug: string;
    createdAt: Timestamp;
}


// --- Berita ---
export interface BeritaCategory {
    id?: string;
    name: string;
}

export interface BeritaPost {
  id?: string;
  type: 'artikel' | 'video';
  title: string;
  slug: string;
  content: string;
  author: string;
  date: string; // ISO string
  imageUrl: string;
  imageHint: string;
  excerpt: string;
  category: string;
  youtubeId?: string;
  isFeatured?: boolean;
  seoScore?: number;
  status?: 'published' | 'draft' | 'hidden_by_moderator';
  indexingStatus?: IndexingStatus | null;
}

export interface IndexingLog {
    id?: string;
    url: string;
    type: 'URL_UPDATED' | 'URL_DELETED';
    requestTimestamp: Timestamp;
    responseStatus: number;
    responseBody: any;
    error?: string;
}

export interface IndexingStatus {
    latestUpdate?: {
        type: string;
        notifyTime: string;
    };
    latestRemove?: {
        type: string;
        notifyTime: string;
    };
}


// --- Data Bank ---
export interface DataBankEntry {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: 'Kebijakan' | 'Data Sektoral' | 'Riset' | 'Lainnya';
  source: string;
  publishedDate: Timestamp;
  createdAt: Timestamp;
}

// --- Documents ---
export interface ImportantDocument {
  id?: string;
  title: string; // Perihal
  description?: string; // Tujuan (penerima)
  documentNumber: string;
  category: string;
  type: string; // Jenis Dokumen
  attachments: string; // Jumlah Lampiran
  canvaUrl?: string; // Link edit Canva
  createdAt: Timestamp;
  fileUrl: string;
  fileName: string;
  filePath: string;
  authorId: string;
  authorName: string; // denormalized
  status: LetterStatus;
  approverId?: string; // UID of the user who needs to approve
  approvedById?: string; // UID of the user who approved
  approvedByName?: string; // denormalized
  approvedByPosition?: string; // denormalized
  approvedAt?: Timestamp;
  rejectionReason?: string;
  rejectedById?: string;
  rejectedByName?: string;
  originalContent?: string; // The extracted text from original PDF before stamping
}

export interface DocumentCategory {
    id?: string;
    name: string;
}

export interface DocumentType {
    id?: string;
    name: string;
    code: string;
}


// --- Events ---
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  visibility: 'public' | 'member';
  submissionType: 'internal' | 'external';
  applicationUrl?: string;
  formId?: string;
  imageUrl: string;
  imageHint?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attendeeIds?: { userId: string, userName: string, timestamp: Timestamp }[];
  guestAttendees?: { name: string, email: string, phone?: string, timestamp: Timestamp }[];
  createdAt: Timestamp;
}


// --- Forms ---
export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FormFieldOption {
  id: string;
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
}

export interface ProgramForm {
  id?: string;
  title: string;
  description: string;
  fields: FormField[];
}

// --- Green Points & Missions ---
export interface RedeemableItem {
  id?: string;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  imageUrl?: string;
}

export interface Mission {
  id?: string;
  name: string;
  description: string;
  points?: number;
  pointsPerLevel?: number[];
  type: 'referral' | 'auto';
  criteria?: {
    metric: BadgeMetric;
    value: number;
  };
}


export interface RedemptionLog {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  pointsSpent: number;
  redeemedAt: string; // ISO String
}

export interface PointLog {
    id?: string;
    points: number;
    description: string;
    createdAt: string; // ISO string
}


// --- Ideas & Challenges ---
export type VoteType = 'up' | 'down';

export type MemberType = 'pusat' | 'daerah' | 'cabang' | 'pembina' | 'pengawas' | 'penasehat' | 'official';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  createdAt: Timestamp;
  status: IdeaStatus;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
  commentCount: number;
  type: IdeaType;
  challengeId?: string; // Link to a challenge
  challengeTitle?: string; // Denormalized for display
}

export interface IdeaAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  type?: MemberType;
}

export interface IdeaWithAuthor extends Omit<Idea, 'authorId' | 'upvotes' | 'downvotes' | 'createdAt'> {
  author: IdeaAuthor;
  userVote?: VoteType;
  createdAt: string; 
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    criteria: string; // What's expected from a solution
    deadline: Timestamp;
    reward?: string; // Prize or incentive
    authorId: string; // The admin/partner who created it
    createdAt: Timestamp;
}

export interface IdeaCategory {
  id?: string;
  name: string;
}

// --- Map Data ---
export type MapDataCategory = 'potensi' | 'permasalahan' | 'program' | 'kegiatan' | 'dana';

export interface MapData {
  id?: string;
  title: string;
  description: string;
  category: MapDataCategory;
  latitude: number;
  longitude: number;
  createdAt: Timestamp;
  budget?: number;
  disbursed?: number;
}

export interface MapDataset {
  id?: string;
  name: string;
  url: string; // URL to the GeoJSON file
  isVisible: boolean;
  createdAt: Timestamp;
}

// --- Members ---
export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected' | 'manual';
export type UserLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Member {
  id: string;
  name: string;
  username: string;
  titlePrefix?: string;
  titlePostfix?: string;
  positionId?: string; 
  type?: MemberType;
  region?: string;
  avatarUrl?: string;
  isSpecialMember?: boolean;
  isHidden?: boolean;
  isSuspended?: boolean;
  instagram?: string;
  linkedin?: string;
  skills?: string[];
  interests?: string[];
  assignedBadges?: string[];
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  upline?: string[];
  greenPoints?: number;
  level?: UserLevel;
}

export interface MemberWithStatus extends Member {
    phoneNumber: string;
    waNumber?: string;
    waVerified?: boolean;
    verificationStatus: VerificationStatus;
    joinDate?: string;
    ktpImageUrl?: string;
    selfieImageUrl?: string;
    nik?: string;
    createdAt?: string; // ISO string
    position?: string; 
    permissions: PermissionId[];
    deletionRequestedAt?: Timestamp;
}

export const memberTypes: { value: MemberType, label: string }[] = [
  { value: 'pusat', label: 'DPP' },
  { value: 'daerah', label: 'DPD' },
  { value: 'cabang', label: 'DPC' },
  { value: 'pembina', label: 'Dewan Pembina' },
  { value: 'pengawas', label: 'Dewan Pengawas' },
  { value: 'penasehat', label: 'Dewan Penasehat' },
];

export const verificationStatuses: { value: VerificationStatus, label: string }[] = [
    { value: 'unverified', label: 'Belum Terverifikasi'},
    { value: 'temporary', label: 'Menunggu Persetujuan'},
    { value: 'permanent', label: 'Permanen'},
    { value: 'rejected', label: 'Ditolak'},
    { value: 'manual', label: 'Manual' },
];

// --- Badges ---
export type BadgeType = 'manual' | 'auto';
export type BadgeMetric = 'post_count' | 'idea_count' | 'comment_count' | 'upvote_count' | 'project_completed' | 'achievement_added' | 'vote_casted';

export const BADGE_METRICS: { value: BadgeMetric; label: string }[] = [
    { value: 'post_count', label: 'Jumlah Postingan' },
    { value: 'idea_count', label: 'Jumlah Ide Diajukan' },
    { value: 'achievement_added', label: 'Jumlah Prestasi Dicatat' },
    { value: 'vote_casted', label: 'Jumlah Suara E-Voting' },
    { value: 'comment_count', label: 'Jumlah Komentar' },
    { value: 'upvote_count', label: 'Jumlah Upvote Diterima' },
    { value: 'project_completed', label: 'Proyek Diselesaikan' },
];


export interface Badge {
  id?: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  createdAt?: Timestamp;
  type: BadgeType;
  criteria?: {
    metric: BadgeMetric;
    value: number;
  };
}


// --- Partners ---
export type PartnerCategory = 'strategis' | 'media';

export interface Partner {
  id?: string;
  name: string;
  category: PartnerCategory;
  websiteUrl: string;
  logoUrl: string;
  isFeatured: boolean;
}

// --- Posts (Feed) ---
export type MediaType = 'image' | 'video';

export interface Mention {
    userId: string;
    username: string;
    x: number;
    y: number;
}

export interface MediaItem {
    url: string;
    type: MediaType;
    hint: string;
    mentions?: Mention[];
}

export interface Post {
  id: string;
  authorId: string;
  media: MediaItem[];
  caption: string;
  likes: string[];
  commentsCount: number;
  createdAt: Timestamp;
  status: 'published' | 'archived' | 'hidden_by_moderator';
  mentionedUserIds: string[];
}

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  type?: MemberType;
  level?: UserLevel;
}

export interface PostWithAuthor {
  id: string;
  author: Author;
  media: MediaItem[];
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  isLiked: boolean;
  status: 'published' | 'archived' | 'hidden_by_moderator';
}

export interface Comment {
    id: string;
    authorId: string;
    text: string;
    createdAt: Timestamp;
}

export interface CommentWithAuthor {
    id: string;
    author: {
        name: string;
        username: string;
        avatarUrl: string;
    };
    text: string;
    timestamp: string;
}

// --- Programs ---
export type ProgramSource = 'garda_lestari' | 'mitra';
export type SubmissionType = 'internal' | 'external';
export type ProgramType = 'aktif' | 'pasif';

export interface Program {
  id: string;
  title: string;
  description: string;
  category: 'flagship' | 'ongoing';
  programType: ProgramType;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  startDate: Date;
  endDate?: Date;
  source: ProgramSource;
  partnerId?: string; 
  benefits: string;
  requiredDocuments: string;
  submissionType: SubmissionType;
  applicationUrl?: string; 
  formId?: string;
  requiresRecommendation: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface ProgramFormData {
  title: string;
  description: string;
  category: 'flagship' | 'ongoing';
  programType: ProgramType;
  imageSource: 'ai' | 'url' | 'upload';
  imageUrl?: string;
  imageHint?: string;
  imageFile?: FileList;
  tags: string[];
  dateRange: { from: Date; to?: Date };
  isUnlimited: boolean;
  source: ProgramSource;
  partnerId?: string;
  benefits: string;
  requiredDocuments: string;
  submissionType: SubmissionType;
  applicationUrl?: string;
  formId?: string;
  requiresRecommendation: boolean;
  attachment?: FileList;
}

export interface ProgramTag {
    id?: string;
    name: string;
}

// --- Projects ---
export interface Project {
    id: string;
    title: string;
    description: string;
    managerId: string;
    teamIds: string[];
    createdAt: string; // ISO string
    taskCount: number;
    originIdeaId?: string;
}

export interface ProjectColumn {
    id: string;
    title: string;
    taskIds: string[];
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface ProjectTask {
    id: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    dueDate?: string; // ISO string
    labels?: string[];
    commentCount: number;
    checklist?: ChecklistItem[];
}

export interface ProjectComment {
    id: string;
    authorId: string;
    text: string;
    createdAt: Timestamp;
}


// --- Recruitments ---
export type RecruitmentType = 'internal' | 'external';

export interface Recruitment {
  id?: string;
  title: string;
  type: RecruitmentType;
  partnerId?: string;
  partnerName?: string;
  partnerLogoUrl?: string;
  applicationUrl: string;
  deadline: Timestamp; // Changed to Timestamp
  createdAt: Timestamp; // Changed to Timestamp
  description: string;
  requirements: string;
}

// --- Settings ---
export interface AppSettings {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  isRegistrationOpen: boolean;
  isWhatsappNotificationsEnabled: boolean;
  isInstallForced: boolean;
  heroImageUrl: string;
  aboutImageUrl: string;
  orgChartImageUrl: string;
  dummyMembers: number;
  dummyPrograms: number;
  dummyEvents: number;
  dummyNews: number;
  isTestimonialsEnabled: boolean;
  isReferralEnabled: boolean;
  isPointsEnabled: boolean;
  isAchievementsEnabled: boolean;
  isIdeasEnabled: boolean;
  isEvotingEnabled: boolean;
}

export type NotificationType =
  | 'document_submission'
  | 'document_approved'
  | 'document_rejected'
  | 'new_task_assigned'
  | 'member_verified_permanent'
  | 'member_verification_rejected'
  | 'member_position_updated'
  | 'event_reminder'
  | 'new_program_announcement'
  | 'kta_activated'
  | 'app_tester_approved';

export interface WhatsAppTemplate {
  id: NotificationType;
  label: string;
  message: string;
  isActive: boolean;
  placeholders: string[];
}

// --- Shortlinks ---
export interface ShortLink {
    id?: string;
    title: string;
    slug: string;
    longUrl: string;
    type: 'event' | 'program' | 'custom' | 'app_tester' | 'edutourism';
    relatedId?: string;
    clicks: number;
    createdAt: string; // ISO string
}


// --- Assistant ---
export const AssistantInputSchema = z.object({
  query: z.string().describe("The user's question or request."),
  userId: z.string().describe('The ID of the user asking the question.'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.any(),
  })).optional().describe('The previous conversation history.'),
  image: z.string().optional().describe('An optional image provided by the user as a data URI.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const CitationSchema = z.object({
  sourceId: z.string().describe('The unique ID of the source document or idea.'),
  type: z.enum(['data', 'idea', 'program', 'event', 'achievement']).describe('The type of the source.'),
  title: z.string().describe('The title of the source.'),
  summary: z.string().describe('A brief summary of the source content.'),
  url: z.string().describe('The URL to view the full source.'),
});
export type Citation = z.infer<typeof CitationSchema>;

export const AssistantOutputSchema = z.object({
  responseText: z.string().describe('The main text of the AI\'s answer, formatted in Markdown. This text MUST include citation markers like [Sumber 1], [Ide 2], etc., corresponding to the `citations` array.'),
  citations: z.array(CitationSchema).optional().describe('An array of sources cited in the `responseText`.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// --- Analytics ---
export interface AnalyticsReport {
    dimensionHeaders: { name: string }[];
    metricHeaders: { name: string; type: string }[];
    rows: {
        dimensionValues: { value: string }[];
        metricValues: { value: string }[];
    }[];
}

export interface PageSpeedReport {
    loadingExperience: {
        metrics: {
            LARGEST_CONTENTFUL_PAINT_MS: { percentile: number; category: string };
            CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: number; category: string };
            INTERACTION_TO_NEXT_PAINT: { percentile: number; category: string };
        };
    };
    lighthouseResult: {
        categories: {
            performance: { score: number };
            accessibility: { score: number };
            'best-practices': { score: number };
            seo: { score: number };
        };
    };
}
// --- Voting ---
export interface VotingOption {
    id: string;
    name: string;
    voteCount: number;
    imageUrl?: string;
}

export interface VotingTopic {
    id: string;
    title: string;
    description: string;
    options: VotingOption[];
    voterIds: string[];
    totalVotes: number;
    startDate: Timestamp;
    endDate: Timestamp;
    createdAt: Timestamp;
    coverImageUrl?: string;
}

export interface VotingTopicDTO extends Omit<VotingTopic, 'startDate' | 'endDate' | 'createdAt'> {
    startDate: string;
    endDate: string;
    createdAt: string;
}


export interface UpdateVotingTopicPayload {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    options: VotingOption[];
    coverImageUrl?: string;
}

export interface PublicUser {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
}

export interface PublicProfile extends PublicUser {
  phoneNumber: string;
  verificationStatus: VerificationStatus;
  position: string;
  positionId?: string;
  type?: MemberType;
  region?: string;
  joinDate?: string;
  permissions: PermissionId[];
  instagram?: string;
  linkedin?: string;
  skills?: string[];
  interests?: string[];
}
    
    

    