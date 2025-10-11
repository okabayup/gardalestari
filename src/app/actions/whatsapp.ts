
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { sendWhatsAppMessage as sendWhatsAppMessageSatuConnect, sendBulkWhatsAppMessage as sendBulkWhatsAppMessageSatuConnect } from '@/services/whatsapp';
import { revalidatePath } from 'next/cache';
import { getPrograms } from '@/app/actions/programs';
import { getMembers } from '@/app/actions/members';

export async function sendTestMessage(phoneNumber: string, message: string) {
    try {
        const result = await sendWhatsAppMessageSatuConnect(phoneNumber, message);
        if (!result.success) {
            throw new Error(result.error || 'Unknown error from SatuConnect');
        }
        return { success: true };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("[sendTestMessage Error]", errorMessage);
        throw new Error(errorMessage);
    }
}

export async function sendBulkTestMessage(phoneNumbers: string, message: string) {
    try {
        const numbersArray = phoneNumbers.split(',').map(num => num.trim()).filter(Boolean);
        if (numbersArray.length === 0) {
            throw new Error('Tidak ada nomor telepon yang valid.');
        }
        await sendBulkWhatsAppMessageSatuConnect(numbersArray, message);
        return { success: true, count: numbersArray.length };
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        console.error("[sendBulkTestMessage Error]", errorMessage);
        throw new Error(errorMessage);
    }
}


export async function getLatestProgramsText(): Promise<string> {
    try {
        const programs = await getPrograms();
        const activePrograms = programs
            .filter(p => p.endDate && new Date(p.endDate) > new Date())
            .slice(0, 3);

        if (activePrograms.length === 0) {
            return "Saat ini belum ada program yang sedang dibuka. Pantau terus aplikasi kami untuk informasi terbaru!";
        }

        let message = "Berikut adalah program yang sedang dibuka:\n\n";
        activePrograms.forEach(p => {
            message += `*${p.title}*\nBatas Pendaftaran: ${p.endDate ? new Date(p.endDate).toLocaleDateString('id-ID') : 'N/A'}\nInfo: ${process.env.NEXT_PUBLIC_BASE_URL}/programs/${p.id}\n\n`;
        });

        return message;
    } catch (error) {
        console.error("[getLatestProgramsText Error]", error);
        return "Mohon maaf, terjadi kesalahan saat mengambil data program terbaru.";
    }
}

async function getVerifiedMembers(limitCount?: number): Promise<{ phoneNumber: string }[]> {
    const usersRef = collection(db, 'users');
    const constraints = [
        where('verificationStatus', '==', 'permanent'),
        where('waVerified', '==', true),
        orderBy('createdAt', 'desc')
    ];
    if (limitCount) {
        constraints.push(limit(limitCount));
    }
    
    const q = query(usersRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const users: { phoneNumber: string }[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.waNumber) {
            users.push({ phoneNumber: data.waNumber });
        }
    });
    return users;
}

export async function getVerifiedMemberCount(): Promise<number> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('verificationStatus', '==', 'permanent'), where('waVerified', '==', true));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}


export async function sendGroupJoinReminders(): Promise<{ success: boolean, count: number }> {
    const users = await getVerifiedMembers(100);
    if (users.length === 0) {
        return { success: true, count: 0 };
    }

    const phoneNumbers = users.map(u => u.phoneNumber.replace(/^\+/, ''));
    const message = "Halo Anggota Garda Lestari!\n\nKami mengundang Anda untuk bergabung ke dalam grup WhatsApp resmi kami untuk mendapatkan informasi terbaru, berdiskusi, dan berkolaborasi.\n\nSilakan klik tautan di bawah ini untuk bergabung:\nhttps://chat.whatsapp.com/LD72HX9daPxD9CxknhTmFL?mode=ems_copy_t\n\nTerima kasih atas partisipasi Anda!";
    
    const result = await sendBulkWhatsAppMessageSatuConnect(phoneNumbers, message);

    if (result.success) {
        return { success: true, count: result.data?.sentCount || phoneNumbers.length };
    } else {
        throw new Error(result.error || 'Gagal mengirim pesan pengingat massal.');
    }
}


export async function sendVerificationReminders(): Promise<{ success: boolean, count: number }> {
    const q = query(collection(db, 'users'), where('verificationStatus', 'in', ['unverified', 'temporary']));
    const querySnapshot = await getDocs(q);
    const users: { phoneNumber: string }[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.waNumber) {
            users.push({ phoneNumber: data.waNumber });
        }
    });

    if (users.length === 0) {
        return { success: true, count: 0 };
    }

    const phoneNumbers = users.map(u => u.phoneNumber.replace(/^\+/, ''));
    const message = "Halo! Kami dari Garda Lestari mengingatkan Anda untuk menyelesaikan proses verifikasi akun Anda. Buka aplikasi dan klik menu verifikasi di halaman profil untuk melanjutkan.";
    
    const result = await sendBulkWhatsAppMessageSatuConnect(phoneNumbers, message);

    if (result.success) {
        return { success: true, count: result.data?.sentCount || phoneNumbers.length };
    } else {
        throw new Error(result.error || 'Gagal mengirim pesan pengingat massal.');
    }
}

export async function getUnverifiedUserCount(): Promise<number> {
    const q = query(collection(db, 'users'), where('verificationStatus', 'in', ['unverified', 'temporary']));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}
