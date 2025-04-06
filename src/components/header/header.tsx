import { Trash } from "lucide-react";
import { Button } from "../ui/button";
import AiConfigDialog from "./select-ai-model";
import DBConnectionDialog from "./select-db-connection";

export default function Header() {
  return (
    <header className="border-border flex items-center justify-between border-b p-4">
      <h1 className="text-xl font-semibold">AI SQL Generator</h1>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Trash className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          <DBConnectionDialog />
          <AiConfigDialog />

          <div className="text-muted-foreground text-sm">No Schema Loaded</div>
        </div>
      </div>
    </header>
  );
}
