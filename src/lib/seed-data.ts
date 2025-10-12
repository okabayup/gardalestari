

'use server';

import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';
import { initialPositions, initialDocumentTypes } from './definitions';

const ideaCategoriesCollection = collection(db, 'ideaCategories');
const beritaCategoriesCollection = collection(db, 'beritaCategories');
const documentCategoriesCollection = collection(db, 'documentCategories');
const docTypesCollection = collection(db, 'documentTypes');
const programTagsCollection = collection(db, 'programTags');
const positionsCollection = collection(db, 'positions');

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
 * @param initialData Array of objects to be added as documents.
 * @param collectionName Name of the collection for logging purposes.
 */
async function seedCollection(collRef: any, initialData: any[], collectionName: string) {
    try {
        const q = query(collRef, limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No documents found in '${collectionName}'. Seeding initial data...`);
            const batchPromises = initialData.map(item => {
                if (typeof item === 'string') {
                    return addDoc(collRef, { name: item });
                }
                return addDoc(collRef, item);
            });
            await Promise.all(batchPromises);
            console.log(`Successfully seeded '${collectionName}'.`);
        } else {
             // console.log(`Collection '${collectionName}' already contains data. Skipping seed.`);
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
    await seedCollection(positionsCollection, initialPositions.map(name => ({ name, permissions: [] })), 'positions');
    await seedCollection(docTypesCollection, initialDocumentTypes, 'documentTypes');
}
