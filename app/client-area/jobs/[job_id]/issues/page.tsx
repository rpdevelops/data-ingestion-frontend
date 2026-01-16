import { getCurrentUser } from "@/lib/auth/cognito";
import { redirect, notFound } from "next/navigation";
import { IssuesComponent } from "@/components/client-area/issues-component";
import { getIssuesByJobId } from "@/actions/issues";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default async function JobIssuesPage({
  params,
}: {
  params: { job_id: string };
}) {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  // Parse job_id from params
  const jobId = parseInt(params.job_id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  // Fetch issues for this specific job using Server Action
  let issues = [];
  let error: string | null = null;

  try {
    const response = await getIssuesByJobId(jobId);
    issues = response.issues;
  } catch (err) {
    console.error("Error fetching issues for job:", err);
    error = err instanceof Error ? err.message : "Failed to load issues";
    
    // If job not found, return 404
    if (error.includes("not found") || error.includes("404")) {
      notFound();
    }
  }

  return (
    <div className="space-y-6 px-5">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/client-area/processing-jobs">
          <Button variant="outline" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Issues</h1>
          <p className="text-gray-600 mt-2">
            Issues for Job #{jobId}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error loading issues:</strong> {error}
          </p>
        </div>
      )}

      {/* Issues Table */}
      <IssuesComponent initialIssues={issues} jobId={jobId} />
    </div>
  );
}
