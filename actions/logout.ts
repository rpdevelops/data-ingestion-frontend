"use server";

import { getAccessToken, signOut, clearAuthCookies } from "@/lib/auth/cognito";
import { redirect } from "next/navigation";

export async function logoutAction() {
  try {
    const accessToken = await getAccessToken();
    
    // Sign out from Cognito if we have a token
    if (accessToken) {
      try {
        await signOut(accessToken);
      } catch (error) {
        // Continue with clearing cookies even if signOut fails
        console.error("Error signing out from Cognito:", error);
      }
    }

    // Clear authentication cookies
    await clearAuthCookies();

    // Redirect to login page
    redirect("/auth/login");
  } catch (error) {
    // Even if there's an error, clear cookies and redirect
    await clearAuthCookies();
    redirect("/auth/login");
  }
}
