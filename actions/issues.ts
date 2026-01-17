"use server";

import { getIdToken } from "@/lib/auth/cognito";
import { Issue, IssuesApiResponse } from "@/types/issue";

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
      return "You don't have permission to access this resource. Please contact an administrator.";
    case 404:
      return "Resource not found. Please contact support.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later or contact support.";
    default:
      return originalMessage || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Server Action to fetch all issues from the backend API
 * Can be used in both Server Components and Client Components
 */
export async function getIssues(): Promise<IssuesApiResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/issues`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch issues: ${response.status} ${response.statusText}`;
    
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

  if (!Array.isArray(data.issues)) {
    throw new Error("Response does not contain an issues array");
  }

  // Transform the response to match our Issue type
  const issues: Issue[] = (data.issues || []).map((issue: any) => ({
    issue_id: issue.issue_id,
    issues_job_id: issue.issues_job_id,
    issue_type: issue.issue_type,
    issue_resolved: issue.issue_resolved,
    issue_description: issue.issue_description || null,
    issue_resolved_at: issue.issue_resolved_at || null,
    issue_resolved_by: issue.issue_resolved_by || null,
    issue_resolution_comment: issue.issue_resolution_comment || null,
    issue_created_at: issue.issue_created_at,
    affected_rows: (issue.affected_rows || []).map((row: any) => ({
      staging_id: row.staging_id,
      staging_email: row.staging_email || null,
      staging_first_name: row.staging_first_name || null,
      staging_last_name: row.staging_last_name || null,
      staging_company: row.staging_company || null,
      staging_created_at: row.staging_created_at,
      staging_status: row.staging_status || null,
    })),
  }));

  return {
    issues,
    total: data.total ?? issues.length,
    resolved_count: data.resolved_count ?? 0,
    unresolved_count: data.unresolved_count ?? 0,
  };
}

export interface UpdateIssueRequest {
  issue_resolved?: boolean;
  issue_description?: string | null;
  issue_resolved_by?: string | null;
  issue_resolution_comment?: string | null;
}

export interface IssueUpdateResponse {
  issue_id: number;
  issues_job_id: number;
  issue_type: string;
  issue_resolved: boolean;
  issue_description: string | null;
  issue_resolved_at: string | null;
  issue_resolved_by: string | null;
  issue_resolution_comment: string | null;
  issue_created_at: string;
  affected_rows: any[];
}

/**
 * Server Action to update an issue
 * Requires "editor" group in Cognito
 */
export async function updateIssue(
  issueId: number,
  updateData: UpdateIssueRequest
): Promise<IssueUpdateResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  // Build request body with only provided fields
  const requestBody: any = {};
  if (updateData.issue_resolved !== undefined) {
    requestBody.issue_resolved = updateData.issue_resolved;
  }
  if (updateData.issue_description !== undefined) {
    requestBody.issue_description = updateData.issue_description;
  }
  if (updateData.issue_resolved_by !== undefined) {
    requestBody.issue_resolved_by = updateData.issue_resolved_by;
  }
  if (updateData.issue_resolution_comment !== undefined) {
    requestBody.issue_resolution_comment = updateData.issue_resolution_comment;
  }

  const response = await fetch(`${API_URL}/issues/${issueId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to update issue: ${response.status} ${response.statusText}`;
    
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
    issue_id: data.issue_id,
    issues_job_id: data.issues_job_id,
    issue_type: data.issue_type,
    issue_resolved: data.issue_resolved,
    issue_description: data.issue_description || null,
    issue_resolved_at: data.issue_resolved_at || null,
    issue_resolved_by: data.issue_resolved_by || null,
    issue_resolution_comment: data.issue_resolution_comment || null,
    issue_created_at: data.issue_created_at,
    affected_rows: data.affected_rows || [],
  };
}

/**
 * Server Action to fetch issue details by ID from the backend API
 */
export async function getIssueDetails(issueId: number): Promise<Issue> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/issues/${issueId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch issue details: ${response.status} ${response.statusText}`;
    
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

  if (!Array.isArray(data.affected_rows)) {
    throw new Error("Response does not contain an affected_rows array");
  }

  // Transform the response to match our Issue type
  return {
    issue_id: data.issue_id,
    issues_job_id: data.issues_job_id,
    issue_type: data.issue_type,
    issue_resolved: data.issue_resolved,
    issue_description: data.issue_description || null,
    issue_resolved_at: data.issue_resolved_at || null,
    issue_resolved_by: data.issue_resolved_by || null,
    issue_resolution_comment: data.issue_resolution_comment || null,
    issue_created_at: data.issue_created_at,
    affected_rows: (data.affected_rows || []).map((row: any) => ({
      staging_id: row.staging_id,
      staging_email: row.staging_email || null,
      staging_first_name: row.staging_first_name || null,
      staging_last_name: row.staging_last_name || null,
      staging_company: row.staging_company || null,
      staging_created_at: row.staging_created_at,
      staging_status: row.staging_status || null,
    })),
  };
}

/**
 * Server Action to fetch issues for a specific job from the backend API
 * Can be used in both Server Components and Client Components
 */
export async function getIssuesByJobId(jobId: number): Promise<IssuesApiResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/issues/job/${jobId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch issues: ${response.status} ${response.statusText}`;
    
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

  if (!Array.isArray(data.issues)) {
    throw new Error("Response does not contain an issues array");
  }

  // Transform the response to match our Issue type
  const issues: Issue[] = (data.issues || []).map((issue: any) => ({
    issue_id: issue.issue_id,
    issues_job_id: issue.issues_job_id,
    issue_type: issue.issue_type,
    issue_resolved: issue.issue_resolved,
    issue_description: issue.issue_description || null,
    issue_resolved_at: issue.issue_resolved_at || null,
    issue_resolved_by: issue.issue_resolved_by || null,
    issue_resolution_comment: issue.issue_resolution_comment || null,
    issue_created_at: issue.issue_created_at,
    affected_rows: (issue.affected_rows || []).map((row: any) => ({
      staging_id: row.staging_id,
      staging_email: row.staging_email || null,
      staging_first_name: row.staging_first_name || null,
      staging_last_name: row.staging_last_name || null,
      staging_company: row.staging_company || null,
      staging_created_at: row.staging_created_at,
      staging_status: row.staging_status || null,
    })),
  }));

  return {
    issues,
    total: data.total ?? issues.length,
    resolved_count: data.resolved_count ?? 0,
    unresolved_count: data.unresolved_count ?? 0,
  };
}
