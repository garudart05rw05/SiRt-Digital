# 📜 Panduan Template EmailJS - Buku Tamu Digital Pro (Ultra Detail)

Salin kode HTML di bawah ini ke bagian **HTML Source** pada dashboard EmailJS Anda untuk menghasilkan laporan tamu yang sangat detail dan profesional.

### 🛠️ Cara Pemasangan:
1. Masuk ke **EmailJS Dashboard**.
2. Buat **New Template** atau edit template yang sudah ada.
3. Klik tab **Settings** dan aktifkan mode **HTML Source** (ikon `<>`).
4. Hapus semua kode lama dan tempelkan kode di bawah ini.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tiket Registrasi Tamu</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          
          <!--  HEADER: IDENTITAS RT -->
          <tr>
            <td style="background-color: #f59e0b; padding: 45px 40px 35px 40px; text-align: center;">
              <div style="background-color: rgba(255,255,255,0.2); width: 70px; height: 70px; border-radius: 20px; margin: 0 auto 20px auto; display: block; line-height: 70px;">
                <img src="https://cdn-icons-png.flaticon.com/512/6009/6009043.png" width="45" height="45" style="margin-top: 12px;">
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Buku Tamu Digital 📜</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">RT 05 RW 05 Gayam - Mojoroto</p>
            </td>
          </tr>

          <!-- STATUS BADGE -->
          <tr>
            <td style="padding: 35px 40px 10px 40px; text-align: center;">
              <div style="display: inline-block; padding: 12px 30px; border-radius: 50px; background-color: #fffbeb; border: 2px solid #fef3c7; color: #b45309; font-size: 14px; font-weight: 800; text-transform: uppercase;">
                🔔 STATUS: {{status}}
              </div>
            </td>
          </tr>

          <!-- TICKET ID CARD -->
          <tr>
            <td style="padding: 10px 40px;">
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 24px; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px;">🎫 Nomor Registrasi Unik</p>
                <h2 style="margin: 12px 0; color: #1e293b; font-size: 38px; font-weight: 900; letter-spacing: -1px; font-family: 'Courier New', monospace;">{{id}}</h2>
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 500;">Simpan kode ini untuk verifikasi petugas gerbang / keamanan.</p>
              </div>
            </td>
          </tr>

          <!-- SECTION I: DETAIL KUNJUNGAN -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 15px; font-weight: 800; text-transform: uppercase; border-left: 5px solid #f59e0b; padding-left: 15px;">📍 I. Rincian Kunjungan</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfaf3; border-radius: 20px; padding: 20px;">
                <tr>
                  <td width="50%" style="padding-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase;">🏠 Warga Yang Dikunjungi</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 15px; font-weight: 700;">{{hostName}}</p>
                  </td>
                  <td width="50%" style="padding-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase;">📝 Keperluan</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 15px; font-weight: 700;">{{purpose}}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%">
                    <p style="margin: 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase;">📅 Waktu Datang</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 700;">{{startDate}} | ⏰ {{startTime}} WIB</p>
                  </td>
                  <td width="50%">
                    <p style="margin: 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase;">⏳ Durasi Rencana</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 700;">{{duration}} ({{visitDays}} Hari)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION II: IDENTITAS TAMU -->
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 15px; font-weight: 800; text-transform: uppercase; border-left: 5px solid #f59e0b; padding-left: 15px;">👤 II. Identitas Lengkap Tamu</h3>
              <div style="background-color: #f1f5f9; border-radius: 20px; padding: 25px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="8">
                  <tr>
                    <td width="40%" style="color: #64748b; font-size: 12px; font-weight: 700;">👤 NAMA LENGKAP</td>
                    <td width="60%" style="color: #1e293b; font-size: 14px; font-weight: 800; text-transform: uppercase;">{{name}}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: 700;">🪪 JENIS & NO. ID</td>
                    <td style="color: #1e293b; font-size: 14px; font-weight: 700;">{{idType}} - {{idNumber}}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: 700;">📱 NO. WHATSAPP</td>
                    <td style="color: #1e293b; font-size: 14px; font-weight: 700;">{{phone}}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: 700;">🏢 INSTANSI/LEMBAGA</td>
                    <td style="color: #1e293b; font-size: 14px; font-weight: 700;">{{institution}}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: 700;">👥 TOTAL ROMBONGAN</td>
                    <td style="color: #1e293b; font-size: 14px; font-weight: 800;">{{guestCount}} Orang</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- SECTION III: DATA KENDARAAN -->
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 15px; font-weight: 800; text-transform: uppercase; border-left: 5px solid #f59e0b; padding-left: 15px;">🚗 III. Data Kendaraan</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33%" align="center" style="padding: 15px; background-color: #f8fafc; border-radius: 15px; border: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 9px; font-weight: 800;">🔢 PLAT NOMOR</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 16px; font-weight: 900; text-transform: uppercase;">{{vehiclePlate}}</p>
                  </td>
                  <td width="2%">&nbsp;</td>
                  <td width="32%" align="center" style="padding: 15px; background-color: #f8fafc; border-radius: 15px; border: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 9px; font-weight: 800;">🏎️ MEREK/TIPE</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase;">{{vehicleBrand}}</p>
                  </td>
                  <td width="2%">&nbsp;</td>
                  <td width="31%" align="center" style="padding: 15px; background-color: #f8fafc; border-radius: 15px; border: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 9px; font-weight: 800;">🎨 JENIS/WARNA</p>
                    <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px; font-weight: 700;">{{vehicleType}} ({{vehicleColor}})</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION IV: TANDA TANGAN -->
          <tr>
            <td style="padding: 20px 40px;">
               <div style="text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 25px;">
                  <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">✍️ Tanda Tangan Elektronik</p>
                  <div style="display: inline-block; padding: 10px; border: 1px solid #f1f5f9; border-radius: 15px;">
                    <img src="{{signature}}" width="220" style="max-height: 100px; display: block; filter: contrast(1.2);">
                  </div>
                  <p style="margin: 15px 0 0 0; color: #cbd5e1; font-size: 10px; font-weight: 600;">Diregistrasi pada: {{request_time}} WIB</p>
               </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #1e293b; padding: 35px 40px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">🛡️ SiRT Digital Pro System</p>
              <p style="margin: 12px 0 0 0; color: #64748b; font-size: 11px; line-height: 1.6;">
                Dokumen ini merupakan catatan resmi sistem informasi RT 05 RW 05 Gayam Kediri. Tembusan otomatis telah dikirimkan ke email Pengurus RT dan Seksi Keamanan.
              </p>
              <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 25px;">
                <a href="https://garudart05.web.app" style="background-color: #f59e0b; color: #ffffff; padding: 12px 25px; border-radius: 12px; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase;">🌐 Buka Portal Warga</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### 📋 Daftar Variabel Penting:
EmailJS akan mengisi otomatis data di dalam `{{ }}` jika dikirim dari aplikasi:
- `{{id}}`: Kode tamu (Contoh: T-12345).
- `{{status}}`: Status pendaftaran (Proses/Diizinkan).
- `{{name}}`: Nama lengkap tamu.
- `{{idType}}` & `{{idNumber}}`: KTP/SIM & Nomornya.
- `{{phone}}`: No. WhatsApp tamu.
- `{{hostName}}`: Nama warga yang dituju.
- `{{purpose}}`: Tujuan kunjungan.
- `{{startDate}}` & `{{startTime}}`: Tanggal & Jam kedatangan.
- `{{duration}}`: Lama berkunjung.
- `{{vehiclePlate}}`, `{{vehicleBrand}}`, `{{vehicleType}}`: Data kendaraan.
- `{{signature}}`: Gambar tanda tangan (Base64).
- `{{request_time}}`: Waktu sistem mencatat data.
