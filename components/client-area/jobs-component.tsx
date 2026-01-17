"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, FilterConfig } from "@/components/data-table";
import { Job, JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IconFileText, IconClock, IconCheck, IconX, IconAlertCircle, IconTrash } from "@tabler/icons-react";
import { getJobs, cancelJob } from "@/actions/jobs";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MM/dd/yyyy HH:mm:ss");
  } catch {
    return dateString;
  }
}

// Helper function to get status badge variant with semantic colors
function getStatusBadge(status: JobStatus) {
  const variants: Record<JobStatus, { 
    variant: "default" | "secondary" | "destructive" | "outline"; 
    icon: React.ReactNode;
    className: string;
  }> = {
    PENDING: { 
      variant: "outline", 
      icon: <IconClock className="h-3 w-3" />,
      className: "border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100"
    },
    PROCESSING: { 
      variant: "default", 
      icon: <IconClock className="h-3 w-3" />,
      className: "border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100"
    },
    NEEDS_REVIEW: { 
      variant: "secondary", 
      icon: <IconAlertCircle className="h-3 w-3" />,
      className: "border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100"
    },
    COMPLETED: { 
      variant: "default", 
      icon: <IconCheck className="h-3 w-3" />,
      className: "border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
    },
    FAILED: { 
      variant: "destructive", 
      icon: <IconX className="h-3 w-3" />,
      className: "border-red-500 text-red-700 bg-red-50 hover:bg-red-100"
    },
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

// Cancel Job Button Component
function CancelJobButton({
  job,
  isCanceling,
  onCancel,
  open,
  onOpenChange,
}: {
  job: Job;
  isCanceling: boolean;
  onCancel: (jobId: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleConfirmCancel = () => {
    onCancel(job.job_id);
    onOpenChange(false);
  };

  return (
    <div className="flex justify-center">
      <Button
        variant="destructive"
        size="sm"
        disabled={isCanceling}
        className="h-7 px-3 text-xs"
        onClick={() => onOpenChange(true)}
      >
        {isCanceling ? (
          <>
            <IconClock className="h-3 w-3 mr-1 animate-spin" />
            Canceling...
          </>
        ) : (
          <>
            <IconTrash className="h-3 w-3 mr-1" />
            Cancel Import
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Import?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this import? This action cannot be undone.
              <br />
              <br />
              <strong>Job ID:</strong> {job.job_id}
              <br />
              <strong>Filename:</strong> {job.job_original_filename}
              <br />
              <strong>Status:</strong> {formatStatus(job.job_status)}
              <br />
              <br />
              This will permanently delete the job, all related staging records, issues, and the CSV file from S3.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <IconClock className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <IconTrash className="h-4 w-4 mr-2" />
                  Cancel Import
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Create columns with actions (with closure for cancel handler)
function createColumns(
  cancelingJobId: number | null,
  onCancel: (jobId: number) => void,
  openDialogJobId: number | null,
  onOpenChange: (jobId: number | null) => void
): ColumnDef<Job>[] {
  return [
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
      const { variant, icon, className } = getStatusBadge(status);
      return (
        <div className="flex justify-center">
          <Badge variant={variant} className={`flex items-center gap-1 w-fit border ${className}`}>
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
      const jobId = row.original.job_id;
      return (
        <div className="flex justify-center">
          {count > 0 ? (
            <Link
              href={`/client-area/jobs/${jobId}/issues`}
              className="cursor-pointer"
            >
              <Badge variant="destructive" className="flex items-center gap-1 w-fit hover:bg-destructive/90 transition-colors">
                <IconAlertCircle className="h-3 w-3" />
                {count}
              </Badge>
            </Link>
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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original;
      const status = job.job_status;
      const canCancel = status === "PENDING" || status === "NEEDS_REVIEW" || status === "FAILED";
      const isCanceling = cancelingJobId === job.job_id;

      if (!canCancel) {
        return <div className="text-center"><span className="text-muted-foreground text-sm">-</span></div>;
      }

      return (
        <CancelJobButton
          job={job}
          isCanceling={isCanceling}
          onCancel={onCancel}
          open={openDialogJobId === job.job_id}
          onOpenChange={(open) => onOpenChange(open ? job.job_id : null)}
        />
      );
    },
  },
  ];
}

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
  initialJobs?: Job[];
}

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

export function JobsComponent({ initialJobs = [] }: JobsComponentProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [cancelingJobId, setCancelingJobId] = useState<number | null>(null);
  const [openDialogJobId, setOpenDialogJobId] = useState<number | null>(null);
  const errorCountRef = useRef(0);
  
  const isDialogOpen = openDialogJobId !== null;

  const fetchJobsData = useCallback(async () => {
    try {
      const response = await getJobs();
      console.log("Polling: Fetched jobs", response.jobs.length, "jobs");
      setJobs(response.jobs);
      setLastUpdate(new Date());
      // Reset error count on successful fetch
      if (errorCountRef.current > 0) {
        errorCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error fetching jobs during polling:", error);
      errorCountRef.current += 1;
      const currentErrorCount = errorCountRef.current;
      
      // Only show toast on first error or every 5 errors to avoid spam
      if (currentErrorCount === 1 || currentErrorCount % 5 === 0) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load jobs";
        toast.error("Failed to refresh jobs", {
          description: errorMessage.includes("Authentication") 
            ? "Please refresh the page and log in again."
            : "The table will continue trying to refresh automatically.",
          duration: 4000,
        });
      }
      
      // Don't stop polling on error, just log it
    }
  }, []);

  useEffect(() => {
    // Initial fetch to ensure we have the latest data
    fetchJobsData();

    // Set up polling interval
    let intervalId: NodeJS.Timeout | null = null;

    // Only poll if not paused and not in dialog
    if (isPolling && !isDialogOpen) {
      intervalId = setInterval(() => {
        fetchJobsData();
      }, POLLING_INTERVAL);
    }

    // Cleanup interval on unmount or when polling stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, isDialogOpen, fetchJobsData]);

  // Check if there are any jobs with status that might change (PENDING, PROCESSING)
  const hasActiveJobs = jobs.some(
    (job) => job.job_status === "PENDING" || job.job_status === "PROCESSING"
  );

  // Auto-enable polling if there are active jobs
  useEffect(() => {
    if (hasActiveJobs && !isPolling) {
      setIsPolling(true);
    }
  }, [hasActiveJobs, isPolling]);

  const handleCancelJob = async (jobId: number) => {
    setCancelingJobId(jobId);
    try {
      await cancelJob(jobId);
      toast.success("Job cancelled successfully", {
        description: `Job ${jobId} has been cancelled and deleted.`,
        duration: 3000,
      });
      // Refresh jobs list after successful cancellation
      await fetchJobsData();
    } catch (error) {
      console.error("Error cancelling job:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel job";
      toast.error("Error cancelling job", { description: errorMessage });
    } finally {
      setCancelingJobId(null);
    }
  };

  const columns = useMemo(
    () => createColumns(cancelingJobId, handleCancelJob, openDialogJobId, setOpenDialogJobId),
    [cancelingJobId, openDialogJobId]
  );

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
          "actions",
          "job_created_at",
          "duration",
        ]}
      />
    </div>
  );
}
