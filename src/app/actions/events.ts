

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, limit, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import type { Event } from '@/lib/definitions';
import { generateImage } from '@/ai/flows/image-generate-flow';
import { getWhatsappTemplate } from './settings';
import { sendBulkWhatsAppMessage } from '@/services/whatsapp';
import { getMembers } from './members';

const eventsCollection = collection(db, 'events');

const toEvent = (doc: any): Event => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    } as Event;
};


// === Public Functions for AI Tool ===

/**
 * Searches events based on a query.
 * To be used by an AI tool.
 * @param searchQuery The keywords to search for.
 * @returns A list of relevant events.
 */
export async function searchEvents(searchQuery: string): Promise<Partial<Event>[]> {
    try {
        const q = query(
            eventsCollection,
            orderBy('startDate', 'desc'),
            limit(10)
        );

        const snapshot = await getDocs(q);
        const allEntries: Event[] = snapshot.docs.map(toEvent);

        const searchTerms = searchQuery.toLowerCase().split(' ');
        const results = allEntries.filter(entry => {
            const searchableText = `${entry.title} ${entry.description} ${entry.location}`.toLowerCase();
            return searchTerms.some(term => searchableText.includes(term));
        }).slice(0, 5);

        return results.map(entry => ({
            id: entry.id,
            title: entry.title,
            startDate: entry.startDate,
            endDate: entry.endDate,
            location: entry.location,
        }));
    } catch (error) {
        console.error("[searchEvents Error]", error);
        throw new Error("Gagal mencari acara.");
    }
}


// Get all events, ordered by date
export async function getEvents(): Promise<Event[]> {
  try {
    const q = query(eventsCollection, orderBy('startDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toEvent);
  } catch (error) {
      console.error("[getEvents Error]", error);
      throw new Error("Gagal mengambil data acara.");
  }
}

// Get a single event by ID
export async function getEvent(id: string): Promise<Event | null> {
    try {
        const eventDoc = doc(db, 'events', id);
        const docSnap = await getDoc(eventDoc);
        if (docSnap.exists()) {
            return toEvent(docSnap);
        }
        return null;
    } catch (error) {
        console.error("[getEvent Error]", error);
        throw new Error("Gagal mengambil data acara.");
    }
}

// Create a new event
export async function createEvent(formData: FormData) {
  try {
    const eventData = Object.fromEntries(formData.entries());
    
    const dataToCreate: { [key: string]: any } = {
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        location: eventData.location,
        visibility: eventData.visibility,
        submissionType: eventData.submissionType,
        applicationUrl: eventData.applicationUrl,
        formId: eventData.formId,
        startDate: Timestamp.fromDate(new Date(eventData.dateRangeFrom as string)),
        endDate: eventData.dateRangeTo ? Timestamp.fromDate(new Date(eventData.dateRangeTo as string)) : null,
        attendeeIds: [],
        createdAt: Timestamp.now(),
    };
    
    if (eventData.imageSource === 'upload' && eventData.imageFile instanceof File) {
        const imageRef = ref(storage, `event-images/${Date.now()}_${eventData.imageFile.name}`);
        await uploadBytes(imageRef, eventData.imageFile);
        dataToCreate.imageUrl = await getDownloadURL(imageRef);
    } else if (eventData.imageSource === 'ai' && typeof eventData.imageHint === 'string' && eventData.imageHint) {
        const result = await generateImage({ prompt: eventData.imageHint });
        if (result.imageUrl) {
            dataToCreate.imageUrl = result.imageUrl;
        }
    } else if (eventData.imageSource === 'url' && typeof eventData.imageUrl === 'string' && eventData.imageUrl) {
         dataToCreate.imageUrl = eventData.imageUrl;
    } else {
         dataToCreate.imageUrl = `https://picsum.photos/seed/${eventData.title}/600/400`;
    }

    if (eventData.attachment instanceof File && eventData.attachment.size > 0) {
      const attachmentRef = ref(storage, `event_attachments/${Date.now()}_${eventData.attachment.name}`);
      await uploadBytes(attachmentRef, eventData.attachment);
      dataToCreate.attachmentUrl = await getDownloadURL(attachmentRef);
      dataToCreate.attachmentName = eventData.attachment.name;
    }
    await addDoc(eventsCollection, dataToCreate);

    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("[createEvent Error]", error);
    throw new Error(`Gagal membuat acara: ${(error as Error).message}`);
  }
}

// Update an existing event
export async function updateEvent(id: string, formData: FormData) {
  try {
    const eventDoc = doc(db, 'events', id);
    const eventData = Object.fromEntries(formData.entries());

    const dataToUpdate: { [key: string]: any } = {
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        location: eventData.location,
        visibility: eventData.visibility,
        submissionType: eventData.submissionType,
        applicationUrl: eventData.applicationUrl,
        formId: eventData.formId,
        startDate: Timestamp.fromDate(new Date(eventData.dateRangeFrom as string)),
        endDate: eventData.dateRangeTo ? Timestamp.fromDate(new Date(eventData.dateRangeTo as string)) : null,
    };
    
    if (eventData.imageFile instanceof File && eventData.imageFile.size > 0) {
        const imageRef = ref(storage, `event-images/${Date.now()}_${eventData.imageFile.name}`);
        await uploadBytes(imageRef, eventData.imageFile);
        dataToUpdate.imageUrl = await getDownloadURL(imageRef);
    } else if (eventData.imageSource === 'ai' && typeof eventData.imageHint === 'string' && eventData.imageHint) {
         const result = await generateImage({ prompt: eventData.imageHint });
         if (result.imageUrl) dataToUpdate.imageUrl = result.imageUrl;
    } else if (eventData.imageSource === 'url' && typeof eventData.imageUrl === 'string' && eventData.imageUrl) {
         dataToUpdate.imageUrl = eventData.imageUrl;
    }

    if (eventData.attachment instanceof File && eventData.attachment.size > 0) {
        const currentEvent = await getEvent(id);
        if (currentEvent?.attachmentUrl) {
            try {
                const oldAttachmentRef = ref(storage, currentEvent.attachmentUrl);
                await deleteObject(oldAttachmentRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                     console.warn("[updateEvent Warn] Could not delete old attachment, it might not exist.", storageError);
                }
            }
        }
        const attachmentRef = ref(storage, `event_attachments/${Date.now()}_${eventData.attachment.name}`);
        await uploadBytes(attachmentRef, eventData.attachment);
        dataToUpdate.attachmentUrl = await getDownloadURL(attachmentRef);
        dataToUpdate.attachmentName = eventData.attachment.name;
    }
    
    await updateDoc(eventDoc, dataToUpdate);
    revalidatePath('/panel/events');
    revalidatePath(`/panel/events/edit/${id}`);
    revalidatePath('/events');
  } catch (error) {
    console.error("[updateEvent Error]", error);
    throw new Error(`Gagal memperbarui acara: ${(error as Error).message}`);
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
                console.error("[deleteEvent Error] Could not delete attachment:", storageError);
             }
        }
    }
     if (eventToDelete?.imageUrl && eventToDelete.imageUrl.includes('firebasestorage')) {
        try {
            const imageRef = ref(storage, eventToDelete.imageUrl);
            await deleteObject(imageRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.error("[deleteEvent Error] Could not delete image:", storageError);
            }
        }
    }
    revalidatePath('/panel/events');
    revalidatePath('/events');
  } catch (error) {
    console.error("[deleteEvent Error]", error);
    throw new Error("Gagal menghapus acara.");
  }
}

export async function markAttendance(eventId: string, userId: string, userName: string): Promise<{success: boolean, message: string}> {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
        return { success: false, message: 'Acara tidak ditemukan.' };
    }

    const eventData = eventDoc.data() as Event;
    
    if (eventData.attendeeIds?.some(attendee => attendee.userId === userId)) {
        return { success: true, message: 'Anda sudah tercatat hadir.' };
    }
    
    const newAttendee = { userId, userName, timestamp: Timestamp.now() };

    await updateDoc(eventRef, {
        attendeeIds: arrayUnion(newAttendee)
    });
    
    revalidatePath(`/events/${eventId}`);
    return { success: true, message: 'Kehadiran Anda berhasil dicatat!' };
}
