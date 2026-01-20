import { getCurrentUser } from "@/lib/auth/cognito";
import { redirect } from "next/navigation";
import { IssuesComponent } from "@/components/client-area/issues-component";
import { getIssues } from "@/actions/issues";
import { Issue } from "@/types/issue";

export default async function IssuesPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  // Fetch issues from backend API using Server Action
  let issues: Issue[] = [];
  let error: string | null = null;

  try {
    const response = await getIssues();
    issues = response.issues;
  } catch (err) {
    console.error("Error fetching issues:", err);
    error = err instanceof Error ? err.message : "Failed to load issues";
  }

  return (
    <div className="space-y-6 px-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
        <p className="text-gray-600 mt-2">
          View and manage data validation issues from all jobs
        </p>
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
      <IssuesComponent initialIssues={issues} />
    </div>
  );
}
