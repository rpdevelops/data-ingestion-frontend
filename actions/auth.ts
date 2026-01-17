"use server";

import { getCurrentUser } from "@/lib/auth/cognito";

/**
 * Server Action to get current user email
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.email || user?.username || null;
  } catch (error) {
    console.error("Error getting current user email:", error);
    return null;
  }
}
