import { supabase } from "@/lib/supabase";

export async function uploadSnapshot(file: Blob, filename: string) {
  const { data, error } = await supabase.storage
    .from("snapshots")
    .upload(filename, file, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
