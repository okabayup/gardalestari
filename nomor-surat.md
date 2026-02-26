# Dokumentasi Penomoran Surat Garda Lestari

Sistem ini menggunakan penomoran otomatis yang dihitung berdasarkan periode bulan dan tahun berjalan.

## 1. Format Nomor Surat
Format standar yang digunakan adalah:
`[Nomor Urut]/[Kode Jenis]/GL/DPP/[Bulan Romawi]/[Tahun]`

**Contoh:** `001/SK/GL/DPP/II/2024`

### Komponen Format:
*   **Nomor Urut (3 digit):** Nomor yang dihasilkan secara otomatis mulai dari `001`.
*   **Kode Jenis:** Singkatan dari jenis dokumen (misal: `SK` untuk Surat Keputusan).
*   **GL:** Identitas organisasi (Garda Lestari).
*   **DPP:** Tingkatan kepengurusan (Dewan Pengurus Pusat).
*   **Bulan Romawi:** Representasi bulan saat dokumen dibuat (I, II, III, ..., XII).
*   **Tahun:** Tahun berjalan (4 digit).

## 2. Logika Pengurutan & Penomoran (Sequencing)
Sistem pengurutan nomor surat didasarkan pada aturan berikut:

1.  **Reset Bulanan:** Nomor urut (`001`) akan direset setiap pergantian bulan baru. Artinya, surat pertama di bulan Maret akan selalu dimulai dari `001`, meskipun di bulan Februari sudah mencapai nomor `050`.
2.  **Global vs Per Jenis:** Saat ini, sistem menghitung nomor urut secara **global per bulan**. Jika surat `001` adalah jenis `SK`, maka surat berikutnya (jenis apa pun) di bulan yang sama akan mendapatkan nomor `002`.
3.  **Pengurutan Tampilan:** Pada daftar dokumen di aplikasi, surat diurutkan berdasarkan waktu pembuatan (`createdAt`) secara **descending** (dokumen terbaru muncul paling atas).

## 3. Daftar Kode Jenis Dokumen
Berikut adalah kode jenis dokumen yang terdaftar dalam sistem:

| Jenis Dokumen | Kode |
| :--- | :--- |
| Surat Keputusan | SK |
| Surat Edaran | SE |
| Surat Undangan | SU |
| Surat Tugas | ST |
| Surat Perintah Perjalanan Dinas | SPPD |
| Surat Permohonan | SPm |
| Surat Keterangan | SKet |
| Surat Kuasa | SKua |
| Surat Peringatan | SPering |
| Nota Kesepahaman | MoU |
| Perjanjian Kerja Sama | PKS |
| Sertifikat | Sert |
| Notulen Rapat | Notula |
| Laporan | Lap |
| Siaran Pers | Pers |
| Lainnya | LL |

## 4. Keamanan & Verifikasi
Setiap nomor surat yang dihasilkan akan tertanam di dalam **Stampel Digital** dan **QR Code** pada dokumen PDF yang disetujui. QR Code tersebut merujuk pada halaman verifikasi resmi di website `gardalestari.org` untuk memastikan keaslian nomor tersebut.
