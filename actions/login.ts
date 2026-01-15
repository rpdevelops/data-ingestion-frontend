"use server";

import { signIn, setAuthCookies } from "@/lib/auth/cognito";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const authResult = await signIn(email, password);
    
    // Set authentication cookies
    await setAuthCookies(
      authResult.accessToken!,
      authResult.idToken!,
      authResult.refreshToken,
      authResult.expiresIn
    );

    // Return success with redirect path (redirect will be handled on client side)
    return { 
      success: true,
      redirectTo: redirectTo || "/client-area"
    };
  } catch (error) {
    return { 
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed" 
    };
  }
}
