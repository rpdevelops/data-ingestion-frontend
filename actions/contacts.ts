"use server";

import { getIdToken } from "@/lib/auth/cognito";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Convert HTTP error status and message to user-friendly error message
 */
function getFriendlyErrorMessage(status: number, originalMessage: string): string {
  switch (status) {
    case 400:
      return `Invalid request: ${originalMessage}`;
    case 401:
      return "Authentication failed. Please log in again.";
    case 403:
      return "You don't have permission to access this resource. Please contact an administrator.";
    case 404:
      return "Contact not found.";
    case 500:
    case 502:
    case 503:
      return "Server error. Please try again later or contact support.";
    default:
      return originalMessage || "An unexpected error occurred. Please try again.";
  }
}

export interface Contact {
  contact_id: number;
  staging_id: number;
  contacts_user_id: string;
  contact_email: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_company: string | null;
  contact_created_at: string;
}

export interface ContactResponse {
  contacts: Contact[];
  total: number;
}

/**
 * Server Action to fetch contact by email from the backend API
 */
export async function getContactByEmail(email: string): Promise<Contact | null> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/contacts?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // 404 means contact not found, which is valid for this use case
    if (response.status === 404) {
      return null;
    }

    let errorMessage = `Failed to fetch contact: ${response.status} ${response.statusText}`;
    
    // Read the response body only once
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    
    try {
      if (isJson) {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      // If we can't parse the error, use the default message
      console.error("Error parsing error response:", parseError);
    }
    
    // Create a user-friendly error message
    const friendlyMessage = getFriendlyErrorMessage(response.status, errorMessage);
    throw new Error(friendlyMessage);
  }

  const data = await response.json();

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format from API");
  }

  if (!Array.isArray(data.contacts) || data.contacts.length === 0) {
    return null;
  }

  // Return the first contact
  const contact = data.contacts[0];
  return {
    contact_id: contact.contact_id,
    staging_id: contact.staging_id,
    contacts_user_id: contact.contacts_user_id,
    contact_email: contact.contact_email,
    contact_first_name: contact.contact_first_name || null,
    contact_last_name: contact.contact_last_name || null,
    contact_company: contact.contact_company || null,
    contact_created_at: contact.contact_created_at,
  };
}

/**
 * Server Action to fetch all contacts from the backend API
 */
export async function getAllContacts(): Promise<ContactResponse> {
  const idToken = await getIdToken();

  if (!idToken) {
    throw new Error("No authentication token available. Please log in.");
  }

  const response = await fetch(`${API_URL}/contacts`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch contacts: ${response.status} ${response.statusText}`;
    
    // Read the response body only once
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    
    try {
      if (isJson) {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else {
        const errorText = await response.text();
        if (errorText && errorText.trim()) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      // If we can't parse the error, use the default message
      console.error("Error parsing error response:", parseError);
    }
    
    // Create a user-friendly error message
    const friendlyMessage = getFriendlyErrorMessage(response.status, errorMessage);
    throw new Error(friendlyMessage);
  }

  const data = await response.json();

  // Validate response structure
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format from API");
  }

  if (!Array.isArray(data.contacts)) {
    throw new Error("Response does not contain a contacts array");
  }

  // Transform the response to match our Contact type
  const contacts: Contact[] = (data.contacts || []).map((contact: any) => ({
    contact_id: contact.contact_id,
    staging_id: contact.staging_id,
    contacts_user_id: contact.contacts_user_id,
    contact_email: contact.contact_email,
    contact_first_name: contact.contact_first_name || null,
    contact_last_name: contact.contact_last_name || null,
    contact_company: contact.contact_company || null,
    contact_created_at: contact.contact_created_at,
  }));

  return {
    contacts,
    total: data.total ?? contacts.length,
  };
}
