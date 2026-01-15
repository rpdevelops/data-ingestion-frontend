/**
 * API client for jobs endpoints
 */
import { getIdToken } from "@/lib/auth/cognito";
import { Job } from "@/types/job";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface JobsApiResponse {
  jobs: Job[];
  total: number;
}

/**
 * Fetch all jobs from the backend API
 * Requires authentication via JWT token
 * 
 * Note: Uses ID Token instead of Access Token because the backend
 * validates the token with audience=CLIENT_ID, which is present
 * in the ID Token but not always in the Access Token.
 */
export async function fetchJobs(): Promise<JobsApiResponse> {
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
    // Disable caching for server-side requests
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch jobs: ${response.status} ${response.statusText}. ${errorText}`
    );
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
  // The API returns datetime objects that are serialized as ISO strings
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
