
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
 * @returns The ID of the newly created booking.
 */
export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'totalPrice'>): Promise<{ bookingId: string; finalAmount: number; }> {
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
 * --- BRAINSTORMING: UNIQUE CODE BANK TRANSFER PAYMENT ---
 * 
 * This method avoids direct payment gateway integration and relies on manual verification by an admin,
 * which is simplified by a unique payment amount.
 * 
 * 1. **Initiate Transaction (Client-side):**
 *    - User finalizes their booking details.
 *    - Client calls the `createBooking` server action.
 *    - The `createBooking` action:
 *      a. Generates a unique 3-digit code (e.g., 123).
 *      b. Calculates the `finalAmount` (e.g., total price of 150,000 becomes 150,123).
 *      c. Creates a booking document in Firestore with `status: 'pending'` and saves the `finalAmount`.
 *      d. Returns the `bookingId` and `finalAmount` to the client.
 *    - The client-side UI then displays a "Waiting for Payment" page with:
 *      a. The exact amount to transfer (Rp 150.123).
 *      b. The bank account details (Bank Name, Account Number, Account Holder Name).
 *      c. A deadline for the payment (e.g., "Please complete payment within 1 hour").
 * 
 * 2. **Manual Payment Confirmation (Admin Workflow):**
 *    - The admin periodically checks their bank account statement.
 *    - They look for incoming transfers with unique amounts (e.g., Rp 150.123).
 *    - When a matching transfer is found, the admin goes to the Admin Panel (`/panel/bookings`).
 *    - In the panel, they find the booking with the corresponding `pending` status and `totalPrice`.
 *    - The admin manually updates the booking status from 'pending' to 'confirmed' or 'paid'.
 * 
 * 3. **Handle Payment Notification (Server-side):**
 *    - When the admin updates the status, a server-side trigger (or an explicit action) can be fired.
 *    - This trigger sends a confirmation notification (e.g., via WhatsApp or email) to the user,
 *      informing them that their payment has been received and their booking is confirmed.
 *
 * 4. **Handling Expired Bookings:**
 *    - A scheduled function (e.g., a cron job or Firebase Scheduled Function) can run periodically (e.g., every hour).
 *    - This function queries for `pending` bookings older than the payment deadline (e.g., 1 hour).
 *    - For each expired booking, it reverts the stock decremented in step 1 and updates the booking status to 'cancelled'.
 */
