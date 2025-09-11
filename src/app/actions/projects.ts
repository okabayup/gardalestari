
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
  runTransaction,
  increment,
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

// Get all columns for a project
export async function getColumnsForProject(projectId: string): Promise<ProjectColumn[]> {
  const columnsRef = collection(db, 'projects', projectId, 'columns');
  // Note: We're not ordering columns for now. Could add an 'order' field later.
  const snapshot = await getDocs(columnsRef);
  // A bit of a hack to ensure default order until an 'order' field is added
  const sortedDocs = snapshot.docs.sort((a, b) => {
    const order = ['Rencana', 'Dikerjakan', 'Tinjauan', 'Selesai'];
    return order.indexOf(a.data().title) - order.indexOf(b.data().title);
  });
  return sortedDocs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectColumn));
}

// Get all tasks for a project
export async function getTasksForProject(projectId: string): Promise<ProjectTask[]> {
  const tasksRef = collection(db, 'projects', projectId, 'tasks');
  const snapshot = await getDocs(tasksRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectTask));
}

// Create a new task in a project and add it to a column
export async function createTask(projectId: string, columnId: string, title: string): Promise<ProjectTask> {
    const projectRef = doc(db, 'projects', projectId);
    const tasksCollectionRef = collection(projectRef, 'tasks');
    const columnRef = doc(projectRef, 'columns', columnId);

    const newTask: Omit<ProjectTask, 'id'> = {
        title: title,
        description: '',
        assigneeIds: [],
    };

    try {
        const taskDocRef = await addDoc(tasksCollectionRef, newTask);
        
        await runTransaction(db, async (transaction) => {
            const columnDoc = await transaction.get(columnRef);
            if (!columnDoc.exists()) {
                throw new Error("Kolom tidak ditemukan");
            }
            const columnData = columnDoc.data();
            const newTaskIds = [...columnData.taskIds, taskDocRef.id];
            transaction.update(columnRef, { taskIds: newTaskIds });
            transaction.update(projectRef, { taskCount: increment(1) });
        });

        revalidatePath(`/panel/projects/${projectId}`);
        return { id: taskDocRef.id, ...newTask };
    } catch (e) {
        console.error("Error creating task: ", e);
        throw new Error("Gagal membuat tugas baru.");
    }
}

// Update task's column
export async function updateTaskColumn(
  projectId: string,
  taskId: string,
  sourceColumnId: string,
  destColumnId: string,
  newIndex: number
) {
    const sourceColRef = doc(db, 'projects', projectId, 'columns', sourceColumnId);
    const destColRef = doc(db, 'projects', projectId, 'columns', destColumnId);

    try {
        await runTransaction(db, async (transaction) => {
            const sourceDoc = await transaction.get(sourceColRef);
            const destDoc = await transaction.get(destColRef);

            if (!sourceDoc.exists() || !destDoc.exists()) {
                throw new Error("Kolom tidak ditemukan");
            }
            
            const sourceData = sourceDoc.data() as ProjectColumn;
            const destData = destDoc.data() as ProjectColumn;

            const newSourceTaskIds = sourceData.taskIds.filter(id => id !== taskId);

            if (sourceColumnId === destColumnId) {
                // Moving within the same column
                newSourceTaskIds.splice(newIndex, 0, taskId);
                transaction.update(sourceColRef, { taskIds: newSourceTaskIds });
            } else {
                // Moving to a different column
                const newDestTaskIds = [...destData.taskIds];
                newDestTaskIds.splice(newIndex, 0, taskId);
                transaction.update(sourceColRef, { taskIds: newSourceTaskIds });
                transaction.update(destColRef, { taskIds: newDestTaskIds });
            }
        });
        revalidatePath(`/panel/projects/${projectId}`);
    } catch(e) {
        console.error("Transaction failed: ", e);
        throw new Error("Gagal memindahkan tugas.");
    }
}
