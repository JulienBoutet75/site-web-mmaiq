import { createClient } from '@supabase/supabase-js';

// ⚠️ UTILISEZ LES VARIABLES D'ENVIRONNEMENT DANS LES PARAMÈTRES (SETTINGS) ⚠️
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://tmmtabzxcgxlmsgfgxwx.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbXRhYnp4Y2d4bG1zZ2ZneHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTMxNDMsImV4cCI6MjA4ODQ2OTE0M30.5qT_9Rijv59fYrU6P2mNqqS9GArDXfUTc5GqdmxbTbU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const isDefaultProject = !import.meta.env.VITE_SUPABASE_URL;

// ── Auth Functions ──

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return { user: data.user, session: data.session, ...data };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return { user: data.user, session: data.session, ...data };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function getProfile(userId, accessToken?: string | null) {
  if (userId === "admin-fallback-id") {
    return {
      id: "admin-fallback-id",
      full_name: "Admin Super",
      email: ADMIN_EMAIL,
      role: "super_admin"
    };
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (error.message.includes('Refresh Token')) {
        await supabase.auth.signOut().catch(() => {});
        if (typeof localStorage !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("Session error:", err);
    return null;
  }
}

// ── Storage Functions ──

export async function uploadFile(bucket: string, file: File, accessToken?: string | null, customPath?: string) {
  if (isDefaultProject) {
    throw new Error("Vous utilisez le projet Supabase par défaut. Veuillez mettre vos propres clés.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = customPath || `${Date.now()}-${safeName}`;
  
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  
  return getPublicUrl(bucket, path);
}

export async function deleteFile(bucket: string, path: string, accessToken?: string | null) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}

export async function listFiles(bucket: string, accessToken?: string | null) {
  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  if (error) return [];
  return data;
}

export function getPublicUrl(bucket: string, fileName: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// ── Site Content ──

export async function loadSiteContent(accessToken?: string | null) {
  const { data, error } = await supabase.from('site_content').select('data').eq('id', 1).single();
  if (error) return null;
  return data.data;
}

export async function saveSiteContent(content: any, accessToken?: string | null) {
  const { error } = await supabase.from('site_content').upsert({ id: 1, data: content, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ── Generic CRUD Functions ──

export async function fetchData(table: string, select = '*', filters = '', accessToken?: string | null): Promise<any[]> {
  let query = supabase.from(table).select(select)
  
  if (filters) {
    const params = new URLSearchParams(filters.replace(/^&/, ''))
    params.forEach((value, key) => {
      if (key === 'order') {
        const parts = value.split('.')
        const column = parts[0]
        const direction = parts[1] || 'asc'
        query = query.order(column, { ascending: direction === 'asc' })
      } else {
        const cleanValue = value.startsWith('eq.') ? value.replace('eq.', '') : value
        query = query.eq(key.replace('eq.', ''), cleanValue)
      }
    })
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function insertData(table: string, data: any, accessToken?: string | null): Promise<any> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()

  if (error) {
    console.error('insertData error:', error)
    throw new Error(error.message)
  }
  return result
}

// Soumission publique (formulaires visiteurs) : insertion sans relecture.
// La table leads autorise l'INSERT à tous mais réserve le SELECT à l'admin ;
// un .select() après insert échouerait donc côté visiteur.
export async function submitLead(
  lead: { type: 'contact' | 'newsletter' | 'waitlist'; email: string; name?: string; message?: string }
): Promise<void> {
  const { error } = await supabase.from('leads').insert(lead)
  if (error) {
    console.error('submitLead error:', error)
    throw new Error(error.message)
  }
}

export async function updateData(table: string, id: string | number, data: any, accessToken?: string | null): Promise<any> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()

  if (error) {
    console.error('updateData error:', error)
    throw new Error(error.message)
  }
  return result
}

export async function deleteData(table: string, id: string | number, accessToken?: string | null): Promise<any> {
  const { data: result, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    console.error('deleteData error:', error)
    throw new Error(error.message)
  }
  return result
}
