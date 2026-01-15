import { getCurrentUser } from "@/lib/auth/cognito";
import { redirect } from "next/navigation";
import { JobsComponent } from "@/components/client-area/jobs-component";

export default async function ProcessingJobsPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  // TODO: Fetch jobs from backend API
  // For now, using empty array - will be populated via API
  const jobs: never[] = [];

  return (
    <div className="space-y-6 px-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Processing Jobs</h1>
        <p className="text-gray-600 mt-2">
          View and manage your data processing jobs
        </p>
      </div>

      {/* Jobs Table */}
      <JobsComponent jobs={jobs} />
    </div>
  );
}
