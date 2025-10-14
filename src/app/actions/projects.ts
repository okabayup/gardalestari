

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
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getUserByUid } from '@/app/actions/user';
import { getWhatsappTemplate } from '@/app/actions/settings';
import type { Project, ProjectColumn, ProjectTask, CommentWithAuthor, IdeaAuthor } from '@/lib/definitions';
import { sendNotification } from './notifications';

const projectsCollection = collection(db, 'projects');
const usersCollection = collection(db, 'users');

// Get all projects
export async function getProjects(): Promise<Project[]> {
    try {
        const q = query(projectsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Project;
        });
    } catch (error) {
        console.error("Error getting projects:", error);
        throw new Error("Gagal mengambil data proyek.");
    }
}

// Get projects for a specific user (where they are a member)
export async function getProjectsForUser(userId: string): Promise<Project[]> {
    try {
        const q = query(projectsCollection, where('teamIds', 'array-contains', userId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                 id: doc.id, 
                 ...data,
                 createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Project
        });
    } catch (error) {
        console.error("Error getting projects for user:", error);
        throw new Error("Gagal mengambil data proyek pengguna.");
    }
}


// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
    try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Project;
        }
        return null;
    } catch (error) {
        console.error("Error getting project by ID:", error);
        throw new Error("Gagal mengambil data proyek.");
    }
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
  try {
    const columnsRef = collection(db, 'projects', projectId, 'columns');
    const snapshot = await getDocs(columnsRef);
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const order = ['Rencana', 'Dikerjakan', 'Tinjauan', 'Selesai'];
      return order.indexOf(a.data().title) - order.indexOf(b.data().title);
    });
    return sortedDocs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectColumn));
  } catch (error) {
      console.error("Error getting columns for project:", error);
      throw new Error("Gagal mengambil data kolom proyek.");
  }
}

// Get all tasks for a project
export async function getTasksForProject(projectId: string): Promise<ProjectTask[]> {
  try {
    const tasksRef = collection(db, 'projects', projectId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        let dueDateString: string | undefined = undefined;
          if (data.dueDate) {
              if (typeof data.dueDate.toDate === 'function') {
              dueDateString = data.dueDate.toDate().toISOString();
              } else if (typeof data.dueDate === 'string') {
              dueDateString = data.dueDate;
              }
          }
        return {
            id: doc.id,
            ...data,
            dueDate: dueDateString,
        } as ProjectTask;
    });
  } catch (error) {
      console.error("Error getting tasks for project:", error);
      throw new Error("Gagal mengambil data tugas proyek.");
  }
}


// Create a new task in a project and add it to a column
export async function createTask(projectId: string, columnId: string, title: string): Promise<ProjectTask> {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const tasksCollectionRef = collection(projectRef, 'tasks');
        const columnRef = doc(projectRef, 'columns', columnId);

        const newTaskData: Omit<ProjectTask, 'id' | 'dueDate'> = {
            title: title,
            description: '',
            assigneeIds: [],
            labels: [],
            commentCount: 0,
            checklist: [],
        };

        const taskDocRef = await addDoc(tasksCollectionRef, newTaskData);
        
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
        return { id: taskDocRef.id, ...newTaskData };
    } catch (e) {
        console.error("Error creating task: ", e);
        throw new Error("Gagal membuat tugas baru.");
    }
}

// Update task details
export async function updateTask(projectId: string, taskId: string, updates: Partial<Omit<ProjectTask, 'id'>>) {
    try {
        const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
        const currentTaskSnap = await getDoc(taskRef);
        if (!currentTaskSnap.exists()) throw new Error("Tugas tidak ditemukan");
        
        const currentTask = currentTaskSnap.data();
        
        const updatesForFirestore: { [key: string]: any } = { ...updates };
        if (updates.dueDate) {
            updatesForFirestore.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
        } else if (updates.dueDate === null) {
            updatesForFirestore.dueDate = null;
        }

        await updateDoc(taskRef, updatesForFirestore);

        if (updates.assigneeIds && currentTask.assigneeIds) {
            const newAssignees = updates.assigneeIds.filter(id => !currentTask.assigneeIds?.includes(id));
            if (newAssignees.length > 0) {
                const project = await getProjectById(projectId);
                const template = await getWhatsappTemplate('new_task_assigned');

                for (const assigneeId of newAssignees) {
                    const user = await getUserByUid(assigneeId);
                    if (user) {
                        if (template.isActive && user.waNumber) {
                            const message = template.message
                                .replace('{namaPengguna}', user.name)
                                .replace('{namaTugas}', updates.title || currentTask.title)
                                .replace('{namaProyek}', project?.title || 'tanpa nama');
                            await sendWhatsAppMessage(user.waNumber, message);
                        }
                        await sendNotification(
                            { 
                                title: 'Tugas Baru untuk Anda', 
                                body: `Anda ditugaskan pada tugas "${updates.title || currentTask.title}" di proyek "${project?.title || ''}".`,
                                link: `/panel/projects/${projectId}`
                            },
                            { type: 'users', userIds: [assigneeId] }
                        );
                    }
                }
            }
        }

        revalidatePath(`/panel/projects/${projectId}`);
    } catch (error) {
        console.error("Error updating task:", error);
        throw new Error("Gagal memperbarui tugas.");
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
    try {
        const sourceColRef = doc(db, 'projects', projectId, 'columns', sourceColumnId);
        const destColRef = doc(db, 'projects', projectId, 'columns', destColumnId);

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
                newSourceTaskIds.splice(newIndex, 0, taskId);
                transaction.update(sourceColRef, { taskIds: newSourceTaskIds });
            } else {
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

// Add/remove team members
export async function updateTeamMembers(projectId: string, teamIds: string[]) {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { teamIds });
        revalidatePath(`/panel/projects/${projectId}`);
    } catch (error) {
        console.error("Error updating team members:", error);
        throw new Error("Gagal memperbarui anggota tim.");
    }
}

// Add a comment to a task
export async function addTaskComment(projectId: string, taskId: string, authorId: string, text: string) {
    try {
        if (!authorId) throw new Error("Pengguna tidak terautentikasi.");
        if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

        const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
        const commentsCollection = collection(taskRef, 'comments');
        
        await runTransaction(db, async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists()) throw new Error("Tugas tidak ditemukan.");

            const newCommentRef = doc(commentsCollection);
            transaction.set(newCommentRef, { authorId, text, createdAt: Timestamp.now() });
            transaction.update(taskRef, { commentCount: increment(1) });
        });
        
        revalidatePath(`/panel/projects/${projectId}`);
    } catch (error) {
        console.error("Error adding task comment:", error);
        throw new Error("Gagal menambahkan komentar.");
    }
}


// Get comments for a task
export async function getTaskComments(projectId: string, taskId: string): Promise<CommentWithAuthor[]> {
    try {
        const commentsCollection = collection(db, 'projects', projectId, 'tasks', taskId, 'comments');
        const q = query(commentsCollection, orderBy('createdAt', 'asc'));

        const commentsSnapshot = await getDocs(q);
        const comments: CommentWithAuthor[] = [];

        for (const commentDoc of commentsSnapshot.docs) {
            const commentData = commentDoc.data();
            const authorDoc = await getDoc(doc(usersCollection, commentData.authorId));

            if (authorDoc.exists()) {
                const authorData = authorDoc.data();
                comments.push({
                    id: commentDoc.id,
                    text: commentData.text,
                    createdAt: (commentData.createdAt as Timestamp).toDate().toISOString(),
                    author: {
                        id: commentData.authorId,
                        name: authorData.fullName || 'User',
                        username: authorData.username || 'user',
                        avatarUrl: authorData.avatarUrl || '',
                    },
                });
            }
        }
        return comments;
    } catch (error) {
        console.error("Error getting task comments:", error);
        throw new Error("Gagal memuat komentar tugas.");
    }
}

    