
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect } from '@/services/whatsapp';


interface BotState {
    status: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_QR';
    qr: string | null;
    lastUpdated: number;
}

const botStateRef = doc(db, 'whatsappBot', 'state');

// This action is called by the admin panel to get the bot's current status
export async function getBotStatus() {
    try {
        const docSnap = await getDoc(botStateRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as BotState;
            // If the status is old, it's likely disconnected
            if (Date.now() - data.lastUpdated > 30000) {
                return { status: 'DISCONNECTED', qr: null };
            }
            return { status: data.status, qr: data.qr };
        }
        // Default state if not found
        return { status: 'IDLE', qr: null };
    } catch (error) {
        console.error("Error getting bot status:", error);
        return { status: 'DISCONNECTED', qr: null };
    }
}

// These actions are placeholders. They would trigger the bot service,
// for example, by sending a request to the bot server.

export async function startBot() {
    console.log("ACTION: Requesting bot to start...");
    // In a real implementation, you'd send an API request to your bot server.
    // For now, we'll just log it. This is a placeholder.
    return { success: true, message: 'Start request sent to bot.' };
}

export async function stopBot() {
    console.log("ACTION: Requesting bot to stop...");
    return { success: true, message: 'Stop request sent to bot.' };
}

export async function logoutBot() {
    console.log("ACTION: Requesting bot to log out...");
     try {
        await setDoc(botStateRef, { status: 'IDLE', qr: null, lastUpdated: Date.now() });
    } catch (error) {
         console.error("Error logging out bot:", error);
    }
    return { success: true, message: 'Logout request sent to bot.' };
}

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
