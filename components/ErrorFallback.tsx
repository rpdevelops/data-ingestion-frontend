import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({ 
  title = "Erro de Conexão", 
  description = "Não foi possível carregar os dados. Verifique sua conexão com a internet.",
  onRetry 
}: ErrorFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Possíveis causas:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Problemas temporários de conectividade</li>
              <li>Timeout na conexão com o banco de dados</li>
              <li>Servidor temporariamente indisponível</li>
            </ul>
          </div>
          
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground">
            Se o problema persistir, entre em contato com o suporte técnico.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
