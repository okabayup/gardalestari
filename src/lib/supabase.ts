/**
 * Supabase Client - Garda Lestari
 * Menggantikan Firebase SDK
 *
 * Import dari file ini:
 *   import { supabase, supabaseAdmin } from '@/lib/supabase'
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

/**
 * Client-side Supabase client (browser).
 * Gunakan untuk operasi yang menggunakan autentikasi user.
 *
 * Equivalent to: Firebase `auth`, `db` (client-side)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Server-side Supabase admin client.
 * Gunakan di Server Actions dan API routes untuk operasi DB yang memerlukan akses penuh.
 * JANGAN expose ke client/browser.
 *
 * Equivalent to: Firebase Admin SDK (`adminDb`, `adminApp`)
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper: Dapatkan current user ID dari session
 * Equivalent to: Firebase `auth.currentUser?.uid`
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Helper: Mapping nama tabel dari Firebase collection ke Supabase
 * Firebase: 'beritaPosts' → Supabase: 'berita_posts'
 * Firebase: 'users' → Supabase: 'profiles' (auth.users dikelola Supabase)
 */
export function getTableName(firebaseCollection: string): string {
  const mapping: Record<string, string> = {
    // Langsung mapping (sesuaikan dengan tabel yang sudah dibuat)
    'boards': 'firebase_garda_lestari_boards',
    'items': 'firebase_garda_lestari_items',
    // Tambahkan mapping lain sesuai kebutuhan
  };
  return mapping[firebaseCollection] ?? firebaseCollection.replace(/([A-Z])/g, '_$1').toLowerCase();
}
