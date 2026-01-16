"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, FilterConfig } from "@/components/data-table";
import { Issue, IssueType } from "@/types/issue";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IconAlertCircle, IconCheck, IconX, IconMail, IconFileAlert, IconUserPlus, IconHash } from "@tabler/icons-react";
import { getIssues, getIssuesByJobId } from "@/actions/issues";
import { toast } from "sonner";
import Link from "next/link";

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MM/dd/yyyy HH:mm:ss");
  } catch {
    return dateString;
  }
}

// Helper function to get issue type badge
function getIssueTypeBadge(issueType: IssueType) {
  const variants: Record<IssueType, { 
    variant: "default" | "secondary" | "destructive" | "outline"; 
    icon: React.ReactNode;
    className: string;
    label: string;
  }> = {
    DUPLICATE_EMAIL: { 
      variant: "outline", 
      icon: <IconUserPlus className="h-3 w-3" />,
      className: "border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100",
      label: "Duplicate Email"
    },
    INVALID_EMAIL: { 
      variant: "destructive", 
      icon: <IconMail className="h-3 w-3" />,
      className: "border-red-500 text-red-700 bg-red-50 hover:bg-red-100",
      label: "Invalid Email"
    },
    EXISTING_EMAIL: { 
      variant: "secondary", 
      icon: <IconAlertCircle className="h-3 w-3" />,
      className: "border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
      label: "Existing Email"
    },
    MISSING_REQUIRED_FIELD: { 
      variant: "outline", 
      icon: <IconFileAlert className="h-3 w-3" />,
      className: "border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100",
      label: "Missing Field"
    },
  };
  return variants[issueType] || { 
    variant: "outline" as const, 
    icon: <IconAlertCircle className="h-3 w-3" />,
    className: "border-gray-500 text-gray-700 bg-gray-50 hover:bg-gray-100",
    label: issueType
  };
}

// Helper function to get resolved badge
function getResolvedBadge(resolved: boolean) {
  if (resolved) {
    return {
      variant: "default" as const,
      icon: <IconCheck className="h-3 w-3" />,
      className: "border-green-500 text-green-700 bg-green-50 hover:bg-green-100",
      label: "Resolved"
    };
  }
  return {
    variant: "destructive" as const,
    icon: <IconX className="h-3 w-3" />,
    className: "border-red-500 text-red-700 bg-red-50 hover:bg-red-100",
    label: "Unresolved"
  };
}

export const columns: ColumnDef<Issue>[] = [
  {
    accessorKey: "issue_id",
    header: "ID",
    cell: ({ row }) => {
      return <div className="font-medium text-center">{row.getValue("issue_id")}</div>;
    },
  },
  {
    accessorKey: "issues_job_id",
    header: "Job ID",
    cell: ({ row }) => {
      const jobId = row.getValue("issues_job_id") as number;
      return (
        <div className="text-center">
          <Link 
            href={`/client-area/processing-jobs?job_id=${jobId}`}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {jobId}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "issue_type",
    header: "Type",
    cell: ({ row }) => {
      const issueType = row.getValue("issue_type") as IssueType;
      const { variant, icon, className, label } = getIssueTypeBadge(issueType);
      return (
        <div className="flex justify-center">
          <Badge variant={variant} className={`flex items-center gap-1 w-fit border ${className}`}>
            {icon}
            {label}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "issue_resolved",
    header: "Status",
    cell: ({ row }) => {
      const resolved = row.getValue("issue_resolved") as boolean;
      const { variant, icon, className, label } = getResolvedBadge(resolved);
      return (
        <div className="flex justify-center">
          <Badge variant={variant} className={`flex items-center gap-1 w-fit border ${className}`}>
            {icon}
            {label}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "issue_description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("issue_description") as string | null;
      return (
        <div className="text-center max-w-[300px]">
          {description ? (
            <span 
              className="truncate block" 
              title={description}
            >
              {description}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    id: "affected_rows_count",
    header: "Affected Rows",
    cell: ({ row }) => {
      const affectedRows = row.original.affected_rows || [];
      return (
        <div className="text-center">
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <IconHash className="h-3 w-3" />
            {affectedRows.length}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "issue_created_at",
    header: "Created At",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("issue_created_at"))}</div>;
    },
  },
  {
    accessorKey: "issue_resolved_at",
    header: "Resolved At",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("issue_resolved_at"))}</div>;
    },
  },
  {
    accessorKey: "issue_resolved_by",
    header: "Resolved By",
    cell: ({ row }) => {
      const resolvedBy = row.getValue("issue_resolved_by") as string | null;
      return (
        <div className="text-center">
          {resolvedBy ? (
            <span className="font-mono text-sm">{resolvedBy}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
];

const filterConfigs: FilterConfig[] = [
  {
    field: "issue_type",
    type: "select",
    label: "Type",
    options: [
      { value: "DUPLICATE_EMAIL", label: "Duplicate Email" },
      { value: "INVALID_EMAIL", label: "Invalid Email" },
      { value: "EXISTING_EMAIL", label: "Existing Email" },
      { value: "MISSING_REQUIRED_FIELD", label: "Missing Field" },
    ],
  },
  {
    field: "issue_resolved",
    type: "select",
    label: "Status",
    options: [
      { value: "true", label: "Resolved" },
      { value: "false", label: "Unresolved" },
    ],
  },
  {
    field: "issues_job_id",
    type: "text",
    label: "Job ID",
    placeholder: "Search by job ID...",
  },
  {
    field: "issue_created_at",
    type: "daterange",
    label: "Created Date",
    dateRangeFields: {
      start: "issue_created_at_start",
      end: "issue_created_at_end",
    },
  },
];

interface IssuesComponentProps {
  initialIssues?: Issue[];
  jobId?: number; // Optional job ID - if provided, fetches issues for that job only
}

// Polling interval in milliseconds (10 seconds for issues - less frequent than jobs)
const POLLING_INTERVAL = 10000;

export function IssuesComponent({ initialIssues = [], jobId }: IssuesComponentProps) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [isPolling, setIsPolling] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    unresolved: 0,
  });
  const errorCountRef = useRef(0);

  const fetchIssuesData = useCallback(async () => {
    try {
      const response = jobId 
        ? await getIssuesByJobId(jobId)
        : await getIssues();
      console.log("Polling: Fetched issues", response.issues.length, "issues", jobId ? `for job ${jobId}` : "");
      setIssues(response.issues);
      setStats({
        total: response.total,
        resolved: response.resolved_count,
        unresolved: response.unresolved_count,
      });
      // Reset error count on successful fetch
      if (errorCountRef.current > 0) {
        errorCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error fetching issues during polling:", error);
      errorCountRef.current += 1;
      const currentErrorCount = errorCountRef.current;
      
      // Only show toast on first error or every 5 errors to avoid spam
      if (currentErrorCount === 1 || currentErrorCount % 5 === 0) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load issues";
        toast.error("Failed to refresh issues", {
          description: errorMessage.includes("Authentication") 
            ? "Please refresh the page and log in again."
            : "The table will continue trying to refresh automatically.",
          duration: 4000,
        });
      }
    }
  }, [jobId]);

  useEffect(() => {
    // Initial fetch to ensure we have the latest data
    fetchIssuesData();

    // Set up polling interval
    let intervalId: NodeJS.Timeout | null = null;

    if (isPolling) {
      intervalId = setInterval(() => {
        fetchIssuesData();
      }, POLLING_INTERVAL);
    }

    // Cleanup interval on unmount or when polling stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, fetchIssuesData]);

  // Check if there are any unresolved issues
  const hasUnresolvedIssues = stats.unresolved > 0;

  // Auto-enable polling if there are unresolved issues
  useEffect(() => {
    if (hasUnresolvedIssues && !isPolling) {
      setIsPolling(true);
    }
  }, [hasUnresolvedIssues, isPolling]);

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total Issues</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700 mb-1">Resolved</div>
          <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700 mb-1">Unresolved</div>
          <div className="text-2xl font-bold text-red-700">{stats.unresolved}</div>
        </div>
      </div>

      {/* Issues Table */}
      <DataTable
        columns={columns}
        data={issues}
        searchFields={["issue_description", "issue_resolved_by", "issues_job_id"]}
        searchPlaceholder="Search issues by description, resolved by, or job ID..."
        filters={filterConfigs.filter(filter => jobId ? filter.field !== "issues_job_id" : true)}
        initialVisibleColumns={
          jobId
            ? [
                "issue_id",
                "issue_type",
                "issue_resolved",
                "issue_description",
                "affected_rows_count",
                "issue_created_at",
                "issue_resolved_at",
              ]
            : [
                "issue_id",
                "issues_job_id",
                "issue_type",
                "issue_resolved",
                "issue_description",
                "affected_rows_count",
                "issue_created_at",
                "issue_resolved_at",
              ]
        }
      />
    </div>
  );
}
