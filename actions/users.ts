"use server";
// Repository removido - será implementado via API do backend
// import { sendResetPasswordEmail, sendWelcomeEmail, sendNewUserNotification } from "@/actions/email";
// import { gerarSenhaAleatoria } from "@/lib/utils";


// Actions simplificadas - repository removido
// Serão implementadas via API do backend Python

export async function atualizarSenhaMinhaConta(novaSenha: string) {
  // TODO: Implementar via API do backend
  return { success: false, error: "Not implemented - will be done via backend API" };
}

export async function getSidebarUserByIdAction(userId: string) {
  // TODO: Implementar via API do backend
  return null;
}

export async function redefinirSenhaUser(userId: string, userEmail: string, userName: string) {
  // TODO: Implementar via API do backend
  return { success: false, error: "Not implemented - will be done via backend API" };
}

export async function cadastrarUser(
  prevState: { success: boolean; error: string; issues: unknown[] },
  formData: FormData
) {
  // TODO: Implementar via API do backend
  return { success: false, error: "Not implemented - will be done via backend API", issues: [] };
}

export async function getUsers() {
  // TODO: Implementar via API do backend
  return [];
}

export async function atualizarUser(
  prevState: { success: boolean; error: string; issues: unknown[] },
  formData: FormData
) {
  // TODO: Implementar via API do backend
  return { success: false, error: "Not implemented - will be done via backend API", issues: [] };
}

export async function getUserById(id: string) {
  // TODO: Implementar via API do backend
  throw new Error("Not implemented - will be done via backend API");
}

export async function deletarUser(userId: string) {
  // TODO: Implementar via API do backend
  return { success: false, error: "Not implemented - will be done via backend API" };
}

// Placeholder para getUserForSidebar - não usado mais no layout
export async function getUserForSidebar() {
  // Não usado mais - layout usa getCurrentUser do Cognito diretamente
  return { success: false, user: null };
} 