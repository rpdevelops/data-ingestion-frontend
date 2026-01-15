import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/forgot-password";

export async function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  let error = null;
  let success = false;

  async function action(formData: FormData) {
    "use server";
    const result = await forgotPasswordAction(formData);
    if (result.error) {
      error = result.error;
    } else {
      success = true;
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifique seu email</CardTitle>
            <CardDescription>Instruções de redefinição de senha enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Se você se cadastrou usando seu email e senha, você receberá um email de redefinição de senha.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir sua senha</CardTitle>
            <CardDescription>
              Digite seu email e nós lhe enviaremos um link para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="bg-gradient-to-r from-[#ff7448] to-[#ef3f56] hover:from-[#ef3f56] hover:to-[#ff7448] text-white font-bold py-3 px-8 shadow-lg mb-10 text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff7448]">
                Enviar link de redefinição
              </Button>
              <div className="mt-4 text-center text-sm">
                Já tem uma conta?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Entrar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
