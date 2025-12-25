
# Script Notifikasi E-Aduan Pro (Universal & Robust)

Pasang kode di bawah ini pada Google Apps Script Anda. Kode ini telah dioptimalkan untuk menangani email kosong dan memastikan pengiriman tidak gagal meskipun data CC tidak lengkap.

### KODE UNTUK DEPLOY (Satu Script untuk Semua Status)

```javascript
/**
 * Sistem Notifikasi Email Aduan RT Digital Pro
 * Versi Robust: Menangani CC Kosong & Error Parsing
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 
  
  try {
    // 1. Parsing Data
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    
    if (!recipient) {
       return ContentService.createTextOutput("Error: Email Penerima Kosong").setMimeType(ContentService.MimeType.TEXT);
    }

    // 2. Filter CC agar tidak error jika email pengurus belum diisi
    var ccRaw = [data.chairmanEmail, data.secretaryEmail, data.securityEmail];
    var ccList = ccRaw.filter(function(email) {
      return email && email.indexOf('@') !== -1;
    }).join(',');

    // 3. Logika Pesan berdasarkan Status
    var subject = "";
    var bodyHead = "";
    var bodyNote = "";

    if (data.status === 'Pending') {
      subject = "🚨 [Laporan Baru] Tiket Aduan - " + data.id;
      bodyHead = "Laporan aduan Anda telah diterima di sistem digital " + (data.rtName || "RT");
      bodyNote = "Pengurus telah menerima notifikasi laporan Anda dan akan segera meninjau detail masalah. Mohon tunggu update status selanjutnya.";
    } else if (data.status === 'Diproses') {
      subject = "⏳ [Progress] Aduan Sedang Ditindaklanjuti - " + data.id;
      bodyHead = "Aduan Anda saat ini sedang dalam TAHAP PENANGANAN oleh Pengurus.";
      bodyNote = "Kami sedang melakukan koordinasi di lapangan atau dengan pihak terkait untuk menyelesaikan subjek: " + data.subject;
    } else if (data.status === 'Selesai') {
      subject = "✅ [Selesai] Aduan Telah Teratasi - " + data.id;
      bodyHead = "Kabar baik! Laporan aduan Anda (" + data.id + ") telah dinyatakan SELESAI.";
      bodyNote = "Terima kasih atas kepedulian Anda terhadap lingkungan. Jika masalah terulang, jangan ragu untuk melapor kembali.";
    }

    // 4. Menyusun Email
    var emailBody = "SISTEM E-ADUAN DIGITAL " + (data.rtName || "RT") + "\n" +
                    "==================================================\n\n" +
                    "Halo " + data.residentName + ",\n\n" +
                    bodyHead + "\n\n" +
                    "DETAIL LAPORAN:\n" +
                    "- ID Tiket    : " + data.id + "\n" +
                    "- Subjek      : " + data.subject + "\n" +
                    "- Kategori    : " + data.category + "\n" +
                    "- Status Saat Ini : " + data.status.toUpperCase() + "\n\n" +
                    "PESAN PENGURUS:\n" +
                    bodyNote + "\n\n" +
                    "--------------------------------------------------\n" +
                    "Tembusan laporan ini telah dikirimkan ke email Pengurus RT terkait.\n" +
                    "Hormat Kami,\n" +
                    "Administrasi RT Digital Pro System";

    // 5. Kirim Email
    var mailOptions = {
      to: recipient,
      subject: subject,
      body: emailBody
    };

    // Tambahkan CC hanya jika ada email yang valid
    if (ccList.length > 0) {
      mailOptions.cc = ccList;
    }

    MailApp.sendEmail(mailOptions);

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
```

### CARA AGAR BERHASIL:
1. **Authorize**: Saat klik "Deploy" pertama kali, Google akan meminta izin. Klik **Advanced** -> **Go to (Unsafe)** -> **Allow**. Ini wajib.
2. **Access**: Pastikan "Who has access" diset ke **Anyone** (Bukan 'Anyone with Google Account').
3. **Admin Panel**: Masuk ke menu **Admin Panel > Konfigurasi** di aplikasi, isi bagian **Email Ketua RT, Sekretaris, dan Keamanan** dengan email yang benar. Tanpa ini, tembusan tidak akan terkirim.
4. **Update URL**: Jika Anda mengubah kode di script, Anda **HARUS** klik "New Deployment" lagi dan menyalin URL barunya ke file `ComplaintPage.tsx`. URL yang lama tidak akan otomatis terupdate kodenya.
