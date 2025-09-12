
'use server';

import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect } from '@/services/whatsapp';

export async function sendTestMessage(phoneNumber: string, message: string) {
    try {
        await sendWhatsAppMessageSatuConnect(phoneNumber, message);
        return { success: true };
    } catch (error) {
        // The error from sendWhatsAppMessageSatuConnect is already descriptive.
        // We catch it here to log it and then re-throw it so the client-side can handle it.
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("Error in sendTestMessage action:", errorMessage);
        // Throw a new error to be caught by the client-side try-catch block
        throw new Error(errorMessage);
    }
}
