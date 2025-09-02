
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: Timestamp;
  location: string;
  imageUrl: string;
  imageHint: string;
}

const eventsCollection = collection(db, 'events');

// Get all events, ordered by date
export async function getEvents(): Promise<Event[]> {
  const q = query(eventsCollection, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  const events: Event[] = [];
  snapshot.forEach(doc => {
    events.push({ id: doc.id, ...doc.data() } as Event);
  });
  return events;
}

// Get a single event by ID
export async function getEvent(id: string): Promise<Event | null> {
    const eventDoc = doc(db, 'events', id);
    const docSnap = await getDoc(eventDoc);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null;
}

// Create a new event
export async function createEvent(event: Omit<Event, 'id'>) {
  try {
    await addDoc(eventsCollection, event);
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat acara.");
  }
}

// Update an existing event
export async function updateEvent(id: string, event: Partial<Event>) {
  try {
    const eventDoc = doc(db, 'events', id);
    await updateDoc(eventDoc, event);
    revalidatePath('/panel/events');
    revalidatePath(`/panel/events/edit/${id}`);
    revalidatePath('/events');
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Gagal memperbarui acara.");
  }
}

// Delete an event
export async function deleteEvent(id: string) {
  try {
    const eventDoc = doc(db, 'events', id);
    await deleteDoc(eventDoc);
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus acara.");
  }
}
