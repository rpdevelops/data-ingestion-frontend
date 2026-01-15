import { getUserForSidebar } from "@/actions/users";
import MinhaContaForm from "@/components/MinhaContaForm";
import { SidebarUser } from "@/types/user";
import ErrorFallback from "@/components/ErrorFallback";

export default async function MinhaContaPage() {
  try {
    // Busca o usuário autenticado (ajuste conforme seu contexto de auth)
    const response = await getUserForSidebar();

    const sidebarUser: SidebarUser = response && response.user
      ? {
          name: response.user.name,
          email: response.user.email,
          avatar: response.user.avatar,
          role: response.user.role,
          createdAt: response.user.createdAt,
          user_changepassword: response.user.user_changepassword,
        }
      : {
          name: "",
          email: "",
          avatar: "/defaultAvatar.webp",
          role: "",
          createdAt: "",
          user_changepassword: null,
        };
    return <MinhaContaForm sidebarUser={sidebarUser} />;
  } catch (error) {
    console.error("Erro ao carregar dados da conta:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error),
      hint: 'Verifique a conexão com o Supabase e tente novamente',
      code: error instanceof Error && 'code' in error ? (error as Error & { code?: string }).code : ''
    });
    
    return <ErrorFallback title="Erro ao Carregar Conta" description="Não foi possível carregar os dados da sua conta." />;
  }
}
