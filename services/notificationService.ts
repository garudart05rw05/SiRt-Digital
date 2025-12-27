
import { AppSettings } from '../types';
import { safeStringify, compressImage } from './storageService.ts';

/**
 * Unified Notification Service
 * Dioptimalkan untuk menangani limit ukuran foto pada EmailJS
 */

export type EmailCategory = 'complaint' | 'guest' | 'letter' | 'jimpitan';

const sanitizeForJson = (data: any): any => {
  try {
    return JSON.parse(safeStringify(data));
  } catch (e) {
    return { error: 'Serialization failed' };
  }
};

export const notificationService = {
  sendEmail: async (settings: AppSettings, payload: any, category: EmailCategory = 'complaint'): Promise<boolean> => {
    const clean = (val?: string) => (val || "").trim();

    // 1. Sanitize Payload
    const sanitizedPayload = sanitizeForJson(payload);
    let finalPayload: any = { ...sanitizedPayload };

    // Kustomisasi Data per Kategori
    if (category === 'jimpitan') {
      const formattedCash = new Intl.NumberFormat('id-ID', { 
        style: 'decimal', 
        minimumFractionDigits: 0 
      }).format(payload.totalCashReceived || 0);

      finalPayload.totalCashReceived = formattedCash;
      finalPayload.resident_paid_list = payload.resident_paid_names || '-';
      finalPayload.resident_prepaid_list = payload.resident_prepaid_names || '-';
      finalPayload.resident_unpaid_list = payload.resident_unpaid_names || '-';
    }

    // Downscale Gambar Khusus untuk Aduan agar tidak ditolak EmailJS (Payload Limit)
    if (category === 'complaint' && payload.imageUrl) {
      try {
        // Kompresi ekstrem: Max 350px width, Quality 0.4 agar di bawah 30KB
        finalPayload.imageUrl = await compressImage(payload.imageUrl, 350, 0.4);
      } catch (e) {
        console.error("Gagal mengompres gambar email:", e);
      }
    }

    const officialRtEmail = 'garudart05rw05@gmail.com';
    const primaryRecipient = clean(payload.email) || officialRtEmail;

    const templateParams = {
      ...finalPayload,
      to_email: primaryRecipient, 
      rt_name: settings.rtRw || 'RT 05 RW 05 Gayam',
      app_email: officialRtEmail,
      chairman_email: clean(settings.chairmanEmail),
      secretary_email: clean(settings.secretaryEmail),
      security_email: clean(settings.securityEmail),
      request_time: new Date().toLocaleString('id-ID')
    };

    // 2. CEK JALUR PENGIRIMAN (EmailJS dinamis dengan fallback kredensial baru Jimpitan)
    let ejs_service = "";
    let ejs_template = "";
    let ejs_public = "";

    if (category === 'jimpitan' || category === 'complaint') {
      ejs_service = settings.ejs_internal_service || (category === 'jimpitan' ? "service_1bi2tve" : "");
      ejs_public = settings.ejs_internal_public || (category === 'jimpitan' ? "G8YgYy4vhj7B2Xw1E" : "");
      ejs_template = category === 'jimpitan' 
        ? (settings.ejs_jimpitan_template || "template_xjpqq8k") 
        : (settings.ejs_complaint_template || "");
    } else {
      ejs_service = settings.ejs_guest_service || "";
      ejs_public = settings.ejs_guest_public || "";
      ejs_template = category === 'guest'
        ? settings.ejs_guest_template || ""
        : settings.ejs_letter_template || "";
    }

    if (ejs_service && ejs_template && ejs_public) {
       try {
         const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             service_id: ejs_service,
             template_id: ejs_template,
             user_id: ejs_public,
             template_params: templateParams
           })
         });
         
         if (response.ok) {
            console.log(`EmailJS (${category}) Sent Successfully`);
            return true;
         } else {
            const errText = await response.text();
            console.error("EmailJS Rejected Request:", errText);
         }
       } catch (ejsErr) {
         console.error("EmailJS Network Error:", ejsErr);
       }
    }

    // Jalur Fallback: Google Apps Script
    const UNIVERSAL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwm5TWWjtrHDGHzWBM7y6L-jS42atQqdk8VI_PT4Q8afHtIUnihsmMbz-_SAJogyK1FZw/exec";
    try {
      await fetch(UNIVERSAL_SCRIPT_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({
          ...templateParams,
          email_type: category,
          rtName: settings.rtRw || 'RT 05'
        }) 
      });
      return true;
    } catch (err) {
      console.error("Gagal mengirim notifikasi via script:", err);
      return false;
    }
  }
};
