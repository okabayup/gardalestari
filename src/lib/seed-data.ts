
'use server';

import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const ideaCategoriesCollection = collection(db, 'ideaCategories');
const beritaCategoriesCollection = collection(db, 'beritaCategories');
const documentCategoriesCollection = collection(db, 'documentCategories');
const programTagsCollection = collection(db, 'programTags');

const initialIdeaCategories = [
    'Agrikultur', 'Maritim', 'Kehutanan', 'Teknologi', 'Pemasaran', 'Komunitas', 'Lainnya'
];

const initialBeritaCategories = [
    'Pertanian', 'Perikanan', 'Kehutanan', 'Konservasi', 'Teknologi', 'Komunitas', 'Acara'
];

const initialDocumentCategories = [
    'Surat Keterangan', 'Surat Permohonan', 'Surat Undangan', 'Laporan', 'Nota Kesepahaman'
];

const initialProgramTags = [
    'Pelatihan', 'Kompetisi', 'Pendanaan', 'Relawan', 'Magang', 'Riset', 'Beasiswa'
];


/**
 * Seeds a specific collection with initial data if it's empty.
 * @param collRef Firestore collection reference.
 * @param initialNames Array of strings to be added as documents.
 * @param collectionName Name of the collection for logging purposes.
 */
async function seedCollection(collRef: any, initialNames: string[], collectionName: string) {
    try {
        const q = query(collRef, limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No documents found in '${collectionName}'. Seeding initial data...`);
            const batchPromises = initialNames.map(name => addDoc(collRef, { name }));
            await Promise.all(batchPromises);
            console.log(`Successfully seeded '${collectionName}'.`);
        } else {
             console.log(`Collection '${collectionName}' already contains data. Skipping seed.`);
        }
    } catch (error) {
        console.error(`Error seeding '${collectionName}':`, error);
    }
}

// This function checks if categories exist and seeds them if the collection is empty.
export async function seedInitialData() {
    await seedCollection(ideaCategoriesCollection, initialIdeaCategories, 'ideaCategories');
    await seedCollection(beritaCategoriesCollection, initialBeritaCategories, 'beritaCategories');
    await seedCollection(documentCategoriesCollection, initialDocumentCategories, 'documentCategories');
    await seedCollection(programTagsCollection, initialProgramTags, 'programTags');
}
