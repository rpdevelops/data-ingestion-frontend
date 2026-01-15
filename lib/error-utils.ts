export function getErrorDetails(error: unknown) {
  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    details: error instanceof Error ? error.stack : String(error),
    hint: 'Verifique a conexão com o Supabase e tente novamente',
    code: error instanceof Error && 'code' in error ? (error as Error & { code?: string }).code : ''
  };
}

