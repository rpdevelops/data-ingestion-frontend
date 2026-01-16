export type IssueType = 'DUPLICATE_EMAIL' | 'INVALID_EMAIL' | 'EXISTING_EMAIL' | 'MISSING_REQUIRED_FIELD';

export type StagingStatus = 'READY' | 'SUCCESS' | 'DISCARD' | 'ISSUE';

export interface StagingRow {
  staging_id: number;
  staging_email: string | null;
  staging_first_name: string | null;
  staging_last_name: string | null;
  staging_company: string | null;
  staging_created_at: string; // ISO timestamp string
  staging_status: StagingStatus | null;
}

export interface Issue {
  issue_id: number;
  issues_job_id: number;
  issue_type: IssueType;
  issue_resolved: boolean;
  issue_description: string | null;
  issue_resolved_at: string | null; // ISO timestamp string or null
  issue_resolved_by: string | null;
  issue_resolution_comment: string | null;
  issue_created_at: string; // ISO timestamp string
  affected_rows: StagingRow[];
}

export interface IssuesApiResponse {
  issues: Issue[];
  total: number;
  resolved_count: number;
  unresolved_count: number;
}
