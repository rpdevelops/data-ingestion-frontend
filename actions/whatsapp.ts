"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseToken } from "@/lib/supabase/auth-token";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:3000";

interface CreateSessionResponse {
  qrCode?: string;
  connected: boolean;
}

interface SessionStatusResponse {
  connected: boolean;
  last_qrcode?: string;
  updated_at: string | null;
}

/**
 * Cria ou restaura uma sessão WhatsApp para o tenant
 */
export async function createWhatsAppSession(tenantId: number, phone?: string): Promise<{ success: boolean; data?: CreateSessionResponse; error?: string }> {
  try {
    const token = await getSupabaseToken();
    if (!token) {
      return { success: false, error: "Não autenticado. Por favor, faça login novamente." };
    }

    console.log("Token obtido, tamanho:", token.length);
    console.log("Backend URL:", BACKEND_URL);

    const response = await fetch(`${BACKEND_URL}/whatsapp/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantId,
        phone,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `Erro ${response.status}` };
      }
      
      console.error("Erro na resposta do backend:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return { 
        success: false, 
        error: errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log("Resposta do backend (createWhatsAppSession):", data);
    revalidatePath("/client-area/whatsapp");
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao criar sessão WhatsApp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao criar sessão WhatsApp" 
    };
  }
}

/**
 * Obtém o status da sessão WhatsApp do tenant
 */
export async function getWhatsAppSessionStatus(tenantId: number): Promise<{ success: boolean; data?: SessionStatusResponse; error?: string }> {
  try {
    const token = await getSupabaseToken();
    if (!token) {
      return { success: false, error: "Não autenticado" };
    }

    const response = await fetch(`${BACKEND_URL}/whatsapp/session/${tenantId}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      return { success: false, error: errorData.message || `Erro ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao obter status da sessão WhatsApp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao obter status da sessão" 
    };
  }
}

/**
 * Desconecta e remove a sessão WhatsApp do tenant
 */
export async function deleteWhatsAppSession(tenantId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getSupabaseToken();
    if (!token) {
      return { success: false, error: "Não autenticado" };
    }

    const response = await fetch(`${BACKEND_URL}/whatsapp/session/${tenantId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      return { success: false, error: errorData.message || `Erro ${response.status}` };
    }

    revalidatePath("/client-area/whatsapp");
    return { success: true };
  } catch (error) {
    console.error("Erro ao desconectar sessão WhatsApp:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao desconectar sessão WhatsApp" 
    };
  }
}

/**
 * Cancela uma tentativa de conexão em andamento
 * Só funciona se a sessão estiver em estado CONNECTING ou QR_READY
 */
export async function cancelWhatsAppSession(tenantId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getSupabaseToken();
    if (!token) {
      return { success: false, error: "Não autenticado" };
    }

    const response = await fetch(`${BACKEND_URL}/whatsapp/session/${tenantId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      return { success: false, error: errorData.message || `Erro ${response.status}` };
    }

    revalidatePath("/client-area/whatsapp");
    return { success: true };
  } catch (error) {
    console.error("Erro ao cancelar tentativa de conexão:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao cancelar tentativa de conexão" 
    };
  }
}

