'use server';

import { collection, addDoc, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from './firebase';
import { initialAccounts, initialDocumentTypes, initialDocumentCategories } from './definitions';
import { createMeetingShortLink } from '@/app/actions/shortlinks';

const ideaCategoriesCollection = collection(db, 'ideaCategories');
const beritaCategoriesCollection = collection(db, 'beritaCategories');
const documentCategoriesCollection = collection(db, 'documentCategories');
const docTypesCollection = collection(db, 'documentTypes');
const programTagsCollection = collection(db, 'programTags');
const accountsCollection = collection(db, 'accounts');

const initialIdeaCategories = [
    'Agrikultur', 'Maritim', 'Kehutanan', 'Teknologi', 'Pemasaran', 'Komunitas', 'Lainnya'
];

const initialBeritaCategories = [
    'Pertanian', 'Perikanan', 'Kehutanan', 'Konservasi', 'Teknologi', 'Komunitas', 'Acara'
];

const initialProgramTags = [
    'Pelatihan', 'Kompetisi', 'Pendanaan', 'Relawan', 'Magang', 'Riset', 'Beasiswa'
];

/**
 * Ensures all items in initialData exist in the collection.
 * @param collRef Firestore collection reference.
 * @param initialData Array of objects or strings to be added.
 * @param collectionName Name for logging.
 * @param uniqueKey The key used to check existence (default 'name').
 */
async function syncCollection(collRef: any, initialData: any[], collectionName: string, uniqueKey: string = 'name') {
    try {
        console.log(`Checking '${collectionName}' consistency...`);
        for (const item of initialData) {
            const itemName = typeof item === 'string' ? item : item[uniqueKey];
            const q = query(collRef, where(uniqueKey, '==', itemName), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log(`Adding missing item '${itemName}' to '${collectionName}'`);
                await addDoc(collRef, typeof item === 'string' ? { [uniqueKey]: item } : item);
            }
        }
    } catch (error) {
        console.error(`Error syncing '${collectionName}':`, error);
    }
}

export async function seedInitialData() {
    // Sync all lookup collections
    await syncCollection(ideaCategoriesCollection, initialIdeaCategories, 'ideaCategories');
    await syncCollection(beritaCategoriesCollection, initialBeritaCategories, 'beritaCategories');
    await syncCollection(documentCategoriesCollection, initialDocumentCategories, 'documentCategories');
    await syncCollection(docTypesCollection, initialDocumentTypes, 'documentTypes');
    await syncCollection(programTagsCollection, initialProgramTags, 'programTags');
    
    // For accounts, we use 'code' as the unique key
    await syncCollection(accountsCollection, initialAccounts, 'accounts', 'code');
    
    await createMeetingShortLink();
}
