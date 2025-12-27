
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const STORAGE_KEYS = {
  NEWS: 'rt_pro_news',
  RESIDENTS: 'rt_pro_residents',
  REPORTS: 'rt_pro_reports',
  SETTINGS: 'rt_pro_settings',
  OFFICIALS: 'rt_pro_officials',
  YOUTH_OFFICIALS: 'rt_pro_youth_officials',
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
  FINANCE: 'rt_pro_finance',
  YOUTH_MEMBERS: 'rt_pro_youth_members',
  YOUTH_ARISAN_LOGS: 'rt_pro_youth_arisan_logs',
  YOUTH_FINANCE: 'rt_pro_youth_finance',
  YOUTH_SETTINGS: 'rt_pro_youth_settings'
};

/**
 * Robust JSON serialization helper that handles circular references and complex system objects
 */
export const safeStringify = (data: any): string => {
  const cache = new WeakSet();
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      
      // Detect and block heavy or problematic internal objects (Firestore snapshots, DOM elements, etc.)
      const isInternal = 
        value instanceof HTMLElement || 
        value.constructor?.name === 'Sa' || 
        value.constructor?.name?.startsWith('Q') || 
        value.firestore || 
        value._delegate ||
        (value.id && value.ref && value.metadata); // Likely a Firestore DocumentSnapshot

      if (isInternal) {
        return '[Internal System Object]';
      }

      cache.add(value);
    }
    return value;
  });
};

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

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  
  set: async <T>(key: string, data: T): Promise<boolean> => {
    try {
      const stringifiedData = safeStringify(data);
      const cleanData = JSON.parse(stringifiedData);
      
      localStorage.setItem(key, stringifiedData);

      await setDoc(doc(db, "app_data", key), { 
        data: cleanData, 
        updatedAt: new Date().toISOString() 
      });
      
      window.dispatchEvent(new Event('storage_updated'));
      return true;
    } catch (e) {
      console.error("System synchronization failure:", e);
      return false;
    }
  },

  updateLocal: <T>(key: string, data: T) => {
    try {
      localStorage.setItem(key, safeStringify(data));
      window.dispatchEvent(new Event('storage_updated'));
    } catch (e) {
      console.error("Local storage update failure:", e);
    }
  }
};
