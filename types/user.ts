export interface SidebarUser {
    name: string;
    email: string;
    avatar: string;
    role: string;
    createdAt: string;
    roles?: string[]; // All user roles/groups from Cognito
  }