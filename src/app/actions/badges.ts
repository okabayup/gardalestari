

'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, Timestamp, orderBy, query, arrayUnion, arrayRemove, where, getCountFromServer } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Badge, BadgeMetric, Mission } from '@/lib/definitions';
import { getUserByUid } from '@/app/actions/user';
import { awardPointsForAction } from './points';

const badgesCollection = collection(db, 'badges');
const missionsCollection = collection(db, 'missions');
const usersCollection = collection(db, 'users');

export async function getBadges(): Promise<Badge[]> {
  try {
    const q = query(badgesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
  } catch (error) {
    console.error("[getBadges Error]", error);
    throw new Error("Gagal mengambil data lencana.");
  }
}

export async function createBadge(data: Omit<Badge, 'id' | 'createdAt'>) {
  try {
    await addDoc(badgesCollection, { ...data, createdAt: Timestamp.now() });
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error("[createBadge Error]", error);
    throw new Error(`Gagal membuat lencana: ${(error as Error).message}`);
  }
}

export async function updateBadge(id: string, data: Partial<Omit<Badge, 'id' | 'createdAt'>>) {
    try {
        const docRef = doc(db, 'badges', id);
        await updateDoc(docRef, data);
        revalidatePath('/panel/badges');
    } catch (error) {
        console.error("[updateBadge Error]", error);
        throw new Error(`Gagal memperbarui lencana: ${(error as Error).message}`);
    }
}

export async function deleteBadge(id: string) {
  try {
    await deleteDoc(doc(db, 'badges', id));
    revalidatePath('/panel/badges');
  } catch (error) {
    console.error("[deleteBadge Error]", error);
    throw new Error("Gagal menghapus lencana.");
  }
}

export async function assignBadgeToUser(userId: string, badgeId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            assignedBadges: arrayUnion(badgeId)
        });
        revalidatePath(`/profile/me`);
        revalidatePath(`/profile/${userId}`);
    } catch(error) {
        console.error("[assignBadgeToUser Error]", error);
        throw new Error("Gagal memberikan lencana.");
    }
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            assignedBadges: arrayRemove(badgeId)
        });
         revalidatePath(`/profile/me`);
         revalidatePath(`/profile/${userId}`);
    } catch(error) {
        console.error("[removeBadgeFromUser Error]", error);
        throw new Error("Gagal mencabut lencana.");
    }
}


// --- Automatic Badge & Mission Awarding Logic ---

async function getUserMetric(userId: string, metric: BadgeMetric): Promise<number> {
    const userRef = doc(usersCollection, userId);
    
    switch(metric) {
        case 'post_count':
            const postQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
            return (await getCountFromServer(postQuery)).data().count;
        case 'idea_count':
             const ideaQuery = query(collection(db, 'ideas'), where('authorId', '==', userId));
            return (await getCountFromServer(ideaQuery)).data().count;
        case 'achievement_added':
            const achievementQuery = query(collection(db, 'achievements'), where('userId', '==', userId));
            return (await getCountFromServer(achievementQuery)).data().count;
        case 'vote_casted':
            // This requires querying all voting topics, which is inefficient.
            // For now, we'll return 0. A better implementation would be a counter on the user document.
            return 0;
        case 'comment_count':
            // This is more complex and would require aggregating across posts/ideas.
            // For now, we'll return 0. A more scalable solution (e.g., Cloud Functions) is needed.
            return 0; 
        case 'upvote_count':
            // Same as above, requires aggregation.
            return 0;
        case 'project_completed':
            // Needs logic based on your project management module.
            return 0;
        default:
            return 0;
    }
}

export async function checkAndAwardBadges(userId: string, triggeredMetric: BadgeMetric) {
    console.log(`[checkAndAwardBadges] Starting check for user: ${userId} on metric: ${triggeredMetric}`);
    try {
        const user = await getUserByUid(userId);
        if (!user) throw new Error("User not found");

        const userValue = await getUserMetric(userId, triggeredMetric);
        
        // --- Badge Awarding ---
        const badgesSnapshot = await getDocs(query(badgesCollection, where('type', '==', 'auto'), where('criteria.metric', '==', triggeredMetric)));
        const autoBadges = badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
        
        const userAssignedBadges = user.assignedBadges || [];

        for (const badge of autoBadges) {
            if (!badge.id || !badge.criteria) continue;
            if (userAssignedBadges.includes(badge.id)) continue; // Already has the badge

            if (userValue >= badge.criteria.value) {
                console.log(`[checkAndAwardBadges] Awarding badge '${badge.name}' to user ${userId} for metric '${badge.criteria.metric}' (${userValue} >= ${badge.criteria.value})`);
                await assignBadgeToUser(userId, badge.id);
            }
        }
        
        // --- Mission Point Awarding ---
        const missionsSnapshot = await getDocs(query(missionsCollection, where('type', '==', 'auto'), where('criteria.metric', '==', triggeredMetric)));
        const autoMissions = missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));

        for (const mission of autoMissions) {
            if (!mission.id || !mission.criteria || !mission.points) continue;
            
            // Check if the current user value is a multiple of the mission's target value
            if (userValue > 0 && userValue % mission.criteria.value === 0) {
                 console.log(`[checkAndAwardBadges] Awarding points for mission '${mission.name}' to user ${userId} for metric '${mission.criteria.metric}' (value ${userValue} is multiple of ${mission.criteria.value})`);
                 await awardPointsForAction(mission.id, userId);
            }
        }

    } catch (error) {
        console.error(`[checkAndAwardBadges] Error processing for user ${userId}:`, error);
        // We don't re-throw here to not block the main operation (e.g., creating a post).
    }
}
