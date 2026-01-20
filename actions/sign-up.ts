"use server";

/**
 * Sign up action - Placeholder for Cognito migration
 * User registration should be done via AWS Console or admin script
 */
export async function signUpAction(formData: FormData) {
  // User registration is handled via AWS Cognito Console or admin scripts
  // This is a placeholder to prevent build errors
  return {
    error: "User registration is not available through the web interface. Please contact an administrator to create your account.",
  };
}
