
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Booking, Addon } from '@/lib/definitions';

const bookingsCollection = collection(db, 'bookings');
const addonsCollection = collection(db, 'addons');

/**
 * Creates a new booking for an Eduwisata package.
 * This function initiates the booking and sets its status to 'pending'.
 * @param bookingData - The core booking information.
 * @returns The ID of the newly created booking and the final amount to be paid.
 */
export async function createBooking(
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'totalPrice' | 'uniqueCode'>
): Promise<{ bookingId: string; finalAmount: number; }> {
  try {
    // Generate a unique 3-digit code for the transfer
    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const basePrice = bookingData.selectedAddons.reduce((acc, item) => acc + (item.price * item.quantity), 0); // Assuming base package price is included or handled separately
    const finalAmount = basePrice + uniqueCode;

    const bookingId = await runTransaction(db, async (transaction) => {
      // 1. Decrement stock for selected add-ons atomically
      for (const item of bookingData.selectedAddons) {
        if (item.quantity <= 0) continue;

        const addonRef = doc(addonsCollection, item.addonId);
        const addonDoc = await transaction.get(addonRef);

        if (!addonDoc.exists()) {
          throw new Error(`Add-on dengan ID ${item.addonId} tidak ditemukan.`);
        }

        const addon = addonDoc.data() as Addon;
        
        // Skip stock check for unlimited items
        if (addon.stock === -1) {
            continue;
        }

        const newStock = addon.stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Stok untuk add-on "${addon.name}" tidak mencukupi.`);
        }
        transaction.update(addonRef, { stock: newStock });
      }

      // 2. Create the booking document with 'pending' status
      const newBookingRef = doc(bookingsCollection);
      const newBooking: Omit<Booking, 'id'> = {
        ...bookingData,
        totalPrice: finalAmount,
        uniqueCode,
        status: 'pending', // Set initial status to pending payment
        createdAt: Timestamp.now(),
      };
      transaction.set(newBookingRef, newBooking);
      
      return newBookingRef.id;
    });

    // 3. Revalidate paths to update caches
    revalidatePath('/admin/bookings'); // Assuming an admin page for bookings

    // 4. Return the booking ID and the final amount for the user to pay
    return { bookingId, finalAmount };

  } catch (error) {
    console.error('[createBooking Error]', error);
    throw new Error(`Gagal membuat pemesanan: ${(error as Error).message}`);
  }
}

/**
 * --- WORKFLOW: PEMBAYARAN TRANSFER BANK DENGAN KODE UNIK ---
 * 
 * Metode ini menghindari integrasi payment gateway langsung dan mengandalkan verifikasi manual 
 * oleh admin, yang disederhanakan dengan jumlah pembayaran yang unik.
 * 
 * 1. **Inisiasi Transaksi (Client-side):**
 *    - Pengguna menyelesaikan detail pemesanan mereka.
 *    - Client memanggil `createBooking` server action.
 *    - `createBooking` akan:
 *      a. Menghasilkan kode unik 3-digit (misal: 123).
 *      b. Menghitung `finalAmount` (misal: total harga 150.000 menjadi 150.123).
 *      c. Membuat dokumen booking di Firestore dengan `status: 'pending'` dan menyimpan `finalAmount` & `uniqueCode`.
 *      d. Mengembalikan `bookingId` dan `finalAmount` ke client.
 *    - UI client kemudian menampilkan halaman "Menunggu Pembayaran" dengan:
 *      a. Jumlah yang harus ditransfer: Rp 150.123.
 *      b. Detail rekening bank: BCA 1801802325 a.n. Oka Bayu Pratama.
 *      c. Batas waktu pembayaran (misal, "Selesaikan pembayaran dalam 1 jam").
 *      d. Form untuk konfirmasi pembayaran (opsional, tapi direkomendasikan), di mana pengguna memasukkan nama pengirim, nama bank, dan mengunggah bukti transfer.
 * 
 * 2. **Konfirmasi Pembayaran (Admin Workflow):**
 *    - Admin secara berkala memeriksa mutasi rekening bank.
 *    - Saat menemukan transfer masuk sebesar Rp 150.123, admin dapat dengan mudah mencocokkannya dengan pesanan yang pending di panel admin.
 *    - Admin mengubah status pesanan dari 'pending' menjadi 'paid' atau 'confirmed'.
 * 
 * 3. **Notifikasi Pembayaran (Server-side):**
 *    - Ketika status diubah, sebuah trigger (misalnya, Cloud Function atau action eksplisit di panel) dapat diaktifkan.
 *    - Trigger ini akan mengirim notifikasi (WhatsApp/email) ke `customerPhone` yang tersimpan di dokumen booking, 
 *      menginformasikan bahwa pembayaran telah diterima dan pesanan dikonfirmasi. Tautan untuk melihat detail pesanan bisa disertakan: `/pesanan/${bookingId}`.
 *
 * 4. **Penanganan Pesanan Kedaluwarsa:**
 *    - Sebuah fungsi terjadwal (misalnya, cron job atau Firebase Scheduled Function) berjalan secara periodik.
 *    - Fungsi ini mencari dokumen booking dengan status `pending` yang dibuat lebih dari 1-2 jam yang lalu.
 *    - Untuk setiap pesanan yang kedaluwarsa, fungsi ini akan mengembalikan stok add-on dan mengubah status pesanan menjadi 'cancelled'.
 */
