
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

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
  SOLIDARITAS_RESIDENTS: 'rt_pro_solidaritas_residents',
  SOLIDARITAS_LOGS: 'rt_pro_solidaritas_logs',
  SOLIDARITAS_SETTINGS: 'rt_pro_solidaritas_settings',
  SOLIDARITAS_STATUS: 'rt_pro_solidaritas_status',
  GALLERY: 'rt_pro_gallery',
  FINANCE: 'rt_pro_finance'
};

/**
 * Fungsi untuk mengompres gambar base64
 */
export const compressImage = (base64Str: string, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const safeStringify = (data: any): string => {
  const cache = new Set();
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
};

/**
 * Storage Service - Cloud Only Edition
 * Menghapus ketergantungan pada localStorage browser.
 */
export const storage = {
  // get sekarang hanya mengembalikan nilai default karena data asli akan ditarik via onSnapshot
  get: <T>(key: string, defaultValue: T): T => {
    return defaultValue;
  },
  
  // set sekarang hanya mengirimkan data ke Firebase Firestore
  set: async <T>(key: string, data: T): Promise<boolean> => {
    try {
      const stringifiedData = safeStringify(data);
      const cleanData = JSON.parse(stringifiedData);
      
      await setDoc(doc(db, "app_data", key), { 
        data: cleanData, 
        updatedAt: new Date().toISOString() 
      });
      
      // Tetap trigger event untuk update UI lokal yang mendengarkan event ini
      window.dispatchEvent(new Event('storage_updated'));
      return true;
    } catch (e) {
      console.error("Cloud storage critical failure:", e);
      return false;
    }
  },

  // Fungsi updateLocal tidak lagi melakukan apa-apa ke browser storage
  updateLocal: <T>(key: string, data: T) => {
    // No-op untuk menjaga kompatibilitas dengan pemanggil lama
    window.dispatchEvent(new Event('storage_updated'));
  }
};
