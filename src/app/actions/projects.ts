
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface Project {
    id: string;
    title: string;
    description: string;
    managerId: string;
    teamIds: string[];
    createdAt: Timestamp;
    taskCount: number;
}

export interface ProjectColumn {
    id: string;
    title: string;
    taskIds: string[];
}

export interface ProjectTask {
    id: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    dueDate?: Timestamp;
}

const projectsCollection = collection(db, 'projects');

// Get all projects
export async function getProjects(): Promise<Project[]> {
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
}

// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
    }
    return null;
}

// Create a new project
export async function createProject(
    data: Omit<Project, 'id' | 'createdAt' | 'taskCount' | 'teamIds' | 'managerId'>,
    managerId: string,
): Promise<string> {
    try {
        const defaultColumns: Omit<ProjectColumn, 'id'>[] = [
            { title: 'Rencana', taskIds: [] },
            { title: 'Dikerjakan', taskIds: [] },
            { title: 'Tinjauan', taskIds: [] },
            { title: 'Selesai', taskIds: [] },
        ];

        const projectData = {
            ...data,
            managerId,
            teamIds: [managerId],
            createdAt: Timestamp.now(),
            taskCount: 0,
        };

        const projectDocRef = await addDoc(projectsCollection, projectData);
        
        // Create default columns in a subcollection
        const columnsCollection = collection(db, 'projects', projectDocRef.id, 'columns');
        const batch = writeBatch(db);
        defaultColumns.forEach(column => {
            const columnRef = doc(columnsCollection);
            batch.set(columnRef, column);
        });
        await batch.commit();

        revalidatePath('/panel/projects');
        return projectDocRef.id;

    } catch (error) {
        console.error("Error creating project:", error);
        throw new Error("Gagal membuat proyek baru.");
    }
}
