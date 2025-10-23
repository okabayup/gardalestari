

import { Timestamp } from "firebase/firestore";
import {z} from 'zod';
import { Briefcase, Calendar, Award, Newspaper, Video, Handshake, Megaphone, FileText, Map, Vote, Lightbulb, LucideIcon, FilePlus, Coins, Flag, TestTube2, Shield, Users, Home, Presentation, MessageCircle, KanbanSquare, Building2, UserCheck, Layers, Database, Target, Gift, BookCopy, TrendingUp, Bug, Settings, Wallet, AreaChart, BookOpen, Notebook, PiggyBank } from 'lucide-react';

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
];

export const panelDirectoryItems: { href: string; icon: LucideIcon; label: string; permission?: PermissionId }[] = [
    { href: '/panel/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/panel/members', icon: Users, label: 'Anggota', permission: 'manage_users' },
    { href: '/panel/berita', icon: Newspaper, label: 'Konten', permission: 'manage_news' },
    { href: '/panel/programs', icon: Megaphone, label: 'Program', permission: 'manage_programs' },
    { href: '/panel/ideas', icon: Lightbulb, label: 'Bank Ide', permission: 'manage_ideas'},
    { href: '/panel/projects', icon: KanbanSquare, label: 'Proyek', permission: 'manage_projects' },
    { href: '/panel/documents', icon: BookCopy, label: 'Persuratan', permission: 'manage_documents'},
    { href: '/panel/finance/dashboard', icon: Wallet, label: 'Keuangan', permission: 'manage_finance'},
    { href: '/panel/settings', icon: Settings, label: 'Pengaturan', permission: 'manage_settings' },
];


export const initialPositions = [
    "Dewan Pembina",
    "Dewan Pengawas",
    "Dewan Penasihat",
    "Ketua Umum",
    "Ketua Harian",
    "Sekretaris Jenderal",
    "Staf Administrasi Internal",
    "Staf Administrasi Eksternal",
    "Bendahara Umum",
    "Staf Keuangan Organisasi",
    "Staf Keuangan Program",
    "Wakil Ketua Bidang Teknis & Program",
    "Agro (Pertanian Berkelanjutan)",
    "Maritim (Kelautan & Perikanan)",
    "Kehutanan (Agroforestri & Rehabilitasi)",
    "Perdagangan Karbon & Energi Hijau",
    "Wakil Ketua Bidang Pendukung & Strategis",
    "Hubungan Eksternal & Kemitraan",
    "Relawan & Kampanye Digital",
    "Kewirausahaan & Inkubasi",
    "Kajian Hukum & Regulasi",
    "Data & Analisis (Data Analyst Unit)",
    "Penelitian & Inovasi",
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

// --- Finance ---
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

export interface JournalTransaction {
    accountId: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id?: string;
    date: Timestamp;
    description: string;
    transactions: JournalTransaction[];
    createdBy: string; // userId
    createdAt: Timestamp;
}

export interface FinancialReportData {
    incomeStatement: {
        revenues: { name: string; total: number; budget?: number }[];
        expenses: { name: string; total: number; budget?: number }[];
        netIncome: number;
        revenueTrend: { date: string; Pendapatan: number }[];
        expenseTrend: { date: string; Beban: number }[];
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
export type ReportReason = 'csae' | 'spam' | 'scam' | 'ujaran_kebencian' | 'pelecehan' | 'konten_ilegal' | 'lainnya';

export interface Report {
    id?: string;
    reporterId: string;
    reporterName: string;
    reportedItemId: string; // User ID or Post ID
    reportedItemType: ReportType;
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
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Timestamp;
    processedAt?: Timestamp;
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
  description: string;
  requirements: string;
  applicationUrl: string;
  deadline: string; // ISO string
  createdAt: string; // ISO string
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
  isTestimonialsEnabled?: boolean;
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
    id?: string; // the short code
    title: string;
    longUrl: string;
    type: 'event' | 'program' | 'custom' | 'app_tester';
    relatedId?: string; // e.g., eventId or programId
    clicks: number;
    createdAt: Timestamp;
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
    
    
