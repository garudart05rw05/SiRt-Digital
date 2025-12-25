# Kode Google Apps Script (GAS) - Buku Tamu Pro (Final Version)

Gunakan kode di bawah ini pada proyek Google Apps Script Anda. Kode ini menangani 3 status sekaligus: **Pending (Proses)**, **ACC (Diizinkan)**, dan **Tolak** berdasarkan data yang dikirim dari aplikasi.

### KODE UNTUK DEPLOY (Universal Script)

```javascript
/**
 * Sistem Notifikasi Email Buku Tamu RT Digital Pro
 * Mendukung: Notifikasi Tamu, Update Status (ACC/Tolak), dan CC Pengurus.
 */

function doPost(e) {
  // Mencegah race condition saat banyak data masuk bersamaan
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 
  
  try {
    // 1. Parsing Data dari Aplikasi
    var data = JSON.parse(e.postData.contents);
    var recipient = data.email;
    
    // 2. Daftar CC: Ketua RT, Sekretaris, dan Keamanan
    var ccList = [data.chairmanEmail, data.secretaryEmail, data.securityEmail].filter(Boolean).join(',');

    // 3. Logika Judul dan Pesan berdasarkan Status
    var subjectPrefix = "";
    var statusBadge = "";
    var instructions = "";

    if (data.status === 'Proses') {
      subjectPrefix = "⏳ [Review] Registrasi Tamu";
      statusBadge = "MENUNGGU PERSETUJUAN (PENDING)";
      instructions = "Data Anda telah masuk ke sistem. Mohon tunggu sejenak, Pengurus RT sedang meninjau permohonan kunjungan Anda. Update status resmi akan dikirimkan kembali melalui email ini.";
    } else if (data.status === 'Diizinkan') {
      subjectPrefix = "✅ [DIIZINKAN] Tiket Kunjungan";
      statusBadge = "DIIZINKAN (ACC) / TERVERIFIKASI";
      instructions = "Kabar baik! Kunjungan Anda telah DISETUJUI oleh Ketua RT. Harap tunjukkan email ini kepada petugas keamanan atau warga yang dikunjungi saat tiba di lokasi.";
    } else {
      subjectPrefix = "❌ [DITOLAK] Permohonan Kunjungan";
      statusBadge = "DITOLAK / TIDAK DIIZINKAN";
      instructions = "Mohon maaf, permohonan kunjungan Anda saat ini belum dapat kami setujui karena alasan keamanan atau kebijakan lingkungan.";
    }

    // 4. Memformat Alamat Detail
    var addr = data.address;
    var fullAddress = (data.addressType === 'Kota' ? 'Kel. ' : 'Desa ') + addr.kelDesa + 
                      ", RT " + addr.rt + "/RW " + addr.rw + 
                      ", Kec. " + addr.kec + ", " + addr.cityRegency;

    // 5. Menyusun Subjek dan Isi Email
    var subject = subjectPrefix + " RT 05 - ID: " + data.id;
    
    var body = "FORMULIR REGISTRASI TAMU DIGITAL RT 05 RW 05 GAYAM\n" +
               "==================================================\n\n" +
               "STATUS SAAT INI : " + statusBadge + "\n" +
               "NOMOR KODE UNIK : " + data.id + "\n\n" +
               "PESAN PENGURUS:\n" + instructions + "\n\n" +
               "--------------------------------------------------\n" +
               "I. IDENTITAS TAMU\n" +
               "- Nama Lengkap : " + data.name + "\n" +
               "- Jenis ID      : " + data.idType + " (" + data.idNumber + ")\n" +
               "- No. HP / WA  : " + data.phone + "\n" +
               "- Jumlah Tamu  : " + data.guestCount + " Orang\n" +
               "- Instansi     : " + (data.institution || "-") + "\n\n" +
               "II. ALAMAT ASAL TAMU\n" +
               "- Domisili     : " + data.addressType + "\n" +
               "- Alamat       : " + fullAddress + "\n\n" +
               "III. DETAIL KUNJUNGAN\n" +
               "- Warga Tujuan : " + data.hostName + "\n" +
               "- Keperluan    : " + data.purpose + "\n" +
               "- Tgl. Mulai   : " + data.startDate + "\n" +
               "- Jam Datang   : " + data.startTime + " WIB\n" +
               "- Durasi       : " + data.duration + " (" + data.visitDays + " Hari)\n\n" +
               "IV. INFORMASI KENDARAAN\n" +
               "- Jenis        : " + data.vehicleType + "\n" +
               "- No. Plat      : " + data.vehiclePlate.toUpperCase() + "\n" +
               "- Merek/Warna  : " + data.vehicleBrand + " / " + data.vehicleColor + "\n\n" +
               "--------------------------------------------------\n\n" +
               "Catatan: Laporan ini dihasilkan secara otomatis oleh sistem digital.\n" +
               "Tembusan (CC) telah dikirimkan ke email Pengurus RT terkait.\n\n" +
               "Hormat Kami,\n" +
               "Administrasi RT 05 RW 05 Gayam\n" +
               "Kel. Gayam, Kec. Mojoroto, Kota Kediri";

    // 6. Pengiriman Email Utama dengan CC
    MailApp.sendEmail({
      to: recipient,
      cc: ccList,
      subject: subject,
      body: body
    });

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
```

### PETUNJUK PENGGUNAAN:
1. Copy seluruh kode di atas.
2. Buka [script.google.com](https://script.google.com).
3. Buat proyek baru dan paste kodenya.
4. Klik **Deploy** -> **New Deployment**.
5. Pilih **Web App**, set **Execute as: Me** dan **Who has access: Anyone**.
6. Salin URL yang dihasilkan.
7. Masukkan URL tersebut ke file `pages/GuestbookPage.tsx` pada variabel:
   - `URL_GUEST_PENDING`
   - `URL_GUEST_APPROVED`
   - `URL_GUEST_REJECTED`
   *(Anda bisa menggunakan satu URL yang sama untuk ketiganya karena script ini bersifat universal).*