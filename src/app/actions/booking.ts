'use server';

import { revalidatePath } from 'next/cache';
import type { Booking, EduwisataPackage } from '@/lib/definitions';
import { sendEmail } from '@/services/email';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from './settings';
import { getAll, getOne, create, set, update, now } from '@/lib/db';

const COL_BOOKINGS = 'bookings';
const COL_MEETINGS = 'meetings';
const COL_PACKAGES = 'edutourismPackages';

const ADMIN_NOTIFICATION_PHONE = '6285144904161';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';

export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'totalPrice' | 'uniqueCode'>,
): Promise<{ bookingId: string; finalAmount: number }> {
  try {
    const pkg = await getOne<EduwisataPackage>(COL_PACKAGES, bookingData.packageId);
    if (!pkg) throw new Error('Paket eduwisata tidak ditemukan.');

    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const basePrice = (bookingData.participants * (pkg.price || 0)) +
      bookingData.selectedAddons.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const finalAmount = basePrice + uniqueCode;

    const bookingId = crypto.randomUUID();
    const newBooking: Omit<Booking, 'id'> = {
      ...bookingData,
      bookingDate: bookingData.bookingDate,
      totalPrice: finalAmount,
      uniqueCode,
      status: 'pending',
      createdAt: now() as any,
    };

    await create(COL_BOOKINGS, newBooking as Record<string, unknown>, bookingId);

    const customerMessage = `Terima kasih, ${bookingData.customerName}! Pemesanan Eduwisata Anda untuk paket "${bookingData.packageName}" telah kami terima. Silakan selesaikan pembayaran sebesar Rp ${finalAmount.toLocaleString('id-ID')} ke rekening berikut agar pesanan dapat kami proses:\n\nBank: BCA\nNo. Rek: 1801802325\na.n. Oka Bayu Pratama`;
    const adminMessage = `Booking Eduwisata Baru:\n- Nama: ${bookingData.customerName}\n- Paket: ${bookingData.packageName}\n- Peserta: ${bookingData.participants} orang\n- Total: Rp ${finalAmount.toLocaleString('id-ID')}`;

    try {
      await sendWhatsAppMessage(bookingData.customerPhone, customerMessage);
      await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, adminMessage);
    } catch (e) { console.error("Failed to send WhatsApp notification", e); }

    try {
      await sendEmail({ to: bookingData.customerEmail, subject: `Konfirmasi Pemesanan Eduwisata Garda Lestari (ID: ${bookingId.substring(0, 8)})`, text: customerMessage });
      await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: `Booking Eduwisata Baru: ${bookingData.customerName}`, text: adminMessage });
    } catch (e) { console.error("Failed to send email notification", e); }

    revalidatePath('/panel/bookings');
    return { bookingId, finalAmount };
  } catch (error) {
    console.error('[createBooking Error]', error);
    throw new Error(`Gagal membuat pemesanan: ${(error as Error).message}`);
  }
}

export async function getBookings(): Promise<Booking[]> {
  const rows = await getAll<any>(COL_BOOKINGS, { orderBy: { field: 'createdAt', direction: 'desc' } });
  return rows as Booking[];
}

export async function confirmPayment(bookingId: string): Promise<void> {
  // Sequential read-modify-write (replaces Firebase transaction)
  const bookingData = await getOne<any>(COL_BOOKINGS, bookingId);
  if (!bookingData) throw new Error("Pemesanan tidak ditemukan.");
  if (bookingData.status !== 'pending') throw new Error("Pemesanan ini tidak dalam status menunggu pembayaran.");

  await update(COL_BOOKINGS, bookingId, { status: 'paid' });

  const template = await getWhatsappTemplate('booking_payment_confirmed');
  const bookingDate = bookingData.bookingDate
    ? new Date(bookingData.bookingDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const waMessage = template.message
    .replace('{namaPengguna}', bookingData.customerName)
    .replace('{namaPaket}', bookingData.packageName)
    .replace('{tanggalKunjungan}', bookingDate);

  const emailSubject = `Pembayaran Dikonfirmasi - Pemesanan Eduwisata Anda (ID: ${bookingId.substring(0, 8)})`;

  if (template.isActive && bookingData.customerPhone) {
    await sendWhatsAppMessage(bookingData.customerPhone, waMessage);
  }
  if (bookingData.customerEmail) {
    await sendEmail({ to: bookingData.customerEmail, subject: emailSubject, text: waMessage });
  }

  revalidatePath('/panel/bookings');
}

export async function createMeetingBooking(
  meetingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'packageId' | 'packageName' | 'selectedAddons' | 'totalPrice' | 'uniqueCode'> & { bookingDate: string }
): Promise<{ meetingId: string }> {
  try {
    const { bookingDate, ...restOfData } = meetingData;
    const meetingId = crypto.randomUUID();

    const newMeeting = {
      ...restOfData,
      bookingDate: new Date(bookingDate).toISOString(),
      status: 'pending',
      createdAt: now(),
    };

    await create(COL_MEETINGS, newMeeting as Record<string, unknown>, meetingId);

    const customerMessage = `Halo ${meetingData.customerName}, permintaan meeting Anda dengan topik "${meetingData.meetingTopic}" telah kami terima. Tim kami akan segera menghubungi Anda untuk penjadwalan lebih lanjut.`;
    const adminMessage = `Permintaan Meeting Baru:\n- Nama: ${meetingData.customerName}\n- Email: ${meetingData.customerEmail}\n- Telepon: ${meetingData.customerPhone}\n- Topik: ${meetingData.meetingTopic}`;

    try {
      await sendWhatsAppMessage(meetingData.customerPhone, customerMessage);
      await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, adminMessage);
    } catch (e) { console.error("Failed to send WhatsApp notification for meeting booking", e); }

    try {
      await sendEmail({ to: meetingData.customerEmail, subject: `Konfirmasi Permintaan Meeting - Garda Lestari`, text: customerMessage });
      await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: `Permintaan Meeting Baru: ${meetingData.customerName}`, text: adminMessage });
    } catch (e) { console.error("Failed to send email notification for meeting booking", e); }

    return { meetingId };
  } catch (error) {
    console.error('[createMeetingBooking Error]', error);
    throw new Error(`Gagal membuat permintaan meeting: ${(error as Error).message}`);
  }
}

export async function getBookedEduwisataDates(packageId: string): Promise<Date[]> {
  try {
    const bookings = await getAll<any>(COL_BOOKINGS, {
      where: [
        { field: 'packageId', op: '==', value: packageId },
        // Note: 'in' operator not directly supported, fetch and filter
      ],
    });
    return bookings
      .filter((b: any) => ['paid', 'confirmed'].includes(b.status))
      .map((b: any) => new Date(b.bookingDate));
  } catch (error) {
    console.error('[getBookedEduwisataDates Error]', error);
    return [];
  }
}

export async function getBookedMeetingSlots(date: Date): Promise<string[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const meetings = await getAll<any>(COL_MEETINGS, {
      where: [
        { field: 'bookingDate', op: '>=', value: startOfDay.toISOString() },
        { field: 'bookingDate', op: '<=', value: endOfDay.toISOString() },
      ],
    });

    return meetings.map((m: any) => {
      const d = new Date(m.bookingDate);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
  } catch (error) {
    console.error('[getBookedMeetingSlots Error]', error);
    return [];
  }
}

export async function getMeetings(): Promise<Booking[]> {
  try {
    const rows = await getAll<any>(COL_MEETINGS, { orderBy: { field: 'createdAt', direction: 'desc' } });
    return rows as unknown as Booking[];
  } catch (error) {
    console.error("[getMeetings Error]", error);
    throw new Error("Gagal mengambil data permintaan meeting.");
  }
}
