
'use server';

import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const ideaCategoriesCollection = collection(db, 'ideaCategories');

const initialIdeaCategories = [
    'Agrikultur', 'Maritim', 'Kehutanan', 'Teknologi', 'Pemasaran', 'Komunitas', 'Lainnya'
];

// This function checks if categories exist and seeds them if the collection is empty.
export async function seedInitialData() {
  try {
    const q = query(ideaCategoriesCollection, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No idea categories found. Seeding initial data...');
      const batchPromises = initialIdeaCategories.map(name => addDoc(ideaCategoriesCollection, { name }));
      await Promise.all(batchPromises);
      console.log('Successfully seeded idea categories.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
