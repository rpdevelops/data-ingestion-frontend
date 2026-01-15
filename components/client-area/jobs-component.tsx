"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, FilterConfig } from "@/components/data-table";
import { Job, JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IconFileText, IconClock, IconCheck, IconX, IconAlertCircle } from "@tabler/icons-react";

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MM/dd/yyyy HH:mm:ss");
  } catch {
    return dateString;
  }
}

// Helper function to get status badge variant
function getStatusBadge(status: JobStatus) {
  const variants: Record<JobStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    PENDING: { variant: "outline", icon: <IconClock className="h-3 w-3" /> },
    PROCESSING: { variant: "default", icon: <IconClock className="h-3 w-3" /> },
    NEEDS_REVIEW: { variant: "secondary", icon: <IconAlertCircle className="h-3 w-3" /> },
    COMPLETED: { variant: "default", icon: <IconCheck className="h-3 w-3" /> },
    FAILED: { variant: "destructive", icon: <IconX className="h-3 w-3" /> },
  };
  return variants[status] || variants.PENDING;
}

// Helper function to format status label
function formatStatus(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    NEEDS_REVIEW: "Needs Review",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return labels[status] || status;
}

// Calculate processing duration
function calculateDuration(start: string | null, end: string | null): string {
  if (!start) return "-";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  } else {
    return `${diffSeconds}s`;
  }
}

// Calculate progress percentage
function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((processed / total) * 100);
}

export const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "job_id",
    header: "ID",
    cell: ({ row }) => {
      return <div className="font-medium text-center">{row.getValue("job_id")}</div>;
    },
  },
  {
    accessorKey: "job_original_filename",
    header: "Filename",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center gap-2">
          <IconFileText className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[200px] truncate" title={row.getValue("job_original_filename")}>
            {row.getValue("job_original_filename")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "job_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("job_status") as JobStatus;
      const { variant, icon } = getStatusBadge(status);
      return (
        <div className="flex justify-center">
          <Badge variant={variant} className="flex items-center gap-1 w-fit">
            {icon}
            {formatStatus(status)}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "job_total_rows",
    header: "Total Rows",
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("job_total_rows")}</div>;
    },
  },
  {
    accessorKey: "job_processed_rows",
    header: "Processed",
    cell: ({ row }) => {
      const processed = row.getValue("job_processed_rows") as number;
      const total = row.original.job_total_rows;
      const progress = calculateProgress(processed, total);
      return (
        <div className="text-center">
          <div className="font-medium">{processed} / {total}</div>
          <div className="text-xs text-muted-foreground">{progress}%</div>
        </div>
      );
    },
  },
  {
    accessorKey: "job_issue_count",
    header: "Issues",
    cell: ({ row }) => {
      const count = row.getValue("job_issue_count") as number;
      return (
        <div className="flex justify-center">
          {count > 0 ? (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <IconAlertCircle className="h-3 w-3" />
              {count}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "job_created_at",
    header: "Created At",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("job_created_at"))}</div>;
    },
  },
  {
    accessorKey: "job_process_start",
    header: "Process Start",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("job_process_start"))}</div>;
    },
  },
  {
    accessorKey: "job_process_end",
    header: "Process End",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("job_process_end"))}</div>;
    },
  },
  {
    id: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = calculateDuration(
        row.original.job_process_start,
        row.original.job_process_end
      );
      return <div className="text-center">{duration}</div>;
    },
  },
  {
    accessorKey: "job_user_id",
    header: "User ID",
    cell: ({ row }) => {
      return <div className="font-mono text-sm text-center">{row.getValue("job_user_id")}</div>;
    },
  },
];

const filterConfigs: FilterConfig[] = [
  {
    field: "job_status",
    type: "select",
    label: "Status",
    options: [
      { value: "PENDING", label: "Pending" },
      { value: "PROCESSING", label: "Processing" },
      { value: "NEEDS_REVIEW", label: "Needs Review" },
      { value: "COMPLETED", label: "Completed" },
      { value: "FAILED", label: "Failed" },
    ],
  },
  {
    field: "job_created_at",
    type: "daterange",
    label: "Created Date",
    dateRangeFields: {
      start: "job_created_at_start",
      end: "job_created_at_end",
    },
  },
  {
    field: "job_original_filename",
    type: "text",
    label: "Filename",
    placeholder: "Search by filename...",
  },
  {
    field: "job_user_id",
    type: "text",
    label: "User ID",
    placeholder: "Search by user ID...",
  },
];

interface JobsComponentProps {
  jobs?: Job[];
}

export function JobsComponent({ jobs = [] }: JobsComponentProps) {
  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={jobs}
        searchFields={["job_original_filename", "job_user_id", "job_s3_object_key"]}
        searchPlaceholder="Search jobs by filename, user ID, or S3 key..."
        filters={filterConfigs}
        initialVisibleColumns={[
          "job_id",
          "job_original_filename",
          "job_status",
          "job_total_rows",
          "job_processed_rows",
          "job_issue_count",
          "job_created_at",
          "duration",
        ]}
      />
    </div>
  );
}
