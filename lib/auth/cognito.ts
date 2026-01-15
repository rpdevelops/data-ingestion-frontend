/**
 * AWS Cognito Authentication Utilities
 * 
 * This module provides authentication functions for AWS Cognito
 * using OAuth2 Authorization Code Flow and JWT token validation.
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType, GlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cookies } from "next/headers";

// Cognito configuration from environment variables
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_REGION = process.env.COGNITO_REGION || "us-east-1";

// Initialize Cognito client (only if env vars are set)
let cognitoClient: CognitoIdentityProviderClient | null = null;
let jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

if (COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID) {
  cognitoClient = new CognitoIdentityProviderClient({
    region: COGNITO_REGION,
  });

  // JWT verifier for validating tokens
  jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USER_POOL_ID,
    tokenUse: "access",
    clientId: COGNITO_CLIENT_ID,
  });
}

/**
 * Authenticate user with email and password
 * Returns access token, ID token, and refresh token
 * 
 * @throws {Error} If authentication fails or new password is required
 */
export async function signIn(email: string, password: string) {
  if (!cognitoClient || !COGNITO_CLIENT_ID) {
    throw new Error("Cognito is not configured. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.");
  }

  try {
    const command = new InitiateAuthCommand({
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    // Check if new password is required (common when user is created with temporary password)
    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      throw new Error(
        "NEW_PASSWORD_REQUIRED: You must change your temporary password. " +
        "Please use the script to set a permanent password or change it via AWS Console."
      );
    }

    // Check if authentication result exists
    if (!response.AuthenticationResult) {
      // Log the full response for debugging
      console.error("Cognito response without AuthenticationResult:", {
        ChallengeName: response.ChallengeName,
        ChallengeParameters: response.ChallengeParameters,
        Session: response.Session,
      });
      
      throw new Error(
        "Authentication failed: No authentication result. " +
        "This may happen if the App Client is not configured correctly. " +
        "Please ensure ALLOW_USER_PASSWORD_AUTH is enabled in your Cognito App Client settings."
      );
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken,
      expiresIn: response.AuthenticationResult.ExpiresIn,
    };
  } catch (error: any) {
    // Handle specific Cognito errors
    if (error.name === "NotAuthorizedException") {
      throw new Error("Invalid email or password");
    }
    if (error.name === "UserNotConfirmedException") {
      throw new Error("User account is not confirmed. Please verify your email address.");
    }
    if (error.name === "UserNotFoundException") {
      throw new Error("User not found. Please check your email address.");
    }
    if (error.name === "InvalidParameterException") {
      throw new Error(
        "Invalid authentication parameters. " +
        "Please ensure ALLOW_USER_PASSWORD_AUTH is enabled in your Cognito App Client."
      );
    }
    if (error.name === "InvalidPasswordException") {
      throw new Error("Password does not meet the requirements.");
    }
    
    // If it's already our custom error message, re-throw it
    if (error.message && error.message.includes("NEW_PASSWORD_REQUIRED")) {
      throw error;
    }
    
    // Generic error
    throw new Error(error.message || "Authentication failed. Please check your credentials and Cognito configuration.");
  }
}

/**
 * Sign out user from all devices
 */
export async function signOut(accessToken: string) {
  if (!cognitoClient) {
    throw new Error("Cognito is not configured.");
  }

  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Sign out failed");
  }
}

/**
 * Verify and decode JWT access token
 * Returns decoded token payload or null if invalid
 */
export async function verifyToken(token: string) {
  if (!jwtVerifier) {
    return null;
  }

  try {
    const payload = await jwtVerifier.verify(token);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get current user from JWT token stored in cookies
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("cognito_access_token")?.value;
    const idToken = cookieStore.get("cognito_id_token")?.value;

    if (!accessToken) {
      return null;
    }

    const payload = await verifyToken(accessToken);
    if (!payload) {
      return null;
    }

    // Decode ID token to get user information
    if (idToken) {
      try {
        const idTokenPayload = JSON.parse(
          Buffer.from(idToken.split(".")[1], "base64").toString()
        );
        return {
          sub: payload.sub,
          email: idTokenPayload.email || payload.username,
          username: payload.username,
          tokenUse: payload.token_use,
        };
      } catch {
        // If ID token decode fails, return basic info from access token
        return {
          sub: payload.sub,
          username: payload.username,
          tokenUse: payload.token_use,
        };
      }
    }

    return {
      sub: payload.sub,
      username: payload.username,
      tokenUse: payload.token_use,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set authentication tokens in cookies
 */
export async function setAuthCookies(
  accessToken: string,
  idToken: string,
  refreshToken?: string,
  expiresIn?: number
) {
  const cookieStore = await cookies();
  const maxAge = expiresIn || 3600; // Default 1 hour

  cookieStore.set("cognito_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  });

  cookieStore.set("cognito_id_token", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  });

  if (refreshToken) {
    cookieStore.set("cognito_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
  }
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete("cognito_access_token");
  cookieStore.delete("cognito_id_token");
  cookieStore.delete("cognito_refresh_token");
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cognito_access_token")?.value || null;
}
