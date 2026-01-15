"use client";

import { cn } from "@/lib/utils";
import { loginAction } from "@/actions/login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    
    // Get redirect parameter from URL if present
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get("redirect");
    if (redirectTo) {
      formData.set("redirect", redirectTo);
    }
    
    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        // Redirect on client side to avoid NEXT_REDIRECT error
        router.push(result.redirectTo || "/client-area");
      }
    } catch (error: unknown) {
      // NEXT_REDIRECT is not a real error, it's how Next.js handles redirects
      // But we're handling redirect on client side now, so this shouldn't happen
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        // Silently handle redirect - it means auth was successful
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirect") || "/client-area";
        router.push(redirectTo);
      } else {
        setError(error instanceof Error ? error.message : "Authentication error");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-8 shadow-lg mb-10 text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff7448]" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
            {/* <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
