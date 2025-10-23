
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
 * This function should be called after a successful payment transaction.
 * @param bookingData - The core booking information.
 * @returns The ID of the newly created booking.
 */
export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
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

      // 2. Create the booking document
      const newBookingRef = doc(bookingsCollection);
      const newBooking: Booking = {
        ...bookingData,
        id: newBookingRef.id,
        status: 'confirmed', // Assuming payment is confirmed at this point
        createdAt: Timestamp.now(),
      };
      transaction.set(newBookingRef, newBooking);
      
      return newBookingRef.id;
    });

    // 3. Revalidate paths to update caches
    revalidatePath('/admin/bookings'); // Assuming an admin page for bookings

    // 4. (Optional) Send confirmation email/notification to the user

    return bookingId;

  } catch (error) {
    console.error('[createBooking Error]', error);
    throw new Error(`Gagal membuat pemesanan: ${(error as Error).message}`);
  }
}

/**
 * --- BRAINSTORMING: PAYMENT GATEWAY INTEGRATION ---
 * 
 * To connect this to a payment gateway (e.g., Midtrans, Xendit):
 * 
 * 1. **Initiate Transaction (Client-side):**
 *    - User finalizes their booking details (package, add-ons, date).
 *    - Client-side code calculates the total price and makes a request to a serverless function (Next.js API route) to create a payment transaction.
 *    - This serverless function communicates with the payment gateway SDK, providing the amount and order details.
 *    - The payment gateway returns a `transaction_token` or a `redirect_url`.
 *    - The client-side then uses this token to open the payment gateway's checkout UI (e.g., Midtrans Snap.js).
 * 
 * 2. **Handle Payment Notification (Server-side Webhook):**
 *    - The payment gateway will send a notification (webhook) to a dedicated API endpoint in our app (e.g., `/api/payment/webhook`).
 *    - This webhook handler MUST verify the signature of the request to ensure it's genuinely from the payment gateway.
 *    - On successful payment notification (`transaction_status === 'settlement'`), the webhook handler will:
 *      a. Call the `createBooking` function with the booking data (which should have been stored temporarily, e.g., in a 'pending_bookings' collection, or passed in the transaction metadata).
 *      b. This ensures that the stock is only decremented and the booking is only finalized AFTER payment is confirmed.
 * 
 * 3. **Update Booking Status:**
 *    - The `createBooking` function would set the booking status to 'confirmed' or 'paid'.
 *    - If a payment fails or is cancelled, the webhook handler would update the temporary booking's status accordingly.
 * 
 * Example `createPaymentTransaction` function (in a Next.js API route):
 * 
 * ```typescript
 * import midtransClient from 'midtrans-client';
 * 
 * // ... (inside your API route handler)
 * 
 * const snap = new midtransClient.Snap({
 *   isProduction: false,
 *   serverKey: process.env.MIDTRANS_SERVER_KEY,
 *   clientKey: process.env.MIDTRANS_CLIENT_KEY
 * });
 * 
 * const parameter = {
 *   transaction_details: {
 *     order_id: `booking-${Date.now()}`, // Should be a unique ID
 *     gross_amount: totalPrice,
 *   },
 *   customer_details: {
 *     first_name: customerName,
 *     email: customerEmail,
 *   },
 *   // You can pass booking details here to retrieve in the webhook
 *   metadata: {
 *      packageId: 'eduwisata-basic',
 *      // ... other booking details
 *   }
 * };
 * 
 * const transaction = await snap.createTransaction(parameter);
 * res.status(200).json(transaction);
 * ```
 */

