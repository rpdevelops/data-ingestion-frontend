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
  const jobs: Job[] = data.jobs.map((job: unknown) => {
    const jobData = job as Record<string, unknown>;
    return {
      job_id: jobData.job_id as number,
      job_created_at: jobData.job_created_at as string,
      job_user_id: jobData.job_user_id as string,
      job_original_filename: jobData.job_original_filename as string,
      job_s3_object_key: jobData.job_s3_object_key as string,
      job_status: jobData.job_status as string,
      job_total_rows: jobData.job_total_rows as number,
      job_processed_rows: jobData.job_processed_rows as number,
      job_issue_count: jobData.job_issue_count as number,
      job_process_start: (jobData.job_process_start as string | null) || null,
      job_process_end: (jobData.job_process_end as string | null) || null,
    };
  });

  return {
    jobs,
    total: data.total ?? jobs.length,
  };
}
