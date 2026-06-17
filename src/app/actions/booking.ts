'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  runTransaction,
  Timestamp,
  getDocs,
  setDoc,
  query,
  where,
  getDocsFromServer,
  orderBy,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Booking, Addon, EduwisataPackage } from '@/lib/definitions';
import { sendEmail } from '@/services/email';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from './settings';

const bookingsCollection = collection(db, 'bookings');
const meetingsCollection = collection(db, 'meetings');
const addonsCollection = collection(db, 'edutourismAddons');

const ADMIN_NOTIFICATION_PHONE = '6285144904161';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';


/**
 * Creates a new booking for an Eduwisata package.
 * This function initiates the booking and sets its status to 'pending'.
 * @param bookingData - The core booking information, including the new fields.
 * @returns The ID of the newly created booking and the final amount to be paid.
 */
export async function createBooking(
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'totalPrice' | 'uniqueCode'>,
): Promise<{ bookingId: string; finalAmount: number; }> {
  try {
    const pkgDoc = await getDoc(doc(db, 'edutourismPackages', bookingData.packageId));
    if (!pkgDoc.exists()) throw new Error('Paket eduwisata tidak ditemukan.');
    const pkg = pkgDoc.data() as EduwisataPackage;
    
    // Generate a unique 3-digit code for the transfer
    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const basePrice = (bookingData.participants * (pkg.price || 0)) + bookingData.selectedAddons.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalAmount = basePrice + uniqueCode;

    const newBookingRef = doc(bookingsCollection);
    const newBooking: Omit<Booking, 'id'> = {
        ...bookingData,
        bookingDate: bookingData.bookingDate,
        totalPrice: finalAmount,
        uniqueCode,
        status: 'pending', // Set initial status to pending payment
        createdAt: Timestamp.now(),
      };
    
    await setDoc(newBookingRef, newBooking);
    const bookingId = newBookingRef.id;

    // 3. Send notifications
    const customerMessage = `Terima kasih, ${bookingData.customerName}! Pemesanan Eduwisata Anda untuk paket "${bookingData.packageName}" telah kami terima. Silakan selesaikan pembayaran sebesar Rp ${finalAmount.toLocaleString('id-ID')} ke rekening berikut agar pesanan dapat kami proses:\n\nBank: BCA\nNo. Rek: 1801802325\na.n. Oka Bayu Pratama`;
    const adminMessage = `Booking Eduwisata Baru:\n- Nama: ${bookingData.customerName}\n- Paket: ${bookingData.packageName}\n- Peserta: ${bookingData.participants} orang\n- Total: Rp ${finalAmount.toLocaleString('id-ID')}`;
    
    try {
        await sendWhatsAppMessage(bookingData.customerPhone, customerMessage);
        await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, adminMessage);
    } catch(e) {
        console.error("Failed to send WhatsApp notification", e);
    }
    
    try {
        await sendEmail({
          to: bookingData.customerEmail,
          subject: `Konfirmasi Pemesanan Eduwisata Garda Lestari (ID: ${bookingId.substring(0, 8)})`,
          text: customerMessage,
        });
         await sendEmail({
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `Booking Eduwisata Baru: ${bookingData.customerName}`,
          text: adminMessage,
        });
    } catch(e) {
        console.error("Failed to send email notification", e);
    }


    // 4. Revalidate paths to update caches
    revalidatePath('/panel/bookings'); // Assuming an admin page for bookings

    // 5. Return the booking ID and the final amount for the user to pay
    return { bookingId, finalAmount };

  } catch (error) {
    console.error('[createBooking Error]', error);
    throw new Error(`Gagal membuat pemesanan: ${(error as Error).message}`);
  }
}

export async function getBookings(): Promise<Booking[]> {
    const q = query(bookingsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        } as Booking;
    });
}

export async function confirmPayment(bookingId: string): Promise<void> {
    const bookingRef = doc(db, 'bookings', bookingId);
    await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) {
            throw new Error("Pemesanan tidak ditemukan.");
        }
        
        const bookingData = bookingDoc.data() as Booking;
        if (bookingData.status !== 'pending') {
            throw new Error("Pemesanan ini tidak dalam status menunggu pembayaran.");
        }

        transaction.update(bookingRef, { status: 'paid' });

        const template = await getWhatsappTemplate('booking_payment_confirmed');
        const waMessage = template.message
            .replace('{namaPengguna}', bookingData.customerName)
            .replace('{namaPaket}', bookingData.packageName)
            .replace('{tanggalKunjungan}', bookingData.bookingDate.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }));
        
        const emailSubject = `Pembayaran Dikonfirmasi - Pemesanan Eduwisata Anda (ID: ${bookingId.substring(0,8)})`;

        if (template.isActive && bookingData.customerPhone) {
            await sendWhatsAppMessage(bookingData.customerPhone, waMessage);
        }
        if (bookingData.customerEmail) {
            await sendEmail({
                to: bookingData.customerEmail,
                subject: emailSubject,
                text: waMessage,
            });
        }
    });
    revalidatePath('/panel/bookings');
}


/**
 * Creates a new meeting booking request.
 * @param meetingData - The details of the meeting booking.
 */
export async function createMeetingBooking(
  meetingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'packageId' | 'packageName' | 'selectedAddons' | 'totalPrice' | 'uniqueCode'> & { bookingDate: string }
): Promise<{ meetingId: string }> {
  try {
    const newMeetingRef = doc(collection(db, 'meetings'));
    
    const { bookingDate, ...restOfData } = meetingData;

    const newMeeting = {
      ...restOfData,
      bookingDate: Timestamp.fromDate(new Date(bookingDate)),
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await setDoc(newMeetingRef, newMeeting);
    const meetingId = newMeetingRef.id;

    // Send notifications
    const customerMessage = `Halo ${meetingData.customerName}, permintaan meeting Anda dengan topik "${meetingData.meetingTopic}" telah kami terima. Tim kami akan segera menghubungi Anda untuk penjadwalan lebih lanjut.`;
    const adminMessage = `Permintaan Meeting Baru:\n- Nama: ${meetingData.customerName}\n- Email: ${meetingData.customerEmail}\n- Telepon: ${meetingData.customerPhone}\n- Topik: ${meetingData.meetingTopic}`;

    try {
        await sendWhatsAppMessage(meetingData.customerPhone, customerMessage);
        await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, adminMessage);
    } catch (e) {
        console.error("Failed to send WhatsApp notification for meeting booking", e);
    }
    
    try {
        await sendEmail({
          to: meetingData.customerEmail,
          subject: `Konfirmasi Permintaan Meeting - Garda Lestari`,
          text: customerMessage,
        });
        await sendEmail({
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `Permintaan Meeting Baru: ${meetingData.customerName}`,
          text: adminMessage,
        });
    } catch(e) {
        console.error("Failed to send email notification for meeting booking", e);
    }

    return { meetingId };
  } catch (error) {
    console.error('[createMeetingBooking Error]', error);
    throw new Error(`Gagal membuat permintaan meeting: ${(error as Error).message}`);
  }
}

/**
 * Fetches all booked dates for a specific edutourism package.
 * @param packageId - The ID of the edutourism package.
 * @returns An array of Date objects for booked dates.
 */
export async function getBookedEduwisataDates(packageId: string): Promise<Date[]> {
    try {
        const q = query(
            bookingsCollection, 
            where('packageId', '==', packageId),
            where('status', 'in', ['paid', 'confirmed'])
        );
        const snapshot = await getDocsFromServer(q);
        return snapshot.docs.map(doc => (doc.data().bookingDate as Timestamp).toDate());
    } catch (error) {
        console.error('[getBookedEduwisataDates Error]', error);
        return [];
    }
}

/**
 * Fetches all booked time slots for a specific date for meetings.
 * @param date - The date to check for booked slots.
 * @returns An array of strings representing booked time slots (e.g., "09:00").
 */
export async function getBookedMeetingSlots(date: Date): Promise<string[]> {
    try {
        const startOfDay = Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(date.setHours(23, 59, 59, 999)));

        const q = query(
            meetingsCollection,
            where('bookingDate', '>=', startOfDay),
            where('bookingDate', '<=', endOfDay),
        );
        const snapshot = await getDocsFromServer(q);
        return snapshot.docs.map(doc => {
            const bookingDate = (doc.data().bookingDate as Timestamp).toDate();
            return `${String(bookingDate.getHours()).padStart(2, '0')}:${String(bookingDate.getMinutes()).padStart(2, '0')}`;
        });
    } catch (error) {
        console.error('[getBookedMeetingSlots Error]', error);
        return [];
    }
}


/**
 * Fetches all meeting booking requests.
 * @returns A promise that resolves to an array of meeting bookings.
 */
export async function getMeetings(): Promise<Booking[]> {
  try {
    const q = query(meetingsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bookingDate: (doc.data().bookingDate as Timestamp).toDate().toISOString(),
        createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(),
    } as unknown as Booking));
  } catch (error) {
    console.error("[getMeetings Error]", error);
    throw new Error("Gagal mengambil data permintaan meeting.");
  }
}