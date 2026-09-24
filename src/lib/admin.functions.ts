import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const emailSchema = z.string().trim().email().transform((email) => email.toLowerCase());
const removeSchema = z.object({ userId: z.string().uuid() });

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Administrator access is required.");
}

async function findUserByEmail(email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error("Staff accounts could not be checked right now.");
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error("Your access level could not be checked.");
    return { isAdmin: Boolean(data) };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Administrators could not be loaded.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admins = await Promise.all(
      (roles ?? []).map(async (role) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(role.user_id);
        return {
          userId: role.user_id,
          email: data.user?.email ?? "Email unavailable",
          grantedAt: role.created_at,
          isCurrentUser: role.user_id === context.userId,
        };
      }),
    );

    return { admins, currentUserId: context.userId };
  });

export const addAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ email: emailSchema }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const user = await findUserByEmail(data.email);
    if (!user) throw new Error("No existing staff account uses that email address.");

    const { error } = await context.supabase.from("user_roles").insert({
      user_id: user.id,
      role: "admin",
    });
    if (error?.code === "23505") throw new Error("That account is already an administrator.");
    if (error) throw new Error("Administrator access could not be added.");
    return { ok: true };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => removeSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: deleted, error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .select("id");

    if (error?.code === "23514" || error?.message.includes("last administrator")) {
      throw new Error("The last administrator cannot be removed.");
    }
    if (error) throw new Error("Administrator access could not be removed.");
    if (!deleted?.length) throw new Error("That account is no longer an administrator.");
    return { ok: true };
  });