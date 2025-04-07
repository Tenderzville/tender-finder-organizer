
import { useState } from "react";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ScraperDiagnosticsProps {
  diagnostics: Record<string, any> | null;
}

export function ScraperDiagnostics({ diagnostics }: ScraperDiagnosticsProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  if (!diagnostics) return null;

  return (
    <Collapsible 
      open={showDiagnostics} 
      onOpenChange={setShowDiagnostics}
      className="mt-4 border-t pt-2"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center w-full justify-between">
          <span className="flex items-center">
            <Terminal className="h-4 w-4 mr-2" />
            Diagnostics
          </span>
          <span className="text-xs text-muted-foreground">
            {showDiagnostics ? 'Hide' : 'Show'}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="text-xs p-2 bg-slate-50 rounded text-slate-700 font-mono">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(diagnostics).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-semibold">{key.replace(/_/g, ' ')}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
