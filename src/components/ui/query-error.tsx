import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface QueryErrorProps {
  error?: Error;
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export function QueryError({ error, onRetry, message, className }: QueryErrorProps) {
  const errorMessage = message || error?.message || "Something went wrong";

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <div>
          <h3 className="font-semibold text-lg mb-2">Error</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {errorMessage}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export function QueryErrorCard({ error, onRetry, message, className }: QueryErrorProps) {
  const errorMessage = message || error?.message || "Failed to load data";

  return (
    <Card className={`p-6 ${className}`}>
      <QueryError error={error} onRetry={onRetry} message={errorMessage} />
    </Card>
  );
}