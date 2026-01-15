export type JobStatus = 'PENDING' | 'PROCESSING' | 'NEEDS_REVIEW' | 'COMPLETED' | 'FAILED';

export interface Job {
  job_id: number;
  job_created_at: string; // ISO timestamp string
  job_user_id: string;
  job_original_filename: string;
  job_s3_object_key: string;
  job_status: JobStatus;
  job_total_rows: number;
  job_processed_rows: number;
  job_issue_count: number;
  job_process_start: string | null; // ISO timestamp string or null
  job_process_end: string | null; // ISO timestamp string or null
}
