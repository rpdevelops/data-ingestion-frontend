"use server";

import { getIdToken } from "@/lib/auth/cognito";
import { Job } from "@/types/job";

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
      return "You don't have permission to upload files. Please contact an administrator.";
    case 404:
      return "Upload endpoint not found. Please contact support.";
    case 409:
      return originalMessage || "This file has already been uploaded.";
    case 413:
      return "File is too large. Maximum size is 5MB.";
    case 415:
      return "Invalid file type. Please upload a CSV file.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later or contact support.";
    default:
      return originalMessage || "An unexpected error occurred. Please try again.";
  }
}

export interface UploadResponse {
  job_id: number;
  message: string;
  filename: string;
  total_rows: number;
}

export interface JobsApiResponse {
  jobs: Job[];
  total: number;
}

/**
 * Server Action to fetch all jobs from the backend API
 * Can be used in both Server Components and Client Components
 */
export async function getJobs(): Promise<JobsApiResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/jobs`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch jobs: ${response.status} ${response.statusText}`;
    
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

  if (!Array.isArray(data.jobs)) {
    throw new Error("Response does not contain a jobs array");
  }

  // Transform the response to match our Job type
  const jobs: Job[] = data.jobs.map((job: any) => ({
    job_id: job.job_id,
    job_created_at: job.job_created_at,
    job_user_id: job.job_user_id,
    job_original_filename: job.job_original_filename,
    job_s3_object_key: job.job_s3_object_key,
    job_status: job.job_status,
    job_total_rows: job.job_total_rows,
    job_processed_rows: job.job_processed_rows,
    job_issue_count: job.job_issue_count,
    job_process_start: job.job_process_start || null,
    job_process_end: job.job_process_end || null,
  }));

  return {
    jobs,
    total: data.total ?? jobs.length,
  };
}

/**
 * Server Action to upload a CSV file to the backend API
 * Requires authentication via JWT token and "uploader" group
 */
export async function uploadCSV(formData: FormData): Promise<UploadResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Create new FormData for the API request
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  const response = await fetch(`${API_URL}/jobs/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      // Don't set Content-Type header - let fetch set it with boundary for FormData
    },
    body: uploadFormData,
  });

  if (!response.ok) {
    let errorMessage = `Failed to upload file: ${response.status} ${response.statusText}`;
    
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
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else {
        // If not JSON, try to read as text
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
  return data;
}
