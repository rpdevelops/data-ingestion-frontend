import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Gera uma senha aleatória de tamanho especificado (default 11)
export function gerarSenhaAleatoria(tamanho = 11) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let senha = '';
  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

export function getBrasiliaDateISOString(): string {
  const now = new Date();
  const brasiliaOffset = -3 * 60; // UTC-3
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utc + (brasiliaOffset * 60000));
  return brasiliaTime.toISOString();
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  
  try {
    // Verifica se a string está vazia ou é apenas espaços em branco
    const trimmedDate = dateString.trim()
    if (trimmedDate === "") return "-"
    
    // Se estiver no formato YYYY-MM-DD, parsear diretamente para evitar problemas de timezone
    if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = trimmedDate.split('-')
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('pt-BR')
      }
    }
    
    // Se estiver no formato YYYY-MM-DDTHH:mm:ss ou similar, extrair apenas a parte da data
    if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const datePart = trimmedDate.split('T')[0]
      const [year, month, day] = datePart.split('-')
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('pt-BR')
      }
    }
    
    // Para outros formatos, tentar parsing manual primeiro
    // Procurar por padrões de data em diferentes formatos
    const dateMatch = trimmedDate.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const [, year, month, day] = dateMatch
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('pt-BR')
      }
    }
    
    // Como último recurso, usar new Date (pode causar problemas de timezone)
    const date = new Date(trimmedDate)
    if (isNaN(date.getTime())) {
      return "-"
    }
    
    return date.toLocaleDateString('pt-BR')
  } catch {
    return "-"
  }
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Ativo" : "Inativo"
  if (typeof value === "number") return value.toString()
  return String(value)
}


export function hasEnvVars(): boolean {
  return !!(
    process.env.COGNITO_USER_POOL_ID &&
    process.env.COGNITO_CLIENT_ID &&
    process.env.COGNITO_REGION
  );
}
