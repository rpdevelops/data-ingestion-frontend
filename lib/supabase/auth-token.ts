/**
 * Obtém o token JWT do Cognito para autenticação nas APIs do backend
 * Usado para fazer chamadas autenticadas ao backend FastAPI
 */
import { getAccessToken } from "@/lib/auth/cognito";

/**
 * Get Cognito access token for backend API authentication
 * This function is kept for backward compatibility with existing code
 * that references getSupabaseToken
 */
export async function getSupabaseToken(): Promise<string | null> {
  try {
    return await getAccessToken();
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}




