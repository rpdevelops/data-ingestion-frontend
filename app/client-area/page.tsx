import Link from "next/link";


export default async function AreaClientePage() {

  return (
    <div className="px-4 w-auto flex flex-row flex-wrap justify-center md:justify-start md:flex-nowrap md:flex-col lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl text-center md:text-left font-bold">Client Area</h1>
        <p className="text-muted-foreground text-center md:text-left">
          Welcome to your exclusive client area.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/client-area/processing-jobs">
          <div className="p-6 bg-white rounded-lg flex flex-col items-center h-full shadow-md border">
            <h3 className="text-lg font-semibold mb-2">Processing Jobs</h3>
            <p className="text-muted-foreground text-center mb-4">
              View and manage your data processing jobs.
            </p>
            
            <button className="text-primary hover:underline">
              View Jobs →
            </button>
            
          </div>
        </Link>
      </div>
    </div>
  );
}
