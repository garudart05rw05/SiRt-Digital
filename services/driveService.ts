
import { CloudStatus } from '../types';

// Ini adalah mock service. Dalam produksi nyata, ini akan memanggil GAPI (Google API Client)
export const driveService = {
  // Simulasi Login Google
  connect: async (): Promise<{ email: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ email: 'rt04.digital@gmail.com' });
      }, 1500);
    });
  },

  // Simulasi Upload data ke Google Drive sebagai file JSON
  syncData: async (data: any): Promise<boolean> => {
    console.log("Syncing to Google Drive...", data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  },

  // Simulasi cek folder di Drive
  getDriveStorageInfo: async () => {
    return {
      used: '1.2 MB',
      total: '15 GB',
      files: ['warga_db.json', 'berita_v1.json', 'foto_kegiatan_folder']
    };
  }
};
