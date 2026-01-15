import { getCurrentUser } from "@/lib/auth/cognito";
import { redirect } from "next/navigation";
import { JobsComponent } from "@/components/client-area/jobs-component";
import { getJobs } from "@/actions/jobs";
import { UploadCSVButton } from "@/components/client-area/upload-csv-button";
import { Job } from "@/types/job";

export default async function ProcessingJobsPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  // Fetch jobs from backend API using Server Action
  let jobs: Job[] = [];
  let error: string | null = null;

  try {
    const response = await getJobs();
    jobs = response.jobs;
  } catch (err) {
    console.error("Error fetching jobs:", err);
    error = err instanceof Error ? err.message : "Failed to load jobs";
  }

  return (
    <div className="space-y-6 px-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Processing Jobs</h1>
        <p className="text-gray-600 mt-2">
          View and manage your data processing jobs
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error loading jobs:</strong> {error}
          </p>
        </div>
      )}

      {/* Upload Button and Jobs Table */}
      <div className="space-y-4">
        <div className="flex justify-start">
          <UploadCSVButton />
        </div>
        <JobsComponent initialJobs={jobs} />
      </div>
    </div>
  );
}
