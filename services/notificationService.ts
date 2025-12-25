
import { AppSettings } from '../types';

/**
 * Unified Notification Service
 * Mendukung EmailJS (Utama) dan Google Script (Cadangan)
 * Dinamis untuk Aduan, Surat, dan Buku Tamu dengan kredensial terpisah untuk Surat
 */

export type EmailCategory = 'complaint' | 'guest' | 'letter';

export const notificationService = {
  sendEmail: async (settings: AppSettings, payload: any, category: EmailCategory = 'complaint'): Promise<boolean> => {
    // 1. Tentukan Kredensial & Template ID berdasarkan kategori
    let targetServiceId = settings.emailJsServiceId;
    let targetPublicKey = settings.emailJsPublicKey;
    let targetTemplateId = settings.emailJsTemplateComplaintId;

    if (category === 'guest') {
      targetTemplateId = settings.emailJsTemplateGuestId;
    } else if (category === 'letter') {
      // Prioritaskan kredensial khusus surat jika tersedia
      targetServiceId = settings.emailJsLetterServiceId || settings.emailJsServiceId;
      targetPublicKey = settings.emailJsLetterPublicKey || settings.emailJsPublicKey;
      targetTemplateId = settings.emailJsTemplateLetterId;
    }

    // 2. Cek apakah EmailJS dikonfigurasi lengkap untuk target ini
    if (targetServiceId && targetTemplateId && targetPublicKey) {
      try {
        // @ts-ignore
        const response = await window.emailjs.send(
          targetServiceId,
          targetTemplateId,
          {
            ...payload,
            rt_name: settings.rtRw || 'RT Digital',
            chairman_email: settings.chairmanEmail || '',
            secretary_email: settings.secretaryEmail || '',
            security_email: settings.securityEmail || ''
          },
          targetPublicKey
        );
        console.log(`EmailJS Success [${category}]:`, response);
        return true;
      } catch (err) {
        console.error(`EmailJS Failed [${category}], switching to GAS:`, err);
      }
    }

    // 3. Cadangan: Kirim ke Google Apps Script (GAS) jika EmailJS gagal/belum diset
    const UNIVERSAL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwm5TWWjtrHDGHzWBM7y6L-jS42atQqdk8VI_PT4Q8afHtIUnihsmMbz-_SAJogyK1FZw/exec";
    
    try {
      await fetch(UNIVERSAL_SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({
          ...payload,
          email_type: category, // Informasi tambahan untuk script GAS
          chairmanEmail: settings.chairmanEmail || '',
          secretaryEmail: settings.secretaryEmail || '',
          securityEmail: settings.securityEmail || '',
          rtName: settings.rtRw || 'RT 05'
        }) 
      });
      return true;
    } catch (err) {
      console.error("Notification Service critical failure:", err);
      return false;
    }
  }
};
