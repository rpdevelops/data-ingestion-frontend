import Link from "next/link";
import { IconReceipt, IconAlertCircle, IconUsers } from "@tabler/icons-react";

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
        <Link href="/client-area/processing-jobs" className="group">
          <div className="p-6 bg-white rounded-lg flex flex-col items-center h-full shadow-md border hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4 p-3 bg-blue-100 rounded-full">
              <IconReceipt className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Processing Jobs</h3>
            <p className="text-muted-foreground text-center mb-4">
              View and manage your data processing jobs.
            </p>
            <span className="text-primary hover:underline group-hover:text-blue-700">
              View Jobs →
            </span>
          </div>
        </Link>

        <Link href="/client-area/issues" className="group">
          <div className="p-6 bg-white rounded-lg flex flex-col items-center h-full shadow-md border hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4 p-3 bg-orange-100 rounded-full">
              <IconAlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Issues</h3>
            <p className="text-muted-foreground text-center mb-4">
              View and manage data validation issues from all jobs.
            </p>
            <span className="text-primary hover:underline group-hover:text-blue-700">
              View Issues →
            </span>
          </div>
        </Link>

        <Link href="/client-area/contacts" className="group">
          <div className="p-6 bg-white rounded-lg flex flex-col items-center h-full shadow-md border hover:shadow-lg transition-shadow cursor-pointer">
            <div className="mb-4 p-3 bg-green-100 rounded-full">
              <IconUsers className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Contacts</h3>
            <p className="text-muted-foreground text-center mb-4">
              View all your imported contacts.
            </p>
            <span className="text-primary hover:underline group-hover:text-blue-700">
              View Contacts →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
