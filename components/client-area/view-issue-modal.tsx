"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { IconCheck, IconX, IconMail, IconFileAlert, IconUserPlus, IconHash, IconLoader2, IconCalendar, IconUser, IconFileText } from "@tabler/icons-react";
import { getIssueDetails } from "@/actions/issues";
import { Issue, IssueType } from "@/types/issue";
import { format } from "date-fns";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface ViewIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: number;
  onResolve?: (issueId: number) => void; // Optional callback to open resolve modal
}

function getIssueTypeBadge(issueType: IssueType) {
  const variants: Record<IssueType, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className: string; label: string }> = {
    DUPLICATE_EMAIL: {
      variant: "outline",
      icon: <IconUserPlus className="h-3 w-3" />,
      className: "border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100",
      label: "Duplicate Email",
    },
    INVALID_EMAIL: {
      variant: "destructive",
      icon: <IconMail className="h-3 w-3" />,
      className: "border-red-500 text-red-700 bg-red-50 hover:bg-red-100",
      label: "Invalid Email",
    },
    EXISTING_EMAIL: {
      variant: "secondary",
      icon: <IconMail className="h-3 w-3" />,
      className: "border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
      label: "Existing Email",
    },
    MISSING_REQUIRED_FIELD: {
      variant: "outline",
      icon: <IconFileAlert className="h-3 w-3" />,
      className: "border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100",
      label: "Missing Required Field",
    },
  };
  return variants[issueType] || variants.MISSING_REQUIRED_FIELD;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "PPpp");
  } catch {
    return dateString;
  }
}

export function ViewIssueModal({ open, onOpenChange, issueId, onResolve }: ViewIssueModalProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);

  // Load issue details when modal opens
  useEffect(() => {
    if (open && issueId) {
      loadIssueDetails();
    } else {
      // Reset state when modal closes
      setIssue(null);
    }
  }, [open, issueId]);

  const loadIssueDetails = async () => {
    setLoading(true);
    try {
      const issueData = await getIssueDetails(issueId);
      setIssue(issueData);
    } catch (error) {
      console.error("Error loading issue details:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load issue details";
      // Error will be handled by parent component if needed
      console.error("Error loading issue:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!issue && !loading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-5 sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Issue Details</SheetTitle>
          <SheetDescription>
            View all details of this issue.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading issue details...</span>
          </div>
        ) : issue ? (
          <div className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconHash className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Issue ID</Label>
                  <p className="text-sm text-gray-900 mt-1">{issue.issue_id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Job ID</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    <Link 
                      href={`/client-area/processing-jobs?job_id=${issue.issues_job_id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {issue.issues_job_id}
                    </Link>
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <div className="mt-1">
                    {(() => {
                      const { variant, icon, className, label } = getIssueTypeBadge(issue.issue_type);
                      return (
                        <Badge variant={variant} className={`flex items-center gap-1 w-fit border ${className}`}>
                          {icon}
                          {label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">
                    {issue.issue_resolved ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                        <IconCheck className="h-3 w-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit border-red-500 text-red-700 bg-red-50 hover:bg-red-100">
                        <IconX className="h-3 w-3" />
                        Unresolved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {issue.issue_description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-sm text-gray-900 mt-1">{issue.issue_description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Timestamps
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created At</Label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-gray-400" />
                    {formatDate(issue.issue_created_at)}
                  </p>
                </div>

                {issue.issue_resolved_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Resolved At</Label>
                    <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-gray-400" />
                      {formatDate(issue.issue_resolved_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {issue.issue_resolved && (
              <>
                <Separator />

                {/* Resolution Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IconCheck className="h-5 w-5 text-green-600" />
                    Resolution Information
                  </h3>
                  
                  {issue.issue_resolved_by && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <IconUser className="h-4 w-4" />
                        Resolved By
                      </Label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{issue.issue_resolved_by}</p>
                    </div>
                  )}

                  {issue.issue_resolution_comment && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <IconFileText className="h-4 w-4" />
                        Resolution Comment
                      </Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{issue.issue_resolution_comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Affected Rows */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconHash className="h-5 w-5" />
                Affected Rows ({issue.affected_rows?.length || 0})
              </h3>
              
              {issue.affected_rows && issue.affected_rows.length > 0 ? (
                <div className="space-y-3">
                  {issue.affected_rows.map((row, index) => (
                    <div key={row.staging_id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <IconHash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Row {index + 1} - Staging ID: {row.staging_id}</span>
                        {row.staging_status && (
                          <Badge variant="outline" className="ml-auto">
                            {row.staging_status}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">Email:</span>
                          <p className="text-gray-900 mt-1">{row.staging_email || "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">First Name:</span>
                          <p className="text-gray-900 mt-1">{row.staging_first_name || "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Last Name:</span>
                          <p className="text-gray-900 mt-1">{row.staging_last_name || "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Company:</span>
                          <p className="text-gray-900 mt-1">{row.staging_company || "-"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Created At:</span>
                          <p className="text-gray-900 mt-1">{formatDate(row.staging_created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No affected rows found.</p>
              )}
            </div>
          </div>
        ) : null}

        <SheetFooter className="mt-6 gap-2">
          {!issue?.issue_resolved && issue?.affected_rows && issue?.affected_rows.length > 0 && onResolve && (
            <Button 
              onClick={() => {
                onOpenChange(false);
                onResolve(issueId);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <IconCheck className="mr-2 h-4 w-4" />
              Resolve Issue
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
