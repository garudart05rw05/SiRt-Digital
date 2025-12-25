
# Panduan Google Apps Script Notifikasi E-Persuratan (Update CC)

Gunakan kode-kode di bawah ini pada 3 proyek Google Apps Script yang berbeda. Pastikan setiap proyek di-deploy sebagai **Web App** dengan akses **Anyone**.

### 1. Proyek: Surat-Pending (URL_PENDING)
```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    var ccList = [data.chairmanEmail, data.secretaryEmail, data.securityEmail].filter(Boolean).join(',');
    
    var subject = "✅ [Antrean] Pengajuan Surat RT - " + data.id;
    var body = "Halo " + data.name + ",\n\n" +
               "Terima kasih, pengajuan surat pengantar Anda telah masuk ke antrean sistem digital RT.\n\n" +
               "ID Surat: " + data.id + "\n" +
               "Status: PENDING\n\n" +
               "Tembusan email telah dikirim ke Ketua RT, Sekretaris, dan Seksi Keamanan.\n\n" +
               "Salam,\nAdministrasi RT 05";

    MailApp.sendEmail({ to: recipient, cc: ccList, subject: subject, body: body });
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

### 2. Proyek: Surat-Proses (URL_PROSES)
```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    var ccList = [data.chairmanEmail, data.secretaryEmail, data.securityEmail].filter(Boolean).join(',');
    
    var subject = "⏳ [Update] Surat Anda Sedang Diproses - " + data.id;
    var body = "Halo " + data.name + ",\n\n" +
               "Pengajuan surat Anda dengan ID: " + data.id + " saat ini SEDANG DIPROSES.\n\n" +
               "Salam,\nPengurus RT 05";

    MailApp.sendEmail({ to: recipient, cc: ccList, subject: subject, body: body });
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

### 3. Proyek: Surat-Selesai (URL_SELESAI)
```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    var ccList = [data.chairmanEmail, data.secretaryEmail, data.securityEmail].filter(Boolean).join(',');
    
    var subject = "📩 [Selesai] Surat Siap Diambil - " + data.id;
    var body = "Halo " + data.name + ",\n\n" +
               "Kabar baik! Surat pengantar Anda (" + data.id + ") telah SELESAI diproses.\n" +
               "Silakan ambil di kediaman Ketua RT.\n\n" +
               "Salam,\nKetua RT 05";

    MailApp.sendEmail({ to: recipient, cc: ccList, subject: subject, body: body });
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```
