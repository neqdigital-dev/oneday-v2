import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (admin access)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

// ============================================================
// STORAGE HELPERS
// ============================================================
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "oneday-images";

export async function uploadImage(
  file: File,
  folder: string = "misc"
): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload exception:", err);
    return null;
  }
}

export async function deleteImage(url: string): Promise<void> {
  try {
    if (!url || !url.includes(BUCKET)) return;
    const path = url.split(`${BUCKET}/`)[1];
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  } catch (err) {
    console.error("Delete image error:", err);
  }
}
