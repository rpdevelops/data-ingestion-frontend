"use server";

import { createClient } from "@/lib/supabase/server";

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Informe o e-mail." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/update-password`,
  });
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
