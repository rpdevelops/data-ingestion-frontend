"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { atualizarSenhaMinhaConta } from "@/actions/users";
import { toast } from "sonner";
import { SidebarUser } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface MinhaContaFormProps {
  sidebarUser: SidebarUser;
}

export default function MinhaContaForm({ sidebarUser }: MinhaContaFormProps) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const senhasIguais = novaSenha === confirmarSenha && novaSenha !== "";
  const mostrarErroSenha = confirmarSenha !== "" && !senhasIguais;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhasIguais) return;
    setLoading(true);
    const result = await atualizarSenhaMinhaConta(novaSenha);
    if (result.success) {
      toast.success("Senha redefinida com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error(result.error || "Erro ao redefinir senha");
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b text-center p-3">
        <CardTitle>Minha Conta</CardTitle>
        {!sidebarUser.user_changepassword && (
          <CardDescription className="font-bold text-red-500">
            Este é o seu primeiro acesso. Por segurança redefina sua senha antes
            de utilizar o sistema.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {/* Avatar com estilo de rede social */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg ring-4 ring-white ring-offset-2 ring-offset-gray-50">
              <Avatar className="h-full w-full rounded-full">
                <AvatarImage src={sidebarUser.avatar} alt={sidebarUser.name} />
                <AvatarFallback className="rounded-full text-lg font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {sidebarUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações do Usuário */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Nome:</span>
                <span className="col-span-2">{sidebarUser.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">E-mail:</span>
                <span className="col-span-2">{sidebarUser.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Criado em:</span>
                <span className="col-span-2">
                  {formatDate(sidebarUser.createdAt) || "-"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Última alteração de senha:</span>
                <span className="col-span-2">
                  {formatDate(sidebarUser.user_changepassword || null) ||
                    "Nunca alterada"}
                </span>
              </div>
            </div>
          </div>

          {/* Formulário de Alteração de Senha */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Alterar Senha</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Digite sua nova senha"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirme sua nova senha"
                  className={`w-full ${
                    mostrarErroSenha ? "border-red-500" : ""
                  }`}
                />
                {mostrarErroSenha && (
                  <p className="text-sm text-red-500 mt-1">
                    As senhas não conferem
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !senhasIguais}
                className="w-full"
              >
                {loading ? "Salvando..." : "Redefinir Senha"}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
