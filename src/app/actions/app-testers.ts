
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { AppTester } from '@/lib/definitions';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendWhatsAppMessage } from '@/services/whatsapp';

const appTestersCollection = collection(db, 'appTesters');

export async function submitTesterApplication(data: Omit<AppTester, 'id' | 'status' | 'submittedAt'>): Promise<void> {
    try {
        await addDoc(appTestersCollection, {
            ...data,
            status: 'pending',
            submittedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error submitting tester application:", error);
        throw new Error("Gagal mengirimkan aplikasi Anda.");
    }
}

export async function getTesterApplications(): Promise<AppTester[]> {
    const q = query(appTestersCollection, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AppTester));
}

export async function approveTesterApplication(id: string, email: string): Promise<void> {
    try {
        const docRef = doc(db, 'appTesters', id);
        
        // You would manually add the email to the Play Console here
        // This action just marks it as approved and sends the notification.
        
        const template = await getWhatsappTemplate('app_tester_approved');
        if (template.isActive) {
            const playStoreLink = 'https://play.google.com/apps/testing/org.gardalestari.twa'; // Replace with your actual testing link
            const message = template.message.replace('{linkPengujian}', playStoreLink);

            // Assuming user's phone number is part of the application data, but it is not.
            // This would require fetching the user by email or having phone number in the form.
            // For now, we'll log a warning.
            console.warn(`Need to implement a way to get phone number for tester with email: ${email} to send WA notification.`);
            // await sendWhatsAppMessage(testerPhoneNumber, message);
        }

        await updateDoc(docRef, {
            status: 'approved',
            processedAt: Timestamp.now(),
        });
        
        revalidatePath('/panel/app-testers');

    } catch (error) {
        console.error("Error approving tester:", error);
        throw new Error("Gagal menyetujui tester.");
    }
}

export async function rejectTesterApplication(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'appTesters', id);
        await updateDoc(docRef, {
            status: 'rejected',
            processedAt: Timestamp.now(),
        });
        revalidatePath('/panel/app-testers');
    } catch (error) {
        console.error("Error rejecting tester:", error);
        throw new Error("Gagal menolak tester.");
    }
}
