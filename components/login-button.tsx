"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface LoginButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoginButton({ 
  children = "Entrar", 
  className = "",
  variant = "default",
  size = "default"
}: LoginButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/redirect");
  };

  return (
    <Button 
      onClick={handleClick}
      className={className}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  );
}
