
// Fix: Added missing StatData interface used in StatCard.tsx
export interface StatData {
  label: string;
  value: number;
  icon: string;
  trend: 'up' | 'down';
  trendValue: string;
}

// Fix: Added missing CloudStatus interface used in driveService.ts and CloudSettings.tsx
export interface CloudStatus {
  isConnected: boolean;
  lastSync: string | null;
  accountEmail: string | null;
  isSyncing: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'Pengumuman' | 'Kegiatan' | 'Keamanan' | 'Sosial';
  author: string;
  date: string;
  imageUrl: string;
  status: 'Draft' | 'Published';
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  category: string;
}

export interface Comment {
  id: string;
  parentId: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Resident {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  dateOfBirth: string;
  kkNumber: string;
  houseNumber: string;
  phone: string;
  status: 'Aktif' | 'Pindah' | 'Tamu';
  joinedDate: string;
}

export interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  location: string;
  content: string;
  status: 'Draft' | 'Final';
}

export interface AttendanceEntry {
  id: string;
  meetingId: string;
  residentId: string;
  residentName: string;
  timestamp: string;
  signature: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  totalQty: number;
  availableQty: number;
  imageUrl: string;
  description: string;
  condition: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
}

export interface BorrowRecord {
  id: string;
  itemId: string;
  itemName: string;
  residentName: string;
  phone: string;
  borrowDate: string;
  returnDate: string | null;
  status: 'Pending' | 'Borrowed' | 'Returned' | 'Rejected';
  quantity: number;
}

export interface LetterRequest {
  id: string;
  residentName: string;
  phone: string;
  letterType: 'Domisili' | 'SKCK' | 'Kematian' | 'Pindah' | 'Lainnya';
  purpose: string;
  status: 'Pending' | 'Diproses' | 'Siap Diambil' | 'Ditolak';
  createdAt: string;
  pickupTime?: string;
}

export interface SecurityShift {
  id: string;
  day: string;
  week: 1 | 2;
  members: string[];
  leader: string;
}

export interface JimpitanSettings {
  dailyAmount: number;
  activeResidentIds: string[];
}

export interface JimpitanResidentStatus {
  residentId: string;
  paidUntil: string | null;
}

export interface JimpitanLog {
  id: string;
  date: string;
  collectorName: string;
  nominalPerWarga: number;
  collectedResidentIds: string[];
  autoPaidResidentIds: string[];
  totalCashReceived: number;
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  status: 'Active' | 'Closed';
  createdAt: string;
}

export interface GuestEntry {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  destinationHouse: string;
  checkIn: string;
  checkOut: string | null;
  guestType: 'Keluarga' | 'Kurir' | 'Dinas' | 'Lainnya';
}

export interface Complaint {
  id: string;
  residentName: string;
  phone: string;
  category: 'Keamanan' | 'Kebersihan' | 'Infrastruktur' | 'Sosial' | 'Lainnya';
  subject: string;
  description: string;
  status: 'Pending' | 'Diproses' | 'Selesai';
  timestamp: string;
  imageUrl?: string;
  adminNote?: string;
}

export interface Official {
  id: string;
  name: string;
  position: string;
  phone: string;
  duties: string;
  imageUrl: string;
}

export interface EmergencyContact {
  id: string;
  label: string;
  phone: string;
  provider: string;
}

export interface Transaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  description: string;
  date: string;
  category: string;
}

export interface AppSettings {
  motto: string;
  youtubeUrl: string;
  tiktokUrl: string;
  instagramUrl: string;
  archiveUrl: string;
  archiveNotulenUrl: string;
  archiveEdaranUrl: string;
  archiveKeuanganUrl: string;
  archivePerdaUrl: string;
  archiveLainnyaUrl: string;
  rtRw: string;
  location: string;
  chairmanPhone: string;
  panicButtonUrl: string;
  guestbookQrUrl?: string;
  popupEnabled: boolean;
  popupTitle?: string;
  popupText?: string;
  popupImageUrl?: string;
  chairmanName?: string;
  treasurerName?: string;
  // Security settings
  adminPassword?: string;
  citizenPassword?: string;
  // Pejabat Wilayah Editable fields
  lurahName?: string;
  lurahPhone?: string;
  babinsaName?: string;
  babinsaPhone?: string;
  bhabinkamtibmasName?: string;
  bhabinkamtibmasPhone?: string;
}

export enum Page {
  WELCOME = 'welcome',
  DASHBOARD = 'dashboard',
  NEWS = 'news',
  RESIDENTS = 'residents',
  GUESTBOOK = 'guestbook',
  COMPLAINTS = 'complaints',
  GALLERY = 'gallery',
  ADMIN_PANEL = 'admin_panel',
  FINANCE = 'finance',
  OFFICIALS = 'officials',
  STATISTICS = 'statistics',
  CLOUD_SETTINGS = 'cloud_settings',
  SOCIAL_MEDIA = 'social_media',
  ARCHIVE = 'archive',
  INVENTORY = 'inventory',
  LETTERS = 'letters',
  SCHEDULE = 'schedule',
  POLLS = 'polls',
  MY_PROFILE = 'my_profile',
  EMERGENCY = 'emergency',
  MINUTES = 'minutes',
  JIMPITAN = 'jimpitan',
  MAP = 'map'
}

export type UserRole = 'ADMIN' | 'WARGA';

export interface ServiceMenu {
  id: Page;
  label: string;
  icon: string;
  color: string;
  category: 'Layanan' | 'Informasi' | 'Administrasi';
  adminOnly?: boolean;
}

export const MASTER_SERVICES: ServiceMenu[] = [
  { id: Page.EMERGENCY, label: 'Darurat', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'bg-red-600', category: 'Layanan' },
  { id: Page.LETTERS, label: 'Surat RT', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z', color: 'bg-indigo-600', category: 'Layanan' },
  { id: Page.COMPLAINTS, label: 'Aduan', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-rose-500', category: 'Layanan' },
  { id: Page.GUESTBOOK, label: 'Buku Tamu', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'bg-amber-500', category: 'Layanan' },
  { id: Page.INVENTORY, label: 'Aset RT', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-teal-600', category: 'Layanan' },
  { id: Page.SCHEDULE, label: 'Ronda', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'bg-slate-800', category: 'Layanan' },
  { id: Page.NEWS, label: 'Warta RT', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z', color: 'bg-green-500', category: 'Informasi' },
  { id: Page.GALLERY, label: 'Galeri', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16', color: 'bg-purple-500', category: 'Informasi' },
  { id: Page.MAP, label: 'Peta Digital', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', color: 'bg-sky-500', category: 'Informasi' },
  { id: Page.MINUTES, label: 'Notulen', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-blue-800', category: 'Informasi' },
  { id: Page.POLLS, label: 'Polling', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-pink-600', category: 'Informasi' },
  { id: Page.SOCIAL_MEDIA, label: 'Sosmed', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757', color: 'bg-indigo-400', category: 'Informasi' },
  { id: Page.FINANCE, label: 'Kas RT', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-orange-500', category: 'Administrasi' },
  { id: Page.JIMPITAN, label: 'Jimpitan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-purple-600', category: 'Administrasi' },
  { id: Page.ARCHIVE, label: 'Arsip', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8', color: 'bg-[#0077b6]', category: 'Administrasi' },
  { id: Page.RESIDENTS, label: 'Data Warga', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7', color: 'bg-blue-600', category: 'Administrasi', adminOnly: true },
  { id: Page.OFFICIALS, label: 'Pengurus', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'bg-blue-400', category: 'Administrasi' },
  { id: Page.STATISTICS, label: 'Statistik', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', color: 'bg-emerald-600', category: 'Administrasi' },
  { id: Page.MY_PROFILE, label: 'Digital ID', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4', color: 'bg-slate-700', category: 'Administrasi' },
];
