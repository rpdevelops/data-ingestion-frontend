"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password) {
    return { error: "Senha obrigatória." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
