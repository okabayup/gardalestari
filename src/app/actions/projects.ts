'use server';

import { revalidatePath } from 'next/cache';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getUserByUid } from '@/app/actions/user';
import { getWhatsappTemplate } from '@/app/actions/settings';
import type { Project, ProjectColumn, ProjectTask, CommentWithAuthor } from '@/lib/definitions';
import { sendNotification } from './notifications';
import { sendEmail } from '@/services/email';
import { getAll, getOne, create, update, remove, now } from '@/lib/db';

const COL_PROJECTS = 'projects';
const COL_USERS = 'users';
// Subcollections mapped to flat tables
const COL_COLUMNS = 'projectColumns';   // was projects/{id}/columns
const COL_TASKS = 'projectTasks';       // was projects/{id}/tasks
const COL_TASK_COMMENTS = 'taskComments'; // was projects/{id}/tasks/{id}/comments

export async function getProjects(): Promise<Project[]> {
  try {
    const rows = await getAll<any>(COL_PROJECTS, { orderBy: { field: 'createdAt', direction: 'desc' } });
    return rows.map(r => ({ ...r, createdAt: r.createdAt || new Date().toISOString() })) as Project[];
  } catch (error) {
    console.error("Error getting projects:", error);
    throw new Error("Gagal mengambil data proyek.");
  }
}

export async function getProjectsForUser(userId: string): Promise<Project[]> {
  try {
    const rows = await getAll<any>(COL_PROJECTS, {
      where: { field: 'teamIds', op: 'array-contains', value: userId },
      orderBy: { field: 'createdAt', direction: 'desc' },
    });
    return rows as Project[];
  } catch (error) {
    console.error("Error getting projects for user:", error);
    throw new Error("Gagal mengambil data proyek pengguna.");
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const row = await getOne<any>(COL_PROJECTS, id);
    return row ? (row as Project) : null;
  } catch (error) {
    console.error("Error getting project by ID:", error);
    throw new Error("Gagal mengambil data proyek.");
  }
}

export async function createProject(
  data: Omit<Project, 'id' | 'createdAt' | 'taskCount' | 'teamIds' | 'managerId'>,
  managerId: string,
): Promise<string> {
  try {
    const projectId = crypto.randomUUID();
    const projectData = {
      ...data,
      managerId,
      teamIds: [managerId],
      createdAt: now(),
      taskCount: 0,
    };

    await create(COL_PROJECTS, projectData as Record<string, unknown>, projectId);

    // Create default columns (replaces writeBatch subcollection set)
    const defaultColumns = ['Rencana', 'Dikerjakan', 'Tinjauan', 'Selesai'];
    await Promise.all(
      defaultColumns.map(title =>
        create(COL_COLUMNS, { projectId, title, taskIds: [] })
      )
    );

    revalidatePath('/panel/projects');
    return projectId;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error("Gagal membuat proyek baru.");
  }
}

export async function getColumnsForProject(projectId: string): Promise<ProjectColumn[]> {
  try {
    const columns = await getAll<any>(COL_COLUMNS, {
      where: { field: 'projectId', op: '==', value: projectId },
    });
    const order = ['Rencana', 'Dikerjakan', 'Tinjauan', 'Selesai'];
    return columns
      .sort((a: any, b: any) => order.indexOf(a.title) - order.indexOf(b.title))
      .map(c => ({ id: c.id, title: c.title, taskIds: c.taskIds || [] })) as ProjectColumn[];
  } catch (error) {
    console.error("Error getting columns for project:", error);
    throw new Error("Gagal mengambil data kolom proyek.");
  }
}

export async function getTasksForProject(projectId: string): Promise<ProjectTask[]> {
  try {
    const tasks = await getAll<any>(COL_TASKS, {
      where: { field: 'projectId', op: '==', value: projectId },
    });
    return tasks.map(t => ({
      ...t,
      dueDate: t.dueDate || undefined,
    })) as ProjectTask[];
  } catch (error) {
    console.error("Error getting tasks for project:", error);
    throw new Error("Gagal mengambil data tugas proyek.");
  }
}

export async function createTask(projectId: string, columnId: string, title: string): Promise<ProjectTask> {
  try {
    const newTaskData = {
      projectId,
      title,
      description: '',
      assigneeIds: [],
      labels: [],
      commentCount: 0,
      checklist: [],
    };

    const taskId = await create(COL_TASKS, newTaskData);

    // Add task to column's taskIds (sequential, replaces transaction)
    const column = await getOne<any>(COL_COLUMNS, columnId);
    if (!column) throw new Error("Kolom tidak ditemukan");
    await update(COL_COLUMNS, columnId, { taskIds: [...(column.taskIds || []), taskId] });

    // Increment project taskCount
    const project = await getOne<any>(COL_PROJECTS, projectId);
    if (project) {
      await update(COL_PROJECTS, projectId, { taskCount: (project.taskCount || 0) + 1 });
    }

    revalidatePath(`/panel/projects/${projectId}`);
    return { id: taskId, ...newTaskData } as unknown as ProjectTask;
  } catch (e) {
    console.error("Error creating task:", e);
    throw new Error("Gagal membuat tugas baru.");
  }
}

export async function updateTask(projectId: string, taskId: string, updates: Partial<Omit<ProjectTask, 'id'>>) {
  try {
    const currentTask = await getOne<any>(COL_TASKS, taskId);
    if (!currentTask) throw new Error("Tugas tidak ditemukan");

    const updatesForDb: Record<string, any> = { ...updates };
    if (updates.dueDate) {
      updatesForDb.dueDate = new Date(updates.dueDate).toISOString();
    } else if (updates.dueDate === null) {
      updatesForDb.dueDate = null;
    }

    await update(COL_TASKS, taskId, updatesForDb);

    if (updates.assigneeIds && currentTask.assigneeIds) {
      const newAssignees = updates.assigneeIds.filter((id: string) => !(currentTask.assigneeIds || []).includes(id));
      if (newAssignees.length > 0) {
        const project = await getProjectById(projectId);
        const template = await getWhatsappTemplate('new_task_assigned');
        const taskTitle = updates.title || currentTask.title;
        const projectName = project?.title || 'tanpa nama';

        for (const assigneeId of newAssignees) {
          const user = await getUserByUid(assigneeId);
          if (user) {
            const message = template.message
              .replace('{namaPengguna}', user.name)
              .replace('{namaTugas}', taskTitle)
              .replace('{namaProyek}', projectName);

            if (template.isActive && user.waNumber) {
              await sendWhatsAppMessage(user.waNumber, message);
            }
            if (user.email) {
              await sendEmail({ to: user.email, subject: `Tugas Baru: ${taskTitle}`, text: message });
            }
            await sendNotification(
              { title: 'Tugas Baru untuk Anda', body: `Anda ditugaskan pada tugas "${taskTitle}" di proyek "${projectName}".`, link: `/panel/projects/${projectId}` },
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

export async function updateTaskColumn(
  projectId: string,
  taskId: string,
  sourceColumnId: string,
  destColumnId: string,
  newIndex: number
) {
  try {
    // Sequential read-modify-write (replaces Firebase transaction)
    const sourceCol = await getOne<any>(COL_COLUMNS, sourceColumnId);
    if (!sourceCol) throw new Error("Kolom sumber tidak ditemukan");

    const newSourceTaskIds = (sourceCol.taskIds || []).filter((id: string) => id !== taskId);

    if (sourceColumnId === destColumnId) {
      newSourceTaskIds.splice(newIndex, 0, taskId);
      await update(COL_COLUMNS, sourceColumnId, { taskIds: newSourceTaskIds });
    } else {
      const destCol = await getOne<any>(COL_COLUMNS, destColumnId);
      if (!destCol) throw new Error("Kolom tujuan tidak ditemukan");

      const newDestTaskIds = [...(destCol.taskIds || [])];
      newDestTaskIds.splice(newIndex, 0, taskId);

      await Promise.all([
        update(COL_COLUMNS, sourceColumnId, { taskIds: newSourceTaskIds }),
        update(COL_COLUMNS, destColumnId, { taskIds: newDestTaskIds }),
      ]);
    }

    revalidatePath(`/panel/projects/${projectId}`);
  } catch (e) {
    console.error("Error moving task:", e);
    throw new Error("Gagal memindahkan tugas.");
  }
}

export async function updateTeamMembers(projectId: string, teamIds: string[]) {
  try {
    await update(COL_PROJECTS, projectId, { teamIds });
    revalidatePath(`/panel/projects/${projectId}`);
  } catch (error) {
    console.error("Error updating team members:", error);
    throw new Error("Gagal memperbarui anggota tim.");
  }
}

export async function addTaskComment(projectId: string, taskId: string, authorId: string, text: string) {
  try {
    if (!authorId) throw new Error("Pengguna tidak terautentikasi.");
    if (!text.trim()) throw new Error("Komentar tidak boleh kosong.");

    await create(COL_TASK_COMMENTS, { projectId, taskId, authorId, text, createdAt: now() });

    // Increment commentCount
    const task = await getOne<any>(COL_TASKS, taskId);
    if (task) {
      await update(COL_TASKS, taskId, { commentCount: (task.commentCount || 0) + 1 });
    }

    revalidatePath(`/panel/projects/${projectId}`);
  } catch (error) {
    console.error("Error adding task comment:", error);
    throw new Error("Gagal menambahkan komentar.");
  }
}

export async function getTaskComments(projectId: string, taskId: string): Promise<CommentWithAuthor[]> {
  try {
    const comments = await getAll<any>(COL_TASK_COMMENTS, {
      where: [
        { field: 'projectId', op: '==', value: projectId },
        { field: 'taskId', op: '==', value: taskId },
      ],
      orderBy: { field: 'createdAt', direction: 'asc' },
    });

    const results: CommentWithAuthor[] = [];
    for (const comment of comments) {
      const authorData = await getOne<any>(COL_USERS, comment.authorId);
      if (authorData) {
        results.push({
          id: comment.id,
          text: comment.text,
          timestamp: comment.createdAt || new Date().toISOString(),
          author: {
            id: comment.authorId,
            name: authorData.fullName || authorData.displayName || 'User',
            username: authorData.username || 'user',
            avatarUrl: authorData.avatarUrl || '',
          },
        });
      }
    }
    return results;
  } catch (error) {
    console.error("Error getting task comments:", error);
    throw new Error("Gagal memuat komentar tugas.");
  }
}
