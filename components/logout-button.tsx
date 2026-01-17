// components/logout-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "GET" });
      router.push("/auth/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-cyan-700 hover:to-blue-700 text-white"
    >
      <IconLogout />
      <p>Logout</p>
    </Button>
  );
}
