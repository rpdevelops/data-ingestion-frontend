"use server";

import { getCurrentUser, getIdToken, getRefreshToken, setAuthCookies, isTokenExpiredOrExpiringSoon } from "@/lib/auth/cognito";
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_REGION = process.env.COGNITO_REGION || "us-east-1";

let cognitoClient: CognitoIdentityProviderClient | null = null;

if (COGNITO_CLIENT_ID) {
  cognitoClient = new CognitoIdentityProviderClient({
    region: COGNITO_REGION,
  });
}

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

/**
 * Server Action to refresh authentication tokens
 * This can be called before making API requests to ensure tokens are valid
 */
export async function refreshAuthTokensAction(): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
} | null> {
  if (!cognitoClient || !COGNITO_CLIENT_ID) {
    return null;
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const command = new InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return null;
    }

    const newTokens = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken || refreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };

    // Update cookies with new tokens
    await setAuthCookies(
      newTokens.accessToken,
      newTokens.idToken,
      newTokens.refreshToken,
      newTokens.expiresIn
    );

    return newTokens;
  } catch (error) {
    console.error("Error refreshing tokens:", error);
    return null;
  }
}

/**
 * Server Action to get ID token, refreshing if necessary
 * This should be used in Server Actions that make API calls
 */
export async function getIdTokenWithRefresh(): Promise<string | null> {
  let idToken = await getIdToken();

  if (!idToken) {
    return null;
  }

  // Check if token is expired or expiring soon (within 5 minutes)
  if (isTokenExpiredOrExpiringSoon(idToken)) {
    // Try to refresh the tokens
    const refreshed = await refreshAuthTokensAction();
    if (refreshed) {
      return refreshed.idToken;
    } else {
      // If refresh fails, return null (will cause auth error)
      return null;
    }
  }

  return idToken;
}
