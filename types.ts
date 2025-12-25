
export enum Page {
  WELCOME = 'WELCOME',
  DASHBOARD = 'DASHBOARD',
  FINANCE = 'FINANCE',
  JIMPITAN = 'JIMPITAN',
  SOLIDARITAS = 'SOLIDARITAS',
  GALLERY = 'GALLERY',
  OFFICIALS = 'OFFICIALS',
  STATISTICS = 'STATISTICS',
  GUESTBOOK = 'GUESTBOOK',
  COMPLAINTS = 'COMPLAINTS',
  CLOUD_SETTINGS = 'CLOUD_SETTINGS',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ARCHIVE = 'ARCHIVE',
  INVENTORY = 'INVENTORY',
  LETTERS = 'LETTERS',
  SCHEDULE = 'SCHEDULE',
  POLLS = 'POLLS',
  MY_PROFILE = 'MY_PROFILE',
  EMERGENCY = 'EMERGENCY',
  MINUTES = 'MINUTES',
  ADMIN_PANEL = 'ADMIN_PANEL',
  NEWS = 'NEWS',
  RESIDENTS = 'RESIDENTS',
  MAP = 'MAP'
}

export type UserRole = 'ADMIN' | 'WARGA';

export interface AppSettings {
  motto?: string;
  rtRw?: string;
  location?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  archiveUrl?: string;
  archiveNotulenUrl?: string;
  archiveEdaranUrl?: string;
  archiveKeuanganUrl?: string;
  archivePerdaUrl?: string;
  archiveLainnyaUrl?: string;
  chairmanPhone?: string;
  chairmanEmail?: string;
  secretaryEmail?: string;
  securityEmail?: string;
  panicButtonUrl?: string;
  popupEnabled?: boolean;
  popupTitle?: string;
  popupText?: string;
  popupImageUrl?: string;
  chairmanName?: string;
  treasurerName?: string;
  adminPassword?: string;
  citizenPassword?: string;
  lurahName?: string;
  lurahPhone?: string;
  babinsaName?: string;
  babinsaPhone?: string;
  bhabinkamtibmasName?: string;
  bhabinkamtibmasPhone?: string;
  marqueeText?: string;
  marqueeEnabled?: boolean;
  // EMAIL JS CONFIG UMUM (Aduan & Tamu)
  emailJsServiceId?: string;
  emailJsPublicKey?: string;
  emailJsTemplateComplaintId?: string;
  emailJsTemplateGuestId?: string;
  // EMAIL JS CONFIG KHUSUS SURAT
  emailJsLetterServiceId?: string;
  emailJsLetterPublicKey?: string;
  emailJsTemplateLetterId?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  date: string;
  category: 'Pengumuman' | 'Kegiatan' | 'Keamanan' | 'Sosial';
  imageUrl?: string;
  status: 'Published' | 'Draft';
  isFeatured?: boolean;
  tags?: string[];
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

export interface Transaction {
  id: string;
  code: string;
  type: 'IN' | 'OUT';
  amount: number;
  description: string;
  date: string;
  category: string;
  evidenceUrl?: string;
}

export interface Complaint {
  id: string;
  residentName: string;
  email: string;
  phone: string;
  category: 'Infrastruktur' | 'Keamanan' | 'Kebersihan' | 'Sosial' | 'Lainnya';
  subject: string;
  description: string;
  status: 'Pending' | 'Diproses' | 'Selesai';
  timestamp: string;
  imageUrl?: string;
  chairmanEmail?: string;
  secretaryEmail?: string;
  securityEmail?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  date: string;
}

export interface Official {
  id: string;
  name: string;
  position: string;
  phone: string;
  duties: string;
  imageUrl: string;
}

export interface CloudStatus {
  isConnected: boolean;
  lastSync: string | null;
  accountEmail: string | null;
  isSyncing: boolean;
}

export interface GuestEntry {
  id: string;
  idType: 'KTP' | 'SIM' | 'Paspor';
  idNumber: string;
  name: string;
  email: string;
  phone: string;
  guestCount: string;
  institution?: string;
  addressType: 'Kota' | 'Kabupaten';
  address: {
    rt: string;
    rw: string;
    kelDesa: string;
    kec: string;
    cityRegency: string;
  };
  visitDays: string;
  startDate: string;
  startTime: string;
  duration: string;
  hostName: string;
  purpose: string;
  vehicleType: string;
  vehicleColor: string;
  vehicleBrand: string;
  vehiclePlate: string;
  signature: string;
  status: 'Tertunda' | 'Proses' | 'Diizinkan' | 'Ditolak';
  checkIn: string;
  checkOut: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  brand: string;
  condition: 'Baik' | 'Rusak' | 'Dalam Perbaikan';
  recommendation?: 'Normal' | 'Perbaikan' | 'Penggantian';
  totalQty: number;
  availableQty: number;
  imageUrl: string;
  description: string;
  dateAdded: string;
}

export interface BorrowRecord {
  id: string;
  itemId: string;
  itemName: string;
  residentName: string;
  phone: string;
  borrowDate: string;
  returnDate: string | null;
  status: 'Pending' | 'Borrowed' | 'Returning' | 'Returned' | 'Rejected';
  quantity: number;
}

export interface LetterRequest {
  id: string;
  name: string;
  nik: string;
  email: string;
  purpose: string;
  requestDate: string;
  status: 'Pending' | 'Diproses' | 'Siap Diambil' | 'Ditolak';
  gender?: 'Laki-laki' | 'Perempuan';
  religion?: string;
  maritalStatus?: string;
  privacyAgreed?: boolean;
  chairmanEmail?: string;
  secretaryEmail?: string;
  securityEmail?: string;
}

export interface SecurityShift {
  id: string;
  week: number;
  day: string;
  leader: string;
  members: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  status: 'Active' | 'Closed';
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  label: string;
  phone: string;
  provider: 'Keamanan' | 'Kesehatan' | 'Kebakaran' | 'PLN/PAM' | 'Lainnya';
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

export interface SolidaritasResident {
  id: string;
  name: string;
  houseNumber: string;
}

export interface SolidaritasStatus {
  residentId: string;
  paidMonths: string[]; 
}

export interface SolidaritasLog {
  id: string;
  residentId: string;
  residentName: string;
  collectorName: string;
  periods: string[]; 
  amountPerMonth: number;
  totalPaid: number;
  timestamp: string;
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
  unpaidResidentIds?: string[];
  totalCashReceived: number;
}

export interface StatData {
  label: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export const MASTER_SERVICES = [
  { id: Page.COMPLAINTS, label: 'Lapor Aduan', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-rose-500', category: 'Layanan' },
  { id: Page.GUESTBOOK, label: 'Buku Tamu', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', color: 'bg-amber-500', category: 'Layanan' },
  { id: Page.EMERGENCY, label: 'Panic Button', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z', color: 'bg-red-600', category: 'Layanan' },
  { id: Page.SCHEDULE, label: 'Jadwal Ronda', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'bg-slate-900', category: 'Layanan' },
  { id: Page.NEWS, label: 'Berita RT', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z', color: 'bg-indigo-600', category: 'Informasi' },
  { id: Page.GALLERY, label: 'Galeri Foto', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16', color: 'bg-purple-600', category: 'Informasi' },
  { id: Page.SOCIAL_MEDIA, label: 'Media Sosial', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-pink-600', category: 'Informasi' },
  { id: Page.MAP, label: 'Peta Wilayah', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', color: 'bg-sky-600', category: 'Informasi' },
  { id: Page.FINANCE, label: 'Kas RT', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-emerald-600', category: 'Keuangan' },
  { id: Page.SOLIDARITAS, label: 'Solidaritas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-rose-600', category: 'Keuangan' },
  { id: Page.JIMPITAN, label: 'Jimpitan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-indigo-800', category: 'Keuangan' },
  { id: Page.RESIDENTS, label: 'Data Warga', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', color: 'bg-blue-600', category: 'Administrasi', adminOnly: true },
  { id: Page.LETTERS, label: 'Surat Pengantar', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z', color: 'bg-indigo-700', category: 'Administrasi' },
  { id: Page.ARCHIVE, label: 'Arsip Digital', icon: 'M5 8h14M5 8a2 2 110-4h14a2 2 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', color: 'bg-[#0077b6]', category: 'Administrasi' },
  { id: Page.INVENTORY, label: 'Inventaris', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-teal-700', category: 'Administrasi' },
  { id: Page.MINUTES, label: 'Notulen Rapat', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-blue-800', category: 'Administrasi' },
  { id: Page.POLLS, label: 'Polling', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-purple-700', category: 'Administrasi' },
  { id: Page.OFFICIALS, label: 'Pengurus', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'bg-indigo-600', category: 'Administrasi' },
  { id: Page.STATISTICS, label: 'Statistik', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', color: 'bg-indigo-500', category: 'Administrasi' },
  { id: Page.CLOUD_SETTINGS, label: 'Cloud Sync', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-indigo-600', category: 'Administrasi', adminOnly: true },
];
