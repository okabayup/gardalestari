/**
 * Supabase Database Helper - Garda Lestari
 * Drop-in helper untuk menggantikan Firebase Firestore SDK.
 *
 * Semua data disimpan di tabel dengan kolom raw_data JSONB.
 * Nama tabel: firebase_garda_lestari_{collection}
 *
 * Gunakan di action files:
 *   import { getAll, getOne, create, update, remove, uploadFile, deleteFile } from '@/lib/db'
 */

import { supabaseAdmin } from './supabase';

const PROJECT_PREFIX = 'firebase_garda_lestari';
const STORAGE_BUCKET = 'garda-lestari';

// ─── Table Name ─────────────────────────────────────────────────────────────

/**
 * Converts Firebase collection name to Supabase table name.
 * e.g. 'beritaKategori' → 'firebase_garda_lestari_berita_kategori'
 */
export function tb(collection: string): string {
  // camelCase → snake_case, then truncate to 60 chars
  const snake = collection
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/^_/, '');
  return `${PROJECT_PREFIX}_${snake}`.substring(0, 60);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type WhereClause = {
  field: string;
  op: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains';
  value: unknown;
};

export type OrderClause = {
  field: string;
  direction?: 'asc' | 'desc';
};

export type QueryOptions = {
  where?: WhereClause | WhereClause[];
  orderBy?: OrderClause | OrderClause[];
  limit?: number;
};

// ─── Internal ────────────────────────────────────────────────────────────────

function applyQuery(
  q: ReturnType<typeof supabaseAdmin.from>,
  opts?: QueryOptions
) {
  let query = q.select('_id, raw_data');

  // Where clauses
  const conditions = opts?.where
    ? Array.isArray(opts.where) ? opts.where : [opts.where]
    : [];
  for (const { field, op, value } of conditions) {
    const col = `raw_data->>${JSON.stringify(field)}`;
    const v = String(value);
    if (op === '==') query = (query as any).eq(col, v);
    else if (op === '!=') query = (query as any).neq(col, v);
    else if (op === '>') query = (query as any).gt(col, v);
    else if (op === '>=') query = (query as any).gte(col, v);
    else if (op === '<') query = (query as any).lt(col, v);
    else if (op === '<=') query = (query as any).lte(col, v);
    // array-contains needs special handling
    else if (op === 'array-contains') {
      query = (query as any).contains(`raw_data->${JSON.stringify(field)}`, JSON.stringify([value]));
    }
  }

  // Order clauses
  const orders = opts?.orderBy
    ? Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]
    : [];
  for (const { field, direction } of orders) {
    const col = `raw_data->>${JSON.stringify(field)}`;
    query = (query as any).order(col, { ascending: direction !== 'desc' });
  }

  // Limit
  if (opts?.limit) query = (query as any).limit(opts.limit);

  return query;
}

function mapRow<T>(row: { _id: string; raw_data: Record<string, unknown> }): T {
  return { id: row._id, ...row.raw_data } as T;
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Get all documents from a collection.
 *
 * Replaces: getDocs(query(collection(db, name), orderBy(...), where(...)))
 */
export async function getAll<T>(
  collection: string,
  opts?: QueryOptions
): Promise<T[]> {
  const { data, error } = await applyQuery(
    supabaseAdmin.from(tb(collection)) as any,
    opts
  );
  if (error) throw new Error(`[db.getAll ${collection}] ${error.message}`);
  return (data ?? []).map(r => mapRow<T>(r as any));
}

/**
 * Get a single document by ID.
 *
 * Replaces: getDoc(doc(db, collection, id))
 */
export async function getOne<T>(collection: string, id: string): Promise<T | null> {
  const { data, error } = await supabaseAdmin
    .from(tb(collection))
    .select('_id, raw_data')
    .eq('_id', id)
    .maybeSingle();
  if (error) throw new Error(`[db.getOne ${collection}/${id}] ${error.message}`);
  return data ? mapRow<T>(data as any) : null;
}

/**
 * Get first document matching conditions.
 */
export async function getFirst<T>(
  collection: string,
  opts?: QueryOptions
): Promise<T | null> {
  const { data, error } = await applyQuery(
    supabaseAdmin.from(tb(collection)) as any,
    { ...opts, limit: 1 }
  );
  if (error) throw new Error(`[db.getFirst ${collection}] ${error.message}`);
  return data?.[0] ? mapRow<T>(data[0] as any) : null;
}

/**
 * Create a new document. Returns the new document ID.
 *
 * Replaces: addDoc(collection(db, name), data)
 */
export async function create(
  collection: string,
  data: Record<string, unknown>,
  id?: string
): Promise<string> {
  const _id = id ?? crypto.randomUUID();
  // Remove 'id' from data (stored separately as _id)
  const { id: _ignored, ...rawData } = data;
  const { error } = await supabaseAdmin
    .from(tb(collection))
    .insert({ _id, raw_data: rawData });
  if (error) throw new Error(`[db.create ${collection}] ${error.message}`);
  return _id;
}

/**
 * Update a document by ID (merges with existing data).
 *
 * Replaces: updateDoc(doc(db, collection, id), data)
 */
export async function update(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  // Get current data to merge
  const current = await getOne<Record<string, unknown>>(collection, id);
  if (!current) throw new Error(`[db.update] Document ${collection}/${id} not found`);

  const { id: _id2, ...currentData } = current;
  const { id: _id3, ...updateData } = data;
  const merged = { ...currentData, ...updateData };

  const { error } = await supabaseAdmin
    .from(tb(collection))
    .update({ raw_data: merged })
    .eq('_id', id);
  if (error) throw new Error(`[db.update ${collection}/${id}] ${error.message}`);
}

/**
 * Replace a document by ID (full overwrite, not merge).
 */
export async function set(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const { id: _ignored, ...rawData } = data;
  const { error } = await supabaseAdmin
    .from(tb(collection))
    .upsert({ _id: id, raw_data: rawData });
  if (error) throw new Error(`[db.set ${collection}/${id}] ${error.message}`);
}

/**
 * Delete a document by ID.
 *
 * Replaces: deleteDoc(doc(db, collection, id))
 */
export async function remove(collection: string, id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from(tb(collection))
    .delete()
    .eq('_id', id);
  if (error) throw new Error(`[db.remove ${collection}/${id}] ${error.message}`);
}

/**
 * Count documents in a collection matching conditions.
 *
 * Replaces: getCountFromServer(query(...))
 */
export async function count(collection: string, opts?: QueryOptions): Promise<number> {
  let q = supabaseAdmin.from(tb(collection)).select('_id', { count: 'exact', head: true });
  const conditions = opts?.where
    ? Array.isArray(opts.where) ? opts.where : [opts.where]
    : [];
  for (const { field, op, value } of conditions) {
    const col = `raw_data->>${JSON.stringify(field)}`;
    const v = String(value);
    if (op === '==') q = (q as any).eq(col, v);
  }
  const { count: c, error } = await q;
  if (error) throw new Error(`[db.count ${collection}] ${error.message}`);
  return c ?? 0;
}

// ─── Storage Operations ───────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL.
 *
 * Replaces: uploadBytes(ref(storage, path), file) + getDownloadURL(...)
 */
export async function uploadFile(
  file: File | Uint8Array | Buffer,
  storagePath: string
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { upsert: true });
  if (error) throw new Error(`[db.uploadFile ${storagePath}] ${error.message}`);

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 * Safely ignores Firebase storage URLs (they can't be deleted via Supabase).
 *
 * Replaces: deleteObject(ref(storage, path))
 */
export async function deleteFile(urlOrPath: string): Promise<void> {
  // Skip Firebase storage URLs (old migrated data keeps them until Firebase is shut down)
  if (urlOrPath.includes('firebasestorage.googleapis.com')) return;

  // Extract path from Supabase public URL if needed
  let path = urlOrPath;
  if (urlOrPath.includes('/storage/v1/object/public/')) {
    path = urlOrPath.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)[1];
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path]);
  if (error) throw new Error(`[db.deleteFile ${path}] ${error.message}`);
}

/**
 * Get public URL for a file in Supabase Storage.
 */
export function getFileUrl(storagePath: string): string {
  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Auth Helper ─────────────────────────────────────────────────────────────

/**
 * Get a user from Supabase Auth by UID.
 *
 * Replaces: getAuth().getUser(uid) from Firebase Admin
 */
export async function getAuthUser(uid: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(uid);
  if (error) throw new Error(`[db.getAuthUser ${uid}] ${error.message}`);
  return data.user;
}

/**
 * Get all users from Supabase Auth (paginated).
 */
export async function listAuthUsers(page = 1, perPage = 50) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
  if (error) throw new Error(`[db.listAuthUsers] ${error.message}`);
  return data.users;
}

// ─── Timestamp Helper ────────────────────────────────────────────────────────

/**
 * Get current timestamp as ISO string.
 * Replaces: Timestamp.now() from Firebase
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Convert a Date or timestamp to ISO string.
 * Replaces: Timestamp.fromDate(date)
 */
export function toTimestamp(date: Date | string | number): string {
  return new Date(date).toISOString();
}
