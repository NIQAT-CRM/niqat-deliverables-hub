import { createAdminClient } from "@/lib/supabase/admin";

/** Insert notifications for all admins. Best-effort — never throws to the caller. */
export async function notifyAdmins(eventType: string, refId: string | null) {
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin");
    if (!admins || admins.length === 0) return;
    const rows = admins.map((a: { id: string }) => ({
      recipient_id: a.id,
      event_type: eventType,
      ref_id: refId,
    }));
    await admin.from("notifications").insert(rows);
  } catch {
    /* notifications are non-critical */
  }
}

/** Notify a single recipient. */
export async function notifyUser(
  recipientId: string,
  eventType: string,
  refId: string | null,
) {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      recipient_id: recipientId,
      event_type: eventType,
      ref_id: refId,
    });
  } catch {
    /* non-critical */
  }
}
