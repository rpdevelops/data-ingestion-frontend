"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconCheck, IconX, IconMail, IconFileAlert, IconUserPlus, IconHash, IconLoader2 } from "@tabler/icons-react";
import { getIssueDetails, updateIssue } from "@/actions/issues";
import { getContactByEmail, Contact } from "@/actions/contacts";
import { updateStaging } from "@/actions/staging";
import { getCurrentUserEmail } from "@/actions/auth";
import { Issue, IssueType, StagingRow, StagingStatus } from "@/types/issue";
import { toast } from "sonner";
import { format } from "date-fns";

interface ResolveIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: number;
  onResolved?: () => void;
}

function getIssueTypeBadge(issueType: IssueType) {
  const variants: Record<IssueType, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className: string; label: string }> = {
    DUPLICATE_EMAIL: {
      variant: "destructive",
      icon: <IconMail className="h-3 w-3" />,
      className: "bg-red-50 text-red-700 border-red-200",
      label: "Duplicate Email",
    },
    INVALID_EMAIL: {
      variant: "destructive",
      icon: <IconMail className="h-3 w-3" />,
      className: "bg-orange-50 text-orange-700 border-orange-200",
      label: "Invalid Email",
    },
    EXISTING_EMAIL: {
      variant: "secondary",
      icon: <IconUserPlus className="h-3 w-3" />,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      label: "Existing Email",
    },
    MISSING_REQUIRED_FIELD: {
      variant: "secondary",
      icon: <IconFileAlert className="h-3 w-3" />,
      className: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Missing Required Field",
    },
  };
  return variants[issueType] || variants.MISSING_REQUIRED_FIELD;
}

export function ResolveIssueModal({ open, onOpenChange, issueId, onResolved }: ResolveIssueModalProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [existingContact, setExistingContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<number, Partial<StagingRow>>>({});
  const [selectedStagingId, setSelectedStagingId] = useState<number | null>(null); // For DUPLICATE_EMAIL
  const [emailInputs, setEmailInputs] = useState<Record<number, string>>({});

  // Load issue details when modal opens
  useEffect(() => {
    if (open && issueId) {
      loadIssueDetails();
    } else {
      // Reset state when modal closes
      setIssue(null);
      setExistingContact(null);
      setFormData({});
      setSelectedStagingId(null);
      setEmailInputs({});
    }
  }, [open, issueId]);

  const loadIssueDetails = async () => {
    setLoading(true);
    try {
      const issueData = await getIssueDetails(issueId);
      setIssue(issueData);

      // Initialize form data with existing values
      const initialFormData: Record<number, Partial<StagingRow>> = {};
      issueData.affected_rows.forEach((row) => {
        initialFormData[row.staging_id] = {
          staging_email: row.staging_email,
          staging_first_name: row.staging_first_name,
          staging_last_name: row.staging_last_name,
          staging_company: row.staging_company,
        };
      });
      setFormData(initialFormData);

      // For EXISTING_EMAIL, fetch the existing contact
      if (issueData.issue_type === "EXISTING_EMAIL" && issueData.affected_rows.length > 0) {
        const email = issueData.affected_rows[0].staging_email;
        if (email) {
          try {
            const contact = await getContactByEmail(email);
            setExistingContact(contact);
            // Don't initialize emailInputs with the original email - leave it empty
            // so we can detect when user actually changes it
            setEmailInputs({});
          } catch (error) {
            console.error("Error fetching contact:", error);
            // Contact might not exist, which is fine
          }
        }
      }

      // For DUPLICATE_EMAIL, select the first one by default
      if (issueData.issue_type === "DUPLICATE_EMAIL" && issueData.affected_rows.length > 0) {
        setSelectedStagingId(issueData.affected_rows[0].staging_id);
      }

      // Initialize email inputs for INVALID_EMAIL
      if (issueData.issue_type === "INVALID_EMAIL") {
        const emailInputsInit: Record<number, string> = {};
        issueData.affected_rows.forEach((row) => {
          emailInputsInit[row.staging_id] = row.staging_email || "";
        });
        setEmailInputs(emailInputsInit);
      }
    } catch (error) {
      console.error("Error loading issue details:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load issue details";
      toast.error("Error loading issue", { description: errorMessage });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (stagingId: number, field: keyof StagingRow, value: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [stagingId]: {
        ...prev[stagingId],
        [field]: value || null,
      },
    }));
  };

  const updateEmailInput = (stagingId: number, value: string) => {
    setEmailInputs((prev) => ({
      ...prev,
      [stagingId]: value,
    }));
    updateFormField(stagingId, "staging_email", value || null);
  };

  // Helper to check if email was changed for EXISTING_EMAIL type
  const isEmailChanged = (): boolean => {
    if (!issue || issue.issue_type !== "EXISTING_EMAIL") return true;
    const stagingId = issue.affected_rows[0]?.staging_id;
    if (!stagingId) return false;
    const originalEmail = issue.affected_rows[0]?.staging_email || "";
    // Check if emailInputs was modified (key exists means user has interacted)
    // If key doesn't exist in emailInputs, user hasn't changed it
    if (!(stagingId in emailInputs)) return false;
    const newEmail = emailInputs[stagingId] || "";
    // Compare with original (case-insensitive)
    return newEmail.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
  };

  const validateForm = (): boolean => {
    if (!issue) return false;

    if (issue.issue_type === "MISSING_REQUIRED_FIELD") {
      // Check if all NULL fields are filled
      for (const row of issue.affected_rows) {
        const formRow = formData[row.staging_id];
        if (!formRow) return false;

        // Check all fields that were NULL
        if (!row.staging_email && !formRow.staging_email) return false;
        if (!row.staging_first_name && !formRow.staging_first_name) return false;
        if (!row.staging_last_name && !formRow.staging_last_name) return false;
        if (!row.staging_company && !formRow.staging_company) return false;
      }
    }

    if (issue.issue_type === "INVALID_EMAIL") {
      // Check if email is filled and valid
      for (const row of issue.affected_rows) {
        const email = emailInputs[row.staging_id] || formData[row.staging_id]?.staging_email;
        if (!email || !email.trim()) return false;
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) return false;
      }
    }

    if (issue.issue_type === "DUPLICATE_EMAIL") {
      // Check if one is selected
      if (!selectedStagingId) return false;
    }

    if (issue.issue_type === "EXISTING_EMAIL") {
      // Check if email is provided, valid, AND different from original
      const stagingId = issue.affected_rows[0]?.staging_id;
      if (!stagingId) return false;
      const originalEmail = issue.affected_rows[0]?.staging_email || "";
      const email = emailInputs[stagingId] || formData[stagingId]?.staging_email;
      if (!email || !email.trim()) return false;
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return false;
      // Email must be different from original
      if (email.trim().toLowerCase() === originalEmail.trim().toLowerCase()) return false;
    }

    return true;
  };

  const generateResolutionComment = (): string => {
    if (!issue) return "";

    switch (issue.issue_type) {
      case "MISSING_REQUIRED_FIELD":
        const filledFields: string[] = [];
        issue.affected_rows.forEach((row) => {
          const formRow = formData[row.staging_id];
          if (formRow) {
            if (!row.staging_email && formRow.staging_email) filledFields.push(`email: ${formRow.staging_email}`);
            if (!row.staging_first_name && formRow.staging_first_name) filledFields.push(`first name: ${formRow.staging_first_name}`);
            if (!row.staging_last_name && formRow.staging_last_name) filledFields.push(`last name: ${formRow.staging_last_name}`);
            if (!row.staging_company && formRow.staging_company) filledFields.push(`company: ${formRow.staging_company}`);
          }
        });
        return `Filled missing required fields: ${filledFields.join(", ")}. All affected staging rows set to READY.`;

      case "INVALID_EMAIL":
        const updatedEmails = issue.affected_rows
          .map((row) => {
            const email = emailInputs[row.staging_id] || formData[row.staging_id]?.staging_email;
            return email ? `${row.staging_email} → ${email}` : null;
          })
          .filter(Boolean);
        return `Corrected invalid email addresses: ${updatedEmails.join("; ")}. All affected staging rows set to READY.`;

      case "DUPLICATE_EMAIL":
        const selectedRow = issue.affected_rows.find((row) => row.staging_id === selectedStagingId);
        const discardedCount = issue.affected_rows.length - 1;
        return `Selected staging ID ${selectedStagingId} (email: ${selectedRow?.staging_email || "N/A"}) to keep. Discarded ${discardedCount} duplicate row(s). Selected row set to READY, others to DISCARD.`;

      case "EXISTING_EMAIL":
        const stagingId = issue.affected_rows[0]?.staging_id;
        const newEmail = stagingId ? (emailInputs[stagingId] || formData[stagingId]?.staging_email) : null;
        const oldEmail = issue.affected_rows[0]?.staging_email;
        return `Updated email address from ${oldEmail || "N/A"} to ${newEmail || "N/A"} to avoid conflict with existing contact. Staging row set to READY.`;

      default:
        return "Issue resolved manually.";
    }
  };

  const handleSubmit = async () => {
    if (!issue || !validateForm()) {
      toast.error("Validation failed", { description: "Please fill all required fields" });
      return;
    }

    setSubmitting(true);

    try {
      // Get current user email for resolved_by
      const userEmail = await getCurrentUserEmail() || "unknown";

      // Update staging rows based on issue type
      if (issue.issue_type === "MISSING_REQUIRED_FIELD") {
        // Update all affected rows with the filled values
        for (const row of issue.affected_rows) {
          const formRow = formData[row.staging_id];
          if (!formRow) continue;

          await updateStaging(row.staging_id, {
            staging_email: formRow.staging_email,
            staging_first_name: formRow.staging_first_name,
            staging_last_name: formRow.staging_last_name,
            staging_company: formRow.staging_company,
            staging_status: "READY",
          });
        }
      } else if (issue.issue_type === "INVALID_EMAIL") {
        // Update email for all affected rows
        for (const row of issue.affected_rows) {
          const email = emailInputs[row.staging_id] || formData[row.staging_id]?.staging_email;
          if (!email) continue;

          await updateStaging(row.staging_id, {
            staging_email: email,
            staging_status: "READY",
          });
        }
      } else if (issue.issue_type === "DUPLICATE_EMAIL") {
        // Set selected to READY, others to DISCARD
        for (const row of issue.affected_rows) {
          const status: StagingStatus = row.staging_id === selectedStagingId ? "READY" : "DISCARD";
          await updateStaging(row.staging_id, {
            staging_status: status,
          });
        }
      } else if (issue.issue_type === "EXISTING_EMAIL") {
        // Update email and set to READY
        const stagingId = issue.affected_rows[0]?.staging_id;
        if (!stagingId) throw new Error("No staging ID found");

        const email = emailInputs[stagingId] || formData[stagingId]?.staging_email;
        if (!email) throw new Error("Email is required");

        await updateStaging(stagingId, {
          staging_email: email,
          staging_status: "READY",
        });
      }

      // Generate resolution comment
      const resolutionComment = generateResolutionComment();

      // Update the issue to mark it as resolved
      await updateIssue(issue.issue_id, {
        issue_resolved: true,
        issue_resolved_by: userEmail,
        issue_resolution_comment: resolutionComment,
      });

      toast.success("Issue resolved successfully", { description: "All affected rows and issue have been updated" });
      onOpenChange(false);
      if (onResolved) {
        onResolved();
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to resolve issue";
      toast.error("Error resolving issue", { description: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (!issue && !loading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-5 sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Resolve Issue</SheetTitle>
          <SheetDescription>
            Review and resolve this issue by updating the affected staging rows.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading issue details...</span>
          </div>
        ) : issue ? (
          <div className="space-y-6 ">
            {/* Issue Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Issue ID:</span>
                <Badge variant="outline">#{issue.issue_id}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
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

              {issue.issue_description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{issue.issue_description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {issue.issue_resolved ? (
                  <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                    <IconCheck className="h-3 w-3" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <IconX className="h-3 w-3" />
                    Unresolved
                  </Badge>
                )}
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">Created:</span>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(issue.issue_created_at), "PPpp")}
                </p>
              </div>
            </div>

            <Separator />

            {/* Affected Rows Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Affected Rows</h3>

              {issue.issue_type === "MISSING_REQUIRED_FIELD" && (
                <div className="space-y-4">
                  {issue.affected_rows.map((row) => (
                    <div key={row.staging_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <IconHash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Staging ID: {row.staging_id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`email-${row.staging_id}`}>Email {!row.staging_email && <span className="text-red-500">*</span>}</Label>
                          {row.staging_email ? (
                            <div className="mt-1 text-sm text-gray-600">{row.staging_email}</div>
                          ) : (
                            <Input
                              id={`email-${row.staging_id}`}
                              type="email"
                              value={formData[row.staging_id]?.staging_email || ""}
                              onChange={(e) => updateFormField(row.staging_id, "staging_email", e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`first_name-${row.staging_id}`}>First Name {!row.staging_first_name && <span className="text-red-500">*</span>}</Label>
                          {row.staging_first_name ? (
                            <div className="mt-1 text-sm text-gray-600">{row.staging_first_name}</div>
                          ) : (
                            <Input
                              id={`first_name-${row.staging_id}`}
                              value={formData[row.staging_id]?.staging_first_name || ""}
                              onChange={(e) => updateFormField(row.staging_id, "staging_first_name", e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`last_name-${row.staging_id}`}>Last Name {!row.staging_last_name && <span className="text-red-500">*</span>}</Label>
                          {row.staging_last_name ? (
                            <div className="mt-1 text-sm text-gray-600">{row.staging_last_name}</div>
                          ) : (
                            <Input
                              id={`last_name-${row.staging_id}`}
                              value={formData[row.staging_id]?.staging_last_name || ""}
                              onChange={(e) => updateFormField(row.staging_id, "staging_last_name", e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`company-${row.staging_id}`}>Company {!row.staging_company && <span className="text-red-500">*</span>}</Label>
                          {row.staging_company ? (
                            <div className="mt-1 text-sm text-gray-600">{row.staging_company}</div>
                          ) : (
                            <Input
                              id={`company-${row.staging_id}`}
                              value={formData[row.staging_id]?.staging_company || ""}
                              onChange={(e) => updateFormField(row.staging_id, "staging_company", e.target.value)}
                              className="mt-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {issue.issue_type === "INVALID_EMAIL" && (
                <div className="space-y-4">
                  {issue.affected_rows.map((row) => (
                    <div key={row.staging_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <IconHash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Staging ID: {row.staging_id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>First Name</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_first_name || "-"}</div>
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_last_name || "-"}</div>
                        </div>
                        <div>
                          <Label>Company</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_company || "-"}</div>
                        </div>
                        <div>
                          <Label htmlFor={`email-${row.staging_id}`}>Email <span className="text-red-500">*</span></Label>
                          <Input
                            id={`email-${row.staging_id}`}
                            type="email"
                            value={emailInputs[row.staging_id] || ""}
                            onChange={(e) => updateEmailInput(row.staging_id, e.target.value)}
                            className="mt-1"
                            placeholder="Enter valid email address"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {issue.issue_type === "DUPLICATE_EMAIL" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Multiple rows have the same email address. Select which one to keep:
                  </p>
                  
                  <div className="space-y-3">
                    {issue.affected_rows.map((row) => (
                      <div key={row.staging_id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            id={`staging-${row.staging_id}`}
                            name="selected-staging"
                            value={row.staging_id.toString()}
                            checked={selectedStagingId === row.staging_id}
                            onChange={(e) => setSelectedStagingId(parseInt(e.target.value, 10))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <Label htmlFor={`staging-${row.staging_id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <IconHash className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">Staging ID: {row.staging_id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Email:</span> {row.staging_email || "-"}
                              </div>
                              <div>
                                <span className="text-gray-500">Name:</span> {row.staging_first_name || "-"} {row.staging_last_name || ""}
                              </div>
                              <div>
                                <span className="text-gray-500">Company:</span> {row.staging_company || "-"}
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {issue.issue_type === "EXISTING_EMAIL" && (
                <div className="space-y-4">
                  {existingContact && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Existing Contact</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-yellow-700 font-medium">Email:</span> {existingContact.contact_email}
                        </div>
                        <div>
                          <span className="text-yellow-700 font-medium">Name:</span> {existingContact.contact_first_name || "-"} {existingContact.contact_last_name || ""}
                        </div>
                        <div>
                          <span className="text-yellow-700 font-medium">Company:</span> {existingContact.contact_company || "-"}
                        </div>
                        <div>
                          <span className="text-yellow-700 font-medium">Contact ID:</span> {existingContact.contact_id}
                        </div>
                      </div>
                    </div>
                  )}

                  {issue.affected_rows.map((row) => (
                    <div key={row.staging_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <IconHash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Staging ID: {row.staging_id}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>First Name</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_first_name || "-"}</div>
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_last_name || "-"}</div>
                        </div>
                        <div>
                          <Label>Company</Label>
                          <div className="mt-1 text-sm text-gray-600">{row.staging_company || "-"}</div>
                        </div>
                        <div>
                          <Label htmlFor={`email-${row.staging_id}`}>New Email <span className="text-red-500">*</span></Label>
                          <Input
                            id={`email-${row.staging_id}`}
                            type="email"
                            value={emailInputs[row.staging_id] !== undefined ? emailInputs[row.staging_id] : (row.staging_email || "")}
                            onChange={(e) => updateEmailInput(row.staging_id, e.target.value)}
                            className="mt-1"
                            placeholder="Enter new email address"
                          />
                          <p className="text-xs text-gray-500 mt-1">Current: {row.staging_email || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <SheetFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          {issue?.issue_type === "EXISTING_EMAIL" && !isEmailChanged() ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSubmit}
                  disabled={true}
                  className="bg-blue-600 hover:bg-blue-700 cursor-not-allowed opacity-50"
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  Resolve Issue
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Please change the email address to a different one before resolving this issue.</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!validateForm() || submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Resolve Issue
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
