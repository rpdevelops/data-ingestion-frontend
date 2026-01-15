import { Card, CardContent } from "@/components/ui/card";
import { IconDeviceMobile } from "@tabler/icons-react";

interface EmptyStateProps {
  title: string;
  description: string;
  subtitle?: string;
}

export function EmptyState({ title, description, subtitle }: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <IconDeviceMobile className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-4">{description}</p>
        {subtitle && (
          <p className="text-sm text-gray-400">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
