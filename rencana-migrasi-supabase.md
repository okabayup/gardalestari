# Rencana Migrasi Kode Garda Lestari: Firebase → Supabase

**Tanggal:** 2026-06-19  
**Target:** Mengganti semua dependensi Firebase (Auth, Firestore, Storage) dengan Supabase  
**Stack:** Next.js 15 App Router, Server Actions, TypeScript

---

## Status Migrasi Data (Selesai ✅)

| Data | Firebase | Supabase | Status |
|------|----------|----------|--------|
| Auth users (main) | 21 users | auth.users | ✅ Done |
| Firestore (main) | 337 rows / 51 collections | 51 PostgreSQL tables | ✅ Done |
| Storage (main) | 98 files | 9 buckets Supabase Storage | ✅ Done |
| Firestore (old: boards) | 13 docs | old_boards table | ⏳ In Progress |
| Firestore (old: items) | 95 docs | old_items table | ⏳ In Progress |
| Auth users (old) | 2 users | - | Skip (akun personal) |

---

## Gambaran Perubahan Kode

### File yang Perlu Dibuat/Diubah

**1. `src/lib/supabase.ts`** ← BARU, ganti `src/lib/firebase.ts`  
**2. `src/hooks/use-auth.tsx`** ← Tulis ulang (terbesar)  
**3. `src/app/actions/*.ts`** ← ~35 file, ganti Firestore → PostgreSQL via PostgREST  
**4. `src/app/actions/user.ts`** ← Ganti Firebase Storage → Supabase Storage  
**5. `.env`** ← Tambah Supabase env vars, hapus Firebase  

---

## Langkah 1: Install Dependencies

```bash
cd gardalestari
npm uninstall firebase firebase-admin
npm install @supabase/supabase-js @supabase/ssr
```

---

## Langkah 2: Buat `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types'; // generate dengan supabase gen types

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (browser)
export const supabase = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-side (Server Actions, API routes)
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

---

## Langkah 3: Update `.env`

Tambahkan:
```env
NEXT_PUBLIC_SUPABASE_URL=https://api.gardalestari.org
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY dari /dev/supabase/docker/.env>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY dari /dev/supabase/docker/.env>
```

Hapus (setelah migrasi selesai):
```env
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# dll
```

---

## Langkah 4: Tulis Ulang `src/hooks/use-auth.tsx`

Ini file terbesar. Perubahan utama:

### 4a. Ganti Firebase Phone Auth → Supabase Phone OTP

```typescript
// SEBELUM (Firebase)
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

// SESUDAH (Supabase)
import { supabase } from '@/lib/supabase';
const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
```

> ⚠️ **Catatan Penting Phone OTP:**  
> Supabase Phone OTP memerlukan provider SMS (Twilio, MessageBird, dll). Karena app saat ini pakai WhatsApp OTP via satuconnect.my.id, ada dua opsi:
> - **Opsi A**: Gunakan Supabase Magic Link (email) untuk admin, WhatsApp OTP custom tetap untuk user umum
> - **Opsi B**: Buat custom auth flow: generate OTP manual → kirim via WhatsApp → verifikasi OTP → `supabase.auth.signInWithPassword()` dengan email+password sementara
> - **Opsi C (Direkomendasikan)**: Aktifkan Twilio di Supabase self-hosted untuk SMS OTP standar

### 4b. Ganti `onAuthStateChanged` → `onAuthStateChange`

```typescript
// SEBELUM (Firebase)
import { onAuthStateChanged } from 'firebase/auth';
const unsubscribe = onAuthStateChanged(auth, async (user) => { ... });

// SESUDAH (Supabase)
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (session?.user) {
      await fetchUserDetails(session.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  }
);
return () => subscription.unsubscribe();
```

### 4c. Ganti Firestore user fetch → PostgREST

```typescript
// SEBELUM (Firebase)
const userDoc = await getDoc(doc(db, 'users', user.uid));
const userData = userDoc.data();

// SESUDAH (Supabase)
const { data: userData } = await supabase
  .from('users')
  .select('*, positions(name, permissions)')
  .eq('id', user.id)
  .single();
```

### 4d. Ganti `signOut`

```typescript
// SEBELUM
await firebaseSignOut(auth);

// SESUDAH
await supabase.auth.signOut();
```

### 4e. Ganti verifyOtp (user registration flow)

```typescript
// SEBELUM
const userCredential = await window.confirmationResult.confirm(otp);

// SESUDAH
const { data, error } = await supabase.auth.verifyOtp({
  phone: phoneNumber,
  token: otp,
  type: 'sms'
});
if (!error) {
  // Cek apakah user baru, buat record di public.users jika belum ada
}
```

---

## Langkah 5: Ganti Firestore di Server Actions (~35 file)

### Pattern Umum

Setiap file di `src/app/actions/*.ts` perlu diubah dari pola ini:

```typescript
// SEBELUM
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

const colRef = collection(db, 'tableName');
const snapshot = await getDocs(query(colRef, where('field', '==', value), orderBy('createdAt', 'desc')));
const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

await addDoc(colRef, data);
await updateDoc(doc(db, 'tableName', id), data);
await deleteDoc(doc(db, 'tableName', id));
```

Menjadi:

```typescript
// SESUDAH
import { supabaseAdmin } from '@/lib/supabase';

const { data: items } = await supabaseAdmin
  .from('table_name')
  .select('*')
  .eq('field', value)
  .order('created_at', { ascending: false });

await supabaseAdmin.from('table_name').insert(data);
await supabaseAdmin.from('table_name').update(data).eq('id', id);
await supabaseAdmin.from('table_name').delete().eq('id', id);
```

### Mapping Koleksi Firestore → Tabel PostgreSQL

| Firestore Collection | Tabel Supabase |
|---------------------|----------------|
| users | users |
| positions | positions |
| beritaPosts | berita_posts |
| importantDocuments | important_documents |
| documentCategories | document_categories |
| documentTypes | document_types |
| announcements | announcements |
| events | events |
| partners | partners |
| programs | programs |
| bookings | bookings |
| edutourism | edutourism |
| achievements | achievements |
| badges | badges |
| pointLogs (subcol) | point_logs |
| notifications | notifications |
| shortlinks | shortlinks |
| settings | settings |
| voting | voting |
| ideas | ideas |
| projects | projects |
| reports | reports |
| assets | assets |
| forms | forms |
| posts | posts |
| finance | finance |
| generationJobs | generation_jobs |
| mapData | map_data |
| mapDatasets | map_datasets |
| recruitments | recruitments |
| appTesters | app_testers |
| bankData | bank_data |
| dataBank | data_bank |
| ... (dst) | ... |

### File Prioritas Tinggi (paling banyak dipakai)

1. `src/app/actions/user.ts` — Auth + profile management
2. `src/app/actions/berita.ts` — Konten berita (sering diakses)
3. `src/app/actions/notifications.ts` — Diimport banyak file lain
4. `src/app/actions/settings.ts` — Config global
5. `src/hooks/use-auth.tsx` — Auth context (fondasi semua halaman)

---

## Langkah 6: Ganti Firebase Storage di Actions

### Pattern Upload

```typescript
// SEBELUM (Firebase Storage)
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const storageRef = ref(storage, `profile-pictures/${userId}-${file.name}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// SESUDAH (Supabase Storage)
import { supabaseAdmin } from '@/lib/supabase';

const { data, error } = await supabaseAdmin.storage
  .from('profile-pictures')
  .upload(`${userId}-${file.name}`, file, { upsert: true, contentType: file.type });

const { data: { publicUrl } } = supabaseAdmin.storage
  .from('profile-pictures')
  .getPublicUrl(`${userId}-${file.name}`);
```

### Pattern Delete

```typescript
// SEBELUM
await deleteObject(ref(storage, fileUrl));

// SESUDAH
const path = extractPathFromSupabaseUrl(fileUrl); // helper function
await supabaseAdmin.storage.from(bucket).remove([path]);
```

### File Afeksi Storage Upload

- `src/app/actions/user.ts` — profile pictures, KTP, selfie
- `src/app/actions/achievements.ts` — achievement images
- `src/app/actions/announcements.ts` — attachment files
- `src/app/actions/documents.ts` — PDF documents
- `src/app/actions/edutourism.ts` — edutourism images
- `src/app/actions/events.ts` — event images
- `src/app/actions/partners.ts` — partner logos
- `src/app/actions/posts.ts` — post images
- `src/app/actions/programs.ts` — program images
- `src/ai/flows/assistant-flow.ts` — AI-generated files
- `src/ai/flows/news-generator-flow.ts` — news images

---

## Langkah 7: Ganti Firebase Admin SDK

```typescript
// SEBELUM
import admin from 'firebase-admin';
if (admin.apps.length === 0) admin.initializeApp();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

// SESUDAH — Tidak perlu admin SDK, gunakan supabaseAdmin (service_role)
import { supabaseAdmin } from '@/lib/supabase';

// Auth operations
const { data: user } = await supabaseAdmin.auth.admin.getUserById(uid);
await supabaseAdmin.auth.admin.updateUserById(uid, { email_confirm: true });
await supabaseAdmin.auth.admin.deleteUser(uid);

// Database operations (sama seperti biasa tapi dengan service_role key)
const { data } = await supabaseAdmin.from('users').select('*');
```

---

## Langkah 8: Real-time Subscriptions

Firestore real-time listeners yang ada perlu diganti:

```typescript
// SEBELUM (Firestore)
import { onSnapshot, collection, query, where } from 'firebase/firestore';
const unsubscribe = onSnapshot(query(colRef, where(...)), (snapshot) => {
  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  setData(data);
});

// SESUDAH (Supabase Realtime)
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name',
    filter: `field=eq.${value}`
  }, (payload) => {
    // handle INSERT, UPDATE, DELETE
    setData(prev => updateState(prev, payload));
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

---

## Langkah 9: Analytics & Logging

```typescript
// SEBELUM (Firebase Analytics)
import { getAnalytics, logEvent } from 'firebase/analytics';
logEvent(analytics, 'event_name', { param: value });

// SESUDAH — Pilihan:
// 1. Posthog (self-hosted atau cloud)
// 2. Plausible (privacy-first)
// 3. Tabel custom di Supabase: INSERT INTO analytics_events (...)
// Rekomendasi: tabel custom untuk simplisitas
```

---

## Langkah 10: Update `src/lib/analytics.ts`

File ini memanggil `logAnalyticsEvent`. Ganti dengan:

```typescript
// src/lib/analytics.ts
import { supabase } from '@/lib/supabase';

export async function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  await supabase.from('analytics_events').insert({
    event_name: eventName,
    params: params || {},
    created_at: new Date().toISOString()
  });
}
```

---

## Langkah 11: `src/lib/seed-data.ts`

File ini dipanggil saat `onAuthStateChanged`. Berguna untuk init data default. Dengan Supabase, bisa dijalankan via SQL migration atau tetap dipertahankan sebagai function yang dicek saat pertama login.

```typescript
// SESUDAH — Cek apakah seed data sudah ada, jika belum insert
const { count } = await supabase.from('settings').select('*', { count: 'exact', head: true });
if (count === 0) {
  await supabase.from('settings').insert([...defaultSettings]);
}
```

---

## Urutan Pengerjaan yang Direkomendasikan

### Sprint 1 (Fondasi) — 1-2 hari
1. Install `@supabase/supabase-js`
2. Buat `src/lib/supabase.ts`
3. Update `.env` dengan Supabase vars
4. Tulis ulang `src/hooks/use-auth.tsx` ← paling kritikal
5. Verifikasi login/logout berfungsi

### Sprint 2 (Database Actions) — 3-5 hari
6. Ganti semua `src/app/actions/*.ts` (prioritas: user, notifications, settings)
7. Pastikan setiap CRUD di panel admin berfungsi

### Sprint 3 (Storage) — 1-2 hari
8. Ganti semua upload/download Firebase Storage → Supabase Storage
9. Verifikasi URL gambar lama masih bisa diakses (sudah dimigrasikan ke Supabase)

### Sprint 4 (Cleanup) — 1 hari
10. Hapus `src/lib/firebase.ts`
11. Uninstall `firebase` dan `firebase-admin`
12. Remove Firebase env vars dari `.env`
13. Remove `apphosting.yaml` (App Hosting Firebase)
14. Testing end-to-end

---

## Catatan Khusus

### Phone OTP Login
App saat ini pakai Firebase Phone Auth (SMS via Firebase) dengan reCAPTCHA. Untuk Supabase:
- Jika tetap pakai SMS: konfigurasikan Twilio di `docker/.env` Supabase (`SMS_PROVIDER=twilio`, `SMS_TWILIO_ACCOUNT_SID=...`)
- Jika pakai WhatsApp OTP yang sudah ada (satuconnect.my.id): buat endpoint `/api/auth/send-wa-otp` yang generate OTP, simpan di Redis/DB sementara, kirim via WhatsApp, lalu verifikasi dan panggil `supabase.auth.admin.createUser()` atau sign in

### KYC Images (kyc bucket)
File KTP dan selfie sudah di `kyc/` bucket Supabase Storage. URL baru:
```
https://api.gardalestari.org/storage/v1/object/public/kyc/{filename}
```
(atau authenticated untuk private: tambahkan token)

### Documents PDF
Sudah di `documents/` bucket. Pertimbangkan set bucket ke **private** (bukan public) agar dokumen resmi tidak bisa diakses publik tanpa autentikasi.

### Cloudflare Tunnel
Supabase sudah bisa diakses via `api.gardalestari.org` (setelah DNS transfer selesai). Semua URL Supabase Storage di kode cukup pakai `NEXT_PUBLIC_SUPABASE_URL`.

---

## Perubahan DNS yang Diperlukan (setelah domain transfer)

Tambahkan di Cloudflare DNS:
```
api.gardalestari.org  CNAME  12b4fc90-9d17-431c-ad66-722dbc993c9a.cfargotunnel.com  (Proxied)
@                     CNAME  12b4fc90-9d17-431c-ad66-722dbc993c9a.cfargotunnel.com  (Proxied)
```

---

## Ringkasan File yang Diubah

| File | Jenis Perubahan |
|------|----------------|
| `src/lib/firebase.ts` | Hapus seluruhnya |
| `src/lib/supabase.ts` | BUAT BARU |
| `src/lib/analytics.ts` | Ganti Firebase Analytics |
| `src/lib/seed-data.ts` | Ganti Firestore calls |
| `src/hooks/use-auth.tsx` | Tulis ulang sepenuhnya |
| `src/app/actions/*.ts` (~35 file) | Ganti Firestore → PostgREST |
| `src/app/actions/user.ts` | Ganti Storage + Auth admin |
| `src/ai/flows/assistant-flow.ts` | Ganti Storage upload |
| `src/ai/flows/news-generator-flow.ts` | Ganti Storage upload |
| `src/services/indexing.ts` | Periksa Firebase dependency |
| `.env` | Tambah Supabase, hapus Firebase |
| `package.json` | Remove firebase, add @supabase |
