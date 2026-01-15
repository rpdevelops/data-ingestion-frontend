import { redirect } from "next/navigation";
import { getCurrentUser, hasAllowedRole, getAllowedGroup } from "@/lib/auth/cognito";
import { SidebarCollapseProvider } from "@/components/ui/sidebar-collapse-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MainContent } from "@/components/client-area/MainContent";
import { SidebarUser } from "@/types/user";

export default async function AreaClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication via Cognito
  const cognitoUser = await getCurrentUser();

  if (!cognitoUser || !cognitoUser.email) {
    redirect("/auth/login");
  }

  // Check if user has required role from environment variable
  const hasRequiredRole = await hasAllowedRole();
  
  if (!hasRequiredRole) {
    const allowedGroup = getAllowedGroup();
    redirect(`/auth/login?error=unauthorized&required=${allowedGroup}`);
  }

  // Get primary role (first role or default) for backward compatibility
  const primaryRole = cognitoUser.roles && cognitoUser.roles.length > 0 
    ? cognitoUser.roles[0] 
    : "user";

  // Create basic sidebarUser from Cognito with all roles
  const sidebarUser: SidebarUser = {
    name: cognitoUser.email.split("@")[0], // Use email part as temporary name
    email: cognitoUser.email,
    avatar: "",
    role: primaryRole, // Keep for backward compatibility
    roles: cognitoUser.roles || [], // All roles/groups
    createdAt: new Date().toISOString(),
  };

  const clienteNavMain = [
    { title: "Home", url: "/client-area", icon: "IconHome" },
    { title: "Processing Jobs", url: "/client-area/processing-jobs", icon: "IconReceipt" },
  ];

  // const clienteNavSecondary = [
  //   { title: "Perfil", url: "/client-area/perfil", icon: 'IconUser' },
  //   { title: "Configurações", url: "/client-area/configuracoes", icon: 'IconSettings' },
  // ];

  return (
    <SidebarCollapseProvider>
      <SidebarProvider>
        <div className="flex lg:w-full min-h-screen">
          <AppSidebar
            user={sidebarUser}
            navMain={clienteNavMain}
            //navSecondary={clienteNavSecondary}
            homeUrl="/client-area"
          />
          <MainContent>{children}</MainContent>
        </div>
      </SidebarProvider>
    </SidebarCollapseProvider>
  );
}
