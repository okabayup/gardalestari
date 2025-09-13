
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Event } from '@/lib/definitions';

const eventsCollection = collection(db, 'events');

// === Public Functions for AI Tool ===

/**
 * Searches events based on a query.
 * To be used by an AI tool.
 * @param searchQuery The keywords to search for.
 * @returns A list of relevant events.
 */
export async function searchEvents(searchQuery: string): Promise<Partial<Event>[]> {
    const q = query(
        eventsCollection,
        orderBy('date', 'desc'),
        limit(10)
    );

    const snapshot = await getDocs(q);
    const allEntries: Event[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

    const searchTerms = searchQuery.toLowerCase().split(' ');
    const results = allEntries.filter(entry => {
        const searchableText = `${entry.title} ${entry.description} ${entry.location}`.toLowerCase();
        return searchTerms.some(term => searchableText.includes(term));
    }).slice(0, 5);

    return results.map(entry => ({
        id: entry.id,
        title: entry.title,
        date: entry.date,
        location: entry.location,
    }));
}


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
export async function createEvent(event: Omit<Event, 'id'>, attachmentFile?: File) {
  try {
    const eventData = { ...event };
    if (attachmentFile) {
        const attachmentRef = ref(storage, `event_attachments/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        eventData.attachmentUrl = await getDownloadURL(attachmentRef);
        eventData.attachmentName = attachmentFile.name;
    }
    await addDoc(eventsCollection, eventData);
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat acara.");
  }
}

// Update an existing event
export async function updateEvent(id: string, event: Partial<Event>, attachmentFile?: File) {
  try {
    const eventDoc = doc(db, 'events', id);
    const eventData: Partial<Event> = { ...event };

    if (attachmentFile) {
        const currentEvent = await getEvent(id);
        if (currentEvent?.attachmentUrl) {
            try {
                const oldAttachmentRef = ref(storage, currentEvent.attachmentUrl);
                await deleteObject(oldAttachmentRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                     console.warn("Could not delete old attachment, it might not exist.", storageError);
                }
            }
        }
        const attachmentRef = ref(storage, `event_attachments/${Date.now()}_${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        eventData.attachmentUrl = await getDownloadURL(attachmentRef);
        eventData.attachmentName = attachmentFile.name;
    }
    
    await updateDoc(eventDoc, eventData);
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
    const eventToDelete = await getEvent(id);
    const eventDoc = doc(db, 'events', id);
    await deleteDoc(eventDoc);
     if (eventToDelete?.attachmentUrl) {
        try {
            const attachmentRef = ref(storage, eventToDelete.attachmentUrl);
            await deleteObject(attachmentRef);
        } catch (storageError: any) {
             if (storageError.code !== 'storage/object-not-found') {
                console.error("Could not delete attachment:", storageError);
             }
        }
    }
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus acara.");
  }
}
