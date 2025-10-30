

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, Timestamp, query, orderBy, getDoc, where, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { AppTester, AppTesterApp } from '@/lib/definitions';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { createShortLink } from '@/app/actions/shortlinks';
import { sendEmail } from '@/services/email';

const appTestersCollection = collection(db, 'appTesters');
const appTesterAppsCollection = collection(db, 'appTesterApps');

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
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: (data.submittedAt as Timestamp).toDate().toISOString(),
        } as AppTester;
    });
}

export async function approveTesterApplication(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'appTesters', id);
        const appSnap = await getDoc(docRef);
        if (!appSnap.exists()) {
            throw new Error("Aplikasi tidak ditemukan.");
        }
        const application = appSnap.data() as AppTester;
        
        const appToTest = await getAppTesterApp(application.appId);
        if (!appToTest) {
            throw new Error("Aplikasi yang diuji tidak ditemukan.");
        }
        
        const template = await getWhatsappTemplate('app_tester_approved');
        if (template.isActive && application.waNumber) {
            const message = template.message
                .replace('{namaPengguna}', application.name)
                .replace('{namaAplikasi}', appToTest.name)
                .replace('{linkPengujian}', appToTest.testingLink);
            await sendWhatsAppMessage(application.waNumber, message);
        }
        
        await sendEmail({
            to: application.email,
            subject: `Persetujuan Penguji Aplikasi: ${appToTest.name}`,
            text: `Selamat, ${application.name}! Anda telah disetujui sebagai penguji untuk aplikasi "${appToTest.name}". Silakan klik tautan berikut untuk bergabung dalam program pengujian: ${appToTest.testingLink}`
        });

        await updateDoc(docRef, {
            status: 'approved',
            processedAt: Timestamp.now(),
        });
        
        revalidatePath('/panel/app-testers');

    } catch (error) {
        console.error("Error approving tester:", error);
        throw new Error(`Gagal menyetujui tester: ${(error as Error).message}`);
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


// --- App Tester App Management ---
export async function createAppTesterApp(data: Omit<AppTesterApp, 'id' | 'createdAt' | 'shortlinkSlug'>) {
    const slug = `uji-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;
    const q = query(appTesterAppsCollection, where('shortlinkSlug', '==', slug));
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error(`Aplikasi dengan nama serupa sudah ada (slug: ${slug}).`);
    }

    const docRef = await addDoc(appTesterAppsCollection, {
        ...data,
        shortlinkSlug: slug,
        createdAt: Timestamp.now(),
    });

    await createShortLink({
        title: `Pendaftaran Uji Aplikasi: ${data.name}`,
        slug: slug,
        longUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/uji-aplikasi/${slug}`,
        type: 'app_tester',
        relatedId: docRef.id,
    });
    
    revalidatePath('/panel/app-testers/apps');
}

export async function getAppTesterApps(): Promise<AppTesterApp[]> {
    const q = query(appTesterAppsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({id: d.id, ...d.data()} as AppTesterApp));
}

export async function getAppTesterApp(id: string): Promise<AppTesterApp | null> {
    const docSnap = await getDoc(doc(appTesterAppsCollection, id));
    return docSnap.exists() ? {id: docSnap.id, ...docSnap.data()} as AppTesterApp : null;
}

export async function getAppTesterAppBySlug(slug: string): Promise<AppTesterApp | null> {
    const q = query(appTesterAppsCollection, where('shortlinkSlug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {id: doc.id, ...doc.data()} as AppTesterApp;
}

export async function deleteAppTesterApp(id: string) {
    // TODO: Also delete the shortlink
    await deleteDoc(doc(appTesterAppsCollection, id));
    revalidatePath('/panel/app-testers/apps');
}
