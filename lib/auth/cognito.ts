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
 * Returns user info including groups/roles from Cognito
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

    // Extract groups/roles from access token
    // Cognito Groups are the correct way to implement user authorization/roles
    // Groups appear as 'cognito:groups' in the access token
    // Note: This is different from IAM roles (which are for AWS resource access)
    // IAM roles are used by backend services, not for user authorization
    const groups = (payload as any)['cognito:groups'] || [];
    const roles = groups; // Groups are used as roles/authorization in Cognito

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
          roles: roles as string[],
          groups: groups as string[],
        };
      } catch {
        // If ID token decode fails, return basic info from access token
        return {
          sub: payload.sub,
          username: payload.username,
          tokenUse: payload.token_use,
          roles: roles as string[],
          groups: groups as string[],
        };
      }
    }

    return {
      sub: payload.sub,
      username: payload.username,
      tokenUse: payload.token_use,
      roles: roles as string[],
      groups: groups as string[],
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get the allowed group from environment variable
 * Defaults to "uploader" if not set
 */
export function getAllowedGroup(): string {
  return process.env.ALLOWED_GROUP || "uploader";
}

/**
 * Check if user has the allowed role (group) from environment variable
 * 
 * This checks Cognito Groups, which is the correct way to implement
 * user authorization in Cognito. Groups appear in JWT as 'cognito:groups'.
 * 
 * Note: This is NOT checking IAM roles. IAM roles are for AWS resource
 * access (used by backend services), not for user authorization.
 */
export async function hasAllowedRole(): Promise<boolean> {
  const allowedGroup = getAllowedGroup();
  const user = await getCurrentUser();
  if (!user || !user.roles) {
    return false;
  }
  return user.roles.includes(allowedGroup);
}

/**
 * Check if user has a specific role (group)
 * 
 * This checks Cognito Groups, which is the correct way to implement
 * user authorization in Cognito. Groups appear in JWT as 'cognito:groups'.
 * 
 * Note: This is NOT checking IAM roles. IAM roles are for AWS resource
 * access (used by backend services), not for user authorization.
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.roles) {
    return false;
  }
  return user.roles.includes(requiredRole);
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
 * Note: This function only reads the token - it does NOT refresh expired tokens
 * Token refresh should be handled in Server Actions before making API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cognito_access_token")?.value || null;
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cognito_refresh_token")?.value || null;
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpiredOrExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    
    if (!payload.exp) {
      return true; // If no expiration, assume expired
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    // Token is expired or will expire within 5 minutes
    return expirationTime <= (currentTime + fiveMinutesInMs);
  } catch {
    return true; // If we can't parse, assume expired
  }
}

/**
 * Get ID token from cookies
 * The ID token contains the "aud" claim required by the backend
 * Note: This function only reads the token - it does NOT refresh expired tokens
 * Token refresh should be handled in Server Actions before making API calls
 */
export async function getIdToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("cognito_id_token")?.value || null;
}
