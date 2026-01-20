"use server";

import { getIdTokenWithRefresh } from "@/actions/auth";
import { Issue, StagingRow, StagingStatus } from "@/types/issue";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Convert HTTP error status and message to user-friendly error message
 */
function getFriendlyErrorMessage(status: number, originalMessage: string): string {
  switch (status) {
    case 400:
      return `Invalid request: ${originalMessage}`;
    case 401:
      return "Authentication failed. Please log in again.";
    case 403:
      return "You don't have permission to update staging records. You need to be in the 'editor' group.";
    case 404:
      return "Staging record not found. Please contact support.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later or contact support.";
    default:
      return originalMessage || "An unexpected error occurred. Please try again.";
  }
}

export interface UpdateStagingRequest {
  staging_email?: string | null;
  staging_first_name?: string | null;
  staging_last_name?: string | null;
  staging_company?: string | null;
  staging_status?: StagingStatus;
}

export interface StagingUpdateResponse {
  staging_id: number;
  staging_job_id: number;
  staging_email: string | null;
  staging_first_name: string | null;
  staging_last_name: string | null;
  staging_company: string | null;
  staging_created_at: string;
  staging_status: StagingStatus | null;
}

/**
 * Server Action to update a staging record
 * Requires "editor" group in Cognito
 */
export async function updateStaging(
  stagingId: number,
  updateData: UpdateStagingRequest
): Promise<StagingUpdateResponse> {
  const idToken = await getIdTokenWithRefresh();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  // Build request body with only provided fields
  const requestBody: any = {};
  if (updateData.staging_email !== undefined) {
    requestBody.staging_email = updateData.staging_email;
  }
  if (updateData.staging_first_name !== undefined) {
    requestBody.staging_first_name = updateData.staging_first_name;
  }
  if (updateData.staging_last_name !== undefined) {
    requestBody.staging_last_name = updateData.staging_last_name;
  }
  if (updateData.staging_company !== undefined) {
    requestBody.staging_company = updateData.staging_company;
  }
  if (updateData.staging_status !== undefined) {
    requestBody.staging_status = updateData.staging_status;
  }

  const response = await fetch(`${API_URL}/staging/${stagingId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to update staging: ${response.status} ${response.statusText}`;
    
    // Read the response body only once
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    
    try {
      if (isJson) {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      // If we can't parse the error, use the default message
      console.error("Error parsing error response:", parseError);
    }
    
    // Create a user-friendly error message
    const friendlyMessage = getFriendlyErrorMessage(response.status, errorMessage);
    throw new Error(friendlyMessage);
  }

  const data = await response.json();

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format from API");
  }

  return {
    staging_id: data.staging_id,
    staging_job_id: data.staging_job_id,
    staging_email: data.staging_email || null,
    staging_first_name: data.staging_first_name || null,
    staging_last_name: data.staging_last_name || null,
    staging_company: data.staging_company || null,
    staging_created_at: data.staging_created_at,
    staging_status: data.staging_status || null,
  };
}
