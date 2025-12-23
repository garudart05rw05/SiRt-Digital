
import { db } from './firebase.ts';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const STORAGE_KEYS = {
  NEWS: 'rt_pro_news',
  RESIDENTS: 'rt_pro_residents',
  REPORTS: 'rt_pro_reports',
  SETTINGS: 'rt_pro_settings',
  OFFICIALS: 'rt_pro_officials',
  COMMENTS: 'rt_pro_comments',
  GUESTBOOK: 'rt_pro_guestbook',
  COMPLAINTS: 'rt_pro_complaints',
  INVENTORY: 'rt_pro_inventory',
  BORROWING: 'rt_pro_borrowing',
  LETTERS: 'rt_pro_letters',
  SCHEDULE: 'rt_pro_schedule',
  POLLS: 'rt_pro_polls',
  EMERGENCY: 'rt_pro_emergency',
  MINUTES: 'rt_pro_minutes',
  ATTENDANCE: 'rt_pro_attendance',
  JIMPITAN_SETTINGS: 'rt_pro_jimpitan_settings',
  JIMPITAN_STATUS: 'rt_pro_jimpitan_status',
  JIMPITAN_LOGS: 'rt_pro_jimpitan_logs',
  JIMPITAN_RESIDENTS: 'rt_pro_jimpitan_residents',
  GALLERY: 'rt_pro_gallery',
  FINANCE: 'rt_pro_finance' // Kunci baru untuk konsistensi kas
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any) => {
    try {
      // Firebase Firestore tidak mendukung nilai 'undefined'.
      // Kita melakukan sanitasi dengan JSON.stringify & parse untuk menghapus key yang bernilai undefined.
      const sanitizedValue = JSON.parse(JSON.stringify(value));
      
      localStorage.setItem(key, JSON.stringify(sanitizedValue));
      window.dispatchEvent(new Event('storage_updated'));
      
      // AUTO-SYNC SELURUH DATA KE FIREBASE
      storage.saveToCloud(key, sanitizedValue);
    } catch (e) {
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        alert("Peringatan: Memori lokal penuh, data hanya akan tersimpan di Cloud.");
      }
      throw e;
    }
  },

  saveToCloud: async (key: string, value: any) => {
    try {
      await setDoc(doc(db, "app_data", key), { 
        data: value,
        updatedAt: new Date().toISOString()
      });
      console.log(`[CloudSync] ${key} tersinkron.`);
    } catch (err) {
      console.error(`[CloudSync] Gagal sinkron ${key}:`, err);
    }
  },

  loadFromCloud: async (key: string) => {
    try {
      const docRef = doc(db, "app_data", key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        localStorage.setItem(key, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (err) {
      console.error(`[CloudSync] Gagal memuat ${key}:`, err);
    }
    return null;
  },

  // Fungsi untuk menarik seluruh data dari Firebase (PENTING SAAT LOGIN)
  syncAllFromCloud: async () => {
    console.log("[CloudSync] Memulai sinkronisasi global...");
    const keys = Object.values(STORAGE_KEYS);
    const promises = keys.map(key => storage.loadFromCloud(key));
    await Promise.all(promises);
    window.dispatchEvent(new Event('storage_updated'));
    console.log("[CloudSync] Sinkronisasi global selesai.");
  }
};
