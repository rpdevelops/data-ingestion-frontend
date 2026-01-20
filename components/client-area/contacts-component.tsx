"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, FilterConfig } from "@/components/data-table";
import { Contact } from "@/actions/contacts";
import { format } from "date-fns";
import { getAllContacts } from "@/actions/contacts";
import { toast } from "sonner";

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MM/dd/yyyy HH:mm:ss");
  } catch {
    return dateString;
  }
}

export const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: "contact_id",
    header: "ID",
    cell: ({ row }) => {
      return <div className="text-center font-mono text-sm">{row.getValue("contact_id")}</div>;
    },
  },
  {
    accessorKey: "contact_email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("contact_email") as string;
      return <div className="text-center">{email}</div>;
    },
  },
  {
    accessorKey: "contact_first_name",
    header: "First Name",
    cell: ({ row }) => {
      const firstName = row.getValue("contact_first_name") as string | null;
      return <div className="text-center">{firstName || "-"}</div>;
    },
  },
  {
    accessorKey: "contact_last_name",
    header: "Last Name",
    cell: ({ row }) => {
      const lastName = row.getValue("contact_last_name") as string | null;
      return <div className="text-center">{lastName || "-"}</div>;
    },
  },
  {
    accessorKey: "contact_company",
    header: "Company",
    cell: ({ row }) => {
      const company = row.getValue("contact_company") as string | null;
      return <div className="text-center">{company || "-"}</div>;
    },
  },
  {
    accessorKey: "staging_id",
    header: "Staging ID",
    cell: ({ row }) => {
      const stagingId = row.getValue("staging_id") as number;
      return (
        <div className="text-center">
          <span className="font-mono text-sm">{stagingId}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_created_at",
    header: "Created At",
    cell: ({ row }) => {
      return <div className="text-center">{formatDate(row.getValue("contact_created_at"))}</div>;
    },
  },
];

const filterConfigs: FilterConfig[] = [
  {
    field: "contact_email",
    type: "text",
    label: "Email",
    placeholder: "Search by email...",
  },
  {
    field: "contact_first_name",
    type: "text",
    label: "First Name",
    placeholder: "Search by first name...",
  },
  {
    field: "contact_last_name",
    type: "text",
    label: "Last Name",
    placeholder: "Search by last name...",
  },
  {
    field: "contact_company",
    type: "text",
    label: "Company",
    placeholder: "Search by company...",
  },
  {
    field: "contact_created_at",
    type: "daterange",
    label: "Created Date",
    dateRangeFields: {
      start: "contact_created_at_start",
      end: "contact_created_at_end",
    },
  },
];

interface ContactsComponentProps {
  initialContacts?: Contact[];
}

// Polling interval in milliseconds (30 seconds for contacts - less frequent as they change rarely)
const POLLING_INTERVAL = 30000;

export function ContactsComponent({ initialContacts = [] }: ContactsComponentProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [isPolling, setIsPolling] = useState(false); // Contacts don't need frequent polling
  const errorCountRef = useRef(0);

  const fetchContactsData = useCallback(async () => {
    try {
      const response = await getAllContacts();
      console.log("Fetched contacts", response.contacts.length, "contacts");
      setContacts(response.contacts);
      // Reset error count on successful fetch
      if (errorCountRef.current > 0) {
        errorCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load contacts";
      
      // If authentication error and can't refresh, stop polling and redirect
      if (errorMessage.includes("Authentication") || errorMessage.includes("401") || errorMessage.includes("No authentication token")) {
        setIsPolling(false);
        toast.error("Session expired", {
          description: "Please log in again to continue.",
          duration: 5000,
        });
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
        return;
      }
      
      errorCountRef.current += 1;
      const currentErrorCount = errorCountRef.current;
      
      // Only show toast on first error or every 5 errors to avoid spam
      if (currentErrorCount === 1 || currentErrorCount % 5 === 0) {
        toast.error("Failed to refresh contacts", {
          description: "The table will continue trying to refresh automatically.",
          duration: 4000,
        });
      }
    }
  }, []);

  useEffect(() => {
    // Initial fetch to ensure we have the latest data
    fetchContactsData();

    // Set up polling interval (optional, can be disabled)
    let intervalId: NodeJS.Timeout | null = null;

    if (isPolling) {
      intervalId = setInterval(() => {
        fetchContactsData();
      }, POLLING_INTERVAL);
    }

    // Cleanup interval on unmount or when polling stops
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, fetchContactsData]);

  return (
    <div className="space-y-4">
      {/* Contacts Table */}
      <DataTable
        columns={columns}
        data={contacts}
        searchFields={["contact_email", "contact_first_name", "contact_last_name", "contact_company"]}
        searchPlaceholder="Search contacts by email, name, or company..."
        filters={filterConfigs}
        initialVisibleColumns={[
          "contact_id",
          "contact_email",
          "contact_first_name",
          "contact_last_name",
          "contact_company",
          "staging_id",
          "contact_created_at",
        ]}
      />
    </div>
  );
}
