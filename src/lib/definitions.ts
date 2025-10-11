

import { Timestamp } from "firebase/firestore";
import {z} from 'zod';
import { Briefcase, Calendar, Award, Newspaper, Video, Handshake, Megaphone, FileText, Map, Vote, Lightbulb, LucideIcon, FilePlus, Coins } from 'lucide-react';
import type { NotificationType } from '@/app/actions/settings';


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

export interface Position {
  id?: string;
  name: string;
  permissions: PermissionId[];
}

export type IdeaStatus = 'diajukan' | 'ditinjau' | 'disetujui' | 'diterapkan' | 'ditolak';
export type IdeaType = 'INNOVATIVE' | 'SOLUTION';

export const ideaStatusMap: Record<IdeaStatus, { label: string, color: string }> = {
    diajukan: { label: 'Diajukan', color: 'bg-gray-500' },
    ditinjau: { label: 'Ditinjau', color: 'bg-blue-500' },
    disetujui: { label: 'Disetujui', color: 'bg-green-500' },
    diterapkan: { label: 'Diterapkan', color: 'bg-purple-500' },
    ditolak: { label: 'Ditolak', color: 'bg-red-500' },
};

export type LetterStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

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
  status?: 'published' | 'draft';
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
  title: string;
  description?: string;
  documentNumber: string;
  category: string;
  createdAt: Timestamp;
  fileUrl: string;
  fileName: string;
  authorId: string;
  authorName: string;
  status: LetterStatus;
  approverId?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  rejectedById?: string;
  rejectedByName?: string;
}

export interface DocumentCategory {
    id?: string;
    name: string;
}

// --- Events ---
export interface Event {
  id?: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl: string;
  imageHint: string;
  attachmentUrl?: string;
  attachmentName?: string;
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
export interface Partner {
  id?: string;
  name: string;
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
  status: 'published' | 'archived';
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
  status: 'published' | 'archived';
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
  deadline: Timestamp;
  createdAt: Timestamp;
}

// --- Settings ---
export interface AppSettings {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  isRegistrationOpen: boolean;
  isWhatsappNotificationsEnabled: boolean;
  heroImageUrl: string;
  aboutImageUrl: string;
  orgChartImageUrl: string;
  dummyMembers: number;
  dummyPrograms: number;
  dummyEvents: number;
  dummyNews: number;
  isTestimonialsEnabled?: boolean;
}

export interface WhatsAppTemplate {
    id: NotificationType;
    label: string;
    message: string;
    isActive: boolean;
    placeholders: string[];
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
