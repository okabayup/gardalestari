'use server';

import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect } from '@/services/whatsapp';


export async function sendTestMessage(phoneNumber: string, message: string) {
    try {
        await sendWhatsAppMessageSatuConnect(phoneNumber, message);
        return { success: true };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("Error in sendTestMessage action:", errorMessage);
        throw new Error(errorMessage);
    }
}
