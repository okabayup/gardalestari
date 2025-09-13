

import { Timestamp } from "firebase/firestore";
import {z} from 'zod';

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
    { id: 'manage_data_bank', label: 'Kelola Bank Data'},
] as const;

export type PermissionId = typeof ALL_PERMISSIONS[number]['id'];

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
  date: string;
  imageUrl?: string;
}

// --- Announcements ---
export interface Announcement {
  id?: string;
  title: string;
  content: string;
  createdAt: string;
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
  date: string; 
  imageUrl: string;
  imageHint: string;
  excerpt: string;
  category: string;
  youtubeId?: string;
  isFeatured?: boolean;
  seoScore?: number;
}

// --- Data Bank ---
export interface DataBankEntry {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: 'Kebijakan' | 'Data Sektoral' | 'Riset' | 'Lainnya';
  source: string;
  publishedDate: string;
  createdAt: string;
}

// --- Documents ---
export interface ImportantDocument {
  id?: string;
  title: string;
  description?: string;
  documentNumber: string;
  category: string;
  createdAt: string;
  fileUrl: string;
  fileName: string;
  authorId: string;
  authorName: string;
  status: LetterStatus;
  approverId?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
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
  date: string;
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

// --- Ideas ---
export type VoteType = 'up' | 'down';

export type MemberType = 'pusat' | 'daerah' | 'cabang' | 'pembina' | 'pengawas' | 'penasehat' | 'official';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId: string;
  createdAt: string;
  status: IdeaStatus;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
  commentCount: number;
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
  timestamp: string; // Formatted time ago string
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
  createdAt: string;
  budget?: number;
  disbursed?: number;
}

// --- Members ---
export type VerificationStatus = 'unverified' | 'temporary' | 'permanent' | 'rejected' | 'manual';

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
    createdAt?: string;
    position?: string; 
    permissions: PermissionId[];
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
  createdAt: string;
  status: 'published' | 'archived';
  mentionedUserIds: string[];
}

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  type?: MemberType;
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
    createdAt: string;
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
  id?: string;
  title: string;
  description: string;
  category: 'flagship' | 'ongoing';
  programType: ProgramType;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  startDate: string;
  endDate: string;
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

export interface ProgramFormData extends Omit<Program, 'id' | 'startDate' | 'endDate' > {
    startDate: Date;
    endDate: Date;
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
    createdAt: string; 
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
    dueDate?: string; 
    labels?: string[];
    commentCount: number;
    checklist?: ChecklistItem[];
}

export interface ProjectComment {
    id: string;
    authorId: string;
    text: string;
    createdAt: string; 
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
  deadline: string;
  createdAt: string;
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
}

// --- User ---
export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface PublicProfile extends MemberWithStatus {
    // This interface just combines the existing types for clarity.
}

// --- Voting ---
export interface VotingOption {
  id: string;
  name: string;
  voteCount: number;
  imageUrl?: string;
}

export interface VotingTopic {
  id?: string;
  title: string;
  description: string;
  options: VotingOption[];
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  totalVotes: number;
  voterIds: string[];
  coverImageUrl?: string;
}

export interface UpdateVotingTopicPayload {
  title: string;
  description: string;
  options: VotingOption[];
  startDate: Date;
  endDate: Date;
  coverImageUrl?: string;
}

export interface VotingTopicDTO {
  id: string;
  title: string;
  description: string;
  options: VotingOption[];
  startDate: string;
  endDate: string;
  createdAt: string;
  totalVotes: number;
  voterIds: string[];
  coverImageUrl?: string;
}

// --- WhatsApp ---
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

// --- Assistant ---
export const AssistantInputSchema = z.object({
  query: z.string().describe("The user's question or request."),
  userId: z.string().describe('The ID of the user asking the question.'),
  history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
  })).optional().describe('The previous conversation history.'),
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
