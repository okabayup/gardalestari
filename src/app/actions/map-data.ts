
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { MapData } from '@/lib/definitions';

const mapDataCollection = collection(db, 'mapData');

// Get all map data points
export async function getMapData(): Promise<MapData[]> {
  const q = query(mapDataCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const data: MapData[] = [];
  snapshot.forEach(doc => {
    data.push({ id: doc.id, ...doc.data() } as MapData);
  });
  return data;
}

// Get a single map data point by ID
export async function getMapDataItem(id: string): Promise<MapData | null> {
    const docRef = doc(db, 'mapData', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MapData;
    }
    return null;
}

// Create a new map data point
export async function createMapData(data: Omit<MapData, 'id' | 'createdAt'>) {
  try {
    const dataToCreate = { 
        ...data,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        budget: data.budget ? Number(data.budget) : 0,
        disbursed: data.disbursed ? Number(data.disbursed) : 0,
        createdAt: Timestamp.now()
    };
    await addDoc(mapDataCollection, dataToCreate);
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error creating map data:", error);
    throw new Error("Gagal membuat data peta.");
  }
}

// Update an existing map data point
export async function updateMapData(id: string, data: Partial<Omit<MapData, 'id' | 'createdAt'>>) {
  try {
    const docRef = doc(db, 'mapData', id);
    const dataToUpdate: { [key: string]: any } = { ...data };

    if (data.latitude) dataToUpdate.latitude = Number(data.latitude);
    if (data.longitude) dataToUpdate.longitude = Number(data.longitude);
    if (data.budget) dataToUpdate.budget = Number(data.budget);
    if (data.disbursed) dataToUpdate.disbursed = Number(data.disbursed);

    await updateDoc(docRef, dataToUpdate);
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error updating map data:", error);
    throw new Error("Gagal memperbarui data peta.");
  }
}

// Delete a map data point
export async function deleteMapData(id: string) {
  try {
    await deleteDoc(doc(db, 'mapData', id));
    revalidatePath('/panel/map-data');
    revalidatePath('/map');
  } catch (error) {
    console.error("Error deleting map data:", error);
    throw new Error("Gagal menghapus data peta.");
  }
}
