import { getCurrentUser } from "@/lib/auth/cognito";
import { redirect } from "next/navigation";
import { ContactsComponent } from "@/components/client-area/contacts-component";
import { getAllContacts } from "@/actions/contacts";

export default async function ContactsPage() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/auth/login");
  }

  // Fetch contacts using Server Action
  let contacts = [];
  let error: string | null = null;

  try {
    const response = await getAllContacts();
    contacts = response.contacts;
  } catch (err) {
    console.error("Error fetching contacts:", err);
    error = err instanceof Error ? err.message : "Failed to load contacts";
  }

  return (
    <div className="space-y-6 px-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="text-gray-600 mt-2">
          View all your imported contacts
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Error loading contacts:</strong> {error}
          </p>
        </div>
      )}

      {/* Contacts Table */}
      <ContactsComponent initialContacts={contacts} />
    </div>
  );
}
