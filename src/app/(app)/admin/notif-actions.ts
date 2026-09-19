"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAllRead(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Signed out." };
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", user.id)
    .eq("read", false);
  if (error) return { error: "Could not update notifications." };
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  return { error: null };
}
