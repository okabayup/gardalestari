
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { MapDataset } from '@/lib/definitions';

const mapDatasetsCollection = collection(db, 'mapDatasets');

// Get all map datasets
export async function getMapDatasets(): Promise<MapDataset[]> {
  try {
    const q = query(mapDatasetsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data: MapDataset[] = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() } as MapDataset);
    });
    return data;
  } catch (error) {
    console.error("Error getting map datasets:", error);
    throw new Error("Gagal memuat dataset peta.");
  }
}

// Get a single map dataset by ID
export async function getMapDataset(id: string): Promise<MapDataset | null> {
    try {
        const docRef = doc(db, 'mapDatasets', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as MapDataset;
        }
        return null;
    } catch (error) {
        console.error("Error getting map dataset item:", error);
        throw new Error("Gagal mengambil item dataset peta.");
    }
}

// Create a new map dataset
export async function createMapDataset(data: Omit<MapDataset, 'id' | 'createdAt'>) {
  try {
    const dataToCreate = { 
        ...data,
        createdAt: Timestamp.now()
    };
    await addDoc(mapDatasetsCollection, dataToCreate);
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error creating map dataset:", error);
    throw new Error("Gagal membuat dataset peta.");
  }
}

// Update an existing map dataset
export async function updateMapDataset(id: string, data: Partial<Omit<MapDataset, 'id' | 'createdAt'>>) {
  try {
    const docRef = doc(db, 'mapDatasets', id);
    await updateDoc(docRef, data);
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error updating map dataset:", error);
    throw new Error("Gagal memperbarui dataset peta.");
  }
}

// Delete a map dataset
export async function deleteMapDataset(id: string) {
  try {
    await deleteDoc(doc(db, 'mapDatasets', id));
    revalidatePath('/panel/map-datasets');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error deleting map dataset:", error);
    throw new Error("Gagal menghapus dataset peta.");
  }
}
