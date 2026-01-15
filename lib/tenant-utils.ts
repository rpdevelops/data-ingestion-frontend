// Repository removido - será implementado via API do backend Python
import { getCurrentUser } from "@/lib/auth/cognito";

/**
 * Obtém o tenant_id do usuário logado através do email
 * TODO: Implementar via API do backend
 */
export async function getCurrentUserTenantId(): Promise<number> {
  const user = await getCurrentUser();
  
  if (!user?.email) {
    throw new Error("User not authenticated");
  }

  // TODO: Buscar tenant via API do backend usando o email do usuário
  // Por enquanto retorna 0 como placeholder
  return 0;
}

/**
 * Obtém o email do usuário logado
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email || null;
}

/**
 * Obtém informações completas do tenant do usuário logado (incluindo telefone)
 * TODO: Implementar via API do backend
 */
export async function getCurrentUserTenantWithPhone(): Promise<{tenant_id: number, tenant_nome: string, tenant_telefone: string | null} | null> {
  const user = await getCurrentUser();
  
  if (!user?.email) {
    return null;
  }

  // TODO: Buscar tenant via API do backend usando o email do usuário
  return null;
}
